import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trash2, LogOut, Edit3, Check, Loader, Crown } from 'lucide-react';
import { conversationService } from '@/services/api';
import { useConversationStore } from '@/stores/conversationStore';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '../Avatar';
import toast from 'react-hot-toast';

export default function ConversationSettingsModal({ isOpen, onClose, conversation }) {
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const { deleteConversation, leaveGroup, updateConversation } = useConversationStore();
  const { user } = useAuthStore();

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.type === 'group';
  const isAdmin = conversation.members?.find(m => m.user_id === user?.id)?.role === 'admin';
  const otherMember = !isGroup ? conversation.members?.find(m => m.user_id !== user?.id)?.user : null;

  const handleDeleteConversation = async () => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await conversationService.delete(conversation.id);
      if (response.success) {
        deleteConversation(conversation.id);
        toast.success('Conversation deleted');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
    setLoading(false);
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await conversationService.leave(conversation.id);
      if (response.success) {
        leaveGroup(conversation.id);
        toast.success('You left the group');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to leave group');
    }
    setLoading(false);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const response = await conversationService.update(conversation.id, { name: newName.trim() });
      if (response.success) {
        updateConversation(conversation.id, { name: newName.trim() });
        setEditingName(false);
        toast.success('Group name updated');
      }
    } catch (error) {
      toast.error('Failed to update group name');
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await conversationService.removeMember(conversation.id, memberId);
      if (response.success) {
        toast.success('Member removed');
        // Update local state would happen via socket event
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                {isGroup ? <Users className="w-5 h-5 text-white" /> : <Avatar src={otherMember?.avatar_url} name={otherMember?.display_name} size="sm" />}
              </div>
              <div>
                <h2 className="font-semibold">{isGroup ? 'Group Settings' : 'Chat Settings'}</h2>
                <p className="text-xs text-gray-500">
                  {isGroup ? `${conversation.members?.length || 0} members` : otherMember?.display_name || otherMember?.username}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {/* Group name (only for groups) */}
            {isGroup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Group Name</label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={conversation.name || 'Enter group name'}
                      className="input flex-1"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={loading}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg"
                    >
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-2 hover:bg-dark-hover rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-dark-secondary rounded-lg">
                    <span className="font-medium">{conversation.name || 'Unnamed Group'}</span>
                    <button
                      onClick={() => {
                        setNewName(conversation.name || '');
                        setEditingName(true);
                      }}
                      className="p-2 hover:bg-dark-hover rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Members list (for groups) */}
            {isGroup && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Members</label>
                <div className="space-y-1">
                  {conversation.members?.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-dark-hover rounded-lg"
                    >
                      <Avatar
                        src={member.user?.avatar_url}
                        name={member.user?.display_name || member.user?.username}
                        size="sm"
                        status={member.user?.status}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user?.display_name || member.user?.username}
                          {member.user_id === user?.id && ' (You)'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.role === 'admin' && (
                            <span className="flex items-center gap-1 text-accent-blue">
                              <Crown className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </p>
                      </div>
                      {isAdmin && member.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"
                          title="Remove member"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-dark-border space-y-2">
              {isGroup ? (
                <>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 hover:bg-dark-hover rounded-lg text-left text-gray-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Leave Group</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={handleDeleteConversation}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 rounded-lg text-left text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Group</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleDeleteConversation}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 rounded-lg text-left text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Conversation</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}