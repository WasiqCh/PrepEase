import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';

interface Material {
  _id: string;
  title: string;
  fileName: string;
  status: string;
  extractedText?: string;
}

const AIGenerator = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [activeTab, setActiveTab] = useState<'quiz' | 'assignment' | 'flashcards' | 'resources'>('quiz');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Quiz settings
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);

  // Assignment settings
  const [assignmentType, setAssignmentType] = useState('essay');
  const [assignmentDifficulty, setAssignmentDifficulty] = useState('medium');

  // Flashcard settings
  const [flashcardCount, setFlashcardCount] = useState(10);

  // Resource settings
  const [resourceTopic, setResourceTopic] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await axiosInstance.get('/materials');
      
      // Filter only materials with extracted text
      const readyMaterials = response.data.materials.filter(
        (m: Material) => m.extractedText && m.extractedText.length > 0
      );
      setMaterials(readyMaterials);
    } catch (err) {
      console.error('Failed to load materials:', err);
      setError('Failed to load materials');
    }
  };

  const generateQuiz = async () => {
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axiosInstance.post('/quizzes/generate', {
        materialId: selectedMaterial,
        difficulty: quizDifficulty,
        questionCount
      });

      setSavedAssessmentId(null);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishQuiz = async (quizId: string, publish: boolean) => {
    try {
      setLoading(true);
      const res = await axiosInstance.patch(`/quizzes/${quizId}/publish`, { isActive: publish });
      // update result state if present
      if (result && result.quiz && res.data.quiz) {
        setResult({ ...result, quiz: res.data.quiz });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update quiz publish state');
    } finally {
      setLoading(false);
    }
  };

  const saveGeneratedAssignment = async () => {
    if (!selectedMaterial) {
      setError('No material selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // fetch material to get its course id
      const matRes = await axiosInstance.get(`/materials/material/${selectedMaterial}`);
      const courseId = matRes.data.material?.course?._id || matRes.data.material?.course || null;
      if (!courseId) {
        setError('Failed to determine course for this material');
        return;
      }

      // Build assessment payload from AI result
      const ai = result;
      const payload: any = {
        title: ai.title || `Assignment: ${ai.materialTitle || ''}`,
        description: (ai.instructions || '') + (ai.questions ? '\n\n' + ai.questions.join('\n') : ''),
        courseId,
        totalMarks: 100,
        type: 'AI-Generated',
        isPublished: false,
      };

      const saveRes = await axiosInstance.post('/assessments', payload);
      const saved = saveRes.data.assignment;
      setSavedAssessmentId(saved._id);

      try {
        window.dispatchEvent(new CustomEvent('assessmentCreated', { detail: { id: saved._id, courseId } }));
      } catch (e) {}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishAssignment = async (assignmentId: string, publish: boolean) => {
    try {
      setLoading(true);
      const res = await axiosInstance.patch(`/assessments/${assignmentId}/publish`, { isPublished: publish });
      if (res.data.assignment) {
        // update savedAssignmentId state remains same; show success
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update assignment publish state');
    } finally {
      setLoading(false);
    }
  };

  const generateAssignment = async () => {
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axiosInstance.post('/study-buddy/generate-assignment', {
        materialId: selectedMaterial,
        assignmentType,
        difficulty: assignmentDifficulty
      });

      // If backend saved an assessment, capture its id
      const savedId = response.data.assessment?._id || null;
      setSavedAssessmentId(savedId);

      // Dispatch a lightweight event so other teacher pages can refresh
      if (savedId) {
        const courseId = response.data.assessment?.course || null;
        try {
          window.dispatchEvent(new CustomEvent('assessmentCreated', { detail: { id: savedId, courseId } }));
        } catch (e) {
          // ignore if dispatch fails in some environments
        }
      }
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate assignment');
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axiosInstance.post('/study-buddy/generate-flashcards', {
        materialId: selectedMaterial,
        count: flashcardCount
      });

      setSavedAssessmentId(null);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const generateResources = async () => {
    if (!selectedMaterial || !resourceTopic.trim()) {
      setError('Please select a material and enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axiosInstance.post('/study-buddy/suggest-resources', {
        materialId: selectedMaterial,
        topic: resourceTopic
      });

      setSavedAssessmentId(null);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suggest resources');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    switch (activeTab) {
      case 'quiz':
        generateQuiz();
        break;
      case 'assignment':
        generateAssignment();
        break;
      case 'flashcards':
        generateFlashcards();
        break;
      case 'resources':
        generateResources();
        break;
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">AI Content Generator</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Settings</h2>

            {/* Material Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Material
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Choose a material...</option>
                {materials.map((material) => (
                  <option key={material._id} value={material._id}>
                    {material.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Selection */}
            <div className="mb-4 space-y-2">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                  activeTab === 'quiz'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📝 Generate Quiz
              </button>
              <button
                onClick={() => setActiveTab('assignment')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                  activeTab === 'assignment'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📄 Generate Assignment
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                  activeTab === 'flashcards'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🎴 Generate Flashcards
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                  activeTab === 'resources'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📚 Suggest Resources
              </button>
            </div>

            {/* Dynamic Settings Based on Tab */}
            <div className="mb-4 space-y-3">
              {activeTab === 'quiz' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Difficulty
                    </label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === 'assignment' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Assignment Type
                    </label>
                    <select
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="essay">Essay</option>
                      <option value="research">Research</option>
                      <option value="analysis">Analysis</option>
                      <option value="report">Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Difficulty
                    </label>
                    <select
                      value={assignmentDifficulty}
                      onChange={(e) => setAssignmentDifficulty(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'flashcards' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of Flashcards
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={flashcardCount}
                    onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Topic of Interest
                  </label>
                  <input
                    type="text"
                    value={resourceTopic}
                    onChange={(e) => setResourceTopic(e.target.value)}
                    placeholder="e.g., loops, recursion"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedMaterial}
              className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate with AI'}
            </button>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Results</h2>

            {!result && !loading && (
              <div className="py-12 text-center text-slate-500">
                Select a material and click "Generate with AI" to get started
              </div>
            )}

            {loading && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500"></div>
                <p className="text-slate-600">Generating content with AI...</p>
              </div>
            )}

            {result && activeTab === 'quiz' && result.quiz && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Quiz generated successfully! {result.quiz.questionCount} questions created.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {result.quiz.questions.map((q: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-4">
                      <p className="mb-2 font-medium text-slate-900">
                        {idx + 1}. {q.question}
                      </p>
                      
                      {q.type === 'mcq' && q.options && (
                        <div className="ml-4 space-y-1">
                          {q.options.map((opt: string, optIdx: number) => (
                            <p
                              key={optIdx}
                              className={`text-sm ${
                                opt === q.correctAnswer
                                  ? 'font-medium text-green-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {opt}
                              {opt === q.correctAnswer && ' ✓'}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {q.type === 'true_false' && (
                        <p className="ml-4 text-sm font-medium text-green-600">
                          Answer: {q.correctAnswer ? 'True' : 'False'}
                        </p>
                      )}
                      
                      {q.explanation && (
                        <p className="ml-4 mt-2 text-xs text-slate-500">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => togglePublishQuiz(result.quiz._id, !result.quiz.isActive)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    {result.quiz.isActive ? 'Unpublish from students' : 'Publish to students'}
                  </button>
                  <div className="text-sm text-slate-600">Quiz ID: {result.quiz._id}</div>
                </div>
              </div>
            )}

            {result && activeTab === 'assignment' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{result.title}</h3>
                
                <div>
                  <h4 className="mb-2 font-semibold text-slate-800">Instructions:</h4>
                  <p className="text-sm text-slate-700">{result.instructions}</p>
                </div>
                
                {result.questions && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-800">Questions/Tasks:</h4>
                    <ol className="list-decimal space-y-2 pl-5">
                      {result.questions.map((q: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700">{q}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {result.evaluationCriteria && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-800">Evaluation Criteria:</h4>
                    <ul className="list-disc space-y-1 pl-5">
                      {result.evaluationCriteria.map((c: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-4 text-sm text-slate-600">
                  {result.suggestedWordCount && (
                    <span>📝 {result.suggestedWordCount}</span>
                  )}
                  {result.estimatedTime && (
                    <span>⏱️ {result.estimatedTime}</span>
                  )}
                </div>
                {savedAssessmentId && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => navigate('/teacher/assessment')}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Open Assignments
                    </button>
                    <div className="text-sm text-slate-600">Saved as assessment ID: {savedAssessmentId}</div>
                  </div>
                )}
                {!savedAssessmentId && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={saveGeneratedAssignment}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Save as Assessment (Draft)
                    </button>
                  </div>
                )}
                {savedAssessmentId && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => togglePublishAssignment(savedAssessmentId, true)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Publish to students
                    </button>
                  </div>
                )}
              </div>
            )}

            {result && activeTab === 'flashcards' && result.flashcards && (
              <div className="grid gap-4 sm:grid-cols-2">
                {result.flashcards.map((card: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 text-xs font-semibold text-blue-600">
                      CARD {idx + 1}
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-500">Front:</p>
                      <p className="text-sm font-semibold text-slate-900">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Back:</p>
                      <p className="text-sm text-slate-700">{card.back}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && activeTab === 'resources' && result.resources && (
              <div className="space-y-4">
                {result.resources.map((resource: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-lg">
                        {resource.type === 'video' && '🎥'}
                        {resource.type === 'article' && '📄'}
                        {resource.type === 'book' && '📚'}
                        {resource.type === 'practice' && '✏️'}
                      </span>
                      <h4 className="font-semibold text-slate-900">{resource.title}</h4>
                    </div>
                    <p className="mb-2 text-sm text-slate-700">{resource.description}</p>
                    <p className="text-xs text-slate-500">
                      Suggested: {resource.suggestedSource}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;
