import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Copy, MessageCircle, Layers, ArrowLeft, ArrowRight, Send, FileText, RotateCw, ExternalLink, AlertCircle, Loader, PlayCircle } from 'lucide-react';
import axiosInstance from '../../src/api/axiosInstance';
import { ChatMessage } from '../../types';

interface Course {
  _id: string;
  courseCode?: string;
  title?: string;
}

interface Material {
  _id: string;
  title?: string;
  fileName?: string;
  fileUrl?: string;
  status?: string;
}

const API_BASE_URL = 'http://localhost:5001';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestVideo, setSuggestVideo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [coursesRes, materialsRes] = await Promise.all([
          axiosInstance.get('/courses'),
          axiosInstance.get(`/materials/${id}`),
        ]);

        const allCourses: Course[] = coursesRes.data.courses || [];
        const matchedCourse = allCourses.find((c) => c._id === id) || null;
        setCourse(matchedCourse);
        
        const loadedMaterials = materialsRes.data.materials || [];
        setMaterials(loadedMaterials);
        
        // Auto-select first READY material for chat
        const readyMaterials = loadedMaterials.filter((m: Material) => m.status === 'Ready');
        if (readyMaterials.length > 0) {
          setSelectedMaterial(readyMaterials[0]);
          setMessages([{
            id: 'm1',
            sender: 'ai',
            text: `Hi! I'm your AI Study Buddy. I can answer questions about "${readyMaterials[0].title}". Ask me anything!`,
            timestamp: new Date()
          }]);
        } else if (loadedMaterials.length > 0) {
          setMessages([{
            id: 'm1',
            sender: 'ai',
            text: `Hi! I'm your AI Study Buddy. Materials are being processed. Please check back in a moment!`,
            timestamp: new Date()
          }]);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load course materials.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id]);

  const handleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMaterialChange = (materialId: string) => {
    const nextMaterial = materials.find((material) => material._id === materialId) || null;
    setSelectedMaterial(nextMaterial);

    if (!nextMaterial) {
      setMessages([]);
      return;
    }

    if (nextMaterial.status === 'Ready') {
      setMessages([{
        id: Date.now().toString(),
        sender: 'ai',
        text: `Hi! I'm your AI Study Buddy. I can answer questions about "${nextMaterial.title}". Ask me anything!`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        id: Date.now().toString(),
        sender: 'ai',
        text: `"${nextMaterial.title}" is still being processed. Please come back once it is marked Ready.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!selectedMaterial) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Please select a material/lecture to chat about.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Check if material is ready
    if (selectedMaterial.status !== 'Ready') {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'This material is still being processed. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Call AI Study Buddy service with correct format
      const response = await axiosInstance.post('/chat', {
        materialId: selectedMaterial._id,
        question: input,
      });
      
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: response.data.answer || 'Unable to generate response. Please try again.',
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: err?.response?.data?.message || 'Failed to get AI response. Please try again.',
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const tabs = [
    { id: 1, label: 'Summary', icon: <FileText size={18} /> },
    { id: 2, label: 'Flashcards', icon: <Copy size={18} /> },
    { id: 3, label: 'AI Study Buddy', icon: <MessageCircle size={18} /> },
    { id: 4, label: 'Resources', icon: <Layers size={18} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => navigate('/student/dashboard')} 
          className="p-2 hover:bg-stone-100 rounded-sm transition-colors cursor-pointer text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">{course?.title || 'Course'}</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">{course?.courseCode || 'Course'}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white rounded-sm border border-stone-200 shadow-sm px-4 pt-4 flex gap-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 font-sans text-sm transition-all border-b-2 rounded-sm
              ${activeTab === tab.id 
                ? 'border-stone-900 text-stone-900 font-bold' 
                : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'}
            `}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white min-h-[500px] rounded-sm shadow-sm border border-stone-200 p-8">
        
        {/* TAB 1: SUMMARY */}
        {activeTab === 1 && (
          <div className="max-w-3xl mx-auto animate-fadeIn">
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-4">
              Course Overview
            </h3>
            <div className="bg-stone-50 border border-stone-200 lg:prose-lg text-stone-600 leading-relaxed p-6 rounded-sm font-sans">
              {course?.title ? `Enrolled in ${course.title} (${course.courseCode})` : "Loading..."}
            </div>
            <div className="mt-8 flex justify-end">
                <button className="flex items-center gap-2 text-sm font-mono font-bold uppercase text-stone-900 hover:text-emerald-700 transition-colors">
                    Download PDF <ArrowLeft className="rotate-[-90deg]" size={14} strokeWidth={1.5} />
                </button>
            </div>

            <div className="mt-10">
              <h3 className="font-serif font-bold text-stone-900 mb-4">Course Materials</h3>
              {loading ? (
                <div className="flex items-center gap-2 font-sans text-stone-500">
                  <Loader size={16} className="animate-spin" strokeWidth={1.5} /> Loading...
                </div>
              ) : error ? (
                <div className="flex items-start gap-2 text-rose-700 bg-white border border-rose-700 rounded-sm p-4">
                  <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 flex-shrink-0" /> <span className="font-sans text-sm">{error}</span>
                </div>
              ) : materials.length === 0 ? (
                <div className="font-sans text-sm text-stone-500">No materials uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div key={material._id} className="flex items-center justify-between rounded-sm border border-stone-200 bg-stone-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-sans font-bold text-stone-900">
                          {material.title || material.fileName || 'Untitled'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                            material.status === 'Ready' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                            material.status === 'Processing' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                            material.status === 'Failed' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                            'bg-stone-100 text-stone-600 border border-stone-300'
                          }`}>
                            {material.status || 'Pending'}
                          </span>
                          {material.status === 'Ready' && (
                            <span className="text-xs font-sans text-emerald-600">● Ready for AI Chat</span>
                          )}
                        </div>
                      </div>
                          <div className="flex items-center gap-3">
                            {material.status === 'Ready' && (
                              <>
                                <button
                                  onClick={() => navigate(`/chat/${material._id}`)}
                                  className="inline-flex items-center gap-1 text-sm font-mono font-bold uppercase text-stone-900 hover:text-emerald-700 transition-colors"
                                >
                                  Ask Study Buddy <MessageCircle size={14} strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={() => navigate('/flashcards')}
                                  className="inline-flex items-center gap-1 text-sm font-mono font-bold uppercase text-stone-900 hover:text-emerald-700 transition-colors"
                                >
                                  Cards <Copy size={14} strokeWidth={1.5} />
                                </button>
                              </>
                            )}
                            {material.fileUrl ? (
                              <a
                                href={material.fileUrl.startsWith('http') ? material.fileUrl : `${API_BASE_URL}${material.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-mono font-bold uppercase text-stone-900 hover:text-emerald-700 transition-colors"
                              >
                                Open <ExternalLink size={14} strokeWidth={1.5} />
                              </a>
                            ) : (
                              <span className="text-xs font-sans text-stone-400">Not available</span>
                            )}
                          </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FLASHCARDS */}
        {activeTab === 2 && (
          <div className="text-center py-12 font-sans animate-fadeIn">
            <Copy size={48} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
            <p className="text-stone-900 font-bold text-lg mb-2">Generate Study Flashcards</p>
            <p className="text-stone-500 mb-6">Select materials and generate custom flashcards with 5, 10, or 15 cards.</p>
            <button
              onClick={() => navigate('/flashcards')}
              className="inline-flex items-center gap-2 bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
            >
              Open Flashcard Generator
            </button>
          </div>
        )}

        {/* TAB 3: AI CHAT */}
        {activeTab === 3 && (
          <div className="flex flex-col h-[600px] border border-stone-200 rounded-sm overflow-hidden animate-fadeIn">
            <div className="bg-stone-50 border-b border-stone-200 p-4 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-sm bg-stone-100 flex items-center justify-center border border-stone-200">
                    <MessageCircle size={16} strokeWidth={1.5} className="text-stone-900" />
                 </div>
                 <span className="font-sans font-bold text-stone-900">Study Buddy</span>
               </div>
               <label className="flex items-center gap-2 cursor-pointer select-none">
                 <input 
                   type="checkbox" 
                   checked={suggestVideo} 
                   onChange={(e) => setSuggestVideo(e.target.checked)}
                   className="w-4 h-4 rounded-sm border-stone-300 focus:ring-stone-900"
                 />
                 <span className="text-sm font-sans font-bold text-stone-700">Suggest Videos</span>
               </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {materials.length > 0 && (
                <div className="mb-2 rounded-sm border border-stone-200 bg-stone-50 p-3">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Select material to ask about
                  </label>
                  <select
                    value={selectedMaterial?._id || ''}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm font-sans focus:outline-none focus:border-stone-900"
                  >
                    <option value="">Choose a material</option>
                    {materials.map((material) => (
                      <option key={material._id} value={material._id}>
                        {material.title || material.fileName || 'Untitled'}{material.status ? ` • ${material.status}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[75%] p-4 rounded-sm text-sm leading-relaxed font-sans
                    ${msg.sender === 'user' 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-stone-50 border border-stone-200 text-stone-900'}
                  `}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] mt-2 block opacity-70 font-mono uppercase tracking-widest ${msg.sender === 'user' ? 'text-stone-200' : 'text-stone-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 border border-stone-200 rounded-sm px-4 py-3 text-sm font-sans focus:outline-none focus:border-stone-900 focus:ring-0 shadow-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-stone-900 text-white hover:bg-emerald-700 p-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all font-bold"
              >
                <Send size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: RESOURCES */}
        {activeTab === 4 && (
          <div className="text-center py-12 font-sans animate-fadeIn">
            <Layers size={48} className="mx-auto mb-4 text-stone-300" strokeWidth={1.5} />
            <p className="text-stone-500">Resources will be available as instructors add them.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default CourseDetail;