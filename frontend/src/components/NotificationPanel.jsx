import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Bell, Check, Trash2, Loader } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { friendService } from '@/services/api';
import { conversationService } from '@/services/api';
import { useNotificationStore } from '@/stores/notificationStore';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuthStore();
  const { refreshFriendRequests } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchFriendRequests();
    }
  }, [isOpen]);

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const response = await friendService.getRequests();
      if (response.success) {
        setRequests(response.data.incoming || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  const handleAccept = async (requestId, userId) => {
    setProcessingId(requestId);
    try {
      const response = await friendService.acceptRequest(requestId);
      if (response.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        toast.success('Friend request accepted!');
        refreshFriendRequests();

        // Tạo hoặc tìm conversation với user đó
        try {
          const convResponse = await conversationService.createDirect(userId);
          if (convResponse.success && convResponse.data.conversation) {
            navigate(`/chat/${convResponse.data.conversation.id}`);
          }
        } catch (e) {
          console.error('Failed to create conversation:', e);
        }

        if (requests.length <= 1) {
          onClose();
        }
      }
    } catch (error) {
      toast.error('Failed to accept request');
    }
    setProcessingId(null);
  };

  const handleDecline = async (requestId) => {
    setProcessingId(requestId);
    try {
      const response = await friendService.declineRequest(requestId);
      if (response.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        toast.success('Friend request declined');
        refreshFriendRequests();
        if (requests.length <= 1) {
          onClose();
        }
      }
    } catch (error) {
      toast.error('Failed to decline request');
    }
    setProcessingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute right-4 top-16 w-80 glass-strong rounded-2xl shadow-2xl overflow-hidden z-50" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-accent-blue" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-hover rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-2">FRIEND REQUESTS</p>
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <Avatar
                    src={request.user?.avatar_url}
                    name={request.user?.display_name || request.user?.username}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {request.user?.display_name || request.user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      wants to be your friend
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAccept(request.id, request.user?.id)}
                      disabled={processingId === request.id}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                      title="Accept"
                    >
                      {processingId === request.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      disabled={processingId === request.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Decline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}