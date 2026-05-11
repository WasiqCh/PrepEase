import React, { useState, useEffect } from 'react';
import { Loader, Users, Search, BookOpen, CheckCircle, AlertCircle, TrendingUp, FileText, HelpCircle, Download } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface StudentEnrollment {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  assignmentSubmissions: number;
  assignmentTotal: number;
  averageAssignmentScore: number;
  quizAttempts: number;
  averageQuizScore: number;
  performanceScore: number;
}

interface StudentAssignmentDetail {
  assessmentId: string;
  title: string;
  description: string;
  dueDate: string | null;
  totalMarks: number;
  submitted: boolean;
  submittedAt: string | null;
  score: number | null;
  gradedAt: string | null;
  feedback: string;
  status: 'pending' | 'submitted' | 'graded';
}

interface StudentQuizAttemptDetail {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  status: 'passed' | 'failed';
  completedAt: string;
}

interface StudentQuizDetail {
  quizId: string;
  title: string;
  passingScore: number;
  questionCount: number;
  attemptsCount: number;
  latestScore: number | null;
  latestStatus: 'passed' | 'failed' | null;
  latestCompletedAt: string | null;
  attempts: StudentQuizAttemptDetail[];
}

const StudentProgressTracking: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [assignmentDetails, setAssignmentDetails] = useState<StudentAssignmentDetail[]>([]);
  const [quizDetails, setQuizDetails] = useState<StudentQuizDetail[]>([]);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentEnrollments(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!showDetailModal || !selectedStudent || !selectedCourse) return;
      try {
        setDetailLoading(true);
        setDetailError('');
        const response = await axiosInstance.get(
          `/enrollments/course/${selectedCourse}/student/${selectedStudent.studentId}/details`
        );
        setAssignmentDetails(response.data.assignments || []);
        setQuizDetails(response.data.quizzes || []);
      } catch (err: any) {
        setDetailError(err?.response?.data?.message || 'Failed to load student details');
        setAssignmentDetails([]);
        setQuizDetails([]);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchStudentDetails();
  }, [showDetailModal, selectedStudent, selectedCourse]);

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

  const fetchStudentEnrollments = async (courseId: string) => {
    try {
      const response = await axiosInstance.get(`/enrollments/course/${courseId}`);
      const enrollments = response.data.enrollments || [];
      
      // Transform enrollment data to StudentEnrollment format
      const studentData: StudentEnrollment[] = enrollments.map((enrollment: any) => ({
        _id: enrollment._id,
        studentId: enrollment.student?._id || '',
        studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim() || 'Unknown Student',
        studentEmail: enrollment.student?.email || '',
        enrolledAt: enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
        status: 'active',
        assignmentSubmissions: enrollment.assignmentSubmissions || 0,
        assignmentTotal: enrollment.assignmentTotal || 0,
        averageAssignmentScore: enrollment.averageAssignmentScore || 0,
        quizAttempts: enrollment.quizAttempts || 0,
        averageQuizScore: enrollment.averageQuizScore || 0,
        performanceScore: enrollment.performanceScore || 0,
      }));
      
      setStudents(studentData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch student enrollments');
    }
  };

  const getPerformanceStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (score >= 60) return { label: 'Average', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Poor', color: 'bg-red-100 text-red-700' };
  };

  const getAssignmentStatus = (submitted: number, total: number) => {
    if (total === 0) return { label: 'No Assignments', color: 'text-slate-500' };
    const percentage = (submitted / total) * 100;
    if (percentage === 100) return { label: 'Completed', color: 'text-green-600' };
    if (percentage >= 80) return { label: 'On Track', color: 'text-blue-600' };
    if (percentage >= 50) return { label: 'Behind', color: 'text-yellow-600' };
    return { label: 'At Risk', color: 'text-red-600' };
  };

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCourseData = courses.find((c) => c._id === selectedCourse);

  const stats = {
    totalEnrolled: students.length,
    onTrack: students.filter((s) => s.performanceScore >= 70).length,
    needsAttention: students.filter((s) => s.performanceScore < 60).length,
    averageScore: students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + s.performanceScore, 0) / students.length)
      : 0,
  };

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Students</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Progress Tracking</p>
      </div>

      {error && (
        <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">No courses assigned. Contact administrator.</span>
        </div>
      ) : (
        <>
          {/* Course Selection */}
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
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

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Total</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-stone-900">{stats.totalEnrolled}</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">On Track</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-emerald-700">{stats.onTrack}</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">At Risk</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-rose-700">{stats.needsAttention}</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Average</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-stone-900">{stats.averageScore}%</p>
            </div>
          </div>

          {/* Course Info */}
          {selectedCourseData && (
            <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 md:p-6">
              <h3 className="font-sans font-bold text-stone-900 mb-1 text-sm md:text-base">{selectedCourseData.courseCode}: {selectedCourseData.title}</h3>
              {selectedCourseData.description && (
                <p className="text-xs md:text-sm font-sans text-stone-600">{selectedCourseData.description}</p>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-400" size={18} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
            />
          </div>

          {/* Students List - Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const performanceStatus = student.performanceScore >= 80 ? 'emerald-700' : student.performanceScore >= 60 ? 'stone-900' : 'rose-700';

                return (
                  <div key={student._id} className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-bold text-stone-900 text-sm truncate">{student.studentName}</h4>
                        <p className="text-xs font-sans text-stone-500 truncate">{student.studentEmail}</p>
                      </div>
                      <div className={`border border-${performanceStatus} text-${performanceStatus} px-2 py-1 text-xs font-mono font-bold uppercase whitespace-nowrap ml-2 rounded-sm`}>
                        {student.performanceScore}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-stone-50 border border-stone-200 rounded-sm p-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">Assignments</p>
                        <p className="font-sans font-bold text-stone-900">{student.assignmentSubmissions}/{student.assignmentTotal}</p>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-sm p-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">Quiz Avg</p>
                        <p className="font-sans font-bold text-stone-900">{student.averageQuizScore}%</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDetailModal(true);
                      }}
                      className="w-full font-mono text-[10px] uppercase tracking-widest font-bold text-stone-900 hover:text-emerald-700 transition-colors px-3 py-2 border border-stone-200 rounded-sm hover:border-stone-900"
                    >
                      View
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 font-sans text-sm text-stone-500">
                No students
              </div>
            )}
          </div>

          {/* Students Table - Desktop View */}
          <div className="hidden md:block bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Student</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Enrolled</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Assignments</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Quizzes</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Score</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Performance</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const performanceColor = student.performanceScore >= 80 ? 'emerald-700' : student.performanceScore >= 60 ? 'stone-900' : 'rose-700';

                      return (
                        <tr key={student._id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-sans font-bold text-stone-900">{student.studentName}</div>
                            <div className="text-xs font-sans text-stone-500">{student.studentEmail}</div>
                          </td>
                          <td className="px-4 py-3 text-xs font-sans text-stone-600">
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm font-sans font-bold text-stone-900">
                              {student.assignmentSubmissions}/{student.assignmentTotal}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="font-sans font-bold text-stone-900 text-sm">{student.quizAttempts}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-base font-sans font-bold text-stone-900">{student.averageQuizScore}%</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`inline-block border border-${performanceColor} text-${performanceColor} px-2 py-1 text-xs font-mono font-bold uppercase rounded-sm`}>
                              {student.performanceScore}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowDetailModal(true);
                              }}
                              className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-900 hover:text-emerald-700 transition-colors px-2 py-1"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center font-sans text-sm text-stone-500">
                        No students
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm max-w-2xl w-full p-6 md:p-8 my-8">
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-stone-200">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight truncate">{selectedStudent.studentName}</h2>
                <p className="text-sm font-sans text-stone-600 truncate">{selectedStudent.studentEmail}</p>
              </div>
              <button
                  onClick={() => setShowDetailModal(false)}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-sm transition flex-shrink-0 ml-2"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-stone-50 border border-stone-200 rounded-sm p-3 md:p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Student ID</p>
                  <p className="font-sans font-bold text-stone-900 text-sm md:text-base">{selectedStudent.studentId}</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-sm p-3 md:p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Enrolled</p>
                  <p className="font-sans font-bold text-stone-900 text-sm md:text-base">{new Date(selectedStudent.enrolledAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-sm p-3 md:p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Status</p>
                  <p className="font-sans font-bold text-stone-900 capitalize text-sm md:text-base">{selectedStudent.status}</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-sm p-3 md:p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Overall</p>
                  <p className="font-sans font-bold text-stone-900 text-sm md:text-base">{selectedStudent.performanceScore}%</p>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="border border-stone-200 rounded-sm p-4 md:p-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Assignments</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium text-slate-700">Submissions</span>
                      <span className="text-xs md:text-sm font-bold text-slate-900">
                        {selectedStudent.assignmentSubmissions}/{selectedStudent.assignmentTotal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 md:h-3">
                      <div
                        className="bg-blue-600 h-2 md:h-3 rounded-full transition-all"
                        style={{
                          width: `${selectedStudent.assignmentTotal ? (selectedStudent.assignmentSubmissions / selectedStudent.assignmentTotal) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {selectedStudent.assignmentTotal === 0
                        ? 'No assignments yet'
                        : selectedStudent.assignmentSubmissions === selectedStudent.assignmentTotal
                          ? '✅ All assignments submitted'
                          : `⏳ ${selectedStudent.assignmentTotal - selectedStudent.assignmentSubmissions} assignment(s) pending`}
                    </span>
                    <span className="font-semibold text-slate-900">Avg Score: {selectedStudent.averageAssignmentScore}%</span>
                  </div>
                </div>
              </div>

              {/* Assignment Details List */}
              <div className="border border-stone-200 rounded-sm p-4 md:p-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Details</h3>
                {detailLoading ? (
                  <div className="flex items-center gap-2 font-sans text-stone-600 text-sm">
                    <Loader className="animate-spin" size={16} strokeWidth={1.5} /> Loading...
                  </div>
                ) : assignmentDetails.length === 0 ? (
                  <div className="text-sm font-sans text-stone-500">No assignments.</div>
                ) : (
                  <div className="space-y-2">
                    {assignmentDetails.map((assignment) => (
                      <div key={assignment.assessmentId} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm md:text-base">{assignment.title}</p>
                            <p className="text-xs text-slate-500">
                              Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              assignment.status === 'graded'
                                ? 'bg-green-100 text-green-700'
                                : assignment.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                          <span>Marks: {assignment.score ?? 'N/A'} / {assignment.totalMarks}</span>
                          <span>Submitted: {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : 'No'}</span>
                          {assignment.gradedAt && (
                            <span>Graded: {new Date(assignment.gradedAt).toLocaleString()}</span>
                          )}
                        </div>
                        {assignment.feedback && (
                          <div className="mt-2 text-xs text-slate-700">
                            <span className="font-semibold">Feedback:</span> {assignment.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quiz Details */}
              <div className="border border-stone-200 rounded-sm p-4 md:p-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Quizzes</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Quizzes Attempted</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900">{selectedStudent.quizAttempts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Average Score</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900">{selectedStudent.averageQuizScore}%</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium text-slate-700">Performance</span>
                      <span className={`text-xs md:text-sm font-bold ${getPerformanceStatus(selectedStudent.averageQuizScore).color}`}>
                        {getPerformanceStatus(selectedStudent.averageQuizScore).label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 md:h-3">
                      <div
                        className="bg-purple-600 h-2 md:h-3 rounded-full transition-all"
                        style={{ width: `${selectedStudent.averageQuizScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Details List */}
              <div className="border border-stone-200 rounded-sm p-4 md:p-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Attempts</h3>
                {detailLoading ? (
                  <div className="flex items-center gap-2 font-sans text-stone-600 text-sm">
                    <Loader className="animate-spin" size={16} strokeWidth={1.5} /> Loading...
                  </div>
                ) : quizDetails.length === 0 ? (
                  <div className="text-sm font-sans text-stone-500">No quizzes.</div>
                ) : (
                  <div className="space-y-2">
                    {quizDetails.map((quiz) => (
                      <div key={quiz.quizId} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm md:text-base">{quiz.title}</p>
                            <p className="text-xs text-slate-500">Attempts: {quiz.attemptsCount}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              quiz.latestStatus === 'passed'
                                ? 'bg-green-100 text-green-700'
                                : quiz.latestStatus === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {quiz.latestStatus || 'not attempted'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                          <span>Latest Score: {quiz.latestScore ?? 'N/A'}%</span>
                          <span>Questions: {quiz.questionCount}</span>
                          <span>Completed: {quiz.latestCompletedAt ? new Date(quiz.latestCompletedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {detailError && (
                <div className="bg-white border border-rose-700 text-rose-700 px-4 py-3 rounded-sm shadow-sm">
                  <span className="font-sans text-sm">{detailError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-stone-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 rounded-sm px-4 py-2.5 font-sans text-sm font-bold transition"
                >
                  Close
                </button>
                <button className="flex-1 bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold flex items-center justify-center gap-2">
                  <Download size={16} strokeWidth={1.5} /> Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressTracking;
