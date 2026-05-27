import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone,
  Video,
  Settings,
  Search,
  Bell,
  Moon,
} from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from './Avatar';
import NotificationPanel from './NotificationPanel';

export default function Header() {
  const location = useLocation();
  const { currentConversation } = useConversationStore();
  const { user } = useAuthStore();
  const { unreadCount, friendRequestCount } = useNotificationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isChatPage = location.pathname.startsWith('/chat/');

  return (
    <>
      <header className="h-16 px-4 flex items-center justify-between bg-dark-secondary/50 backdrop-blur-sm border-b border-dark-border">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {isChatPage && currentConversation ? (
            <>
              <Avatar
                src={currentConversation.type === 'direct'
                  ? currentConversation.members?.find((m) => m.user_id !== user?.id)?.user?.avatar_url
                  : currentConversation.avatar_url
                }
                name={currentConversation.type === 'direct'
                  ? currentConversation.members?.find((m) => m.user_id !== user?.id)?.user?.display_name
                  : currentConversation.name
                }
                size="md"
              />
              <div>
                <h2 className="font-semibold text-white">
                  {currentConversation.type === 'direct'
                    ? currentConversation.members?.find((m) => m.user_id !== user?.id)?.user?.display_name
                    : currentConversation.name
                  }
                </h2>
                <p className="text-xs text-gray-500">
                  {currentConversation.type === 'group'
                    ? `${currentConversation.members?.length || 0} members`
                    : currentConversation.members?.find((m) => m.user_id !== user?.id)?.user?.status === 'online'
                      ? 'Online'
                      : 'Offline'
                  }
                </p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="font-semibold text-lg text-white">Welcome back</h2>
              <p className="text-xs text-gray-500">
                {user?.display_name || user?.username}
              </p>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isChatPage && currentConversation && (
            <>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {(friendRequestCount + unreadCount) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 rounded-full text-[10px] font-bold text-white">
                {(friendRequestCount + unreadCount) > 99 ? '99+' : (friendRequestCount + unreadCount)}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                      Preferences
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}