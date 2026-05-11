import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Material {
  _id: string;
  title: string;
  fileName?: string;
  status?: string;
  course: {
    _id: string;
    courseCode?: string;
    title: string;
  };
}

interface Flashcard {
  front: string;
  back: string;
}

interface GeneratedSet {
  flashcards: Flashcard[];
  materialId: string;
  materialTitle: string;
}

const FlashcardGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [flashcardCount, setFlashcardCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedSet | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardsEndRef = useRef<HTMLDivElement>(null);

  // Load enrolled courses and their materials on mount
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const token = localStorage.getItem('token');
        const [enrollmentsResponse, materialsResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/enrollments/my-courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/api/materials', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const enrolledCourseIds = new Set(
          (enrollmentsResponse.data.enrollments || []).map((enrollment: any) => enrollment.course?._id || enrollment.course)
        );

        const allMaterials: Material[] = (materialsResponse.data.materials || [])
          .filter((material: any) => {
            const materialCourseId = material.course?._id || material.course;
            return enrolledCourseIds.has(materialCourseId);
          })
          .map((material: any) => ({
            _id: material._id,
            title: material.title || material.fileName || 'Untitled Material',
            fileName: material.fileName,
            status: material.status,
            course: material.course || {
              _id: '',
              courseCode: '',
              title: 'Unknown Course',
            },
          }));

        const readyMaterials = allMaterials.filter((material) => material.status === 'Ready');
        setAvailableMaterials(allMaterials);

        if (readyMaterials.length > 0) {
          setSelectedMaterialId(readyMaterials[0]._id);
        }
      } catch (err) {
        console.error('Failed to load materials:', err);
        setError('Failed to load available materials');
      } finally {
        setLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, []);

  const selectedMaterial = availableMaterials.find((material) => material._id === selectedMaterialId);
  const canGenerate = Boolean(selectedMaterialId && selectedMaterial?.status === 'Ready');

  const handleGenerate = async () => {
    if (!selectedMaterialId || !canGenerate) return;

    setLoading(true);
    setError('');
    setGeneratedFlashcards(null);
    setCurrentCard(0);
    setIsFlipped(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/study-buddy/generate-flashcards',
        { materialId: selectedMaterialId, count: flashcardCount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedFlashcards({
        flashcards: response.data.flashcards || [],
        materialId: response.data.materialId,
        materialTitle: response.data.materialTitle,
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to generate flashcards. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (generatedFlashcards && currentCard < generatedFlashcards.flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const resetStudy = () => {
    setCurrentCard(0);
    setIsFlipped(false);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Generate Flashcards</h1>
        <p className="text-sm text-slate-600 mt-1">Select a material and create flashcards to study</p>
      </div>

      {!generatedFlashcards ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          {/* Material Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select material from enrolled courses
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              disabled={loadingMaterials}
            >
              <option value="">-- Select a course file --</option>
              {availableMaterials.map((material) => (
                <option key={material._id} value={material._id}>
                  {material.course.title} {material.course.courseCode ? `(${material.course.courseCode})` : ''} - {material.title}
                  {material.status === 'Ready' ? ' ✓' : material.status === 'Processing' ? ' ⏳' : ''}
                </option>
              ))}
            </select>
            {loadingMaterials && <p className="mt-1 text-xs text-slate-500">Loading materials...</p>}
            {selectedMaterial && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <p className="font-medium text-slate-800">
                  {selectedMaterial.course.title} {selectedMaterial.course.courseCode ? `• ${selectedMaterial.course.courseCode}` : ''}
                </p>
                <p className="mt-1">
                  Status: {selectedMaterial.status || 'Unknown'}{selectedMaterial.status !== 'Ready' ? ' — flashcards will be available when processing finishes.' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Flashcard Count Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Flashcards</label>
            <div className="flex gap-3">
              {[5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => setFlashcardCount(count)}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                    flashcardCount === count
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:border-blue-500'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className={`w-full py-3 rounded-lg font-medium text-white transition ${
              canGenerate && !loading
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin" /> Generating...
              </span>
            ) : (
              'Generate Flashcards'
            )}
          </button>

          {selectedMaterialId && selectedMaterial?.status !== 'Ready' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This material is still processing. Generation will be available once it's marked Ready.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Study Interface */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900">{generatedFlashcards.materialTitle}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Card {currentCard + 1} of {generatedFlashcards.flashcards.length}
                </p>
              </div>
              <button
                onClick={resetStudy}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            {/* Flashcard Display */}
            <div className="p-8">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="min-h-[300px] rounded-lg border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50 p-8 flex items-center justify-center cursor-pointer transition transform hover:shadow-md"
              >
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-500 mb-4">
                    {isFlipped ? 'Answer' : 'Question'} — Click to flip
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 leading-relaxed">
                    {isFlipped
                      ? generatedFlashcards.flashcards[currentCard].back
                      : generatedFlashcards.flashcards[currentCard].front}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentCard + 1) / generatedFlashcards.flashcards.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentCard + 1) / generatedFlashcards.flashcards.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                {isFlipped ? 'Hide Answer' : 'Show Answer'}
              </button>

              <button
                onClick={nextCard}
                disabled={currentCard === generatedFlashcards.flashcards.length - 1}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Completion Message */}
            {currentCard === generatedFlashcards.flashcards.length - 1 && isFlipped && (
              <div className="bg-green-50 border-t border-green-200 px-6 py-4 text-center">
                <p className="text-sm font-medium text-green-700">
                  Great! You've reached the end. Consider repeating to reinforce your learning.
                </p>
              </div>
            )}
          </div>

          {/* Generate New Button */}
          <button
            onClick={() => {
              setGeneratedFlashcards(null);
              setCurrentCard(0);
              setIsFlipped(false);
            }}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Generate Different Flashcards
          </button>
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;
