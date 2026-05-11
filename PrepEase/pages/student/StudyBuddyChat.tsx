import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Material {
  _id: string;
  title: string;
  fileName?: string;
  status?: string;
  courseId?: string;
  course: {
    _id: string;
    courseCode?: string;
    title: string;
  };
}

const StudyBuddyChat = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [materialInfo, setMaterialInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materialId || '');
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available materials on mount
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const token = localStorage.getItem('token');
        const [enrollmentsResponse, materialsResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/enrollments/my-courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/api/materials',
          { headers: { Authorization: `Bearer ${token}` } }
        )
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
          courseId: material.course?._id || material.course,
          course: material.course || {
            _id: '',
            courseCode: '',
            title: 'Unknown Course',
          },
        }));

        const readyMaterials = allMaterials.filter((material) => material.status === 'Ready');
        setAvailableMaterials(allMaterials);

        if (!selectedMaterialId && readyMaterials.length > 0) {
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

  // Load specific material info when selected
  useEffect(() => {
    const loadMaterial = async () => {
      if (!selectedMaterialId) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5001/api/materials/material/${selectedMaterialId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMaterialInfo(response.data.material);
        
        // Add welcome message
        setMessages([{
          role: 'ai',
          content: `Hi! I'm your AI Study Buddy. I can answer questions about "${response.data.material.title}". Ask me anything!`,
          timestamp: new Date()
        }]);
      } catch (err: any) {
        console.error('Failed to load material:', err);
        setError('Failed to load material information');
      }
    };
    
    loadMaterial();
  }, [selectedMaterialId]);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!question.trim() || loading || !selectedMaterialId) return;

    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/chat',
        { materialId: selectedMaterialId, question: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage: Message = {
        role: 'ai',
        content: response.data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to get response. Please try again.';
      setError(errorMsg);
      
      // Add error as AI message
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedMaterial = availableMaterials.find((material) => material._id === selectedMaterialId);
  const canChat = Boolean(selectedMaterialId && selectedMaterial?.status === 'Ready');

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-slate-900">AI Study Buddy</h1>
        <p className="text-sm text-slate-600 mt-1">
          Ask questions about your course materials
        </p>
      </div>

      {/* Material Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select teacher-uploaded material
        </label>
        <select
          value={selectedMaterialId}
          onChange={(e) => {
            setSelectedMaterialId(e.target.value);
            setMessages([]);
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
        {loadingMaterials && (
          <p className="mt-1 text-xs text-slate-500">Loading materials...</p>
        )}
        {!selectedMaterialId && availableMaterials.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Please select a ready material to start chatting
          </p>
        )}
        {selectedMaterial && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">
              {selectedMaterial.course.title} {selectedMaterial.course.courseCode ? `• ${selectedMaterial.course.courseCode}` : ''}
            </p>
            <p className="mt-1">
              Status: {selectedMaterial.status || 'Unknown'}{selectedMaterial.status !== 'Ready' ? ' — chat is available when processing finishes.' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Chat Container */}
      {selectedMaterialId && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <span className={`mt-1 block text-xs ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the material..."
              className="flex-1 resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
              disabled={loading || !canChat}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !question.trim() || !canChat}
              className="rounded-lg bg-blue-500 px-6 font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          
          <p className="mt-2 text-xs text-slate-500">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
      )}
      
      {!selectedMaterialId && !loadingMaterials && availableMaterials.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No materials available yet. Ask your teacher to upload course files.</p>
        </div>
      )}

      {selectedMaterialId && selectedMaterial?.status !== 'Ready' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This material is still processing. You can select it now, but questions will work once the teacher upload is marked Ready.
        </div>
      )}
    </div>
  );
};

export default StudyBuddyChat;
