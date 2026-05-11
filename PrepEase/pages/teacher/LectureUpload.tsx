import React, { useState, useEffect } from 'react';
import { Upload, Loader, BookOpen, FileText, Trash2, Edit2 } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

const TeacherLectureUpload: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lectures, setLectures] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseLectures(selectedCourse);
    }
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

  const fetchCourseLectures = async (courseId: string) => {
    try {
      const response = await axiosInstance.get(`/materials/${courseId}`);
      setLectures(response.data.materials || []);
    } catch (err: any) {
      console.error('Failed to fetch lectures:', err);
      setLectures([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
        setError('Only PDF and PPT files are allowed');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
        setError('Only PDF and PPT files are allowed');
        return;
      }
      setEditFile(file);
      setError('');
    }
  };

  const handleUploadLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!lectureTitle) {
      setError('Lecture title is required');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('courseId', selectedCourse);
      formData.append('title', lectureTitle);
      formData.append('file', selectedFile);

      await axiosInstance.post('/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Lecture uploaded successfully!');
      setLectureTitle('');
      setSelectedFile(null);
      fetchCourseLectures(selectedCourse);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload lecture');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!window.confirm('Delete this lecture?')) return;

    setError('');
    setSuccess('');

    try {
      await axiosInstance.delete(`/materials/${lectureId}`);
      setSuccess('Lecture deleted successfully');
      if (selectedCourse) {
        fetchCourseLectures(selectedCourse);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete lecture');
    }
  };

  const handleReplaceLecture = async (lectureId: string) => {
    if (!editFile && !editTitle) {
      setError('Please select a file or enter a title');
      return;
    }

    setError('');
    setSuccess('');
    setUploadingFile(true);

    try {
      const formData = new FormData();
      if (editTitle) formData.append('title', editTitle);
      if (editFile) formData.append('file', editFile);

      await axiosInstance.put(`/materials/${lectureId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Lecture updated successfully!');
      setEditingId(null);
      setEditTitle('');
      setEditFile(null);
      if (selectedCourse) {
        fetchCourseLectures(selectedCourse);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update lecture');
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedCourseData = courses.find((c) => c._id === selectedCourse);
  const editingLecture = editingId ? lectures.find(l => l._id === editingId) : null;

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Lectures</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Upload Materials</p>
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
        <div className="bg-white border border-stone-200 text-stone-600 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">No courses assigned.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
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

              <form onSubmit={handleUploadLecture} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    placeholder="Introduction to Loops"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">File</label>
                  <div className="border-2 border-dashed border-stone-200 rounded-sm p-6 text-center hover:border-stone-900 transition-colors bg-stone-50">
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Upload className="mx-auto text-stone-400 mb-2" size={32} strokeWidth={1.5} />
                      <p className="text-sm font-sans font-bold text-stone-700">
                        {selectedFile ? selectedFile.name : 'Click to upload'}
                      </p>
                      <p className="text-xs font-sans text-stone-500 mt-1">PDF or PPT files</p>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingFile || !lectureTitle || !selectedFile}
                  className="w-full bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                >
                  {uploadingFile ? (
                    <>
                      <Loader className="animate-spin inline mr-2" size={14} strokeWidth={2} /> Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </form>

              {selectedCourseData && (
                <div className="bg-stone-50 border border-stone-200 rounded-sm p-4">
                  <h3 className="font-mono text-xs font-bold text-stone-900 mb-2">{selectedCourseData.courseCode}</h3>
                  <p className="text-sm font-sans text-stone-600">{selectedCourseData.title}</p>
                  {selectedCourseData.description && (
                    <p className="text-xs font-sans text-stone-500 mt-2">{selectedCourseData.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lectures List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Course Materials</h2>

              {lectures.length > 0 ? (
                <div className="space-y-3">
                  {lectures.map((lecture) => (
                    <div key={lecture._id}>
                      {editingId === lecture._id ? (
                        <div className="p-4 border border-stone-300 rounded-sm bg-stone-50 space-y-3">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Title</label>
                            <input
                              type="text"
                              value={editTitle || lecture.title}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Replace File (Optional)</label>
                            <div className="border-2 border-dashed border-stone-200 rounded-sm p-4 text-center hover:border-stone-900 transition-colors bg-white">
                              <input
                                type="file"
                                accept=".pdf,.ppt,.pptx"
                                onChange={handleEditFileSelect}
                                className="hidden"
                                id={`edit-file-input-${lecture._id}`}
                              />
                              <label htmlFor={`edit-file-input-${lecture._id}`} className="cursor-pointer">
                                <Upload className="mx-auto text-stone-400 mb-2" size={24} strokeWidth={1.5} />
                                <p className="text-xs font-sans font-bold text-stone-700">
                                  {editFile ? editFile.name : 'Click to upload new file'}
                                </p>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplaceLecture(lecture._id)}
                              disabled={uploadingFile}
                              className="flex-1 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                            >
                              {uploadingFile ? <Loader className="animate-spin inline mr-1" size={12} /> : null} Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditTitle('');
                                setEditFile(null);
                              }}
                              className="flex-1 bg-stone-300 text-stone-900 hover:bg-stone-400 rounded-sm px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between p-4 border border-stone-200 rounded-sm hover:bg-stone-50 transition-colors">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-sm mt-1">
                              <FileText size={20} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-sans font-bold text-stone-900 break-words">{lecture.title}</h3>
                              <p className="text-xs font-sans text-stone-500 mt-1">
                                {lecture.fileName} • {lecture.fileType}
                              </p>
                              <p className="text-xs font-sans text-stone-400 mt-1">
                                {new Date(lecture.createdAt).toLocaleDateString()}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`inline-block text-xs border px-2 py-1 font-mono font-bold uppercase ${
                                    lecture.status === 'Ready'
                                      ? 'border-emerald-700 text-emerald-700'
                                      : lecture.status === 'Processing'
                                      ? 'border-stone-900 text-stone-900'
                                      : 'border-rose-700 text-rose-700'
                                  }`}
                                >
                                  {lecture.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingId(lecture._id);
                                setEditTitle(lecture.title);
                                setEditFile(null);
                              }}
                              className="p-2 text-stone-400 hover:text-stone-900 rounded-sm transition"
                              title="Edit lecture"
                            >
                              <Edit2 size={18} strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleDeleteLecture(lecture._id)}
                              className="p-2 text-stone-400 hover:text-rose-700 rounded-sm transition"
                              title="Delete lecture"
                            >
                              <Trash2 size={18} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 font-sans text-sm text-stone-500">
                  {selectedCourse ? 'No lectures uploaded.' : 'Select a course.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLectureUpload;
