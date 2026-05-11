import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, HelpCircle, Loader, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

const QuizUploadClean: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    passingScore: 60,
    showAnswers: false,
    shuffleQuestions: true,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'medium',
      topic: '',
    },
  ]);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseQuizzes(selectedCourse);
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

  const fetchCourseQuizzes = async (courseId: string) => {
    try {
      const response = await axiosInstance.get(`/quizzes/course/${courseId}`);
      const baseQuizzes = response.data.quizzes || [];

      let summaryMap: Record<string, { attemptsCount: number; averageScore: number }> = {};
      try {
        const summaryRes = await axiosInstance.get(`/quizzes/course/${courseId}/attempts-summary`);
        const summary = summaryRes.data.summary || [];
        summaryMap = summary.reduce((acc: any, item: any) => {
          acc[item.quizId] = {
            attemptsCount: item.attemptsCount || 0,
            averageScore: item.averageScore || 0,
          };
          return acc;
        }, {});
      } catch (_err) {
        // ignore
      }

      const quizzesWithStats = baseQuizzes.map((quiz: any) => ({
        ...quiz,
        attemptsCount: summaryMap[quiz._id]?.attemptsCount || 0,
        averageScore: summaryMap[quiz._id]?.averageScore || 0,
      }));

      setQuizzes(quizzesWithStats);
    } catch (err: any) {
      console.error('Failed to fetch quizzes:', err);
      setQuizzes([]);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: 'medium',
        topic: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === 'question' || field === 'correctAnswer' || field === 'difficulty' || field === 'topic') {
      (newQuestions[index] as any)[field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      timeLimit: 30,
      passingScore: 60,
      showAnswers: false,
      shuffleQuestions: true,
    });
    setQuestions([
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: 'medium',
          topic: '',
      },
    ]);
    setExpandedQuestions([]);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!formData.title) {
      setError('Quiz title is required');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question) {
        setError(`Question ${i + 1}: Question text is required`);
        return;
      }
      if (questions[i].options.some((opt) => !opt)) {
        setError(`Question ${i + 1}: All options must be filled`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const quizData = {
        courseId: selectedCourse,
        title: formData.title,
        description: formData.description,
        timeLimit: formData.timeLimit,
        passingScore: formData.passingScore,
        showAnswers: formData.showAnswers,
        shuffleQuestions: formData.shuffleQuestions,
        questions,
      };

      await axiosInstance.post('/quizzes', quizData);
      setSuccess('Quiz created successfully!');
      resetForm();
      setShowCreateModal(false);
      fetchCourseQuizzes(selectedCourse);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz? This action cannot be undone.')) return;

    setError('');
    setSuccess('');

    try {
      await axiosInstance.delete(`/quizzes/${quizId}`);
      setSuccess('Quiz deleted successfully');
      if (selectedCourse) {
        fetchCourseQuizzes(selectedCourse);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const toggleQuestionExpand = (index: number) => {
    if (expandedQuestions.includes(index)) {
      setExpandedQuestions(expandedQuestions.filter((i) => i !== index));
    } else {
      setExpandedQuestions([...expandedQuestions, index]);
    }
  };

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Quizzes</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Create & Manage</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
        >
          New
        </button>
      </div>

      {error && <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm"><span className="font-sans text-sm">{error}</span></div>}
      {success && <div className="bg-white border border-emerald-700 text-emerald-700 px-6 py-3 rounded-sm shadow-sm"><span className="font-sans text-sm">{success}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
          {loading && (
            <div className="flex items-center gap-2 text-stone-600 font-sans text-sm mt-4">
              <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Course Quizzes</h2>

            {quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="border border-stone-200 rounded-sm bg-white">
                    <div className="flex items-start justify-between p-4 hover:bg-stone-50 transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-stone-50 border border-stone-200 text-stone-900 rounded-sm mt-1">
                          <HelpCircle size={20} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/teacher/quizzes/${quiz._id}/attempts`)}
                            className="font-sans font-bold text-stone-900 break-words text-left hover:text-emerald-700"
                          >
                            {quiz.title}
                          </button>
                          {quiz.description && (
                            <p className="text-sm font-sans text-stone-600 mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs font-sans text-stone-500 mt-2">
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>Time: {quiz.timeLimit} min</span>
                            <span>Pass: {quiz.passingScore}%</span>
                            <span>Attempts: {quiz.attemptsCount || 0}</span>
                            <span>Avg: {quiz.averageScore || 0}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => navigate(`/teacher/quizzes/${quiz._id}/attempts`)}
                          className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-900 hover:text-emerald-700 transition-colors px-3 py-2"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="p-2 text-stone-400 hover:text-rose-700 rounded-sm transition"
                          title="Delete quiz"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 font-sans text-sm text-stone-500">
                {selectedCourse ? 'No quizzes. Click "New" to create.' : 'Select a course.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-sm rounded-sm max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
              <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">New Quiz</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-sm transition"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-6">
              <div className="space-y-4 pb-6 border-b border-stone-200">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                      placeholder="Chapter 1 Quiz"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Time (min)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    placeholder="Quiz description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Pass Score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    />
                  </div>

                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showAnswers}
                        onChange={(e) => setFormData({ ...formData, showAnswers: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-xs font-sans font-bold text-stone-700">Show answers</span>
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs font-sans font-bold text-stone-700">Shuffle questions</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Questions ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="bg-stone-50 border border-stone-200 text-stone-900 hover:bg-stone-900 hover:text-white rounded-sm px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest font-bold transition"
                  >
                    Add
                  </button>
                </div>

                {questions.map((question, qIndex) => (
                  <div key={qIndex} className="border border-stone-200 rounded-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpand(qIndex)}
                      className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition"
                    >
                      <span className="font-sans font-bold text-stone-900">Question {qIndex + 1}</span>
                      {expandedQuestions.includes(qIndex) ? (
                        <ChevronUp size={20} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown size={20} strokeWidth={1.5} />
                      )}
                    </button>

                    {expandedQuestions.includes(qIndex) && (
                      <div className="p-4 space-y-4 border-t border-stone-200">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Question *</label>
                          <textarea
                            value={question.question}
                            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                            placeholder="Enter question..."
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Difficulty</label>
                            <select
                              value={question.difficulty}
                              onChange={(e) =>
                                handleQuestionChange(qIndex, 'difficulty', e.target.value as 'easy' | 'medium' | 'hard')
                              }
                              className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Topic *</label>
                            <input
                              type="text"
                              value={question.topic || ''}
                              onChange={(e) => handleQuestionChange(qIndex, 'topic', e.target.value)}
                              placeholder="e.g., Loops, Arrays, Functions"
                              required
                              className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Correct Answer</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            {question.options.map((_, idx) => (
                              <option key={idx} value={idx}>
                                Option {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Options *</label>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 w-8">
                                  {String.fromCharCode(65 + oIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition font-medium"
                          >
                            Remove Question
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
                  className="flex-1 bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin inline mr-2" size={14} strokeWidth={2} /> Creating...
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

export default QuizUploadClean;
