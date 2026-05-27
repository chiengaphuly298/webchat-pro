import { create } from 'zustand';
import { conversationService } from '@/services/api';

export const useConversationStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  typingUsers: {},
  onlineStatuses: {},
  isLoading: false,
  error: null,
  hasMore: {},

  // Fetch all conversations
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await conversationService.getAll();
      if (response.success) {
        set({ conversations: response.data.conversations || [], isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch single conversation
  fetchConversation: async (conversationId) => {
    try {
      const response = await conversationService.getById(conversationId);
      if (response.success) {
        const conv = response.data.conversation;
        set((state) => {
          const exists = state.conversations.some(c => c.id === conversationId);
          return {
            conversations: exists
              ? state.conversations.map((c) => c.id === conversationId ? conv : c)
              : [conv, ...state.conversations],
            currentConversation: conv
          };
        });
        return conv;
      }
    } catch (error) {
      console.error('fetchConversation error:', error);
      throw error;
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  // Create/get direct conversation
  createDirectConversation: async (userId) => {
    try {
      const response = await conversationService.createDirect(userId);
      if (response.success) {
        const { conversation, created } = response.data;
        if (created) {
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          }));
        }
        return conversation;
      }
    } catch (error) {
      throw error;
    }
  },

  // Create group conversation
  createGroupConversation: async (name, memberIds) => {
    try {
      const response = await conversationService.createGroup(name, memberIds);
      if (response.success) {
        set((state) => ({
          conversations: [response.data.conversation, ...state.conversations],
        }));
        return response.data.conversation;
      }
      throw new Error(response.message || 'Failed to create group');
    } catch (error) {
      throw error;
    }
  },

  // Fetch messages for conversation
  fetchMessages: async (conversationId, before = null) => {
    try {
      const messages = get().messages[conversationId] || [];
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || [])],
        },
        hasMore: { ...state.hasMore, [conversationId]: true },
      }));

      const response = await conversationService.getMessages(conversationId, {
        limit: 50,
        before,
      });

      console.log('fetchMessages response:', JSON.stringify(response, null, 2));

      if (response.success) {
        const newMessages = response.data.messages || [];
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: before
              ? [...newMessages, ...(state.messages[conversationId] || [])]
              : newMessages,
          },
          hasMore: {
            ...state.hasMore,
            [conversationId]: newMessages.length === 50,
          },
        }));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add optimistic (temporary) message
  addOptimisticMessage: (conversationId, content, userId, tempId, type = 'text', replyTo = null) => {
    const tempMessage = {
      id: null,
      tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      type,
      reply_to: replyTo || null,
      created_at: new Date().toISOString(),
      is_pending: true,
    };
    
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, tempMessage],
        },
      };
    });
    
    return tempMessage;
  },

  // Add message (from socket)
  addMessage: (message) => {
    set((state) => {
      const existingMessages = state.messages[message.conversation_id] || [];
      // Check for duplicate by message ID
      if (existingMessages.some(m => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [message.conversation_id]: [...existingMessages, message],
        },
        conversations: state.conversations.map((c) =>
          c.id === message.conversation_id
            ? { ...c, last_message: message, last_message_at: message.created_at }
            : c
        ),
      };
    });
  },

  // Update temp message (after server confirms) - replace temp message with real one
  updateMessageTemp: (message) => {
    set((state) => {
      const conversationId = message.conversation_id;
      const existingMessages = state.messages[conversationId] || [];
      const tempId = message.metadata?.tempId;
      
      // Find temp message with matching tempId or matching content
      const tempMessageIndex = existingMessages.findIndex(m => 
        (tempId && m.tempId === tempId) || 
        (m.is_pending && m.content === message.content && m.sender_id === message.sender_id)
      );
      
      if (tempMessageIndex === -1) {
        // No temp message found, just add the message if it doesn't exist
        if (existingMessages.some(m => m.id === message.id)) {
          return state; // Already exists
        }
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...existingMessages, message],
          },
        };
      }
      
      // Replace temp message with real one
      const newMessages = [...existingMessages];
      newMessages[tempMessageIndex] = message;
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: newMessages,
        },
      };
    });
  },

  // Edit message
  editMessage: (messageId, updatedMessage) => {
    set((state) => {
      const newMessages = {};
      Object.keys(state.messages).forEach((convId) => {
        newMessages[convId] = (state.messages[convId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updatedMessage, edited_at: new Date().toISOString() } : m
        );
      });
      return { messages: newMessages };
    });
  },

  // Delete message
  deleteMessage: (messageId) => {
    set((state) => {
      const newMessages = {};
      Object.keys(state.messages).forEach((convId) => {
        newMessages[convId] = (state.messages[convId] || []).map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: 'Message deleted' } : m
        );
      });
      return { messages: newMessages };
    });
  },

  // Mark message as read
  markMessageRead: (messageId, readBy) => {
    set((state) => {
      const newMessages = {};
      Object.keys(state.messages).forEach((convId) => {
        newMessages[convId] = (state.messages[convId] || []).map((m) =>
          m.id === messageId
            ? { ...m, read_by: [...(m.read_by || []), readBy] }
            : m
        );
      });
      return { messages: newMessages };
    });
  },

  // Set typing indicator
  setTyping: (conversationId, userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: isTyping
          ? { ...(state.typingUsers[conversationId] || {}), [userId]: true }
          : Object.fromEntries(
              Object.entries(state.typingUsers[conversationId] || {}).filter(([id]) => id !== userId)
            ),
      },
    }));
  },

  // Update user online status
  updateUserStatus: (userId, status) => {
    set((state) => ({
      onlineStatuses: { ...state.onlineStatuses, [userId]: status },
    }));
  },

  // Mark conversation as read
  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    }));
  },

  // Clear current conversation
  clearCurrentConversation: () => {
    set({ currentConversation: null });
  },

  // Delete conversation from list
  deleteConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter(c => c.id !== conversationId),
      currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
    }));
  },

  // Leave group
  leaveGroup: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter(c => c.id !== conversationId),
      currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
    }));
  },

  // Update conversation
  updateConversation: (conversationId, updates) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, ...updates } : c
      ),
      currentConversation: state.currentConversation?.id === conversationId
        ? { ...state.currentConversation, ...updates }
        : state.currentConversation,
    }));
  },

  // Reset store
  reset: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: {},
      typingUsers: {},
      isLoading: false,
      error: null,
    });
  },
}));