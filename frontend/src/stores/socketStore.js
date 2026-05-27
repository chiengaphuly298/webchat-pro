import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useConversationStore } from './conversationStore';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';
import toast from 'react-hot-toast';

let socket = null;
let listenersRegistered = false;
let stateSetters = {};

const registerSocketListeners = () => {
  if (listenersRegistered || !socket) return;
  
  // Remove any existing listeners to prevent duplicates
  socket.removeAllListeners();
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
    stateSetters.setIsConnected(true);
    toast.success('Connected to server');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    stateSetters.setIsConnected(false);
    listenersRegistered = false; // Reset for next connection
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    stateSetters.setIsConnected(false);
  });

  // Message events
  socket.on('new_message', (message) => {
    const currentUser = useAuthStore.getState().user;
    // Skip if this message is from ourselves - we already handle it via message_sent
    if (message.sender_id === currentUser?.id) {
      return;
    }
    useConversationStore.getState().addMessage(message);
  });

  socket.on('message_sent', ({ message }) => {
    useConversationStore.getState().updateMessageTemp(message);
  });

  socket.on('message_edited', (message) => {
    useConversationStore.getState().editMessage(message.id, message);
  });

  socket.on('message_deleted', ({ id }) => {
    useConversationStore.getState().deleteMessage(id);
  });

  socket.on('message_read', ({ message_id, read_by }) => {
    useConversationStore.getState().markMessageRead(message_id, read_by);
  });

  // Typing events
  socket.on('user_typing', ({ conversation_id, user_id, username, typing }) => {
    useConversationStore.getState().setTyping(conversation_id, user_id, typing);
  });

  // Presence events
  socket.on('user_status', ({ user_id, status }) => {
    useConversationStore.getState().updateUserStatus(user_id, status);
  });

  socket.on('online_users', ({ users }) => {
    stateSetters.setOnlineUsers(users);
  });

  // Notification events
  socket.on('notification', (notification) => {
    useNotificationStore.getState().addNotification(notification);
    toast(notification.title || 'New notification', {
      icon: '🔔',
    });
  });

  // Friend accepted event
  socket.on('friend_accepted', ({ user, message }) => {
    toast.success(message || `${user?.display_name || user?.username} is now your friend!`, {
      icon: '🤝',
    });
    // Refresh friend requests count
    useNotificationStore.getState().refreshFriendRequests();
  });

  // Error handling
  socket.on('error', ({ message }) => {
    toast.error(message);
  });
  
  listenersRegistered = true;
};

export const useSocketStore = create((set, get) => {
  // Store the setter functions for use in listeners
  stateSetters.setIsConnected = (isConnected) => {
    set({ isConnected });
  };
  
  stateSetters.setOnlineUsers = (users) => {
    set({ onlineUsers: users });
  };

  return {
    socket: null,
    isConnected: false,
    onlineUsers: [],

    // Connect to socket server
    connect: (token) => {
      if (socket?.connected) return;

      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

      socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Register listeners only once
      registerSocketListeners();
      set({ socket });
    },

    // Disconnect from socket server
    disconnect: () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        set({ socket: null, isConnected: false });
      }
    },

    // Emit event
    emit: (event, data) => {
      if (socket?.connected) {
        socket.emit(event, data);
      }
    },

    // Join conversation room
    joinConversation: (conversationId) => {
      if (socket?.connected) {
        socket.emit('join_conversation', conversationId);
      }
    },

    // Leave conversation room
    leaveConversation: (conversationId) => {
      if (socket?.connected) {
        socket.emit('leave_conversation', conversationId);
      }
    },

    // Send message
    sendMessage: (conversationId, content, type = 'text', replyTo = null, metadata = {}) => {
      if (socket?.connected) {
        socket.emit('send_message', {
          conversation_id: conversationId,
          content,
          type,
          reply_to: replyTo,
          metadata,
        });
      }
    },

    // Start typing
    startTyping: (conversationId) => {
      if (socket?.connected) {
        socket.emit('typing_start', { conversation_id: conversationId });
      }
    },

    // Stop typing
    stopTyping: (conversationId) => {
      if (socket?.connected) {
        socket.emit('typing_stop', { conversation_id: conversationId });
      }
    },

    // Mark as read
    markRead: (conversationId, messageId = null) => {
      if (socket?.connected) {
        socket.emit('mark_read', { conversation_id: conversationId, message_id: messageId });
      }
    },

    // Update status
    updateStatus: (status) => {
      if (socket?.connected) {
        socket.emit('update_status', { status });
      }
    },
  };
});