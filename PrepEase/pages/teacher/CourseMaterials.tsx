import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

const CourseMaterials: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 bg-[#FDFBF7] -m-8 p-8 min-h-screen">
      <div className="border-b border-stone-200 pb-4">
        <button 
          onClick={() => navigate('/teacher/dashboard')}
          className="mb-3 text-stone-500 hover:text-stone-900 transition-colors text-sm font-sans flex items-center gap-2"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Materials</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Course Resources</p>
          </div>
          <select className="bg-white border border-stone-200 rounded-sm px-4 py-3 text-sm font-mono text-stone-900 focus:border-stone-900 focus:ring-0 focus:outline-none shadow-sm">
              <option>Web Engineering (CS-311)</option>
              <option>Data Structures (CS-202)</option>
          </select>
        </div>
      </div>

      <div className="border-2 border-stone-200 bg-white p-12 text-center hover:border-stone-900 transition-colors cursor-pointer group rounded-sm">
        <div className="inline-flex p-4 bg-stone-50 border border-stone-200 mb-4 group-hover:border-stone-900 transition-all">
            <UploadCloud className="text-stone-400" size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-sans font-bold text-stone-900">Drop files here</h3>
        <p className="text-stone-500 text-sm mt-1 font-sans">PDF, PPTX, DOCX • Max 20MB</p>
        <button className="mt-6 bg-stone-900 text-white hover:bg-emerald-700 rounded-sm px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors shadow-sm font-bold">
            Browse Files
        </button>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">File</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Uploaded</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Status</th>
                    <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
                {[
                    { name: 'Lecture_5_Slides.ppt', date: 'Oct 24, 2023' },
                    { name: 'React_Hooks_Cheatsheet.pdf', date: 'Oct 20, 2023' },
                    { name: 'Project_Guidelines.docx', date: 'Oct 15, 2023' },
                ].map((file, i) => (
                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-sans font-bold text-stone-900 flex items-center gap-3">
                            <FileText size={16} className="text-stone-400" strokeWidth={1.5} /> {file.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 font-mono">{file.date}</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-700 text-xs font-mono font-bold text-emerald-700">
                                <CheckCircle size={12} strokeWidth={2} /> Active
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-xs font-mono text-rose-700 hover:text-rose-900 font-bold uppercase tracking-widest">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseMaterials;