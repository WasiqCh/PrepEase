import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Building2, Shield, Bell, Lock, Save, AlertCircle } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedDepartments?: string[];
  assignedSemesters?: string[];
  assignedSubjects?: string[];
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
        <div className="border-b border-stone-200 pb-4">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
          >
            <ArrowLeft size={16} strokeWidth={1.5} /> Back
          </button>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Settings</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Account Configuration</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Settings</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Account Configuration</p>
      </div>

      {error && (
        <div className="bg-white border border-rose-700 rounded-sm p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="text-rose-700" size={18} strokeWidth={1.5} />
          <p className="text-rose-700 font-sans text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <div className="text-center mb-6 pb-6 border-b border-stone-200">
              <div className="w-20 h-20 bg-stone-100 border-2 border-stone-900 mx-auto flex items-center justify-center">
                <span className="text-2xl font-serif font-bold text-stone-900">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-4 tracking-tight">{user?.firstName} {user?.lastName}</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">{user?.role}</p>

              <div className="space-y-0 divide-y divide-stone-200 text-left">
                <div className="flex items-center gap-3 py-3">
                  <Mail size={16} className="text-stone-400" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Email</p>
                    <p className="text-sm font-sans text-stone-900 mt-0.5">{user?.email}</p>
                  </div>
                </div>
                
                {user?.assignedDepartments && user.assignedDepartments.length > 0 && (
                  <div className="flex items-start gap-3 py-3">
                    <Building2 size={16} className="text-stone-400 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Departments</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.assignedDepartments.map((dept, idx) => (
                          <span key={idx} className="bg-white border border-stone-900 text-stone-900 text-xs px-2 py-1 font-mono font-bold">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {user?.assignedSemesters && user.assignedSemesters.length > 0 && (
                  <div className="flex items-start gap-3 py-3">
                    <Building2 size={16} className="text-stone-400 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Semesters</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.assignedSemesters.map((sem, idx) => (
                          <span key={idx} className="bg-white border border-stone-900 text-stone-900 text-xs px-2 py-1 font-mono font-bold">
                            {sem}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {user?.assignedSubjects && user.assignedSubjects.length > 0 && (
                  <div className="flex items-start gap-3 py-3">
                    <Building2 size={16} className="text-stone-400 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Subjects</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.assignedSubjects.map((subject, idx) => (
                          <span key={idx} className="bg-white border border-stone-900 text-stone-900 text-xs px-2 py-1 font-mono font-bold">
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
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight mb-6 pb-4 border-b border-stone-200 flex items-center gap-3">
              <Bell size={20} className="text-stone-400" strokeWidth={1.5} /> Preferences
            </h3>
            <div className="space-y-0 divide-y divide-stone-200">
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-sans font-bold text-sm text-stone-900">Email Alerts</p>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">Get updates about assignments and progress</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none border border-stone-300 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-stone-900 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700 peer-checked:border-emerald-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-sans font-bold text-sm text-stone-900">SMS Alerts</p>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">Get urgent alerts via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={smsNotif} onChange={() => setSmsNotif(!smsNotif)} />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none border border-stone-300 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-stone-900 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700 peer-checked:border-emerald-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-sans font-bold text-sm text-stone-900">Dark Theme</p>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">Use darker colors for night work</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none border border-stone-300 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-stone-900 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700 peer-checked:border-emerald-700"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight mb-6 pb-4 border-b border-stone-200 flex items-center gap-3">
              <Shield size={20} className="text-stone-400" strokeWidth={1.5} /> Security
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              {passwordError && (
                <div className="bg-white border border-rose-700 rounded-sm p-3 flex items-center gap-3 shadow-sm">
                  <AlertCircle className="text-rose-700" size={16} strokeWidth={1.5} />
                  <p className="text-sm font-sans text-rose-700">{passwordError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-stone-400" size={16} strokeWidth={1.5} />
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-stone-400" size={16} strokeWidth={1.5} />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold flex items-center gap-2"
                >
                  <Save size={14} strokeWidth={2} /> {passwordUpdating ? 'Saving...' : 'Save Password'}
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
