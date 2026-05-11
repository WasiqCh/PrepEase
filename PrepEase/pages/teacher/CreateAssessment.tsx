import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileText, 
  Layers, 
  Loader2 
} from 'lucide-react';

type CreateMode = 'selection' | 'manual' | 'ai';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOption: number;
}

const CreateAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreateMode>('selection');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Manual Mode State
  const [quizTitle, setQuizTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState({ text: '', options: ['', '', '', ''], correct: 0 });

  // AI Mode State
  const [aiConfig, setAiConfig] = useState({ course: 'Web Engineering (CS-311)', material: 'Lecture_5_Slides.pdf', topic: '', count: 10 });
  const [isGenerating, setIsGenerating] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddQuestion = () => {
    if (!currentQ.text || currentQ.options.some(opt => !opt)) return;
    setQuestions([...questions, { 
      id: Date.now(), 
      text: currentQ.text, 
      options: [...currentQ.options], 
      correctOption: currentQ.correct 
    }]);
    setCurrentQ({ text: '', options: ['', '', '', ''], correct: 0 });
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handlePublishManual = () => {
    if (!quizTitle || questions.length === 0) {
      alert("Please add a title and at least one question.");
      return;
    }
    showNotification("Quiz Published Successfully!");
    // Logic to save would go here
    setTimeout(() => navigate('/teacher/dashboard'), 2000);
  };

  const handleGenerateAi = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showNotification("Quiz Generated & Assigned to Class");
      setTimeout(() => navigate('/teacher/dashboard'), 2000);
    }, 2000);
  };

  // --- RENDERERS ---

  const renderSelection = () => (
    <div className="animate-fadeIn">
      <div className="border-b border-stone-200 pb-4 mb-8">
        <button 
          onClick={() => navigate('/teacher/dashboard')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">New Assessment</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Choose Method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Manual Card */}
        <button 
          onClick={() => setMode('manual')}
          className="group relative bg-white p-8 border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-900 transition-all rounded-sm text-left"
        >
          <div className="p-4 bg-stone-50 border border-stone-200 w-fit rounded-sm mb-6 group-hover:bg-stone-900 group-hover:border-stone-900 transition-colors">
            <Edit3 size={32} className="text-stone-900 group-hover:text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Manual</h2>
          <p className="text-stone-500 font-sans text-sm leading-relaxed">Create custom quiz by writing questions, options, and selecting correct answers.</p>
        </button>

        {/* AI Card */}
        <button 
          onClick={() => setMode('ai')}
          className="group relative bg-white p-8 border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-700 transition-all rounded-sm text-left"
        >
          <div className="absolute top-4 right-4 border border-emerald-700 text-emerald-700 text-xs font-mono font-bold px-2 py-1 flex items-center gap-1">
             <Sparkles size={10} strokeWidth={2} /> New
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 w-fit rounded-sm mb-6 group-hover:bg-emerald-700 group-hover:border-emerald-700 transition-colors">
            <Sparkles size={32} className="text-emerald-700 group-hover:text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">AI Generator</h2>
          <p className="text-stone-500 font-sans text-sm leading-relaxed">Upload lecture file or select topic, and let AI generate complete quiz instantly.</p>
        </button>
      </div>
    </div>
  );

  const renderManualMode = () => (
    <div className="animate-slideIn">
      <div className="border-b border-stone-200 pb-4 mb-6">
        <button 
          onClick={() => setMode('selection')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Manual Builder</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Draft Assessment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Editor */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 border-b border-stone-200 pb-2">Quiz Details</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Title</label>
                    <input 
                      type="text" 
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm" 
                      placeholder="React Components Quiz"
                    />
                 </div>
                 <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Due Date</label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm" 
                    />
                 </div>
              </div>
           </div>

           <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 border-b border-stone-200 pb-2">Question Editor</h3>
              
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Question</label>
                <textarea 
                  value={currentQ.text}
                  onChange={(e) => setCurrentQ({...currentQ, text: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm h-24 resize-none"
                  placeholder="Type your question..."
                />
              </div>

              <div className="space-y-3">
                 <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block">Options</label>
                 {currentQ.options.map((opt, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correctOpt" 
                        checked={currentQ.correct === idx}
                        onChange={() => setCurrentQ({...currentQ, correct: idx})}
                        className="w-4 h-4 text-stone-900 focus:ring-stone-900 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => {
                           const newOpts = [...currentQ.options];
                           newOpts[idx] = e.target.value;
                           setCurrentQ({...currentQ, options: newOpts});
                        }}
                        className="flex-1 px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                   </div>
                 ))}
              </div>

              <div className="pt-2 flex justify-end">
                 <button 
                   onClick={handleAddQuestion}
                   className="bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                 >
                   Add
                 </button>
              </div>
           </div>
        </div>

        {/* Right Col: Preview */}
        <div className="space-y-6">
           <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 h-full flex flex-col">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4 flex items-center justify-between">
                <span>Preview</span>
                <span className="border border-stone-900 text-stone-900 px-2 py-1 font-bold">{questions.length}</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 custom-scrollbar">
                 {questions.length === 0 ? (
                   <div className="text-center py-10 text-stone-400">
                      <FileText size={48} className="mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                      <p className="text-sm font-sans font-bold">No questions</p>
                   </div>
                 ) : (
                   questions.map((q, i) => (
                     <div key={q.id} className="p-4 bg-stone-50 border border-stone-200 rounded-sm relative group">
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="absolute top-2 right-2 text-stone-400 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                        <p className="text-sm font-sans font-bold text-stone-900 mb-2">{i + 1}. {q.text}</p>
                        <p className="text-xs font-sans text-emerald-700 font-bold">
                           Correct: {q.options[q.correctOption]}
                        </p>
                     </div>
                   ))
                 )}
              </div>

              <div className="pt-6 mt-4 border-t border-stone-200">
                 <button 
                   onClick={handlePublishManual}
                   className="w-full bg-stone-900 text-white hover:bg-emerald-700 rounded-sm py-3 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
                 >
                   Publish
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderAiMode = () => (
    <div className="animate-slideIn max-w-2xl mx-auto">
      <div className="border-b border-stone-200 pb-4 mb-8">
        <button 
          onClick={() => setMode('selection')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-3">
          <Sparkles className="text-emerald-700" size={28} strokeWidth={1.5} /> AI Generator
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Generate From Materials</p>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-8 space-y-6">
         <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Course</label>
              <select 
                value={aiConfig.course}
                onChange={(e) => setAiConfig({...aiConfig, course: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-stone-200 font-mono text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm"
              >
                 <option>Web Engineering (CS-311)</option>
                 <option>Data Structures (CS-202)</option>
                 <option>Artificial Intelligence (CS-401)</option>
              </select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Material</label>
              <div className="flex items-center gap-3 p-3 border border-stone-200 rounded-sm bg-stone-50">
                 <Layers size={20} className="text-stone-400" strokeWidth={1.5} />
                 <select 
                    value={aiConfig.material}
                    onChange={(e) => setAiConfig({...aiConfig, material: e.target.value})}
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-stone-900 font-sans text-sm p-0"
                 >
                    <option>Lecture_5_Slides.pdf</option>
                    <option>Week_2_Recap.pptx</option>
                    <option>Course_Syllabus.docx</option>
                 </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-1">Topic (Optional)</label>
              <input 
                type="text" 
                value={aiConfig.topic}
                onChange={(e) => setAiConfig({...aiConfig, topic: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-stone-200 font-sans text-sm text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none rounded-sm" 
                placeholder="State vs Props"
              />
            </div>

            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Questions</label>
                 <span className="border border-stone-900 text-stone-900 px-2 py-0.5 font-mono text-xs font-bold">{aiConfig.count}</span>
               </div>
               <input 
                 type="range" 
                 min="5" 
                 max="20" 
                 step="1"
                 value={aiConfig.count}
                 onChange={(e) => setAiConfig({...aiConfig, count: parseInt(e.target.value)})}
                 className="w-full h-2 bg-stone-200 rounded-sm appearance-none cursor-pointer accent-stone-900"
               />
               <div className="flex justify-between font-mono text-[10px] text-stone-400 font-bold mt-1">
                 <span>5</span>
                 <span>20</span>
               </div>
            </div>
         </div>

         <div className="pt-4 border-t border-stone-200">
            <button 
              onClick={handleGenerateAi}
              disabled={isGenerating}
              className="w-full bg-stone-900 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm py-4 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin inline mr-2" strokeWidth={2} /> Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] bg-[#FDFBF7] -m-8 p-8">
      {mode === 'selection' && renderSelection()}
      {mode === 'manual' && renderManualMode()}
      {mode === 'ai' && renderAiMode()}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white border border-emerald-700 text-emerald-700 px-6 py-4 rounded-sm shadow-sm flex items-center gap-4 animate-slideIn z-50">
            <div className="p-1 bg-emerald-700 rounded-full">
              <CheckCircle size={16} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans font-bold text-sm">{toastMessage}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateAssessment;