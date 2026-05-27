/**
 * Message Routes
 * Handles message CRUD operations
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * @route   GET /api/v1/messages/:conversationId
 * @desc    Get messages for conversation
 * @access  Private
 */
router.get('/:conversationId', protect, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('before').optional().isUUID()
], asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  let { limit = 50, before } = req.query;

  console.log('GET /messages/:conversationId', { conversationId, userId: req.userId, before, limit });

  // Validate before - must be valid UUID or null
  if (before === 'null' || before === 'undefined' || before === '') {
    before = null;
  }
  if (before && typeof before !== 'string') {
    before = null;
  }
  // Validate UUID format for before
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (before && !uuidRegex.test(before)) {
    before = null;
  }

  // Verify user is member
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.userId)
    .single();

  console.log('Membership check:', { membership, membershipError });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - user not a member'
    });
  }

  let query = supabaseAdmin
    .from('messages')
    .select('*, sender:users(id, username, display_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;
  console.log('Messages query result:', { count: messages?.length, error });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }

  // Fetch reply_to message details for messages that have replies
  const messagesWithReplies = await Promise.all(
    (messages || []).map(async (msg) => {
      if (msg.reply_to) {
        const { data: replyMsg } = await supabaseAdmin
          .from('messages')
          .select('id, content, sender:users(id, username, display_name, avatar_url)')
          .eq('id', msg.reply_to)
          .single();
        return { ...msg, reply_to: replyMsg || null };
      }
      return msg;
    })
  );

  res.json({
    success: true,
    data: { messages: messagesWithReplies?.reverse() || [] }
  });
}));

/**
 * @route   POST /api/v1/messages/:conversationId
 * @desc    Send message
 * @access  Private
 */
router.post('/:conversationId', protect, messageLimiter, [
  body('content').optional().isLength({ max: 5000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'voice']),
  body('reply_to').optional().isUUID(),
  body('metadata').optional().isObject()
], asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, type = 'text', reply_to, metadata = {} } = req.body;

  // Verify user is member
  const { data: membership } = await supabaseAdmin
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.userId)
    .single();

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: req.userId,
      content,
      type,
      reply_to,
      metadata
    })
    .select(`
      *,
      sender:users(id, username, display_name, avatar_url),
      attachments(*)
    `)
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }

  // Notify other members via Socket (handled in socket handler)
  // Emit through io instance
  const io = req.app.get('io');
  if (io) {
    io.to(conversationId).emit('new_message', message);
  }

  res.status(201).json({
    success: true,
    data: { message }
  });
}));

/**
 * @route   PUT /api/v1/messages/:id
 * @desc    Edit message
 * @access  Private
 */
router.put('/:id', protect, [
  body('content').isLength({ min: 1, max: 5000 })
], asyncHandler(async (req, res) => {
  const { content } = req.body;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('sender_id, conversation_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  if (existing.sender_id !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'Can only edit your own messages'
    });
  }

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .update({
      content,
      edited_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select(`
      *,
      sender:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }

  // Notify via Socket
  const io = req.app.get('io');
  if (io) {
    io.to(existing.conversation_id).emit('message_edited', message);
  }

  res.json({
    success: true,
    data: { message }
  });
}));

/**
 * @route   DELETE /api/v1/messages/:id
 * @desc    Delete message (soft delete)
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const { hard } = req.query;

  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('sender_id, conversation_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  if (existing.sender_id !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'Can only delete your own messages'
    });
  }

  if (hard === 'true') {
    // Hard delete (admin only in real scenario)
    await supabaseAdmin.from('messages').delete().eq('id', req.params.id);
  } else {
    // Soft delete
    await supabaseAdmin
      .from('messages')
      .update({ is_deleted: true, content: 'Message deleted' })
      .eq('id', req.params.id);
  }

  // Notify via Socket
  const io = req.app.get('io');
  if (io) {
    io.to(existing.conversation_id).emit('message_deleted', { id: req.params.id });
  }

  res.json({
    success: true,
    message: 'Message deleted'
  });
}));

/**
 * @route   PUT /api/v1/messages/:id/pin
 * @desc    Pin/unpin message
 * @access  Private
 */
router.put('/:id/pin', protect, asyncHandler(async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('conversation_id')
    .eq('id', req.params.id)
    .single();

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  const { data: message } = await supabaseAdmin
    .from('messages')
    .update({ is_pinned: supabaseAdmin.sql`NOT is_pinned` })
    .eq('id', req.params.id)
    .select()
    .single();

  res.json({
    success: true,
    data: { message }
  });
}));

/**
 * @route   PUT /api/v1/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const { data: message } = await supabaseAdmin
    .from('messages')
    .select('conversation_id, sender_id')
    .eq('id', req.params.id)
    .single();

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Don't mark own messages as read
  if (message.sender_id === req.userId) {
    return res.json({ success: true });
  }

  // Upsert read status
  await supabaseAdmin
    .from('message_status')
    .upsert({
      message_id: req.params.id,
      user_id: req.userId,
      status: 'read'
    }, {
      onConflict: 'message_id,user_id'
    });

  // Notify sender via Socket
  const io = req.app.get('io');
  if (io) {
    io.to(message.conversation_id).emit('message_read', {
      message_id: req.params.id,
      read_by: req.userId
    });
  }

  res.json({
    success: true
  });
}));

/**
 * @route   GET /api/v1/messages/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/', protect, [
  query('q').isLength({ min: 1 }),
  query('conversation_id').optional().isUUID()
], asyncHandler(async (req, res) => {
  const { q, conversation_id } = req.query;

  let queryBuilder = supabaseAdmin
    .from('messages')
    .select(`
      id,
      conversation_id,
      content,
      sender_id,
      created_at,
      sender:users(id, username, display_name, avatar_url),
      conversation:conversations(id, name, type)
    `)
    .eq('is_deleted', false)
    .ilike('content', `%${q}%`);

  if (conversation_id) {
    queryBuilder = queryBuilder.eq('conversation_id', conversation_id);
  }

  const { data: messages, error } = await queryBuilder.limit(50);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }

  res.json({
    success: true,
    data: { messages }
  });
}));

module.exports = router;