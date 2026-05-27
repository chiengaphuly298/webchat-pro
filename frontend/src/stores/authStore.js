import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login with credentials
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return response;
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Register new user
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return response;
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Google OAuth
      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.googleLogin(idToken);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return response;
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // GitHub OAuth
      loginWithGithub: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.githubLogin(idToken);
          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return response;
          }
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getMe();
          if (response.success) {
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          } else {
            get().logout();
          }
        } catch (error) {
          get().logout();
        }
      },

      // Update user profile
      updateProfile: async (data) => {
        try {
          const response = await authService.updateProfile(data);
          if (response.success) {
            set({ user: response.data.user });
          }
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          // Ignore logout errors
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);