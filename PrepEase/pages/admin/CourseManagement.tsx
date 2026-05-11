import React, { useState, useEffect } from 'react';
import { Search, Loader, BookOpen, GraduationCap, Users, Plus, X } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    department: 'BS(CS) Morning/Evening',
    programSemester: 2,
    description: '',
    credits: 3,
    semester: 'Spring',
    year: 2026,
  });

  const allowedDepartments = [
    'BS(CS) Morning/Evening',
    'BS(SE) Morning/Evening',
    'BETI (Morning/Afternoon)',
  ];

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/courses');
      setCourses(response.data.courses || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get('/admin/users?limit=1000');
      const allUsers = response.data.users || [];
      setTeachers(allUsers.filter((u: any) => u.role === 'Teacher'));
    } catch (err: any) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.courseCode || !formData.title || !formData.department || !formData.programSemester) {
      setError('Course code, title, department, and program semester are required');
      return;
    }

    try {
      await axiosInstance.post('/courses', {
        ...formData,
        programSemester: Number(formData.programSemester),
        credits: Number(formData.credits),
        year: Number(formData.year),
      });

      setSuccess('Course created successfully!');
      setFormData({
        courseCode: '',
        title: '',
        department: 'BS(CS) Morning/Evening',
        programSemester: 2,
        description: '',
        credits: 3,
        semester: 'Spring',
        year: 2026,
      });
      setShowCreateModal(false);
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create course');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCourse || !selectedTeacher) {
      setError('Please select a teacher');
      return;
    }

    try {
      await axiosInstance.post(`/courses/${selectedCourse._id}/assign-teacher`, {
        teacherId: selectedTeacher,
      });
      setSuccess('Teacher assigned successfully!');
      setShowAssignModal(false);
      setSelectedTeacher('');
      setSelectedCourse(null);
      fetchCourses();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedCourses = filteredCourses.reduce((groups: Record<string, any[]>, course) => {
    const department = course.department || 'Unassigned Department';
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(course);
    return groups;
  }, {});

  const departmentNames = Object.keys(groupedCourses).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-stone-900" size={32} strokeWidth={1.5} />
            <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Spring-2026 Course Catalog</h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Read-only catalog grouped by department and semester</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-sm bg-stone-900 px-4 py-3 text-sm font-sans font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} strokeWidth={1.5} /> Add Course
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
        <Search className="absolute left-3 top-3 text-stone-400" size={20} strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search by department, course code, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-purple-600" size={32} />
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {departmentNames.length > 0 ? (
              departmentNames.map((department) => (
                <div key={department} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-serif font-bold text-stone-900">{department}</h2>
                    <span className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold">
                      {groupedCourses[department].length} courses
                    </span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedCourses[department]
                      .sort((a, b) => (a.programSemester ?? 0) - (b.programSemester ?? 0) || a.courseCode.localeCompare(b.courseCode))
                      .map((course) => (
                        <div key={course._id} className="border border-stone-200 rounded-sm p-4 hover:bg-stone-50 transition-colors">
                          <div className="flex items-start justify-between mb-3 gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h3 className="text-lg font-sans font-bold text-stone-900">{course.title}</h3>
                                <span className="border border-stone-900 text-stone-900 px-2 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-widest">
                                  {course.courseCode}
                                </span>
                              </div>
                              {course.description && (
                                <p className="text-stone-600 text-sm mb-2 font-sans">{course.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-sans">
                                <span>Department: {course.department || 'N/A'}</span>
                                <span>Program Sem: {course.programSemester || 'N/A'}</span>
                                <span>Credits: {course.credits}</span>
                                <span>{course.semester} {course.year}</span>
                                <span>{course.isActive ? '✅ Active' : '❌ Inactive'}</span>
                              </div>
                            </div>
                          </div>

                          {course.teachers && course.teachers.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-stone-200">
                              <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400 mb-2">Assigned Teachers:</p>
                              <div className="flex flex-wrap gap-2">
                                {course.teachers.map((teacher: any) => (
                                  <div key={teacher._id} className="border border-stone-900 text-stone-900 rounded-sm px-3 py-1 text-sm font-sans">
                                    {teacher.firstName} {teacher.lastName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-stone-200 text-xs font-sans text-stone-400">
                              No teachers assigned yet.
                            </div>
                          )}

                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                setShowAssignModal(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-sm border border-stone-900 px-3 py-2 text-xs font-mono font-bold uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
                            >
                              <Users size={14} strokeWidth={1.5} /> Assign Teacher
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-500 font-sans">
                No courses found
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-sm bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold tracking-tight text-stone-900">Add Course to Catalog</h2>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Spring-2026 departments only
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-sm p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  >
                    {allowedDepartments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Program Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.programSemester}
                    onChange={(e) => setFormData({ ...formData, programSemester: parseInt(e.target.value || '0', 10) })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Course Code</label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                    placeholder="CSC-399"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value || '0', 10) })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  placeholder="Advanced Software Testing"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  rows={3}
                  placeholder="Optional course description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Fall">Fall</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value || '0', 10) })}
                    className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-sm border border-stone-200 px-4 py-2 font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-sm bg-stone-900 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold tracking-tight text-stone-900">Assign Teacher</h2>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {selectedCourse.courseCode} • {selectedCourse.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTeacher('');
                  setSelectedCourse(null);
                }}
                className="rounded-sm p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-mono font-bold uppercase tracking-widest text-stone-400">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full rounded-sm border border-stone-200 px-3 py-2 outline-none focus:border-stone-900"
                >
                  <option value="">Choose a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTeacher('');
                    setSelectedCourse(null);
                  }}
                  className="flex-1 rounded-sm border border-stone-200 px-4 py-2 font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-sm bg-stone-900 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Assign Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
