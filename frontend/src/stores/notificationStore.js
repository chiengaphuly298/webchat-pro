import { create } from 'zustand';
import { notificationService } from '@/services/api';
import { friendService } from '@/services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  friendRequestCount: 0,
  isLoading: false,

  // Fetch notifications and friend requests
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      // Fetch notifications
      const notifResponse = await notificationService.getAll();
      if (notifResponse.success) {
        set({
          notifications: notifResponse.data.notifications || [],
          unreadCount: notifResponse.data.notifications?.filter((n) => !n.is_read).length || 0,
        });
      }

      // Fetch friend requests
      const friendResponse = await friendService.getRequests();
      if (friendResponse.success) {
        set({
          friendRequestCount: (friendResponse.data.incoming || []).length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    set({ isLoading: false });
  },

  // Refresh friend request count
  refreshFriendRequests: async () => {
    try {
      const friendResponse = await friendService.getRequests();
      if (friendResponse.success) {
        set({
          friendRequestCount: (friendResponse.data.incoming || []).length,
        });
      }
    } catch (error) {
      console.error('Failed to refresh friend requests:', error);
    }
  },

  // Add notification (from socket)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await notificationService.delete(notificationId);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: notification && !notification.is_read ? state.unreadCount - 1 : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  // Reset
  reset: () => {
    set({ notifications: [], unreadCount: 0, friendRequestCount: 0, isLoading: false });
  },
}));