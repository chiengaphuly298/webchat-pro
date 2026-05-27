import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader } from 'lucide-react';
import { userService } from '@/services/api';
import { friendService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from '../Avatar';
import toast from 'react-hot-toast';

export default function FindFriendsModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const { user } = useAuthStore();
  const { refreshFriendRequests } = useNotificationStore();

  // Fetch all users on mount
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.search('');
      if (response.success) {
        // Filter out current user, already friends, and already sent request
        const filtered = (response.data.users || []).filter(u => {
          if (u.id === user?.id) return false;
          return true;
        });
        setUsers(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setLoading(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const response = await userService.search(query);
      if (response.success) {
        const filtered = (response.data.users || []).filter(u => u.id !== user?.id);
        setUsers(filtered);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  const sendFriendRequest = async (userId) => {
    setSendingTo(userId);
    try {
      const response = await friendService.sendRequest(userId);
      if (response.success) {
        setPendingRequests(prev => new Set([...prev, userId]));
        // Remove from list after short delay
        setTimeout(() => {
          setUsers(prev => prev.filter(u => u.id !== userId));
        }, 500);
        toast.success('Friend request sent!');
        refreshFriendRequests();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send request');
    }
    setSendingTo(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-strong rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Find Friends</h2>
                <p className="text-xs text-gray-500">Send friend requests to other users</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-dark-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by name or username..."
                className="input pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="w-6 h-6 animate-spin text-accent-blue" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              <div className="p-2">
                {users.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="flex items-center gap-3 p-3 hover:bg-dark-hover rounded-lg transition-colors"
                  >
                    <Avatar
                      src={userItem.avatar_url}
                      name={userItem.display_name || userItem.username}
                      size="md"
                      status={userItem.status}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {userItem.display_name || userItem.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{userItem.username}
                        {userItem.status === 'online' && (
                          <span className="text-online ml-2">• Online</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(userItem.id)}
                      disabled={sendingTo === userItem.id || pendingRequests.has(userItem.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        pendingRequests.has(userItem.id)
                          ? 'bg-green-500/20 text-green-400'
                          : 'hover:bg-dark-tertiary text-gray-400 hover:text-white'
                      }`}
                    >
                      {sendingTo === userItem.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : pendingRequests.has(userItem.id) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark-border">
            <p className="text-xs text-gray-500 text-center">
              Sent requests will be removed from this list
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}