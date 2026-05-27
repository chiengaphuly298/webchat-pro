import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  Search,
  Plus,
} from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';
import { useAuthStore } from '@/stores/authStore';
import FindFriendsModal from '@/components/modals/FindFriendsModal';
import NewChatModal from '@/components/modals/NewChatModal';
import CreateGroupModal from '@/components/modals/CreateGroupModal';

export default function Home() {
  const { conversations } = useConversationStore();
  const { user } = useAuthStore();
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const quickActions = [
    { label: 'New Chat', icon: Plus, color: 'from-accent-blue to-accent-purple', onClick: () => setShowNewChat(true) },
    { label: 'Find Friends', icon: Search, color: 'from-green-500 to-emerald-600', onClick: () => setShowFindFriends(true) },
    { label: 'Create Group', icon: Users, color: 'from-purple-500 to-violet-600', onClick: () => setShowCreateGroup(true) },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-3 p-4 glass rounded-xl hover:border-accent-blue/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent chats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Chats</h2>
            <Link to="/" className="text-sm text-accent-blue hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">Start chatting with friends and colleagues</p>
              <button className="btn-primary">
                Start a new chat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {conversations.slice(0, 4).map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/chat/${conversation.id}`}
                  className="glass rounded-xl p-4 hover:border-accent-blue/30 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {conversation.name || 'Chat'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Find Friends Modal */}
      <FindFriendsModal
        isOpen={showFindFriends}
        onClose={() => setShowFindFriends(false)}
      />

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  );
}