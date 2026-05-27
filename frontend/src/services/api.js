/**
 * API Service Layer
 * Centralized API calls with consistent error handling
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get auth header
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.token
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Generic fetch wrapper
 */
const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

/**
 * Auth Service
 */
export const authService = {
  login: (email, password) =>
    fetchApi('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (data) =>
    fetchApi('/api/v1/auth/register', {
      method: 'POST',
      body: data,
    }),

  logout: () =>
    fetchApi('/api/v1/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetchApi('/api/v1/auth/me'),

  googleLogin: (idToken) =>
    fetchApi('/api/v1/auth/google', {
      method: 'POST',
      body: { id_token: idToken },
    }),

  githubLogin: (idToken, accessToken) =>
    fetchApi('/api/v1/auth/github', {
      method: 'POST',
      body: { id_token: idToken, access_token: accessToken },
    }),

  forgotPassword: (email) =>
    fetchApi('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  changePassword: (currentPassword, newPassword) =>
    fetchApi('/api/v1/auth/password', {
      method: 'PUT',
      body: { current_password: currentPassword, new_password: newPassword },
    }),
};

/**
 * User Service
 */
export const userService = {
  search: (query) =>
    fetchApi(`/api/v1/users/search?q=${encodeURIComponent(query)}`),

  getById: (userId) =>
    fetchApi(`/api/v1/users/${userId}`),

  updateProfile: (data) =>
    fetchApi('/api/v1/users/profile', {
      method: 'PUT',
      body: data,
    }),

  updateSettings: (settings) =>
    fetchApi('/api/v1/users/settings', {
      method: 'PUT',
      body: { settings },
    }),

  updateStatus: (status) =>
    fetchApi('/api/v1/users/status', {
      method: 'PUT',
      body: { status },
    }),
};

/**
 * Conversation Service
 */
export const conversationService = {
  getAll: () =>
    fetchApi('/api/v1/conversations'),

  getById: (conversationId) =>
    fetchApi(`/api/v1/conversations/${conversationId}`),

  createDirect: (userId) =>
    fetchApi('/api/v1/conversations/direct', {
      method: 'POST',
      body: { user_id: userId },
    }),

  createGroup: (name, memberIds) =>
    fetchApi('/api/v1/conversations/group', {
      method: 'POST',
      body: { name, member_ids: memberIds },
    }),

  update: (conversationId, data) =>
    fetchApi(`/api/v1/conversations/${conversationId}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (conversationId) =>
    fetchApi(`/api/v1/conversations/${conversationId}`, {
      method: 'DELETE',
    }),

  addMember: (conversationId, userId) =>
    fetchApi(`/api/v1/conversations/${conversationId}/members`, {
      method: 'POST',
      body: { user_id: userId },
    }),

  removeMember: (conversationId, userId) =>
    fetchApi(`/api/v1/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
    }),

  leave: (conversationId) =>
    fetchApi(`/api/v1/conversations/${conversationId}/leave`, {
      method: 'POST',
    }),

  markAsRead: (conversationId) =>
    fetchApi(`/api/v1/conversations/${conversationId}/read`, {
      method: 'PUT',
    }),

  getMessages: (conversationId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/v1/messages/${conversationId}${query ? `?${query}` : ''}`);
  },
};

/**
 * Message Service
 */
export const messageService = {
  send: (conversationId, data) =>
    fetchApi(`/api/v1/messages/${conversationId}`, {
      method: 'POST',
      body: data,
    }),

  edit: (messageId, content) =>
    fetchApi(`/api/v1/messages/${messageId}`, {
      method: 'PUT',
      body: { content },
    }),

  delete: (messageId, hard = false) =>
    fetchApi(`/api/v1/messages/${messageId}?hard=${hard}`, {
      method: 'DELETE',
    }),

  pin: (messageId) =>
    fetchApi(`/api/v1/messages/${messageId}/pin`, {
      method: 'PUT',
    }),

  markRead: (messageId) =>
    fetchApi(`/api/v1/messages/${messageId}/read`, {
      method: 'PUT',
    }),

  search: (query, conversationId = null) => {
    const params = new URLSearchParams({ q: query });
    if (conversationId) params.append('conversation_id', conversationId);
    return fetchApi(`/api/v1/messages/search?${params.toString()}`);
  },
};

/**
 * Friend Service
 */
export const friendService = {
  getAll: (status = 'accepted') =>
    fetchApi(`/api/v1/friends?status=${status}`),

  getRequests: () =>
    fetchApi('/api/v1/friends/requests'),

  sendRequest: (userId) =>
    fetchApi('/api/v1/friends/request', {
      method: 'POST',
      body: { user_id: userId },
    }),

  acceptRequest: (requestId) =>
    fetchApi(`/api/v1/friends/request/${requestId}/accept`, {
      method: 'PUT',
    }),

  declineRequest: (requestId) =>
    fetchApi(`/api/v1/friends/request/${requestId}/decline`, {
      method: 'PUT',
    }),

  remove: (friendshipId) =>
    fetchApi(`/api/v1/friends/${friendshipId}`, {
      method: 'DELETE',
    }),

  block: (userId, block = true) =>
    fetchApi(`/api/v1/friends/block/${userId}`, {
      method: 'PUT',
      body: { block },
    }),
};

/**
 * Notification Service
 */
export const notificationService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/v1/notifications${query ? `?${query}` : ''}`);
  },

  markAsRead: (notificationId) =>
    fetchApi(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    fetchApi('/api/v1/notifications/read-all', {
      method: 'PUT',
    }),

  delete: (notificationId) =>
    fetchApi(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};

/**
 * Upload Service
 */
export const uploadService = {
  uploadFile: async (file, type = 'file') => {
    const formData = new FormData();
    formData.append(type === 'voice' ? 'voice' : 'file', file);

    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.token
      : null;

    const response = await fetch(`${API_URL}/api/v1/upload/${type}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },

  uploadImage: (file) => uploadService.uploadFile(file, 'image'),

  uploadVoice: (file) => uploadService.uploadFile(file, 'voice'),
};