import React, { useState, useEffect } from 'react';
import { Upload, Loader, BookOpen, FileText, Trash2, Plus, X, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

const TeacherAssignmentUpload: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    totalMarks: 100,
    attachmentUrl: '',
  });

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAssignments(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {};
        const courseId = detail.courseId || detail.course || null;
        if (courseId) {
          // if current selected course matches, refresh; otherwise optionally switch
          if (selectedCourse === courseId) {
            fetchCourseAssignments(selectedCourse);
          } else if (!selectedCourse) {
            setSelectedCourse(courseId);
          }
        }
      } catch (err) {
        // noop
      }
    };

    window.addEventListener('assessmentCreated', handler as EventListener);
    return () => window.removeEventListener('assessmentCreated', handler as EventListener);
  }, [selectedCourse]);

  const fetchAssignedCourses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/courses/teacher/my-courses');
      setCourses(response.data.courses || []);
      if (response.data.courses?.length > 0) {
        setSelectedCourse(response.data.courses[0]._id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch your courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseAssignments = async (courseId: string) => {
    try {
      const response = await axiosInstance.get(`/assessments/course/${courseId}`);
      setAssignments(response.data.assignments || []);
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err);
      setAssignments([]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!formData.title) {
      setError('Assignment title is required');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }

    // Validate due date is in the future
    if (new Date(formData.dueDate) < new Date()) {
      setError('Due date must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        courseId: selectedCourse,
        dueDate: new Date(formData.dueDate).toISOString(),
        totalMarks: formData.totalMarks,
      };

      await axiosInstance.post('/assessments', assignmentData);

      setSuccess('Assignment created successfully!');
      resetForm();
      setShowCreateModal(false);
      fetchCourseAssignments(selectedCourse);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment? This action cannot be undone.')) return;

    setError('');
    setSuccess('');

    try {
      await axiosInstance.delete(`/assessments/${assignmentId}`);
      setSuccess('Assignment deleted successfully');
      if (selectedCourse) {
        fetchCourseAssignments(selectedCourse);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      totalMarks: 100,
      attachmentUrl: '',
    });
  };

  const selectedCourseData = courses.find((c) => c._id === selectedCourse);

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Assignments</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Create & Manage</p>
      </div>

      {error && (
        <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-white border border-emerald-700 text-emerald-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-sm shadow-sm">
          <span className="font-sans text-sm">No courses assigned. Contact administrator.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Info & Create Button */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 space-y-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourseData && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-sm">
                  <h3 className="font-mono font-bold text-sm text-stone-900 mb-1">{selectedCourseData.courseCode}</h3>
                  <p className="text-sm font-sans text-stone-600">{selectedCourseData.title}</p>
                  {selectedCourseData.description && (
                    <p className="text-xs font-sans text-stone-500 mt-2">{selectedCourseData.description}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus size={14} strokeWidth={2} /> New
              </button>
            </div>
          </div>

          {/* Assignments List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
              <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight mb-6 pb-4 border-b border-stone-200">Assignments</h2>

              {assignments.length > 0 ? (
                <div className="space-y-0 divide-y divide-stone-200">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="flex items-start justify-between py-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <FileText size={18} className="text-stone-400 mt-1" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-sans font-bold text-sm text-stone-900 break-words">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm font-sans text-stone-600 mt-1">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 font-mono text-[10px] text-stone-400 mt-2 uppercase tracking-widest">
                            <span>Marks: {assignment.totalMarks}</span>
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => navigate(`/teacher/assignments/${assignment._id}/grade?courseId=${selectedCourse}`)}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-sm transition"
                          title="Grade"
                        >
                          <CheckSquare size={18} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="p-2 text-rose-700 hover:bg-rose-50 rounded-sm transition"
                          title="Delete"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-500 font-sans text-sm">
                  {selectedCourse ? 'No assignments. Create one to get started.' : 'Select a course'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
              <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">New Assignment</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-stone-100 rounded-sm transition text-stone-500"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                  placeholder="Chapter 3 Exercise Problems"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                  placeholder="Brief overview..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                  placeholder="Detailed steps..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Due Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 rounded-sm px-4 py-2.5 font-sans text-sm font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={14} strokeWidth={2} /> Saving...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentUpload;
