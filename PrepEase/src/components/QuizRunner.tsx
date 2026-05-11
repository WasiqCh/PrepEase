import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty?: string;
  explanation?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit: number;
  passingScore: number;
  questionCount: number;
}

interface Answer {
  questionIndex: number;
  selectedAnswer: number;
  timeSpent: number;
}

const QuizRunner: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quizStarted || quizSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizSubmitted]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      if (!quizId) {
        setError('Missing quiz id in URL');
        return;
      }
      const response = await axiosInstance.get(`/quizzes/${quizId}`, {
        timeout: 15000,
      });
      const quizData = response.data.quiz;
      setQuiz(quizData);
      setTimeRemaining(quizData.timeLimit * 60);

      try {
        const attemptRes = await axiosInstance.get(`/quizzes/${quizId}/attempts`);
        const attempts = attemptRes.data.attempts || [];
        if (attempts.length > 0) {
          setResult(attempts[0]);
          setQuizSubmitted(true);
        }
      } catch (_err) {
        // noop
      }
      
      // Initialize answers array
      setAnswers(
        quizData.questions.map((_, index) => ({
          questionIndex: index,
          selectedAnswer: -1,
          timeSpent: 0,
        }))
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load quiz'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuestionStartTime(Date.now());
  };

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion].selectedAnswer = optionIndex;
    newAnswers[currentQuestion].timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const response = await axiosInstance.post(`/quizzes/${quizId}/submit`, {
        answers,
        timeTaken: Math.floor((quiz!.timeLimit * 60 - timeRemaining)),
      });

      setResult(response.data.attempt);
      setQuizSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.attempt) {
        setResult(err.response.data.attempt);
        setQuizSubmitted(true);
      } else {
        setError(err?.response?.data?.message || 'Failed to submit quiz');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="mx-auto text-red-600 mb-2" size={32} />
        <p className="text-red-800 font-semibold">{error || 'Quiz not found'}</p>
        <button
          onClick={() => navigate('/student/assignments')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-slate-600">{quiz.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-slate-600 font-medium">Questions</p>
              <p className="text-2xl font-bold text-blue-700">{quiz.questionCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-slate-600 font-medium">Time Limit</p>
              <p className="text-2xl font-bold text-green-700">{quiz.timeLimit} min</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-slate-600 font-medium">Passing Score</p>
              <p className="text-2xl font-bold text-purple-700">{quiz.passingScore}%</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-bold text-slate-900 mb-4">Quiz Instructions:</h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>You have {quiz.timeLimit} minutes to complete this quiz. The timer will start when you begin.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>All {quiz.questionCount} questions must be answered before submission.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>You need to score at least {quiz.passingScore}% to pass this quiz.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>You can navigate between questions using the Previous/Next buttons.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Once you submit, your quiz will be evaluated immediately.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => navigate('/student/assignments')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleStartQuiz}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizSubmitted && result) {
    const passed = result.status === 'passed';
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="text-center">
            {passed ? (
              <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            ) : (
              <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            )}
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {passed ? 'Congratulations!' : 'Quiz Completed'}
            </h1>
            <p className="text-slate-600">
              {passed
                ? `You passed the quiz with a score of ${result.score}%`
                : `You scored ${result.score}%. The passing score is ${quiz.passingScore}%.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-slate-600 font-medium">Your Score</p>
              <p className="text-2xl font-bold text-blue-700">{result.score}%</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-slate-600 font-medium">Correct Answers</p>
              <p className="text-2xl font-bold text-green-700">{result.correctAnswers}/{result.totalQuestions}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-slate-600 font-medium">Time Taken</p>
              <p className="text-2xl font-bold text-purple-700">{Math.floor(result.timeTaken / 60)}m</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            {passed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">✓ You have successfully completed this quiz!</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">
                  You did not achieve the passing score. Consider reviewing the material and trying again.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => navigate('/student/assignments')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
            >
              Back to Assignments
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];
  const allAnswered = answers.every((a) => a.selectedAnswer !== -1);

  return (
    <div className="space-y-6">
      {/* Timer and Progress */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 font-medium">Question</p>
          <p className="text-2xl font-bold text-slate-900">
            {currentQuestion + 1}/{quiz.questions.length}
          </p>
        </div>
        <div className={`rounded-lg border shadow-sm p-4 ${
          timeRemaining < 60
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-slate-200'
        }`}>
          <p className="text-sm text-slate-600 font-medium flex items-center gap-1">
            <Clock size={16} /> Time Remaining
          </p>
          <p className={`text-2xl font-bold ${
            timeRemaining < 60 ? 'text-red-700' : 'text-slate-900'
          }`}>
            {formatTime(timeRemaining)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 font-medium">Progress</p>
          <div className="mt-2">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {answers.filter((a) => a.selectedAnswer !== -1).length}/{quiz.questions.length} answered
            </p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{question.question}</h2>
          {question.difficulty && (
            <p className="text-sm text-slate-500">Difficulty: {question.difficulty}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                currentAnswer.selectedAnswer === index
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    currentAnswer.selectedAnswer === index
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  }`}
                >
                  {currentAnswer.selectedAnswer === index && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-slate-900 font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={!allAnswered || submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;
