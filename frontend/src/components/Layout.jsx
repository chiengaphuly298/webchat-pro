import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useConversationStore } from '@/stores/conversationStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSocketStore } from '@/stores/socketStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { fetchConversations } = useConversationStore();
  const { fetchNotifications } = useNotificationStore();
  const { isConnected } = useSocketStore();

  useEffect(() => {
    fetchConversations();
    fetchNotifications();
  }, [fetchConversations, fetchNotifications]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-dark-primary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 glass-strong px-4 py-2 rounded-full flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-gray-400">Reconnecting...</span>
        </div>
      )}
    </div>
  );
}