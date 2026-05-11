import React, { useState } from 'react';
import { Shield, Lock, Bell, Database, Users, Save, AlertCircle } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const AdminSettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    requirePasswordChange: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
  });

  const user = localStorage.getItem("user") 
    ? JSON.parse(localStorage.getItem("user")!) 
    : { email: "admin@prepease.com", firstName: "Admin", lastName: "User" };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingChange = (setting: string, value: any) => {
    setSystemSettings({
      ...systemSettings,
      [setting]: value,
    });
  };

  const handleSaveSystemSettings = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // In a real implementation, this would save to backend
      // For now, we'll just show success
      setSuccess('System settings saved successfully!');
      console.log('Settings to save:', systemSettings);
    } catch (err: any) {
      setError('Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-stone-900">Admin Settings</h1>
        <p className="text-stone-600 mt-2 font-sans">Manage your admin account and system configuration</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm flex items-start gap-3">
          <AlertCircle size={20} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-sm font-sans">
          ✅ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-stone-400 to-stone-500"></div>
            <div className="px-6 pb-6 text-center -mt-10">
              <div className="w-20 h-20 rounded-full bg-stone-50 p-1 mx-auto shadow-md border-4 border-stone-50">
                <div className="w-full h-full rounded-full bg-stone-100 flex items-center justify-center text-stone-900 text-2xl font-bold font-serif">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-3">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-stone-500 font-mono text-xs uppercase tracking-widest font-bold">Administrator</p>

              <div className="mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-stone-700 border-b border-stone-200 pb-3">
                  <Shield size={16} strokeWidth={1.5} className="text-stone-900 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 font-mono uppercase tracking-widest font-bold">Role</p>
                    <p className="font-sans font-semibold text-stone-900">Admin</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700 border-b border-stone-200 pb-3">
                  <Users size={16} strokeWidth={1.5} className="text-stone-900 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 font-mono uppercase tracking-widest font-bold">Email</p>
                    <p className="font-sans font-semibold text-stone-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <Database size={16} strokeWidth={1.5} className="text-stone-900 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 font-mono uppercase tracking-widest font-bold">Status</p>
                    <p className="font-sans font-semibold text-emerald-700">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Section */}
          <div className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm p-6">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Lock size={20} strokeWidth={1.5} className="text-stone-900" /> Change Password
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-mono uppercase tracking-widest font-bold text-stone-900">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-mono uppercase tracking-widest font-bold text-stone-900">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono uppercase tracking-widest font-bold text-stone-900">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none font-sans"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-stone-900 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-sans font-bold rounded-sm flex items-center gap-2 transition-colors"
                >
                  <Save size={16} strokeWidth={1.5} /> Update Password
                </button>
              </div>
            </form>
          </div>

          {/* System Settings */}
          <div className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm p-6">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Bell size={20} strokeWidth={1.5} className="text-stone-900" /> System Settings
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-stone-200">
                <div>
                  <p className="font-sans font-bold text-stone-900">Email Notifications</p>
                  <p className="text-sm text-stone-500 font-sans">Receive system alerts and reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.emailNotifications}
                    onChange={(e) => handleSystemSettingChange('emailNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pb-6 border-b border-stone-200">
                <div>
                  <p className="font-sans font-bold text-stone-900">Require Password Change</p>
                  <p className="text-sm text-stone-500 font-sans">Force admins to change default password on first login</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.requirePasswordChange}
                    onChange={(e) => handleSystemSettingChange('requirePasswordChange', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              <div className="pb-6 border-b border-stone-200">
                <p className="font-sans font-bold text-stone-900 mb-3">Session Timeout (hours)</p>
                <p className="text-sm text-stone-500 font-sans mb-3">Auto-logout after inactivity</p>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none font-sans"
                />
              </div>

              <div>
                <p className="font-sans font-bold text-stone-900 mb-3">Max Login Attempts</p>
                <p className="text-sm text-stone-500 font-sans mb-3">Lock account after failed attempts</p>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none font-sans"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={loading}
                  className="px-6 py-2 bg-stone-900 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-sans font-bold rounded-sm flex items-center gap-2 transition-colors"
                >
                  <Save size={16} strokeWidth={1.5} /> Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
