import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Image,
  File,
  Mic,
  Reply,
  Trash2,
  Edit3,
  Pin,
  Check,
  CheckCheck,
  Settings,
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useConversationStore } from '@/stores/conversationStore';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/components/Avatar';
import TypingIndicator from '@/components/TypingIndicator';
import EmojiPicker from '@/components/EmojiPicker';
import MessageSkeleton from '@/components/skeletons/MessageSkeleton';
import ConversationSettingsModal from '@/components/modals/ConversationSettingsModal';
import clsx from 'clsx';

export default function Chat() {
  const { conversationId } = useParams();
  const {
    messages,
    currentConversation,
    fetchMessages,
    fetchConversation,
    setCurrentConversation,
    typingUsers,
    hasMore,
    addMessage,
    addOptimisticMessage,
  } = useConversationStore();
  const { sendMessage, startTyping, stopTyping, markRead, joinConversation, leaveConversation } = useSocketStore();
  const { user } = useAuthStore();

  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editMessage, setEditMessage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversationMessages = messages[conversationId] || [];
  const otherUserId = currentConversation?.type === 'direct'
    ? currentConversation.members?.find((m) => m.user_id !== user?.id)?.user_id
    : null;
  const typingUser = typingUsers[conversationId]?.[otherUserId];

  // Load conversation and messages
  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      setIsLoading(true);
      try {
        await fetchConversation(conversationId);
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
      try {
        await fetchMessages(conversationId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
      setIsLoading(false);
    };

    loadConversation();
    joinConversation(conversationId);
    markRead(conversationId);

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, fetchConversation, fetchMessages, joinConversation, leaveConversation, markRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }, [conversationId, startTyping, stopTyping]);

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (editMessage) {
      // Edit message (would call API here)
      setEditMessage(null);
    } else {
      // Generate temp ID for optimistic message
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare reply_to data - include full message object if replying
      const replyToData = replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        sender: replyingTo.sender || {
          id: replyingTo.sender_id,
          username: 'Unknown',
          display_name: replyingTo.sender_name || 'Unknown User',
          avatar_url: null
        }
      } : null;
      
      // Add optimistic message immediately with full reply info
      addOptimisticMessage(
        conversationId,
        newMessage.trim(),
        user?.id,
        tempId,
        'text',
        replyToData
      );
      
      // Send message to server
      sendMessage(conversationId, newMessage.trim(), 'text', replyingTo?.id, { tempId });
    }

    setNewMessage('');
    setReplyingTo(null);
    stopTyping(conversationId);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add reaction
  const addReaction = (messageId, emoji) => {
    // Would call API here
    setShowEmoji(false);
  };

  // Group messages by date
  const groupedMessages = conversationMessages.reduce((groups, message) => {
    const date = new Date(message.created_at);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  const formatDateLabel = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <MessageSkeleton />
        ) : conversationMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-dark-tertiary mx-auto mb-4 flex items-center justify-center">
                <Send className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <span className="px-4 py-1 bg-dark-tertiary rounded-full text-xs text-gray-400">
                  {formatDateLabel(dateKey)}
                </span>
              </div>

              {/* Messages */}
              <AnimatePresence>
                <div className="space-y-3">
                  {msgs.map((message, index) => (
                    <MessageBubble
                      key={message.id || message.tempId}
                      message={message}
                      isOwn={message.sender_id === user?.id}
                      showAvatar={
                        index === 0 ||
                        msgs[index - 1]?.sender_id !== message.sender_id ||
                        new Date(message.created_at).getTime() - new Date(msgs[index - 1]?.created_at).getTime() > 300000
                      }
                      onReply={() => setReplyingTo(message)}
                      onEdit={() => setEditMessage(message)}
                      onDelete={() => {/* TODO */}}
                      onReact={(emoji) => addReaction(message.id, emoji)}
                      isEditing={editMessage?.id === message.id}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUser && (
          <TypingIndicator username={currentConversation?.members?.find((m) => m.user_id === otherUserId)?.user?.display_name} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2 bg-white/10 border-t border-white/20 flex items-center gap-3"
        >
          <Reply className="w-4 h-4 text-white/70" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/90 font-medium">
              Replying to {replyingTo.sender?.display_name || replyingTo.sender?.username || 'Unknown'}
            </p>
            <p className="text-xs text-white/50 truncate">{replyingTo.content}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-dark-hover rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center gap-3">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAttach(!showAttach)}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
              title="Conversation Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-dark-tertiary border border-dark-border rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-transparent transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Emoji picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmoji && (
              <EmojiPicker
                onSelect={(emoji) => {
                  setNewMessage((prev) => prev + emoji);
                  setShowEmoji(false);
                }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={clsx(
              'p-3 rounded-xl transition-all',
              newMessage.trim()
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-lg hover:shadow-accent-blue/25'
                : 'bg-dark-tertiary text-gray-500 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Attachment popup */}
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-4 glass-strong rounded-xl p-2 shadow-xl"
          >
            <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-dark-hover rounded-lg transition-colors">
              <Image className="w-5 h-5 text-accent-blue" />
              <span>Image</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-dark-hover rounded-lg transition-colors">
              <File className="w-5 h-5 text-accent-purple" />
              <span>File</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Conversation Settings Modal */}
      <ConversationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        conversation={currentConversation}
      />
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isEditing,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (date) => format(new Date(date), 'HH:mm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx('flex items-end gap-3', isOwn && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={clsx('w-10 flex-shrink-0 self-end', showAvatar ? '' : 'invisible')}>
        <Avatar
          src={message.sender?.avatar_url}
          name={message.sender?.display_name || message.sender?.username}
          size="md"
        />
      </div>

      {/* Message content */}
      <div className={clsx('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {showAvatar && (
          <div className={clsx('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
            <span className="text-sm font-medium">
              {message.sender?.display_name || message.sender?.username}
            </span>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
          </div>
        )}

        {/* Message bubble */}
        <div className={clsx(
          'group relative rounded-2xl px-4 py-2',
          isOwn
            ? 'message-sent rounded-br-md message-sent-glow'
            : 'message-received rounded-bl-md message-received-glow'
        )}>
          {message.is_deleted ? (
            <p className="italic text-gray-400">Message deleted</p>
          ) : (
            <>
              {message.reply_to && (
                <div className={clsx(
                  "mb-2 pl-3 border-l-2 rounded-r-lg py-1.5 px-2",
                  isOwn
                    ? "border-white/30 bg-white/10"
                    : "border-white/20 bg-white/5"
                )}>
                  <p className={clsx(
                    "text-xs font-medium truncate",
                    isOwn ? "text-white/90" : "text-white/70"
                  )}>
                    ↳ {message.reply_to.sender?.display_name || message.reply_to.sender?.username || 'Unknown'}
                  </p>
                  <p className="text-xs text-white/50 truncate">{message.reply_to.content || '(message deleted)'}</p>
                </div>
              )}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.edited_at && (
                <span className="text-xs text-gray-400 ml-2">(edited)</span>
              )}
            </>
          )}

          {/* Hover menu */}
          <div className={clsx(
            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            isOwn ? '-left-12' : '-right-12'
          )}>
            <div className="flex items-center gap-1 bg-dark-secondary border border-dark-border rounded-lg p-1">
              <button onClick={onReply} className="p-1.5 hover:bg-dark-hover rounded">
                <Reply className="w-4 h-4" />
              </button>
              <button onClick={() => onReact('👍')} className="p-1.5 hover:bg-dark-hover rounded">
                <Smile className="w-4 h-4" />
              </button>
              {isOwn && (
                <button onClick={onEdit} className="p-1.5 hover:bg-dark-hover rounded">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {isOwn && (
                <button onClick={onDelete} className="p-1.5 hover:bg-dark-hover rounded text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reactions & status */}
        {(message.reactions || message.read_by?.length > 0) && (
          <div className={clsx('flex items-center gap-2 mt-1', isOwn && 'justify-end')}>
            {message.reactions && (
              <span className="px-2 py-0.5 bg-dark-tertiary rounded-full text-xs">
                {message.reactions}
              </span>
            )}
            {isOwn && message.read_by?.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCheck className="w-4 h-4 text-accent-blue" />
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}