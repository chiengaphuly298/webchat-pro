import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Search, MessageSquare, Loader } from 'lucide-react';
import { friendService } from '@/services/api';
import { conversationService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '../Avatar';
import toast from 'react-hot-toast';

export default function NewChatModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await friendService.getAll();
      console.log('Friends response:', response);
      if (response.success) {
        // Process friends to get the correct friend object
        const currentUserId = user?.id;
        const processedFriends = (response.data.friends || []).map(f => {
          console.log('Processing friend:', JSON.stringify(f, null, 2), 'Current userId:', currentUserId);
          // The friend object is directly in f.friend
          // user_id might not be in response, so we just use f.friend
          const actualFriend = f.friend;
          console.log('actualFriend:', actualFriend);
          return {
            ...f,
            actualFriend,
            actualFriendId: actualFriend?.id
          };
        });
        // Filter out current user from the list
        const filteredFriends = processedFriends.filter(f => f.actualFriendId !== currentUserId);
        console.log('Processed friends:', filteredFriends);
        setFriends(filteredFriends);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
    setLoading(false);
  };

  const handleStartChat = async (friendId) => {
    alert('Starting chat with ID: ' + friendId);
    console.log('Starting chat with friendId:', friendId);
    console.log('Current user:', user);
    console.log('Friends list:', friends);
    setStartingChat(friendId);
    try {
      const response = await conversationService.createDirect(friendId);
      console.log('Create direct chat response:', response);
      if (response.success && response.data?.conversation) {
        toast.success('Chat created!');
        onClose();
        navigate(`/chat/${response.data.conversation.id}`);
      } else {
        toast.error(response.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Failed to create chat');
    }
    setStartingChat(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold">New Chat</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2 bg-dark-tertiary border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
        </div>

        {/* Friends list */}
        <div className="max-h-80 overflow-y-auto p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No friends yet</p>
              <p className="text-sm mt-1">Add friends to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 px-2">YOUR FRIENDS</p>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-dark-hover rounded-xl transition-colors group"
                >
                  <Avatar
                    src={friend.actualFriend?.avatar_url}
                    name={friend.actualFriend?.display_name || friend.actualFriend?.username}
                    size="md"
                    status={friend.actualFriend?.status}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {friend.actualFriend?.display_name || friend.actualFriend?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {friend.actualFriend?.status === 'online' ? (
                        <span className="text-green-400">Online</span>
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartChat(friend.actualFriendId)}
                    disabled={startingChat === friend.actualFriendId}
                    className="p-2 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg transition-all"
                    title="Start chat"
                    style={{ opacity: 1 }}
                  >
                    {startingChat === friend.actualFriendId ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}