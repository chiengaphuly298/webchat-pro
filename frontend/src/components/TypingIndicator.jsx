import { motion } from 'framer-motion';

export default function TypingIndicator({ username }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full typing-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {username ? `${username} is typing...` : 'Someone is typing...'}
      </span>
    </motion.div>
  );
}