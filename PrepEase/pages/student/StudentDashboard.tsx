import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, ChevronRight, Book, Loader, HelpCircle } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  progress?: number;
  nextDeadline?: string;
}

interface EnrollmentData {
  _id: string;
  student: string;
  course: Course;
  enrolledAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  timeLimit: number;
  questionCount: number;
  passingScore: number;
}

const StudentDashboard: React.FC = () => {
  const [userName, setUserName] = useState<string>('Student');
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuizzes, setPendingQuizzes] = useState(0);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use localStorage user (avoid /users/profile 404)
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.name || parsedUser?.email) {
            setUserName(parsedUser?.name || parsedUser?.email);
          }
        }
      } catch (_err) {
        // noop
      }

      // Fetch enrolled courses
      const enrollmentsRes = await axiosInstance.get('/enrollments/my-courses');
      const enrollments: EnrollmentData[] = enrollmentsRes.data.enrollments || [];
      
      // Transform enrollment data to course format
      const courses: Course[] = enrollments.map((enrollment: EnrollmentData) => {
        const course = enrollment.course;
        // Parse course title for progress if needed
        return {
          _id: course._id,
          courseCode: course.courseCode || 'N/A',
          title: course.title || 'Untitled Course',
          progress: Math.floor(Math.random() * 100), // Placeholder - calculate from materials completed
          nextDeadline: 'N/A',
        };
      });

      setEnrolledCourses(courses);

      // Fetch quizzes for enrolled courses
      try {
        const allQuizzes: Quiz[] = [];
        for (const enrollment of enrollments) {
          try {
            const quizRes = await axiosInstance.get(`/quizzes/course/${enrollment.course._id}`);
            const courseQuizzes = quizRes.data.quizzes || [];
            allQuizzes.push(...courseQuizzes.map((q: any) => ({
              _id: q._id,
              title: q.title,
              courseId: q.courseId,
              timeLimit: q.timeLimit,
              questionCount: q.questionCount || q.questions?.length || 0,
              passingScore: q.passingScore,
            })));
          } catch (err) {
            // noop - quiz fetch is optional
          }
        }
        const quizzesWithAttempts = await Promise.all(
          allQuizzes.map(async (quiz) => {
            try {
              const attemptRes = await axiosInstance.get(`/quizzes/${quiz._id}/attempts`);
              const attempts = attemptRes.data.attempts || [];
              if (attempts.length > 0) {
                return {
                  ...quiz,
                  status: 'completed',
                  score: attempts[0].score,
                } as any;
              }
            } catch (_err) {
              // noop
            }
            return { ...quiz, status: 'pending' } as any;
          })
        );
        setQuizzes(quizzesWithAttempts);
        setPendingQuizzes(quizzesWithAttempts.filter((q: any) => q.status === 'pending').length);
      } catch (err) {
        // noop
      }
      try {
        const coursesRes = await axiosInstance.get('/courses');
        const allCourses: Course[] = coursesRes.data.courses || [];
        const enrolledIds = new Set(courses.map((c) => c._id));
        setAvailableCourses(allCourses.filter((c) => !enrolledIds.has(c._id)));
      } catch (err) {
        console.warn('Failed to fetch available courses:', err);
        setAvailableCourses([]);
      }

      // Skip quiz summary fetch (endpoint not available)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      await axiosInstance.post('/enrollments/enroll', { courseId });
      await fetchDashboardData();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to enroll in course.';
      setError(message);
    } finally {
      setEnrollingId(null);
    }
  };

  if (error && enrolledCourses.length === 0) {
    return (
      <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
        <div className="bg-white border border-rose-700 rounded-sm p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-rose-700 mt-1" size={24} strokeWidth={1.5} />
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900 mb-2">Failed to Load</h2>
              <p className="font-sans text-sm text-stone-700 mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white border border-stone-200 rounded-sm p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mb-2">Welcome, {userName}</h1>
            <p className="font-sans text-sm text-stone-600">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader size={16} className="animate-spin" strokeWidth={1.5} />
                  Loading...
                </span>
              ) : (
                `${pendingQuizzes} pending quiz${pendingQuizzes !== 1 ? 'zes' : ''} this week.`
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center justify-center rounded-sm border border-stone-900 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Open Study Buddy
            </Link>
            <Link
              to="/flashcards"
              className="inline-flex items-center justify-center rounded-sm border border-stone-900 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Generate Flashcards
            </Link>
            <Link
              to="/resources-discover"
              className="inline-flex items-center justify-center rounded-sm border border-stone-900 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Discover Resources
            </Link>
            <Link
              to="/student/resources"
              className="inline-flex items-center justify-center rounded-sm border border-stone-200 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
            >
              View Materials
            </Link>
          </div>
        </div>
      </div>

      {error && enrolledCourses.length > 0 && (
        <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">{error}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Courses */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">
            Enrolled Courses
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-sm border border-stone-200 p-6 shadow-sm animate-pulse">
                  <div className="h-6 bg-stone-200 rounded-sm w-20 mb-4"></div>
                  <div className="h-6 bg-stone-200 rounded-sm w-40 mb-4"></div>
                  <div className="h-2 bg-stone-200 rounded-sm mb-2"></div>
                </div>
              ))}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map(course => (
                <Link 
                  key={course._id} 
                  to={`/student/course/${course._id}`}
                  className="group bg-white rounded-sm border border-stone-200 p-6 shadow-sm hover:border-stone-900 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="border border-stone-900 text-stone-900 text-xs font-mono font-bold uppercase px-2 py-1 rounded-sm">
                      {course.courseCode}
                    </span>
                    {course.nextDeadline && course.nextDeadline !== 'N/A' && (
                      <span className="flex items-center text-xs font-mono font-bold uppercase border border-rose-700 text-rose-700 px-2 py-1 rounded-sm">
                        <AlertCircle size={12} strokeWidth={1.5} className="mr-1" /> {course.nextDeadline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-sans font-bold text-stone-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {course.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest font-bold text-stone-400">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-sm h-2">
                      <div 
                        className="bg-stone-900 h-2 rounded-sm transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-sm p-8 text-center">
              <Book className="mx-auto text-stone-400" size={32} strokeWidth={1.5} />
              <h3 className="font-sans font-bold text-stone-900 mb-2 mt-4">No Enrolled Courses</h3>
              <p className="font-sans text-sm text-stone-600 mb-4">You haven't enrolled in any courses yet.</p>
              <span className="inline-block bg-stone-900 text-white rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest font-bold">
                Browse Below
              </span>
            </div>
          )}

          {!loading && availableCourses.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Available Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCourses.map((course) => (
                  <div key={course._id} className="bg-white rounded-sm border border-stone-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono font-bold uppercase border border-stone-900 text-stone-900 px-2 py-1 rounded-sm inline-block mb-2">
                          {course.courseCode}
                        </div>
                        <div className="text-sm font-sans font-bold text-stone-900">
                          {course.title}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingId === course._id}
                        className="bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 rounded-sm px-4 py-2 text-[10px] font-mono uppercase tracking-widest font-bold transition-colors"
                      >
                        {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Activity & Deadlines */}
        <div className="space-y-6">
          <div className="bg-white rounded-sm border border-stone-200 shadow-sm p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">
              Pending Quizzes
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 bg-stone-100 rounded-sm animate-pulse"></div>
                ))}
              </div>
            ) : quizzes.filter((q: any) => q.status === 'pending').length > 0 ? (
              <div className="space-y-3 mb-4">
                {quizzes.filter((q: any) => q.status === 'pending').slice(0, 3).map(quiz => (
                  <div key={quiz._id} className="bg-stone-50 border border-stone-200 rounded-sm p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans font-bold text-stone-900 truncate">{quiz.title}</p>
                        <p className="text-xs font-sans text-stone-600 flex items-center gap-1 mt-1">
                          <Clock size={12} strokeWidth={1.5} /> {quiz.timeLimit} min • {quiz.questionCount} questions
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {quizzes.filter((q: any) => q.status === 'pending').length > 3 && (
                  <p className="text-xs font-sans text-stone-500 text-center py-2">
                    +{quizzes.filter((q: any) => q.status === 'pending').length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-sans text-stone-600 mb-4">No pending quizzes.</p>
            )}
            <Link to="/student/assignments" className="w-full flex items-center justify-center py-2.5 font-mono text-[10px] uppercase tracking-widest text-stone-900 hover:text-emerald-700 bg-stone-50 hover:bg-stone-100 font-bold rounded-sm transition-colors gap-1">
              View All <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-sm shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white border border-stone-200 rounded-sm shadow-sm">
                <Book size={24} className="text-stone-900" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-lg text-stone-900 mb-1">Keep Learning</h4>
                <p className="font-sans text-stone-600 text-sm mb-3">
                  {loading 
                    ? 'Loading...' 
                    : enrolledCourses.length > 0 
                      ? `Enrolled in ${enrolledCourses.length} course${enrolledCourses.length !== 1 ? 's' : ''}.`
                      : 'Start by enrolling in a course.'
                  }
                </p>
                <Link to="/student/assignments" className="inline-block bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest font-bold shadow-sm transition-colors">
                  Assignments
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;