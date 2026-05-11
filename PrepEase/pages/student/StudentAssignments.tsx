import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Play, X, ArrowLeft, Loader, HelpCircle, BookOpen } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  courseId: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  submittedAt?: string;
  feedback?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  timeLimit: number;
  passingScore: number;
  questionCount: number;
  status?: 'pending' | 'completed';
  score?: number;
}

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<Assignment | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    fetchAssignmentsAndQuizzes();
  }, []);

  const fetchAssignmentsAndQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch assigned courses first
      const coursesRes = await axiosInstance.get('/enrollments/my-courses');
      const enrollments = coursesRes.data.enrollments || [];
      
      // Fetch assignments and quizzes for each course
      const allAssignments: Assignment[] = [];
      const allQuizzes: Quiz[] = [];
      
      for (const enrollment of enrollments) {
        try {
          // Fetch assignments for the course
          const assignRes = await axiosInstance.get(`/assessments/student/course/${enrollment.course._id}`);
          const courseAssignments = assignRes.data.assignments || [];
          const assignmentsWithStatus = courseAssignments.map((a: any) => ({
            _id: a._id,
            title: a.title,
            description: a.description || '',
            dueDate: a.dueDate,
            totalMarks: a.totalMarks || 100,
            courseId: a.course,
            status: 'pending' as const,
            grade: undefined,
            submittedAt: undefined,
          }));
          allAssignments.push(...assignmentsWithStatus);
        } catch (err) {
          console.error('Failed to fetch assignments for course');
        }

        try {
          // Fetch quizzes for the course
          const quizRes = await axiosInstance.get(`/quizzes/course/${enrollment.course._id}`);
          const courseQuizzes = quizRes.data.quizzes || [];
          allQuizzes.push(...courseQuizzes.map((q: any) => ({
            _id: q._id,
            title: q.title,
            description: q.description || '',
            courseId: q.courseId,
            timeLimit: q.timeLimit,
            passingScore: q.passingScore,
            questionCount: q.questionCount || q.questions?.length || 0,
            status: 'pending',
          })));
        } catch (err) {
          console.error('Failed to fetch quizzes for course');
        }
      }

      // Get submission status for assignments
      const assignmentsWithSubmissions = await Promise.all(
        allAssignments.map(async (assignment) => {
          try {
            const submissionsRes = await axiosInstance.get(`/assessments/submissions/assignment/${assignment._id}`);
            const submissions = submissionsRes.data.submissions || [];
            
            // Find my submission
            if (submissions.length > 0) {
              const mySubmission = submissions[0]; // Assuming one submission per student
              return {
                ...assignment,
                status: mySubmission.gradedAt ? 'graded' as const : 'submitted' as const,
                grade: mySubmission.score,
                submittedAt: mySubmission.submittedAt,
                feedback: mySubmission.feedback || '',
              };
            }
          } catch (_err) {
            // noop
          }
          return assignment;
        })
      );
      
      const quizzesWithAttempts = await Promise.all(
        allQuizzes.map(async (quiz) => {
          try {
            const attemptRes = await axiosInstance.get(`/quizzes/${quiz._id}/attempts`);
            const attempts = attemptRes.data.attempts || [];
            if (attempts.length > 0) {
              const latest = attempts[0];
              return {
                ...quiz,
                status: 'completed' as const,
                score: latest.score,
              };
            }
          } catch (_err) {
            // noop
          }
          return quiz;
        })
      );

      setAssignments(assignmentsWithSubmissions);
      setQuizzes(quizzesWithAttempts);
    } catch (err: any) {
      console.error('Failed to fetch assignments and quizzes');
      setAssignments([]);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !submissionText.trim()) {
      setSubmissionError('Please write your submission');
      return;
    }

    setSubmitting(true);
    setSubmissionError('');
    try {
      const response = await axiosInstance.post('/assessments/submit', {
        assessmentId: activeAssignment,
        submission: submissionText,
      });

      // Update the assignment status to submitted
      setAssignments(assignments.map(a => 
        a._id === activeAssignment 
          ? { ...a, status: 'submitted' as const }
          : a
      ));

      setSubmissionText('');
      setActiveAssignment(null);
    } catch (err: any) {
      setSubmissionError(err?.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="p-2 hover:bg-stone-100 rounded-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Assignments & Quizzes</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Submit & Attempt</p>
        </div>
      </div>
      
      {assignments.length === 0 && quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-sm border border-stone-200 shadow-sm">
          <p className="text-stone-500 font-sans">No assignments or quizzes available yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Assignments Section */}
          {assignments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen size={20} className="text-stone-900" strokeWidth={1.5} />
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Assignments</h2>
              </div>
              <div className="grid gap-4">
                {assignments.map(assignment => (
                  <div key={assignment._id} className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${
                          assignment.status === 'graded'
                            ? 'border border-emerald-700 text-emerald-700'
                            : assignment.status === 'submitted'
                              ? 'border border-stone-900 text-stone-900'
                              : 'border border-stone-400 text-stone-400'
                        }`}>
                          {assignment.status}
                        </span>
                        <span className="text-xs text-stone-500 font-sans">{assignment.totalMarks} marks</span>
                      </div>
                      <h3 className="text-lg font-sans font-bold text-stone-900">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-stone-600 mt-1 font-sans">{assignment.description}</p>
                      )}
                      <p className="text-sm text-stone-500 flex items-center gap-2 mt-2 font-sans">
                        <Clock size={14} strokeWidth={1.5} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        {assignment.grade !== undefined && <span className="text-stone-900 font-bold">• Grade: {assignment.grade}/{assignment.totalMarks}</span>}
                      </p>
                      
                      {assignment.feedback && assignment.status === 'graded' && (
                        <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-sm">
                          <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-700 mb-1">Teacher Feedback:</p>
                          <p className="text-sm text-stone-900 font-sans">{assignment.feedback}</p>
                        </div>
                      )}
                    </div>
                    
                    {assignment.status === 'pending' ? (
                      <button 
                        onClick={() => {
                          setActiveAssignment(assignment._id);
                          setSelectedAssignmentDetail(assignment);
                        }}
                        className="px-6 py-2 bg-stone-900 text-white hover:bg-emerald-700 rounded-sm font-sans font-bold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                      >
                        <Play size={16} strokeWidth={1.5} /> Submit
                      </button>
                    ) : (
                      <button disabled className="px-6 py-2 bg-stone-50 text-stone-400 rounded-sm font-sans font-bold flex items-center gap-2 cursor-not-allowed border border-stone-200 whitespace-nowrap">
                        <CheckCircle size={16} strokeWidth={1.5} /> Submitted
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Section */}
          {quizzes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={20} className="text-stone-900" strokeWidth={1.5} />
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Quizzes</h2>
              </div>
              <div className="grid gap-4">
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${
                          quiz.status === 'completed' 
                            ? 'border border-emerald-700 text-emerald-700' 
                            : 'border border-stone-400 text-stone-400'
                        }`}>
                          {quiz.status}
                        </span>
                        <span className="text-xs text-stone-500 font-sans">{quiz.questionCount} questions</span>
                        <span className="text-xs text-stone-500 font-sans">•</span>
                        <span className="text-xs text-stone-500 font-sans">{quiz.timeLimit} min</span>
                      </div>
                      <h3 className="text-lg font-sans font-bold text-stone-900">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-sm text-stone-600 mt-1 font-sans">{quiz.description}</p>
                      )}
                      <p className="text-sm text-stone-500 flex items-center gap-2 mt-2 font-sans">
                        <HelpCircle size={14} strokeWidth={1.5} /> Passing Score: {quiz.passingScore}%
                        {quiz.score !== undefined && <span className="text-stone-900 font-bold">• Your Score: {quiz.score}%</span>}
                      </p>
                    </div>
                    
                    {quiz.status === 'pending' ? (
                      <button 
                        onClick={() => setSelectedQuiz(quiz)}
                        className="px-6 py-2 bg-stone-900 text-white hover:bg-emerald-700 rounded-sm font-sans font-bold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                      >
                        <Play size={16} strokeWidth={1.5} /> Start Quiz
                      </button>
                    ) : (
                      <button disabled className="px-6 py-2 bg-stone-50 text-stone-400 rounded-sm font-sans font-bold flex items-center gap-2 cursor-not-allowed border border-stone-200 whitespace-nowrap">
                        <CheckCircle size={16} strokeWidth={1.5} /> Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 z-[60] bg-stone-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-stone-50 p-6 border-b border-stone-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">Submit Assignment</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Write your solution</p>
              </div>
              <button 
                onClick={() => {
                  setActiveAssignment(null);
                  setSelectedAssignmentDetail(null);
                  setSubmissionText('');
                  setSubmissionError('');
                }}
                className="p-2 hover:bg-stone-100 rounded-sm transition-colors text-stone-500 hover:text-stone-900"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitAssignment} className="p-8 space-y-6">
              {selectedAssignmentDetail && (
                <div className="mb-6 pb-6 border-b border-stone-200">
                  <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3 tracking-tight">{selectedAssignmentDetail.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-stone-50 p-4 rounded-sm border border-stone-200">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Total Marks</p>
                      <p className="text-2xl font-serif font-bold text-stone-900">{selectedAssignmentDetail.totalMarks}</p>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-sm border border-stone-200">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Due Date</p>
                      <p className="text-lg font-sans font-bold text-stone-900">{new Date(selectedAssignmentDetail.dueDate).toLocaleDateString()}</p>
                      <p className="text-xs text-stone-600 font-sans">{new Date(selectedAssignmentDetail.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {selectedAssignmentDetail.description && (
                    <div className="mb-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Description</p>
                      <p className="text-stone-900 text-sm leading-relaxed bg-stone-50 p-4 rounded-sm border border-stone-200 font-sans">{selectedAssignmentDetail.description}</p>
                    </div>
                  )}

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
                    <p className="text-xs text-stone-700 font-sans">
                      Please read the assignment details carefully before submitting your solution.
                    </p>
                  </div>
                </div>
              )}

              {submissionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm text-sm font-sans">
                  {submissionError}
                </div>
              )}
              
              <div className="mb-6">
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Your Submission</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => {
                    setSubmissionText(e.target.value);
                    setSubmissionError('');
                  }}
                  placeholder="Write your solution, answer, or explanation here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 resize-none font-sans outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAssignment(null);
                    setSelectedAssignmentDetail(null);
                    setSubmissionText('');
                    setSubmissionError('');
                  }}
                  className="px-6 py-2 bg-white border border-stone-200 text-stone-700 rounded-sm font-sans font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !submissionText.trim()}
                  className="px-6 py-2 bg-stone-900 text-white rounded-sm font-sans font-bold hover:bg-emerald-700 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? <Loader size={16} className="animate-spin" strokeWidth={1.5} /> : <CheckCircle size={16} strokeWidth={1.5} />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Preview Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-[60] bg-stone-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="bg-stone-100 p-6 border-b border-stone-200 flex justify-between items-start sticky top-0">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">{selectedQuiz.title}</h2>
                {selectedQuiz.description && (
                  <p className="text-stone-600 text-sm mt-1 font-sans">{selectedQuiz.description}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedQuiz(null)}
                className="p-2 hover:bg-stone-200 rounded-sm transition-colors text-stone-600 hover:text-stone-900"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400 mb-1">Questions</p>
                  <p className="text-2xl font-serif font-bold text-stone-900">{selectedQuiz.questionCount}</p>
                </div>
                <div className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400 mb-1">Time Limit</p>
                  <p className="text-2xl font-serif font-bold text-stone-900">{selectedQuiz.timeLimit} min</p>
                </div>
                <div className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <p className="text-xs font-mono uppercase tracking-widest font-bold text-stone-400 mb-1">Passing Score</p>
                  <p className="text-2xl font-serif font-bold text-stone-900">{selectedQuiz.passingScore}%</p>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-serif font-bold text-stone-900 mb-3 text-lg tracking-tight">Quiz Instructions:</h3>
                <ul className="space-y-2 text-sm text-stone-600 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-stone-900 font-bold">•</span>
                    <span>You have {selectedQuiz.timeLimit} minutes to complete this quiz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-900 font-bold">•</span>
                    <span>All {selectedQuiz.questionCount} questions must be answered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-900 font-bold">•</span>
                    <span>You need to score at least {selectedQuiz.passingScore}% to pass</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-900 font-bold">•</span>
                    <span>Once you start, you cannot pause or exit the quiz</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-sm p-4">
                <p className="text-sm text-stone-700 font-sans">
                  <strong>Note:</strong> Quiz runner feature is coming soon. You will be able to start the quiz from here.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setSelectedQuiz(null)}
                    className="flex-1 px-6 py-3 border border-stone-200 text-stone-700 rounded-sm hover:bg-stone-50 transition font-sans font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => navigate(`/student/quiz/${selectedQuiz._id}`)}
                    className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-sm hover:bg-emerald-700 transition font-sans font-semibold flex items-center justify-center gap-2"
                  >
                    <Play size={18} strokeWidth={1.5} /> Start Quiz Now
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;