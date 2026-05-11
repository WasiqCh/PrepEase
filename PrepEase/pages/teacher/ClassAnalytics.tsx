import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface StudentData {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  assignmentSubmissions: number;
  assignmentTotal: number;
  quizAttempts: number;
  averageQuizScore: number;
  performanceScore: number;
}

interface StudentAssignmentDetail {
  assessmentId: string;
  title: string;
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

const ClassAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [assignmentDetails, setAssignmentDetails] = useState<StudentAssignmentDetail[]>([]);
  const [quizDetails, setQuizDetails] = useState<StudentQuizDetail[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchClassAnalytics(selectedCourse);
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

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/courses/teacher/my-courses');
      const data = response.data.courses || [];
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourse(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  const fetchClassAnalytics = async (courseId: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/enrollments/course/${courseId}`);
      const enrollments = response.data.enrollments || [];
      
      const studentData: StudentData[] = enrollments.map((enrollment: any) => ({
        _id: enrollment._id,
        studentId: enrollment.student?._id || '',
        studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim() || 'Unknown Student',
        studentEmail: enrollment.student?.email || '',
        enrolledAt: enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
        status: 'active',
        assignmentSubmissions: enrollment.assignmentSubmissions || 0,
        assignmentTotal: enrollment.assignmentTotal || 0,
        quizAttempts: enrollment.quizAttempts || 0,
        averageQuizScore: enrollment.averageQuizScore || 0,
        performanceScore: enrollment.performanceScore || 0,
      }));
      
      setStudents(studentData);
    } catch (err) {
      console.error('Failed to fetch class analytics');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStatus = (score: number) => {
    if (score < 60) return 'High';
    if (score < 75) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <button 
          onClick={() => navigate('/teacher/dashboard')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Analytics</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Class Performance</p>
      </div>

      {courses.length > 0 && (
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full max-w-xs px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.courseCode} - {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
        </div>
      ) : (
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Student</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Email</th>
                <th className="px-6 py-4 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Quiz</th>
                <th className="px-6 py-4 text-center font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Performance</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Risk</th>
                <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {students.map((student) => {
                const riskStatus = getRiskStatus(student.performanceScore);
                return (
                  <tr key={student._id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-sans font-bold text-stone-900">{student.studentName}</td>
                    <td className="px-6 py-4 font-sans text-sm text-stone-600">{student.studentEmail}</td>
                    <td className="px-6 py-4 text-center font-serif text-stone-900 font-bold">{student.averageQuizScore}%</td>
                    <td className="px-6 py-4 text-center font-serif text-stone-900 font-bold">{student.performanceScore}%</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex border px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wide
                        ${riskStatus === 'High' ? 'border-rose-700 text-rose-700' : 
                          riskStatus === 'Medium' ? 'border-stone-900 text-stone-900' : 
                          'border-emerald-700 text-emerald-700'}`}>
                        {riskStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDetailModal(true);
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-900 hover:text-emerald-700 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="text-center py-12 font-sans text-sm text-stone-500">
              No students enrolled.
            </div>
          )}
        </div>
      )}

      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm max-w-3xl w-full p-4 md:p-6 my-4 md:my-8">
            <div className="flex items-start justify-between mb-4 md:mb-6 pb-4 border-b border-stone-200">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-tight truncate">
                  {selectedStudent.studentName}
                </h2>
                <p className="text-sm md:text-base font-sans text-stone-600 truncate mt-1">{selectedStudent.studentEmail}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-stone-400 hover:text-stone-900 text-xl md:text-2xl flex-shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {detailError && (
              <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm text-sm font-sans mb-4">
                {detailError}
              </div>
            )}

            <div className="space-y-4">
              <div className="border border-stone-200 rounded-sm p-3 md:p-4">
                <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Assignments</h4>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-stone-600 text-sm font-sans">
                    <Loader className="animate-spin" size={16} strokeWidth={1.5} /> Loading...
                  </div>
                ) : assignmentDetails.length === 0 ? (
                  <div className="text-sm font-sans text-stone-500">No assignments.</div>
                ) : (
                  <div className="space-y-2">
                    {assignmentDetails.map((assignment) => (
                      <div key={assignment.assessmentId} className="bg-stone-50 border border-stone-200 rounded-sm p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-sans font-bold text-stone-900 text-sm md:text-base">{assignment.title}</p>
                            <p className="text-xs font-sans text-stone-500 mt-1">
                              Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span
                            className={`border px-2 py-1 text-xs font-mono font-bold uppercase ${
                              assignment.status === 'graded'
                                ? 'border-emerald-700 text-emerald-700'
                                : assignment.status === 'submitted'
                                  ? 'border-stone-900 text-stone-900'
                                  : 'border-stone-400 text-stone-400'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-sans text-stone-600 flex flex-wrap gap-3">
                          <span>Marks: {assignment.score ?? 'N/A'} / {assignment.totalMarks}</span>
                          <span>Submitted: {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : 'No'}</span>
                          {assignment.gradedAt && (
                            <span>Graded: {new Date(assignment.gradedAt).toLocaleString()}</span>
                          )}
                        </div>
                        {assignment.feedback && (
                          <div className="mt-2 text-xs font-sans text-stone-700">
                            <span className="font-bold">Feedback:</span> {assignment.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-stone-200 rounded-sm p-3 md:p-4">
                <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Quizzes</h4>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-stone-600 text-sm font-sans">
                    <Loader className="animate-spin" size={16} strokeWidth={1.5} /> Loading...
                  </div>
                ) : quizDetails.length === 0 ? (
                  <div className="text-sm font-sans text-stone-500">No quizzes.</div>
                ) : (
                  <div className="space-y-2">
                    {quizDetails.map((quiz) => (
                      <div key={quiz.quizId} className="bg-stone-50 border border-stone-200 rounded-sm p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-sans font-bold text-stone-900 text-sm md:text-base">{quiz.title}</p>
                            <p className="text-xs font-sans text-stone-500 mt-1">Attempts: {quiz.attemptsCount}</p>
                          </div>
                          <span
                            className={`border px-2 py-1 text-xs font-mono font-bold uppercase ${
                              quiz.latestStatus === 'passed'
                                ? 'border-emerald-700 text-emerald-700'
                                : quiz.latestStatus === 'failed'
                                  ? 'border-rose-700 text-rose-700'
                                  : 'border-stone-400 text-stone-400'
                            }`}
                          >
                            {quiz.latestStatus || 'none'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-sans text-stone-600 flex flex-wrap gap-3">
                          <span>Latest: {quiz.latestScore ?? 'N/A'}%</span>
                          <span>Questions: {quiz.questionCount}</span>
                          <span>Completed: {quiz.latestCompletedAt ? new Date(quiz.latestCompletedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAnalytics;