import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, ArrowRight, ArrowLeft, User, Lock, AlertCircle, Shield } from 'lucide-react';
import { Role } from '../../types';
import axiosInstance from '../../src/api/axiosInstance';

// Simple text logo
const LOGO_SRC = "PREPEASE";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select a portal.');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: username.trim(),
        password: password.trim(),
      });

      const { token, id, email, role, firstName, lastName } = response.data || {};

      if (!token || !email || !role) {
        setError('Login failed. Please try again.');
        return;
      }

      const user = { id, email, role, firstName, lastName };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      const userRole = (user.role || selectedRole).toLowerCase();
      switch (userRole) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/student/dashboard');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid email or password.';
      setError(message);
    }
  };

  const handleForgotPassword = () => {
    alert("Reset link sent to your email.");
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'student': return <GraduationCap size={32} strokeWidth={1.5} className="text-stone-900" />;
      case 'teacher': return <BookOpen size={32} strokeWidth={1.5} className="text-stone-900" />;
      case 'admin': return <Shield size={32} strokeWidth={1.5} className="text-stone-900" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4 font-sans">
      <div className="mb-8 text-center animate-fadeIn flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-stone-100 text-stone-900">⚡</span>
          <div className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{LOGO_SRC}</div>
        </div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400">Sign in to your portal</p>
        <p className="text-stone-500 font-sans">AI-Powered Exam Preparation Platform</p>
      </div>

      <div className="w-full max-w-md bg-stone-50 rounded-sm shadow-sm border border-stone-200 overflow-hidden transition-all duration-300">
        
        {/* VIEW 1: PORTAL SELECTION */}
        {!selectedRole && (
          <div className="p-8 animate-slideIn">
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-6 text-center">Select your portal</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelect('student')}
                className="w-full group flex items-center justify-between p-4 rounded-sm border border-stone-200 hover:border-stone-900 hover:bg-stone-100 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-stone-100 text-stone-900 rounded-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <GraduationCap size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-stone-900 font-sans">Student Login</div>
                    <div className="text-xs text-stone-500 font-sans">Access your courses & tools</div>
                  </div>
                </div>
                <ArrowRight className="text-stone-300 group-hover:text-stone-900 transition-colors" strokeWidth={1.5} size={20} />
              </button>

              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full group flex items-center justify-between p-4 rounded-sm border border-stone-200 hover:border-stone-900 hover:bg-stone-100 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-stone-100 text-stone-900 rounded-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <BookOpen size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-stone-900 font-sans">Teacher Login</div>
                    <div className="text-xs text-stone-500 font-sans">Manage assessments & classes</div>
                  </div>
                </div>
                <ArrowRight className="text-stone-300 group-hover:text-stone-900 transition-colors" strokeWidth={1.5} size={20} />
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className="w-full group flex items-center justify-between p-4 rounded-sm border border-stone-200 hover:border-stone-900 hover:bg-stone-100 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-stone-100 text-stone-900 rounded-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <Shield size={24} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-stone-900 font-sans">Admin Login</div>
                    <div className="text-xs text-stone-500 font-sans">System management & user creation</div>
                  </div>
                </div>
                <ArrowRight className="text-stone-300 group-hover:text-stone-900 transition-colors" strokeWidth={1.5} size={20} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: LOGIN FORM */}
        {selectedRole && (
          <div className="p-8 animate-slideIn">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors font-sans"
            >
              <ArrowLeft size={16} strokeWidth={1.5} /> Back to selection
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="p-3 bg-stone-100 rounded-full mb-3">
                {getRoleIcon()}
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 capitalize">
                {selectedRole} Portal
              </h2>
              <p className="text-sm text-stone-500 font-sans">Please enter your credentials</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-sm flex items-center gap-2 animate-shake font-sans">
                  <AlertCircle size={16} strokeWidth={1.5} /> {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-mono uppercase tracking-widest font-bold text-stone-900">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-stone-400" strokeWidth={1.5} size={18} />
                  <input 
                    type="email" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all font-sans"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-mono uppercase tracking-widest font-bold text-stone-900">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-stone-400" strokeWidth={1.5} size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all font-sans"
                    placeholder="•••••"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm pt-2">
                <label className="flex items-center gap-2 text-stone-600 cursor-pointer font-sans">
                  <input type="checkbox" className="rounded-sm text-stone-900 focus:ring-stone-400" />
                  Remember me
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-stone-900 hover:text-emerald-700 font-sans font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-sm text-white font-sans font-bold shadow-sm hover:shadow-md transform active:scale-[0.98] transition-all bg-stone-900 hover:bg-emerald-700"
              >
                Sign In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
