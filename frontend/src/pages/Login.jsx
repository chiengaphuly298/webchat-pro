import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-dark-primary p-4 overflow-y-auto">
      {/* Custom scrollbar styles */}
      <style>{`
        .login-container::-webkit-scrollbar {
          width: 6px;
        }
        .login-container::-webkit-scrollbar-track {
          background: #0a0a0f;
        }
        .login-container::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        .login-container::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md login-container"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to continue to WebChat Pro</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="input pl-11"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-accent-blue hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-blue hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}