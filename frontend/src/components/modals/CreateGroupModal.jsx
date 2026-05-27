import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search } from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';
import { userService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '../Avatar';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ isOpen, onClose }) {
  const { createGroupConversation } = useConversationStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userService.search(query);
      if (response.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const toggleMember = (member) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      toast.error('Group name is required and at least 2 members needed');
      return;
    }

    // Validate UUIDs
    const memberIds = selectedMembers.map((m) => m.id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = memberIds.filter(id => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      console.error('Invalid UUIDs:', invalidIds);
      toast.error('Invalid member ID format');
      return;
    }

    setIsCreating(true);
    console.log('Creating group:', { name: groupName, memberIds });
    try {
      const result = await createGroupConversation(groupName, memberIds);
      console.log('Group created result:', result);
      toast.success('Group created successfully');
      onClose();
      // Reset form
      setStep(1);
      setGroupName('');
      setSelectedMembers([]);
    } catch (error) {
      console.error('Create group error:', error);
      toast.error(error.message || 'Failed to create group');
    }
    setIsCreating(false);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Create Group</h2>
                <p className="text-xs text-gray-500">
                  {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Add Members ({selectedMembers.length} selected)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search users..."
                      className="input pl-10"
                    />
                  </div>

                  {/* Selected members */}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 px-2 py-1 bg-accent-blue/20 rounded-full"
                        >
                          <span className="text-sm">{member.display_name || member.username}</span>
                          <button
                            onClick={() => toggleMember(member)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-dark-border">
                      {searchResults
                        .filter((u) => u.id !== user?.id)
                        .map((userResult) => (
                          <div
                            key={userResult.id}
                            onClick={() => toggleMember(userResult)}
                            className="flex items-center gap-3 p-3 hover:bg-dark-hover cursor-pointer transition-colors"
                          >
                            <Avatar
                              src={userResult.avatar_url}
                              name={userResult.display_name || userResult.username}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {userResult.display_name || userResult.username}
                              </p>
                              <p className="text-xs text-gray-500">@{userResult.username}</p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedMembers.find((m) => m.id === userResult.id)
                                  ? 'border-accent-blue bg-accent-blue'
                                  : 'border-gray-500'
                              }`}
                            >
                              {selectedMembers.find((m) => m.id === userResult.id) && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Creating group <span className="text-white font-medium">"{groupName}"</span> with{' '}
                  <span className="text-accent-blue">{selectedMembers.length}</span> members
                </p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-dark-tertiary rounded-lg">
                      <Avatar
                        src={member.avatar_url}
                        name={member.display_name || member.username}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium">{member.display_name || member.username}</p>
                        <p className="text-xs text-gray-500">@{member.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-dark-border">
            {step === 1 ? (
              <>
                <button onClick={onClose} className="btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!groupName.trim() || selectedMembers.length < 2}
                  className="btn-primary"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} className="btn-ghost">
                  Back
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                  className="btn-primary"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}