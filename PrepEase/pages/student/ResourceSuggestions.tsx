import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Search, ExternalLink, Video, BookOpen, Globe, Lightbulb } from 'lucide-react';
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

interface Resource {
  title: string;
  description: string;
  suggestedSource: string;
  url?: string;
  type?: 'video' | 'article' | 'website' | 'course';
}

interface SuggestionsResult {
  resources?: Resource[];
  suggestions?: Resource[];
  materialTitle?: string;
}

const ResourceSuggestions: React.FC = () => {
  const navigate = useNavigate();
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Resource[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

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
          setSelectedMaterial(readyMaterials[0]);
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

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId);
    const material = availableMaterials.find((m) => m._id === materialId);
    setSelectedMaterial(material || null);
    setSuggestions([]);
    setTopic('');
  };

  const handleSuggestResources = async () => {
    if (!selectedMaterialId || !topic.trim() || !selectedMaterial || selectedMaterial.status !== 'Ready') {
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/study-buddy/suggest-resources',
        {
          materialId: selectedMaterialId,
          topic: topic.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const resourceList = response.data.resources || response.data.suggestions || [];
      setSuggestions(resourceList);

      if (resourceList.length === 0) {
        setError('No resources found. Try a different topic.');
      }
    } catch (err: any) {
      console.error('Suggestion error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to get resource suggestions. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const canSuggest = Boolean(
    selectedMaterialId && topic.trim() && selectedMaterial?.status === 'Ready'
  );

  const getResourceIcon = (source: string) => {
    const lower = source.toLowerCase();
    if (lower.includes('youtube') || lower.includes('video')) {
      return <Video size={20} className="text-red-500" />;
    } else if (lower.includes('khan') || lower.includes('course')) {
      return <BookOpen size={20} className="text-blue-500" />;
    } else if (lower.includes('site') || lower.includes('web')) {
      return <Globe size={20} className="text-green-500" />;
    }
    return <Lightbulb size={20} className="text-yellow-500" />;
  };

  const generateYouTubeSearchUrl = (title: string, topic: string) => {
    const query = `${topic} ${selectedMaterial?.course.title || ''}`.trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-2 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Discover Learning Resources</h1>
        <p className="text-sm text-slate-600 mt-1">
          Find YouTube videos, articles, and other resources based on your course materials
        </p>
      </div>

      {/* Search Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        {/* Material Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select material from enrolled courses
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
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
        </div>

        {/* Material Info */}
        {selectedMaterial && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">
              {selectedMaterial.course.title} {selectedMaterial.course.courseCode ? `• ${selectedMaterial.course.courseCode}` : ''}
            </p>
            <p className="mt-1">
              Material: {selectedMaterial.title}
            </p>
            <p className="mt-1">
              Status: {selectedMaterial.status || 'Unknown'}
              {selectedMaterial.status !== 'Ready' ? ' — suggestions will be available when processing finishes.' : ''}
            </p>
          </div>
        )}

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What topic would you like to learn more about?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSuggestResources()}
              placeholder="e.g., JavaScript loops, Data structures, etc."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              disabled={!selectedMaterial || selectedMaterial.status !== 'Ready' || loading}
            />
            <button
              onClick={handleSuggestResources}
              disabled={!canSuggest || loading}
              className={`px-6 py-2 rounded-lg font-medium text-white transition ${
                canSuggest && !loading
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-slate-400 cursor-not-allowed opacity-50'
              }`}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {selectedMaterial && selectedMaterial.status !== 'Ready' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This material is still processing. Suggestions will be available once it's marked Ready.
          </div>
        )}
      </div>

      {/* Results Section */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Suggested Resources ({suggestions.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {suggestions.map((resource, index) => {
              const isYouTube = resource.suggestedSource.toLowerCase().includes('youtube');
              const youtubeSearchUrl = generateYouTubeSearchUrl(resource.title, topic);

              return (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getResourceIcon(resource.suggestedSource)}
                        <span className="text-xs font-mono font-bold uppercase text-slate-500">
                          {resource.suggestedSource}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                        {resource.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {resource.description}
                  </p>

                  <div className="flex gap-3 pt-2">
                    {isYouTube ? (
                      <a
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                      >
                        <Video size={16} /> Watch on YouTube
                      </a>
                    ) : resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
                      >
                        <ExternalLink size={16} /> Visit Resource
                      </a>
                    ) : (
                      <button
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(resource.title)}`, '_blank')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-500 text-white text-sm font-medium hover:bg-slate-600 transition"
                      >
                        <Search size={16} /> Search Online
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && suggestions.length === 0 && selectedMaterialId && selectedMaterial?.status === 'Ready' && topic.trim() && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">Enter a topic and click search to discover relevant resources.</p>
        </div>
      )}

      {/* Onboarding State */}
      {!loading && suggestions.length === 0 && (!selectedMaterialId || !topic.trim()) && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium mb-2">Get Started</p>
          <p className="text-slate-500 text-sm">
            Select a material and enter a topic to discover YouTube videos, articles, and learning resources.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResourceSuggestions;
