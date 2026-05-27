import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Palette,
  LogOut,
  Camera,
  Save,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, logout } = useAuthStore();

  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-tertiary text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="glass rounded-2xl p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={formData.avatar_url || user?.avatar_url}
                    alt={user?.display_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-dark-border"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;
                    }}
                  />
                  <button className="absolute bottom-0 right-0 p-2 bg-accent-blue rounded-full text-white hover:bg-accent-blue/80 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold">{user?.display_name || user?.username}</h3>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="input resize-none"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="glass rounded-2xl p-6 space-y-6">
              <h3 className="font-semibold">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button className="btn-primary">Update Password</button>

              <hr className="border-dark-border" />

              <div>
                <h3 className="font-semibold mb-2">Active Sessions</h3>
                <p className="text-sm text-gray-500">
                  You're currently logged in on this device.
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold">Notification Preferences</h3>

              {[
                { label: 'Push Notifications', desc: 'Receive push notifications for new messages' },
                { label: 'Sound Alerts', desc: 'Play sound for new messages' },
                { label: 'Message Preview', desc: 'Show message content in notifications' },
                { label: 'Typing Indicators', desc: 'Show when someone is typing' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-dark-tertiary rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-dark-border peer-focus:ring-2 peer-focus:ring-accent-blue/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold">Theme</h3>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'dark', label: 'Dark', color: 'from-gray-900 to-gray-800' },
                  { id: 'light', label: 'Light', color: 'from-gray-100 to-gray-200' },
                  { id: 'system', label: 'System', color: 'from-gray-700 to-gray-600' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    className="p-4 rounded-xl border-2 border-dark-border hover:border-accent-blue transition-colors"
                  >
                    <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${theme.color} mb-2`} />
                    <span className="text-sm font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="btn-danger w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}