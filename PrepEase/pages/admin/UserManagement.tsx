import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Search, Loader } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const MAIN_DEPARTMENT = 'Information and Technology';
const SUB_DEPARTMENTS = [
  'Bachelor of IT',
  'Bachelor of Computer Science',
  'Bachelor of Software Engineering',
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Student',
    password: '',
    department: MAIN_DEPARTMENT,
    semester: '',
    subjects: '',
    assignedDepartments: MAIN_DEPARTMENT,
    assignedSemesters: '',
    assignedSubjects: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Student',
    password: '',
    department: MAIN_DEPARTMENT,
    semester: '',
    subjects: '',
    assignedDepartments: MAIN_DEPARTMENT,
    assignedSemesters: '',
    assignedSubjects: [] as string[],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/users?limit=100');
      setUsers(response.data.users || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.role === 'Student') {
      if (!formData.department || !formData.semester || !formData.subjects) {
        setError('Department, semester, and subjects are required for students');
        return;
      }
    }

    if (formData.role === 'Teacher') {
      const hasAssignedSubjects = Array.isArray(formData.assignedSubjects)
        ? formData.assignedSubjects.length > 0
        : !!formData.assignedSubjects;
      if (!formData.assignedDepartments || !formData.assignedSemesters || !hasAssignedSubjects) {
        setError('Assigned departments, semesters, and sub departments are required for teachers');
        return;
      }
    }

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      };

      const normalizeList = (value) =>
        (Array.isArray(value) ? value : value.split(','))
          .map((s) => s.trim())
          .filter(Boolean);

      if (formData.role === 'Student') {
        payload.department = formData.department;
        payload.semester = formData.semester;
        payload.subjects = normalizeList(formData.subjects);
      }

      if (formData.role === 'Teacher') {
        payload.assignedDepartments = normalizeList(formData.assignedDepartments);
        payload.assignedSemesters = normalizeList(formData.assignedSemesters);
        payload.assignedSubjects = normalizeList(formData.assignedSubjects);
      }

      await axiosInstance.post('/admin/create-user', payload);
      setSuccess(`${formData.role} account created successfully!`);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Student',
        password: '',
        department: MAIN_DEPARTMENT,
        semester: '',
        subjects: '',
        assignedDepartments: MAIN_DEPARTMENT,
        assignedSemesters: '',
        assignedSubjects: [] as string[],
      });
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'Student',
      password: '',
      department: MAIN_DEPARTMENT,
      semester: user.semester || '',
      subjects: Array.isArray(user.subjects) ? user.subjects[0] || '' : '',
      assignedDepartments: MAIN_DEPARTMENT,
      assignedSemesters: Array.isArray(user.assignedSemesters)
        ? user.assignedSemesters.join(', ')
        : user.assignedSemesters || '',
      assignedSubjects: Array.isArray(user.assignedSubjects) ? user.assignedSubjects : [],
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?._id) return;

    setError('');
    setSuccess('');

    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
      };

      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      if (editFormData.role === 'Student') {
        payload.department = editFormData.department;
        payload.semester = editFormData.semester;
        payload.subjects = editFormData.subjects ? [editFormData.subjects] : [];
      }

      if (editFormData.role === 'Teacher') {
        payload.assignedDepartments = [editFormData.assignedDepartments].filter(Boolean);
        payload.assignedSemesters = editFormData.assignedSemesters
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        payload.assignedSubjects = editFormData.assignedSubjects;
      }

      await axiosInstance.put(`/admin/users/${editingUser._id}`, payload);
      setSuccess('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">User Management</h1>
          <p className="text-stone-600 mt-1 font-sans">Create, manage, and delete user accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-sm hover:bg-emerald-700 transition"
        >
          <Plus size={20} strokeWidth={1.5} /> Create User
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm flex items-center gap-2 font-sans">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-sm flex items-center gap-2 font-sans">
          ✅ {success}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-stone-400" strokeWidth={1.5} size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
        >
          <option value="all">All Roles</option>
          <option value="Student">Students</option>
          <option value="Teacher">Teachers</option>
          <option value="Admin">Admins</option>
        </select>
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
                <th className="px-6 py-4 font-mono tracking-widest">Role</th>
                <th className="px-6 py-4 font-mono tracking-widest">Joined</th>
                <th className="px-6 py-4 text-right font-mono tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-stone-100 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900 font-sans">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-sans">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="border border-stone-900 text-stone-900 px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-widest">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-sm font-sans">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-stone-700 hover:bg-stone-100 rounded-sm transition"
                        title="Edit user"
                      >
                        <Edit2 size={18} strokeWidth={1.5} />
                      </button>
                      {user.role !== 'Admin' && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 text-rose-700 hover:bg-rose-50 rounded-sm transition"
                          title="Delete user"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500 font-sans">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Create New User</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                </select>
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

              {formData.role === 'Student' && (
                <>
                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Department</label>
                    <input
                      type="text"
                      value={MAIN_DEPARTMENT}
                      readOnly
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Semester</label>
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                      placeholder="e.g., Fall 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Sub Department</label>
                    <select
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                    >
                      <option value="">Select sub department</option>
                      {SUB_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {formData.role === 'Teacher' && (
                <>
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
                </>
              )}

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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-sm shadow-xl max-w-md w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Edit User</h2>

            <form onSubmit={handleUpdateUser} className="space-y-4">
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
                <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Role</label>
                <input
                  type="text"
                  value={editFormData.role}
                  readOnly
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
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

              {editFormData.role === 'Student' && (
                <>
                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Department</label>
                    <input
                      type="text"
                      value={MAIN_DEPARTMENT}
                      readOnly
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-stone-100 text-stone-700 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Semester</label>
                    <input
                      type="text"
                      value={editFormData.semester}
                      onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono uppercase tracking-widest font-bold text-stone-900 mb-1">Sub Department</label>
                    <select
                      value={editFormData.subjects}
                      onChange={(e) => setEditFormData({ ...editFormData, subjects: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-400 focus:border-transparent font-sans"
                    >
                      <option value="">Select sub department</option>
                      {SUB_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {editFormData.role === 'Teacher' && (
                <>
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
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-900 rounded-sm hover:bg-stone-100 transition font-sans font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-bold"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
