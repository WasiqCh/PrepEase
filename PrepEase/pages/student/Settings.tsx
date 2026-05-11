import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Hash, Book, Shield, Bell, Lock, Save, AlertCircle, LogOut } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  semester?: string;
  subjects?: string[];
  createdAt?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users/me');
      setUser(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user data');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdating(true);
    setPasswordError('');
    try {
      await axiosInstance.put('/users/me/password', {
        currentPassword: (e.currentTarget.elements.namedItem('currentPassword') as HTMLInputElement).value,
        newPassword: (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value,
      });
      alert('Password updated successfully.');
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
        <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="p-2 hover:bg-stone-100 rounded-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Account Settings</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Preferences & Security</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-stone-100 rounded-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Account Settings</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Preferences & Security</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-700" size={20} strokeWidth={1.5} />
          <p className="text-rose-700 text-sm font-sans">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-sm border border-stone-200 shadow-sm overflow-hidden">
             <div className="h-20 bg-stone-100 border-b border-stone-200"></div>
             <div className="px-6 pb-6 text-center -mt-10">
                <div className="w-20 h-20 rounded-sm bg-white p-1 mx-auto border border-stone-200 shadow-sm">
                    <div className="w-full h-full rounded-sm bg-stone-50 flex items-center justify-center text-stone-900 text-xl font-bold font-serif">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 mt-3 tracking-tight">{user?.firstName} {user?.lastName}</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">{user?.role} User</p>

                <div className="mt-6 space-y-4 text-left">
                    <div className="flex items-center gap-3 text-sm text-stone-700 border-b border-stone-200 pb-3">
                        <Mail size={16} className="text-stone-900" strokeWidth={1.5} />
                        <div className="font-sans">
                            <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Email</p>
                            <p className="text-stone-900 font-medium">{user?.email}</p>
                        </div>
                    </div>
                    {user?.department && (
                      <div className="flex items-center gap-3 text-sm text-stone-700 border-b border-stone-200 pb-3">
                          <Hash size={16} className="text-stone-900" strokeWidth={1.5} />
                          <div className="font-sans">
                              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Department</p>
                              <p className="text-stone-900 font-medium">{user.department}</p>
                          </div>
                      </div>
                    )}
                    {user?.semester && (
                      <div className="flex items-center gap-3 text-sm text-stone-700 border-b border-stone-200 pb-3">
                          <Book size={16} className="text-stone-900" strokeWidth={1.5} />
                          <div className="font-sans">
                              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Semester</p>
                              <p className="text-stone-900 font-medium">{user.semester}</p>
                          </div>
                      </div>
                    )}
                    {user?.subjects && user.subjects.length > 0 && (
                      <div className="flex items-start gap-3 text-sm text-stone-700">
                          <Book size={16} className="text-stone-900 mt-0.5" strokeWidth={1.5} />
                          <div className="flex-1 font-sans">
                              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Subjects</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {user.subjects.map((subject, idx) => (
                                  <span key={idx} className="border border-stone-900 text-stone-900 text-xs font-mono font-bold px-2 py-1 rounded-sm">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                          </div>
                      </div>
                    )}
                </div>
             </div>
          </div>
        </div>

        {/* Settings & Security */}
        <div className="lg:col-span-2 space-y-6">
            {/* Preferences */}
            <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight">
                    <Bell size={20} className="text-stone-900" strokeWidth={1.5} /> Preferences
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-sans font-bold text-stone-900">Email Notifications</p>
                            <p className="text-sm text-stone-500 font-sans">Receive updates about quizzes and assignments</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stone-200 rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-sans font-bold text-stone-900">SMS Alerts</p>
                            <p className="text-sm text-stone-500 font-sans">Get urgent deadlines via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={smsNotif} onChange={() => setSmsNotif(!smsNotif)} />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stone-200 rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-sans font-bold text-stone-900">Dark Mode</p>
                            <p className="text-sm text-stone-500 font-sans">Switch to a darker theme for night study</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-stone-200 rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight">
                    <Shield size={20} className="text-stone-900" strokeWidth={1.5} /> Security
                </h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    {passwordError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-sm p-3 flex items-center gap-2">
                        <AlertCircle className="text-rose-700" size={16} strokeWidth={1.5} />
                        <p className="text-sm text-rose-700 font-sans">{passwordError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <label className="text-sm font-sans font-bold text-stone-900">Current Password</label>
                             <div className="relative">
                                 <Lock className="absolute left-3 top-2.5 text-stone-400" size={16} strokeWidth={1.5} />
                                 <input 
                                   type="password" 
                                   name="currentPassword"
                                   placeholder="••••••••" 
                                   required
                                   className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans" 
                                 />
                             </div>
                         </div>
                         <div className="space-y-2">
                             <label className="text-sm font-sans font-bold text-stone-900">New Password</label>
                             <div className="relative">
                                 <Lock className="absolute left-3 top-2.5 text-stone-400" size={16} strokeWidth={1.5} />
                                 <input 
                                   type="password" 
                                   name="newPassword"
                                   placeholder="••••••••" 
                                   required
                                   className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans" 
                                 />
                             </div>
                         </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button 
                          type="submit" 
                          disabled={passwordUpdating}
                          className="px-6 py-2 bg-stone-900 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-bold rounded-sm flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} strokeWidth={1.5} /> {passwordUpdating ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;