import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Chrome, Github, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { signInWithGoogle, signInWithGithub } from '@/services/supabase';

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    display_name: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await register({
        email: formData.email,
        username: formData.username,
        display_name: formData.display_name || formData.username,
        password: formData.password,
      });

      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Google signup failed');
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { data, error } = await signInWithGithub();
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('GitHub signup failed');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-dark-primary p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-gray-400 mt-2">Join WebChat Pro and start chatting</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="John Doe"
                className="input pl-11"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="johndoe"
                required
                minLength={3}
                maxLength={30}
                className="input pl-11"
              />
            </div>
          </div>

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
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="input pl-11"
              />
            </div>
          </div>

          {/* Errors */}
          {(error || validationError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {validationError || error}
            </div>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-accent-blue hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </div>
            ) : (
              'Create account'
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-sm text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Chrome className="w-5 h-5" />
              Google
            </button>
            <button
              type="button"
              onClick={handleGithubLogin}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-blue hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}