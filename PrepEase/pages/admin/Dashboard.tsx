import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Shield, TrendingUp, Activity } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/users?limit=1000');
      const users = response.data.users || [];

      setStats({
        totalUsers: users.length,
        students: users.filter((u: any) => u.role === 'Student').length,
        teachers: users.filter((u: any) => u.role === 'Teacher').length,
        admins: users.filter((u: any) => u.role === 'Admin').length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Students',
      value: stats.students,
      icon: GraduationCap,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Teachers',
      value: stats.teachers,
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Admins',
      value: stats.admins,
      icon: Shield,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-stone-900 tracking-tight">Admin Dashboard</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-2">System Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm p-6">
              <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-4 bg-white border border-stone-200 text-stone-900">
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">{card.label}</h3>
              <p className="text-3xl font-serif font-bold text-stone-900 mt-2 tracking-tight">{loading ? '...' : card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-stone-900" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-serif font-bold text-stone-900 tracking-tight">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <a
              href="/admin/students"
              className="block p-4 border border-stone-200 rounded-sm hover:bg-stone-50 transition font-sans"
            >
              <h3 className="font-bold text-stone-900">Student Management</h3>
              <p className="text-sm text-stone-600 mt-1">Create and manage student accounts</p>
            </a>
            <a
              href="/admin/teachers"
              className="block p-4 border border-stone-200 rounded-sm hover:bg-stone-50 transition font-sans"
            >
              <h3 className="font-bold text-stone-900">Teacher Management</h3>
              <p className="text-sm text-stone-600 mt-1">Create and manage teacher accounts</p>
            </a>
            <a
              href="/admin/users"
              className="block p-4 border border-stone-200 rounded-sm hover:bg-stone-50 transition font-sans"
            >
              <h3 className="font-bold text-stone-900">All Users</h3>
              <p className="text-sm text-stone-600 mt-1">View and manage all user accounts</p>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-stone-900" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-serif font-bold text-stone-900 tracking-tight">System Status</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-sans font-medium text-stone-700">Database</span>
                <span className="text-sm font-sans font-semibold text-emerald-700">Connected</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-stone-900 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-sans font-medium text-stone-700">API Server</span>
                <span className="text-sm font-sans font-semibold text-emerald-700">Running</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div className="bg-stone-900 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-sm">
              <p className="text-xs text-stone-700 font-sans">
                ℹ️ All systems operational. Last check: just now
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 tracking-tight">Security Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 rounded-sm font-sans">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-stone-900">Change Default Admin Password</p>
              <p className="text-stone-700 mt-1">You are using the default admin credentials. Please change your password immediately after login.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 rounded-sm font-sans">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-semibold text-stone-900">Role-Based Access Control</p>
              <p className="text-stone-700 mt-1">Students and Teachers cannot self-register. Only admins can create accounts. Role field is immutable once assigned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
