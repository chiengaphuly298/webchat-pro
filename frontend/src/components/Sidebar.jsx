import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';
import { useAuthStore } from '@/stores/authStore';
import Avatar from './Avatar';
import CreateGroupModal from './modals/CreateGroupModal';

export default function Sidebar() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { conversations, isLoading } = useConversationStore();
  const { user } = useAuthStore();

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = conv.type === 'direct'
      ? conv.members?.find((m) => m.user_id !== user?.id)?.user?.display_name
      : conv.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const navItems = [
    { icon: MessageSquare, label: 'Chats', path: '/' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <aside className="w-72 h-full flex flex-col bg-dark-secondary border-r border-dark-border">
        {/* Logo */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-dark-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">WebChat Pro</h1>
            <p className="text-xs text-gray-500">Online • {conversations.length} chats</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(({ icon: Icon, label, path }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    location.pathname === path
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-gray-400 hover:text-white hover:bg-dark-tertiary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-tertiary border border-dark-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Conversations
            </h3>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-1 text-gray-400 hover:text-white hover:bg-dark-hover rounded transition-colors"
              title="New group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-1">
            {isLoading ? (
              // Loading skeletons
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 skeleton rounded" />
                    <div className="h-3 w-32 skeleton rounded" />
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={location.pathname === `/chat/${conversation.id}`}
                  index={index}
                />
              ))
            )}
          </ul>
        </div>

        {/* User profile quick access */}
        <div className="p-4 border-t border-dark-border">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-tertiary transition-colors"
          >
            <Avatar
              src={user?.avatar_url}
              name={user?.display_name || user?.username}
              size="sm"
              status={user?.status}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.display_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </Link>
        </div>
      </aside>

      {/* Modals */}
      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </>
  );
}

function ConversationItem({ conversation, isActive, index }) {
  const { user } = useAuthStore();

  const otherMember = conversation.type === 'direct'
    ? conversation.members?.find((m) => m.user_id !== user?.id)?.user
    : null;

  const displayName = conversation.type === 'direct'
    ? otherMember?.display_name || otherMember?.username
    : conversation.name;

  const avatarUrl = conversation.type === 'direct'
    ? otherMember?.avatar_url
    : conversation.avatar_url;

  const lastMessage = conversation.last_message;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/chat/${conversation.id}`}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
          isActive
            ? 'bg-accent-blue/10 border-l-2 border-accent-blue'
            : 'hover:bg-dark-tertiary'
        }`}
      >
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="md"
          status={otherMember?.status}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>
              {conversation.type === 'group' && (
                <Hash className="inline w-3 h-3 mr-1 text-gray-500" />
              )}
              {displayName}
            </p>
            {conversation.unread_count > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-accent-blue rounded-full text-xs font-medium text-white">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
          {lastMessage && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {lastMessage.sender_id === user?.id ? 'You: ' : ''}
              {lastMessage.content || lastMessage.type}
            </p>
          )}
        </div>
      </Link>
    </motion.li>
  );
}