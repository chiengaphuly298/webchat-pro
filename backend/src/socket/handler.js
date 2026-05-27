const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const connectedUsers = new Map();
const userSockets = new Map();

function socketHandler(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      socket.userId = user.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);
    connectedUsers.set(socket.userId, { socketId: socket.id, user: socket.user });
    userSockets.set(socket.id, socket.userId);
    socket.join('user:' + socket.userId);
    broadcastUserStatus(io, socket.userId, 'online');
    joinConversationRooms(socket);

    socket.on('send_message', async (data) => {
      try {
        const { conversation_id, content, type, reply_to, metadata } = data;
        console.log('Socket: send_message received:', { conversation_id, content, type });
        const { data: message, error: insertError } = await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id,
            sender_id: socket.userId,
            content,
            type: type || 'text',
            reply_to,
            metadata: metadata || {}
          })
          .select('*, sender:users(id, username, display_name, avatar_url)')
          .single();

        if (insertError) {
          console.error('Socket: Failed to insert message:', insertError);
          socket.emit('error', { message: 'Failed to send message', details: insertError });
          return;
        }

        // Fetch reply_to details if exists
        let messageWithReply = message;
        if (message.reply_to) {
          const { data: replyMsg } = await supabaseAdmin
            .from('messages')
            .select('id, content, sender:users(id, username, display_name, avatar_url)')
            .eq('id', message.reply_to)
            .single();
          messageWithReply = { ...message, reply_to: replyMsg || null };
        }

        console.log('Socket: Message saved successfully:', messageWithReply.id);
        console.log('reply_to details:', JSON.stringify(messageWithReply.reply_to, null, 2));
        io.to(conversation_id).emit('new_message', messageWithReply);
        socket.emit('message_sent', { message: messageWithReply });
      } catch (error) {
        console.error('Socket: Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', (data) => {
      socket.to(data.conversation_id).emit('user_typing', {
        conversation_id: data.conversation_id,
        user_id: socket.userId,
        username: socket.user.username,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.conversation_id).emit('user_typing', {
        conversation_id: data.conversation_id,
        user_id: socket.userId,
        typing: false
      });
    });

    socket.on('mark_read', async (data) => {
      try {
        const { conversation_id, message_id } = data;
        await supabaseAdmin
          .from('conversation_members')
          .update({ unread_count: 0, last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversation_id)
          .eq('user_id', socket.userId);
        if (message_id) {
          await supabaseAdmin
            .from('message_status')
            .upsert({ message_id, user_id: socket.userId, status: 'read' }, { onConflict: 'message_id,user_id' });
          socket.to(conversation_id).emit('message_read', { message_id, read_by: socket.userId });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.user.username);
      connectedUsers.delete(socket.userId);
      userSockets.delete(socket.id);
      await supabaseAdmin
        .from('users')
        .update({ status: 'offline', last_seen_at: new Date().toISOString() })
        .eq('id', socket.userId);
      broadcastUserStatus(io, socket.userId, 'offline');
    });
  });
}

async function joinConversationRooms(socket) {
  try {
    const { data: memberships } = await supabaseAdmin
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', socket.userId);
    if (memberships) {
      memberships.forEach(m => socket.join(m.conversation_id));
    }
  } catch (error) {
    console.error('Join rooms error:', error);
  }
}

async function broadcastUserStatus(io, userId, status) {
  try {
    const { data: memberships } = await supabaseAdmin
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);
    if (memberships) {
      memberships.forEach(m => {
        io.to(m.conversation_id).emit('user_status', { user_id: userId, status });
      });
    }
  } catch (error) {
    console.error('Broadcast status error:', error);
  }
}

module.exports = { socketHandler };