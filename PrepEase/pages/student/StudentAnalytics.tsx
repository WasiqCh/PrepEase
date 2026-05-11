import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, AlertTriangle, ArrowLeft, Loader, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface Course {
  _id: string;
  courseCode?: string;
  title?: string;
}

interface EnrollmentData {
  _id: string;
  course: Course;
}

interface AssignmentDetail {
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

interface QuizDetail {
  quizId: string;
  title: string;
  passingScore: number;
  questionCount: number;
  attemptsCount: number;
  latestScore: number | null;
  latestStatus: 'passed' | 'failed' | null;
  latestCompletedAt: string | null;
}

interface SummaryData {
  assignmentTotal: number;
  assignmentSubmitted: number;
  averageAssignmentScore: number;
  quizAttempts: number;
  averageQuizScore: number;
  performanceScore: number;
}

const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weakTopics, setWeakTopics] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/enrollments/my-courses');
        const enrollments: EnrollmentData[] = response.data.enrollments || [];
        const courseList = enrollments.map((e) => e.course).filter(Boolean) as Course[];
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0]._id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load your courses');
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!selectedCourse) return;
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/enrollments/my-course/${selectedCourse}/details`);
        setSummary(response.data.summary || null);
        setAssignments(response.data.assignments || []);
        setQuizzes(response.data.quizzes || []);
        setWeakTopics(response.data.summary?.weakTopics || response.data.weakTopics || []);
      } catch (err: any) {
          const serverMessage = err?.response?.data?.message;
          const status = err?.response?.status;
          const message = serverMessage || err?.message || 'Failed to load performance data';
          console.error('[StudentAnalytics] fetchPerformance error:', err);
          setError(`${message}${status ? ` (status ${status})` : ''}`);
        setSummary(null);
        setAssignments([]);
        setQuizzes([]);
          setWeakTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [selectedCourse]);

  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Assignments', score: summary.averageAssignmentScore || 0 },
      { name: 'Quizzes', score: summary.averageQuizScore || 0 },
      { name: 'Overall', score: summary.performanceScore || 0 },
    ];
  }, [summary]);

  // Calculate performance insights and recommendations
  const insights = useMemo(() => {
    const issues: any[] = [];
    const recommendations: any[] = [];

    if (!summary) return { issues, recommendations, weakAreas: [] };

    // Check assignment performance
    if (summary.averageAssignmentScore < 70) {
      issues.push({
        type: 'assignment',
        severity: summary.averageAssignmentScore < 50 ? 'critical' : 'warning',
        title: 'Low Assignment Performance',
        score: summary.averageAssignmentScore,
        message: `Your average assignment score is ${summary.averageAssignmentScore}%, which is below the target.`,
      });
      recommendations.push({
        icon: Lightbulb,
        title: 'Improve Assignment Skills',
        tips: [
          'Review feedback from previous assignments',
          'Start assignments earlier to have more time',
          'Ask for help if concepts are unclear',
          'Practice similar problems before submission',
        ],
      });
    }

    // Check quiz performance
    if (summary.averageQuizScore < 70) {
      issues.push({
        type: 'quiz',
        severity: summary.averageQuizScore < 50 ? 'critical' : 'warning',
        title: 'Low Quiz Performance',
        score: summary.averageQuizScore,
        message: `Your average quiz score is ${summary.averageQuizScore}%, indicating concept gaps.`,
      });
      recommendations.push({
        icon: Lightbulb,
        title: 'Strengthen Quiz Preparation',
        tips: [
          'Review course materials before each quiz',
          'Take practice quizzes to build confidence',
          'Focus on weak topics',
          'Attend all lectures and take notes',
        ],
      });
    }

    // Check submission rate
    const submissionRate = summary.assignmentTotal > 0 
      ? (summary.assignmentSubmitted / summary.assignmentTotal) * 100 
      : 0;
    if (submissionRate < 80) {
      issues.push({
        type: 'submission',
        severity: 'warning',
        title: 'Low Submission Rate',
        score: submissionRate,
        message: `You've only submitted ${Math.round(submissionRate)}% of assignments.`,
      });
    }

    // Check overall performance
    if (summary.performanceScore < 70) {
      recommendations.push({
        icon: AlertCircle,
        title: 'Overall Performance Below Target',
        tips: [
          'Set a study schedule and stick to it',
          'Allocate more time to this course',
          'Form study groups with peers',
          'Visit instructor office hours',
          'Use available tutoring resources',
        ],
      });
    }

    const weakAreas = assignments.filter(a => a.score && a.totalMarks && (a.score / a.totalMarks) < 0.7)
      .concat(quizzes.filter(q => q.latestScore && q.latestScore < 70).map((q, idx) => ({ 
        assessmentId: `quiz-${idx}`,
        title: q.title,
        score: q.latestScore,
        totalMarks: 100
      })));

    return { issues, recommendations, weakAreas };
  }, [summary, assignments, quizzes, weakTopics]);

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
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Performance Analytics</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Progress & Insights</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
        <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-200 focus:border-stone-900 outline-none font-sans text-stone-900"
        >
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseCode ? `${course.courseCode} - ` : ''}{course.title || 'Untitled Course'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 text-rose-700 text-sm font-sans">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
            <h3 className="font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight text-lg">
                <TrendingUp className="text-stone-900" size={20} strokeWidth={1.5} /> Subject Proficiency
            </h3>
            <div className="h-64">
                {loading ? (
                  <div className="flex items-center gap-2 text-stone-500 font-sans">
                    <Loader size={16} className="animate-spin" /> Loading performance...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 500}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 500}} />
                          <Tooltip 
                              contentStyle={{ borderRadius: '2px', border: '1px solid #e7e5e4', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} 
                              cursor={{ fill: '#f5f5f4' }}
                              formatter={(value) => [`${value}%`, 'Score']}
                          />
                          <Bar dataKey="score" fill="#1c1917" radius={[2, 2, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
            <h3 className="font-serif font-bold text-stone-900 mb-6 flex items-center gap-2 tracking-tight text-lg">
                <AlertTriangle className="text-stone-900" size={20} strokeWidth={1.5} /> Performance Summary
            </h3>
            <p className="text-sm text-stone-500 mb-4 font-sans">Course metrics overview:</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Assignments Submitted</span>
                <span className="font-bold text-stone-900">
                  {summary?.assignmentSubmitted ?? 0}/{summary?.assignmentTotal ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Average Assignment Score</span>
                <span className="font-bold text-stone-900">{summary?.averageAssignmentScore ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Quiz Attempts</span>
                <span className="font-bold text-stone-900">{summary?.quizAttempts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-stone-600">Average Quiz Score</span>
                <span className="font-bold text-stone-900">{summary?.averageQuizScore ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between font-sans border-t border-stone-200 pt-3">
                <span className="text-stone-700 font-bold">Overall Performance</span>
                <span className="font-bold text-stone-900 text-base">{summary?.performanceScore ?? 0}%</span>
              </div>
            </div>
        </div>
      </div>

      {/* Performance Issues and Weak Areas */}
      {insights.issues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">⚠️ Performance Issues</h2>
          <div className="grid grid-cols-1 gap-4">
            {insights.issues.map((issue, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-sm border-l-4 ${
                  issue.severity === 'critical'
                    ? 'bg-rose-50 border-l-rose-600 border border-rose-200'
                    : 'bg-amber-50 border-l-amber-600 border border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle 
                    size={20} 
                    className={issue.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}
                    strokeWidth={1.5}
                  />
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${issue.severity === 'critical' ? 'text-rose-900' : 'text-amber-900'}`}>
                      {issue.title}
                    </p>
                    <p className={`text-sm mt-1 ${issue.severity === 'critical' ? 'text-rose-800' : 'text-amber-800'}`}>
                      {issue.message}
                    </p>
                    <p className={`text-xs font-mono font-bold mt-2 ${issue.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'}`}>
                      Current Score: {Math.round(issue.score)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Areas Detection */}
      {insights.weakAreas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">📊 Areas Needing Improvement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.weakAreas.slice(0, 6).map((area) => (
              <div key={area.assessmentId} className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-sm border border-rose-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-rose-600 mt-1" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900 text-sm mb-2">{area.title}</p>
                    <div className="w-full bg-white rounded-sm h-2 mb-2 overflow-hidden border border-rose-200">
                      <div 
                        className="bg-gradient-to-r from-rose-400 to-rose-600 h-full"
                        style={{ width: `${Math.min((area.score / area.totalMarks) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-rose-700 font-mono font-bold">
                      Score: {Math.round((area.score / area.totalMarks) * 100)}% ({area.score}/{area.totalMarks})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {insights.weakAreas.length > 6 && (
            <p className="text-xs text-stone-500 font-sans">
              ...and {insights.weakAreas.length - 6} more areas need improvement
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {insights.issues.length === 0 && summary && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-sm border border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle size={24} className="text-emerald-700 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="font-semibold text-emerald-900">Great Performance! 🎉</p>
              <p className="text-sm text-emerald-800 mt-1">
                You're performing well in this course. Keep up the good work and maintain your progress!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weak Topics Section */}
      {weakTopics && weakTopics.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">📚 Areas You're Lagging In (by Topic)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakTopics.map((topic, idx) => {
              const isWeak = topic.percentage < 70;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-sm border ${
                    isWeak
                      ? 'bg-gradient-to-br from-rose-50 to-red-100 border-rose-200'
                      : 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold text-sm ${isWeak ? 'text-rose-900' : 'text-emerald-900'}`}>
                      {topic.displayLabel || `${topic.quizLabel || 'Quiz'} • ${topic.topic}`}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        isWeak
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {topic.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isWeak ? 'bg-rose-200' : 'bg-emerald-200'}`}>
                      <div
                        className={`h-full transition-all ${
                          isWeak
                            ? 'bg-gradient-to-r from-rose-500 to-red-600'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600'
                        }`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                    <p className={`text-xs ${isWeak ? 'text-rose-800' : 'text-emerald-800'}`}>
                      {topic.correctAnswers} out of {topic.totalQuestions} questions correct
                    </p>
                    {topic.quizLabel && (
                      <p className={`text-[11px] font-sans ${isWeak ? 'text-rose-700' : 'text-emerald-700'}`}>
                        Quiz: {topic.quizLabel}
                      </p>
                    )}
                    {Array.isArray(topic.wrongQuestions) && topic.wrongQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className={`text-[11px] font-semibold ${isWeak ? 'text-rose-700' : 'text-emerald-700'}`}>
                          Wrong questions to review:
                        </p>
                        <ul className={`list-disc pl-4 space-y-1 text-[11px] ${isWeak ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {topic.wrongQuestions.slice(0, 4).map((wrongQuestion: string, questionIndex: number) => (
                            <li key={questionIndex}>{wrongQuestion}</li>
                          ))}
                        </ul>
                        {topic.wrongQuestions.length > 4 && (
                          <p className={`text-[11px] ${isWeak ? 'text-rose-700' : 'text-emerald-700'}`}>
                            + {topic.wrongQuestions.length - 4} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assignments and Quizzes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
          <h3 className="font-serif font-bold text-stone-900 mb-4 tracking-tight text-lg">Assignments</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-stone-500 font-sans">
              <Loader size={16} className="animate-spin" /> Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-sm text-stone-500 font-sans">No assignments found.</div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.assessmentId} className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-sans font-semibold text-stone-900 text-sm">{assignment.title}</p>
                      <p className="text-xs text-stone-500 font-sans">
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-sm text-xs font-mono font-bold ${
                        assignment.status === 'graded'
                          ? 'border border-emerald-700 text-emerald-700'
                          : assignment.status === 'submitted'
                            ? 'border border-stone-900 text-stone-900'
                            : 'border border-stone-400 text-stone-400'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 font-sans flex flex-wrap gap-3">
                    <span>Marks: {assignment.score ?? 'N/A'} / {assignment.totalMarks}</span>
                    <span>Submitted: {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : 'No'}</span>
                  </div>
                  {assignment.feedback && (
                    <div className="mt-3 text-xs text-stone-700 font-sans">
                      <span className="font-semibold">Feedback:</span> {assignment.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm">
          <h3 className="font-serif font-bold text-stone-900 mb-4 tracking-tight text-lg">Quizzes</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-stone-500 font-sans">
              <Loader size={16} className="animate-spin" /> Loading quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-sm text-stone-500 font-sans">No quizzes found.</div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.quizId} className="bg-stone-50 rounded-sm p-4 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-sans font-semibold text-stone-900 text-sm">{quiz.title}</p>
                      <p className="text-xs text-stone-500 font-sans">Attempts: {quiz.attemptsCount}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-sm text-xs font-mono font-bold ${
                        quiz.latestStatus === 'passed'
                          ? 'border border-emerald-700 text-emerald-700'
                          : quiz.latestStatus === 'failed'
                            ? 'border border-rose-700 text-rose-700'
                            : 'border border-stone-400 text-stone-400'
                      }`}
                    >
                      {quiz.latestStatus || 'not attempted'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 font-sans flex flex-wrap gap-3">
                    <span>Latest Score: {quiz.latestScore ?? 'N/A'}%</span>
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
    
  );
};

export default StudentAnalytics;