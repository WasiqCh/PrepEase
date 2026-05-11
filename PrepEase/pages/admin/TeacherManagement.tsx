import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Search, Loader, BookOpen, Edit2 } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const MAIN_DEPARTMENT = 'Information and Technology';
const SUB_DEPARTMENTS = [
  'Bachelor of IT',
  'Bachelor of Computer Science',
  'Bachelor of Software Engineering',
];

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    assignedDepartments: MAIN_DEPARTMENT,
    assignedSemesters: '',
    assignedSubjects: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    assignedDepartments: MAIN_DEPARTMENT,
    assignedSemesters: '',
    assignedSubjects: [] as string[],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/users?limit=100');
      const allUsers = response.data.users || [];
      setTeachers(allUsers.filter((u: any) => u.role === 'Teacher'));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    const hasAssignedSubjects = Array.isArray(formData.assignedSubjects)
      ? formData.assignedSubjects.length > 0
      : !!formData.assignedSubjects;

    if (!formData.assignedDepartments || !formData.assignedSemesters || !hasAssignedSubjects) {
      setError('Assigned departments, semesters, and sub departments are required');
      return;
    }

    try {
      const normalizeList = (value) =>
        (Array.isArray(value) ? value : value.split(','))
          .map((s) => s.trim())
          .filter(Boolean);

      const assignedDepartments = normalizeList(formData.assignedDepartments);
      const assignedSemesters = normalizeList(formData.assignedSemesters);
      const assignedSubjects = normalizeList(formData.assignedSubjects);

      await axiosInstance.post('/admin/create-user', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: 'Teacher',
        assignedDepartments,
        assignedSemesters,
        assignedSubjects,
      });
      setSuccess('Teacher account created successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        assignedDepartments: MAIN_DEPARTMENT,
        assignedSemesters: '',
        assignedSubjects: [] as string[],
      });
      setShowCreateModal(false);
      fetchTeachers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher account?')) return;

    try {
      await axiosInstance.delete(`/admin/users/${teacherId}`);
      setSuccess('Teacher deleted successfully');
      fetchTeachers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const handleEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditFormData({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      email: teacher.email || '',
      password: '',
      assignedDepartments: MAIN_DEPARTMENT,
      assignedSemesters: Array.isArray(teacher.assignedSemesters)
        ? teacher.assignedSemesters.join(', ')
        : teacher.assignedSemesters || '',
      assignedSubjects: Array.isArray(teacher.assignedSubjects) ? teacher.assignedSubjects : [],
    });
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher?._id) return;

    setError('');
    setSuccess('');

    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        assignedDepartments: [editFormData.assignedDepartments].filter(Boolean),
        assignedSemesters: editFormData.assignedSemesters
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        assignedSubjects: editFormData.assignedSubjects,
      };

      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      await axiosInstance.put(`/admin/users/${editingTeacher._id}`, payload);
      setSuccess('Teacher updated successfully');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update teacher');
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-stone-900" strokeWidth={1.5} size={32} />
            <h1 className="text-3xl font-serif font-bold text-stone-900">Teacher Management</h1>
          </div>
          <p className="text-stone-600 font-sans">Create, manage, and delete teacher accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm hover:bg-emerald-700 transition"
        >
          <Plus size={20} strokeWidth={1.5} /> Create Teacher
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm font-sans">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-sm font-sans">
          ✅ {success}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-stone-400" strokeWidth={1.5} size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
        />
      </div>

      <div className="bg-stone-50 rounded-sm border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-stone-900" strokeWidth={1.5} size={32} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-stone-100 text-stone-500 text-xs uppercase font-bold border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-mono tracking-widest">Name</th>
                <th className="px-6 py-4 font-mono tracking-widest">Email</th>
                <th className="px-6 py-4 font-mono tracking-widest">Assigned Departments</th>
                <th className="px-6 py-4 font-mono tracking-widest">Assigned Semesters</th>
                <th className="px-6 py-4 font-mono tracking-widest">Assigned Subjects</th>
                <th className="px-6 py-4 font-mono tracking-widest">Added</th>
                <th className="px-6 py-4 text-right font-mono tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-stone-100 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900 font-sans">
                      {teacher.firstName} {teacher.lastName}
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-sans">{teacher.email}</td>
                    <td className="px-6 py-4 text-stone-600 text-sm font-sans">
                      {(teacher.assignedDepartments || []).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-stone-600 text-sm font-sans">
                      {(teacher.assignedSemesters || []).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-stone-600 text-sm font-sans">
                      {(teacher.assignedSubjects || []).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm font-sans">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditTeacher(teacher)}
                        className="p-2 text-stone-700 hover:bg-stone-100 rounded-sm transition"
                        title="Edit teacher"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher._id)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-sm transition"
                        title="Delete teacher"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-500 font-sans">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Create New Teacher</h2>

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Jane"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={MAIN_DEPARTMENT}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Semesters (comma separated)</label>
                <input
                  type="text"
                  value={formData.assignedSemesters}
                  onChange={(e) => setFormData({ ...formData, assignedSemesters: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Fall 2025, Spring 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Sub Departments</label>
                <select
                  multiple
                  value={formData.assignedSubjects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignedSubjects: Array.from(
                        e.target.selectedOptions,
                        (option) => (option as HTMLOptionElement).value
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                >
                  {SUB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-500 font-sans mt-1">Hold Cmd/Ctrl to select multiple.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-900 rounded-sm hover:bg-stone-100 transition font-sans font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Edit Teacher</h2>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">First Name</label>
                <input
                  type="text"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Password</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={MAIN_DEPARTMENT}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Semesters (comma separated)</label>
                <input
                  type="text"
                  value={editFormData.assignedSemesters}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedSemesters: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Fall 2025, Spring 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Assigned Sub Departments</label>
                <select
                  multiple
                  value={editFormData.assignedSubjects}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      assignedSubjects: Array.from(
                        e.target.selectedOptions,
                        (option) => (option as HTMLOptionElement).value
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                >
                  {SUB_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-500 font-sans mt-1">Hold Cmd/Ctrl to select multiple.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-900 rounded-sm hover:bg-stone-100 transition font-sans font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
                >
                  Update Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
