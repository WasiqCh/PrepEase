import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

type Attempt = {
  _id: string;
  studentId: { email: string; firstName?: string; lastName?: string };
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  status: 'passed' | 'failed';
  completedAt: string;
};

type Quiz = {
  _id: string;
  title: string;
  passingScore: number;
  timeLimit: number;
  questionCount?: number;
  questions?: any[];
};

const PAGE_SIZE = 25;

const QuizAttempts: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [maxScoreFilter, setMaxScoreFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      if (!quizId) return;
      try {
        setLoading(true);
        const [quizRes, attemptsRes] = await Promise.all([
          axiosInstance.get(`/quizzes/${quizId}`),
          axiosInstance.get(`/quizzes/${quizId}/attempts`),
        ]);
        setQuiz(quizRes.data.quiz);
        setAttempts(attemptsRes.data.attempts || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load quiz attempts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId]);

  const filteredAttempts = useMemo(() => {
    const minScore = minScoreFilter === '' ? null : Number(minScoreFilter);
    const maxScore = maxScoreFilter === '' ? null : Number(maxScoreFilter);
    const q = search.trim().toLowerCase();

    return attempts.filter((attempt) => {
      if (statusFilter !== 'all' && attempt.status !== statusFilter) return false;
      if (minScore !== null && attempt.score < minScore) return false;
      if (maxScore !== null && attempt.score > maxScore) return false;

      if (!q) return true;
      const student = attempt.studentId || {};
      const name = [student.firstName, student.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const email = (student.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [attempts, statusFilter, minScoreFilter, maxScoreFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE));
  const pagedAttempts = filteredAttempts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, minScoreFilter, maxScoreFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate('/teacher/quizzes')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">{quiz?.title || 'Quiz Results'}</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Attempts & Scores</p>
      </div>

      {error && (
        <div className="bg-white border border-rose-700 text-rose-700 px-6 py-3 rounded-sm shadow-sm">
          <span className="font-sans text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'passed' | 'failed')}
            className="px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          >
            <option value="all">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Min Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value)}
            placeholder="0"
            className="px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Max Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={maxScoreFilter}
            onChange={(e) => setMaxScoreFilter(e.target.value)}
            placeholder="100"
            className="px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              className="w-full pl-9 pr-3 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
            />
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 lg:ml-auto">
          Showing {filteredAttempts.length}
        </div>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
        <div className="divide-y divide-stone-200">
          {pagedAttempts.length === 0 ? (
            <div className="text-center py-10 font-sans text-sm text-stone-500">No attempts.</div>
          ) : (
            pagedAttempts.map((attempt) => {
              const student = attempt.studentId || {};
              const name = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unknown Student';
              return (
                <div key={attempt._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-sans font-bold text-stone-900">{name}</p>
                    <p className="text-xs font-sans text-stone-600">{student.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-stone-700">
                    <span className={`border px-2 py-1 text-xs font-mono font-bold uppercase ${attempt.status === 'passed' ? 'border-emerald-700 text-emerald-700' : 'border-rose-700 text-rose-700'}`}>
                      {attempt.status}
                    </span>
                    <span className="font-bold">Score: {attempt.score}%</span>
                    <span>
                      Correct: {attempt.correctAnswers}/{attempt.totalQuestions}
                    </span>
                    <span className="text-stone-500">{new Date(attempt.completedAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-white border border-stone-200 text-stone-900 hover:border-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-4 py-2 font-sans text-sm font-bold transition"
          >
            Previous
          </button>
          <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="bg-white border border-stone-200 text-stone-900 hover:border-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-4 py-2 font-sans text-sm font-bold transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizAttempts;
