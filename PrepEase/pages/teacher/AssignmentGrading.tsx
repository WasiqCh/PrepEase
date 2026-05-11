import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

interface Submission {
  _id: string;
  student: { _id: string; name: string; email: string };
  submissionText: string;
  submittedAt: string;
  score: number;
  feedback: string;
  gradedAt?: string;
}

interface Assignment {
  _id: string;
  title: string;
  totalMarks: number;
  dueDate: string;
}

const AssignmentGrading: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending'>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<string>('');
  const [maxScoreFilter, setMaxScoreFilter] = useState<string>('');

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/assessments/submissions/assignment/${assignmentId}`);
      setAssignment(response.data.assignment);
      setSubmissions(response.data.submissions);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (submissionId: string) => {
    if (score === null || score === undefined) {
      setError('Please enter a score');
      return;
    }

    if (!assignment || score > assignment.totalMarks) {
      setError(`Score cannot exceed ${assignment?.totalMarks}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axiosInstance.put(`/assessments/submission/${submissionId}/grade`, {
        score,
        feedback,
      });

      // Update submission in list
      setSubmissions(submissions.map(s =>
        s._id === submissionId
          ? { ...s, score, feedback, gradedAt: new Date().toISOString() }
          : s
      ));

      setGradingSubmissionId(null);
      setScore(0);
      setFeedback('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to grade submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-stone-900" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  const gradedCount = submissions.filter(s => s.gradedAt).length;
  const filteredSubmissions = submissions.filter(submission => {
    if (statusFilter === 'graded' && !submission.gradedAt) return false;
    if (statusFilter === 'pending' && submission.gradedAt) return false;

    const minScore = minScoreFilter === '' ? null : Number(minScoreFilter);
    const maxScore = maxScoreFilter === '' ? null : Number(maxScoreFilter);

    if ((minScore !== null || maxScore !== null) && !submission.gradedAt) {
      return false;
    }

    if (minScore !== null && submission.score < minScore) return false;
    if (maxScore !== null && submission.score > maxScore) return false;

    return true;
  });

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <button
          onClick={() => navigate('/teacher/assignments')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">{assignment?.title}</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Grade Submissions</p>
      </div>

      {/* Assignment Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Total Marks</p>
          <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight mt-4">{assignment?.totalMarks}</p>
        </div>
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Submissions</p>
          <p className="text-4xl font-serif font-bold text-stone-900 tracking-tight mt-4">{submissions.length}</p>
        </div>
        <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Graded</p>
          <p className="text-4xl font-serif font-bold text-emerald-700 tracking-tight mt-4">{gradedCount}/{submissions.length}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-white border border-rose-700 px-6 py-3 rounded-sm shadow-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-700" strokeWidth={1.5} />
          <p className="font-sans text-sm text-rose-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'graded' | 'pending')}
            className="px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          >
            <option value="all">All</option>
            <option value="graded">Graded</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Min Score</label>
          <input
            type="number"
            min="0"
            max={assignment?.totalMarks}
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
            max={assignment?.totalMarks}
            value={maxScoreFilter}
            onChange={(e) => setMaxScoreFilter(e.target.value)}
            placeholder={assignment?.totalMarks?.toString() || ''}
            className="px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 lg:ml-auto">
          Showing {filteredSubmissions.length} of {submissions.length}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-stone-200 shadow-sm rounded-sm">
            <p className="text-stone-500 font-sans text-sm">No submissions.</p>
          </div>
        ) : (
          filteredSubmissions.map(submission => (
            <div key={submission._id} className="bg-white border border-stone-200 shadow-sm rounded-sm p-6">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-sans font-bold text-stone-900">{submission.student.name}</h3>
                  <p className="text-sm font-sans text-stone-600">{submission.student.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {submission.gradedAt ? (
                    <span className="flex items-center gap-2 border border-emerald-700 text-emerald-700 px-3 py-1 text-xs font-mono font-bold">
                      <CheckCircle size={12} strokeWidth={2} /> Graded
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 border border-stone-900 text-stone-900 px-3 py-1 text-xs font-mono font-bold">
                      <Clock size={12} strokeWidth={2} /> Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-stone-200">
                <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Submission</p>
                <p className="bg-stone-50 border border-stone-200 p-4 rounded-sm text-stone-800 font-sans text-sm whitespace-pre-wrap line-clamp-3">
                  {submission.submissionText}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Submitted</p>
                  <p className="text-stone-900 font-sans mt-1">{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                {submission.gradedAt && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Score</p>
                    <p className="text-stone-900 font-serif text-lg font-bold mt-1">{submission.score}/{assignment?.totalMarks}</p>
                  </div>
                )}
              </div>

              {gradingSubmissionId === submission._id ? (
                <div className="bg-stone-50 border border-stone-200 p-6 rounded-sm space-y-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">
                      Score (max {assignment?.totalMarks})
                    </label>
                    <input
                      type="number"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      min="0"
                      max={assignment?.totalMarks}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Feedback</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setGradingSubmissionId(null);
                        setScore(0);
                        setFeedback('');
                      }}
                      className="flex-1 bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 rounded-sm px-4 py-2.5 font-sans text-sm font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleGradeSubmit(submission._id)}
                      disabled={submitting}
                      className="flex-1 bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  {submission.feedback && (
                    <div className="flex-1 bg-stone-50 border border-stone-200 p-4 rounded-sm">
                      <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2 mb-2">
                        <MessageSquare size={12} strokeWidth={2} /> Feedback
                      </p>
                      <p className="text-sm font-sans text-stone-800">{submission.feedback}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setGradingSubmissionId(submission._id);
                      setScore(submission.score);
                      setFeedback(submission.feedback);
                    }}
                    className="bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold whitespace-nowrap"
                  >
                    {submission.gradedAt ? 'Edit' : 'Grade'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentGrading;
