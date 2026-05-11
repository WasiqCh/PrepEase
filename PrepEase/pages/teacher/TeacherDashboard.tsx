import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, CheckSquare, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

const TeacherDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [courseStats, setCourseStats] = useState<any[]>([]);

    const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError('');

                const coursesRes = await axiosInstance.get('/courses/teacher/my-courses');
                const courses = coursesRes.data.courses || [];

                const stats = await Promise.all(
                    courses.map(async (course: any) => {
                        let studentCount = 0;
                        let pendingGrading = 0;
                        let assignmentCount = 0;
                        let quizCount = 0;
                        let totalQuizAttempts = 0;

                        try {
                            const enrollmentsRes = await axiosInstance.get(`/enrollments/course/${course._id}`);
                            studentCount = (enrollmentsRes.data.enrollments || []).length;
                        } catch (_err) {
                            // noop
                        }

                        try {
                            const submissionsRes = await axiosInstance.get(`/assessments/submissions/course/${course._id}`);
                            const submissionsByAssignment = submissionsRes.data.submissionsByAssignment || [];
                            pendingGrading = submissionsByAssignment.reduce((total: number, item: any) => {
                                const pending = (item.submissions || []).filter((s: any) => !s.gradedAt).length;
                                return total + pending;
                            }, 0);
                        } catch (_err) {
                            // noop
                        }

                        try {
                            const assignmentsRes = await axiosInstance.get(`/assessments/course/${course._id}`);
                            assignmentCount = (assignmentsRes.data.assignments || []).length;
                        } catch (_err) {
                            // noop
                        }

                        try {
                            const quizzesRes = await axiosInstance.get(`/quizzes/course/${course._id}`);
                            quizCount = (quizzesRes.data.quizzes || []).length;
                        } catch (_err) {
                            // noop
                        }

                        try {
                            const attemptsRes = await axiosInstance.get(`/quizzes/course/${course._id}/attempts-summary`);
                            const summary = attemptsRes.data.summary || [];
                            totalQuizAttempts = summary.reduce((sum: number, item: any) => sum + (item.attemptsCount || 0), 0);
                        } catch (_err) {
                            // noop
                        }

                        return {
                            _id: course._id,
                            courseCode: course.courseCode,
                            title: course.title,
                            studentCount,
                            pendingGrading,
                            assignmentCount,
                            quizCount,
                            totalQuizAttempts,
                        };
                    })
                );

                setCourseStats(stats);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to load dashboard data');
                setCourseStats([]);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchDashboard();

            const handler = () => {
                // refresh dashboard when assessments/quizzes are created
                fetchDashboard();
            };

            window.addEventListener('assessmentCreated', handler);
            return () => window.removeEventListener('assessmentCreated', handler);
        }, []);

    const totals = useMemo(() => {
        const totalStudents = courseStats.reduce((sum, c) => sum + (c.studentCount || 0), 0);
        const pendingGrading = courseStats.reduce((sum, c) => sum + (c.pendingGrading || 0), 0);
        const assignmentCount = courseStats.reduce((sum, c) => sum + (c.assignmentCount || 0), 0);
        const quizCount = courseStats.reduce((sum, c) => sum + (c.quizCount || 0), 0);
        const totalQuizAttempts = courseStats.reduce((sum, c) => sum + (c.totalQuizAttempts || 0), 0);
        return {
            totalStudents,
            activeCourses: courseStats.length,
            pendingGrading,
            assignmentCount,
            quizCount,
            totalQuizAttempts,
        };
    }, [courseStats]);

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Teaching Portal</p>
      </div>

            {error && (
                <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm flex items-center gap-3 shadow-sm">
                    <AlertCircle size={18} strokeWidth={1.5} /> 
                    <span className="text-sm font-sans">{error}</span>
                </div>
            )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <Users size={20} className="text-stone-400" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Students</span>
            </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                                <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                            </div>
                        ) : (
                            <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.totalStudents}</p>
                        )}
                        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-2">All Courses</p>
        </div>

        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <BookOpen size={20} className="text-stone-400" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Courses</span>
            </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                                <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                            </div>
                        ) : (
                            <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.activeCourses}</p>
                        )}
                        <p className="text-xs text-stone-500 font-sans mt-2 line-clamp-1">
                            {courseStats.slice(0, 3).map((c) => c.courseCode || c.title).join(', ') || 'No courses'}
                        </p>
        </div>

        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <CheckSquare size={20} className="text-stone-400" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Grading</span>
            </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                                <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                            </div>
                        ) : (
                            <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.pendingGrading}</p>
                        )}
                        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-rose-700 mt-2">Pending</p>
        </div>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Assignments</span>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                            <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                        </div>
                    ) : (
                        <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.assignmentCount}</p>
                    )}
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-2">Total</p>
                </div>

                <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Quizzes</span>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                            <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                        </div>
                    ) : (
                        <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.quizCount}</p>
                    )}
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-2">Total</p>
                </div>

                <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Attempts</span>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                            <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                        </div>
                    ) : (
                        <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight">{totals.totalQuizAttempts}</p>
                    )}
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-2">Quiz Completions</p>
                </div>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
                    <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">Courses</h2>
                    <Link
                        to="/teacher/students"
                        className="bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold flex items-center gap-2"
                    >
                        View Students <ArrowRight size={12} strokeWidth={2} />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-stone-500 text-sm font-sans">
                        <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading courses...
                    </div>
                ) : courseStats.length === 0 ? (
                    <div className="text-sm text-stone-500 font-sans py-8 text-center">No courses assigned.</div>
                ) : (
                    <div className="space-y-0 divide-y divide-stone-200">
                        {courseStats.map((course) => (
                            <div key={course._id} className="grid grid-cols-12 gap-4 items-center py-4">
                                <div className="col-span-12 md:col-span-5">
                                    <p className="font-sans font-bold text-sm text-stone-900">
                                        {course.courseCode ? `${course.courseCode}` : ''}{course.courseCode && ' — '}{course.title}
                                    </p>
                                </div>
                                <div className="col-span-12 md:col-span-7 grid grid-cols-4 gap-2 text-xs font-mono">
                                    <div><span className="text-stone-400">Students:</span> <span className="font-bold text-stone-900">{course.studentCount}</span></div>
                                    <div><span className="text-stone-400">Assignments:</span> <span className="font-bold text-stone-900">{course.assignmentCount}</span></div>
                                    <div><span className="text-stone-400">Quizzes:</span> <span className="font-bold text-stone-900">{course.quizCount}</span></div>
                                    <div><span className="text-rose-700">Pending:</span> <span className="font-bold text-rose-700">{course.pendingGrading}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
    </div>
  );
};

export default TeacherDashboard;