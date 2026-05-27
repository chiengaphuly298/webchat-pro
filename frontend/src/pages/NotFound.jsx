import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-dark-primary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-bold text-accent-blue">404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link to="/login" className="btn-secondary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}