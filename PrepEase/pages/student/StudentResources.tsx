import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../src/api/axiosInstance';
import { FileText, ExternalLink, Sparkles, ArrowLeft, AlertCircle, Loader, MessageCircle, Copy, Search } from 'lucide-react';

interface Material {
  _id: string;
  title?: string;
  fileName?: string;
  fileUrl?: string;
  course?: {
    _id: string;
    courseCode?: string;
    title?: string;
  };
  status?: string;
}

const API_BASE_URL = 'http://localhost:5001';

const StudentResources: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axiosInstance.get('/materials');
        setMaterials(data.materials || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load materials.');
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, []);

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
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Resource Discovery</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Course Materials</p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-3 flex items-center gap-2 tracking-tight">
            <Sparkles className="text-stone-900" size={24} strokeWidth={1.5} />
            Personalized Discovery
        </h2>
        <p className="text-stone-600 font-sans mb-4">
            Find YouTube videos, articles, and curated resources based on your course materials and topics.
        </p>
        <button
          onClick={() => navigate('/resources-discover')}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-sm border border-stone-900 bg-stone-900 text-white hover:bg-stone-700 transition-colors font-mono text-[10px] font-bold uppercase tracking-widest"
        >
          <Search size={16} /> Discover Resources
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 tracking-tight">Your Course Materials</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-stone-500 font-sans">
            <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading materials...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-4">
            <AlertCircle size={16} className="mt-0.5" strokeWidth={1.5} /> {error}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-stone-500 font-sans">No materials available yet. Enroll in a course or ask your teacher to upload files.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div key={material._id} className="bg-white p-6 rounded-sm border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-sm bg-stone-50 text-stone-900 border border-stone-200">
                    <FileText size={24} strokeWidth={1.5} />
                  </div>
                  {material.course?.courseCode && (
                    <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 border border-stone-200 px-2 py-1 rounded-sm">
                      {material.course.courseCode}
                    </span>
                  )}
                </div>
                <h3 className="font-sans font-bold text-stone-900 mb-2 leading-tight group-hover:text-stone-600 transition-colors">
                  {material.title || material.fileName || 'Untitled Material'}
                </h3>
                <p className="text-xs text-stone-500 mb-4 font-sans">
                  {material.course?.title || 'Course material'}
                </p>
                {material.fileUrl ? (
                  <div className="space-y-2">
                    <a
                      href={material.fileUrl.startsWith('http') ? material.fileUrl : `${API_BASE_URL}${material.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 border border-stone-200 rounded-sm text-sm font-sans font-bold text-stone-900 hover:bg-stone-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      Open Material <ExternalLink size={14} strokeWidth={1.5} />
                    </a>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/chat/${material._id}`)}
                        disabled={material.status !== 'Ready'}
                        className="flex-1 py-2 border border-stone-900 rounded-sm text-sm font-sans font-bold text-stone-900 hover:bg-stone-900 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-stone-900"
                      >
                        Ask Buddy <MessageCircle size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => navigate('/flashcards')}
                        disabled={material.status !== 'Ready'}
                        className="flex-1 py-2 border border-stone-200 rounded-sm text-sm font-sans font-bold text-stone-900 hover:bg-stone-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Cards <Copy size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 border border-stone-200 rounded-sm text-sm font-sans font-bold text-stone-400 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    Not Available
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResources;