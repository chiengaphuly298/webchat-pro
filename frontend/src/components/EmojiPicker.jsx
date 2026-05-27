import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const commonEmojis = [
  '😂', '❤️', '😍', '😊', '🔥', '👍', '👏', '🎉',
  '😎', '🤔', '😅', '🥰', '😘', '🤝', '💯', '✨',
  '🙌', '💪', '🤣', '😭', '😜', '🤩', '🥳', '😇',
];

const emojiCategories = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '☝️', '👆', '👇', '👈', '👉', '🖕', '✋', '🤚', '🖐️'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'] },
  { name: 'Objects', emojis: ['🔥', '⭐', '✨', '💫', '⚡', '🌟', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '📱', '💻', '⌨️', '🖥️'] },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [category, setCategory] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full right-0 mb-2 w-80 glass-strong rounded-xl shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-dark-border">
        <span className="text-sm font-medium">Emoji</span>
        <button onClick={onClose} className="p-1 hover:bg-dark-hover rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 p-2 border-b border-dark-border">
        {emojiCategories.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setCategory(i)}
            className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
              category === i ? 'bg-accent-blue text-white' : 'hover:bg-dark-hover'
            }`}
          >
            {cat.name.slice(0, 5)}
          </button>
        ))}
      </div>

      {/* Emojis grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[category]?.emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-dark-hover rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Quick picks */}
      <div className="p-3 border-t border-dark-border">
        <p className="text-xs text-gray-500 mb-2">Quick picks</p>
        <div className="flex gap-1 flex-wrap">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-dark-hover rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}