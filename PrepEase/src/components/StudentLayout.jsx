import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  BarChart2, 
  Settings, 
  LogOut,
  BookOpen,
  MessageCircle,
  Copy,
  Search
} from 'lucide-react';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname.includes(path);

  const navItemClass = (path) => `
    flex items-center gap-3 px-4 py-3 text-sm font-sans rounded-sm transition-all mb-1
    ${isActive(path) ? 'bg-stone-900 text-white font-bold shadow-sm' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-semibold'}
  `;

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { email: "Student" };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white text-stone-600 shadow-sm flex flex-col border-r border-stone-200">
        <div className="flex flex-col items-start px-6 py-8 border-b border-stone-200">
          <div className="h-10 w-auto mb-2 text-stone-900 font-serif font-bold text-2xl tracking-tight">PREPEASE</div>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-stone-400">Student Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <Link to="/student/dashboard" className={navItemClass('/student/dashboard')}>
            <LayoutDashboard size={18} strokeWidth={1.5} /> Dashboard
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-widest px-4 mt-6 mb-2 text-stone-400 font-bold">AI Tools</div>
          <Link to="/chat" className={navItemClass('/chat')}>
            <MessageCircle size={18} strokeWidth={1.5} /> Study Buddy
          </Link>
          <Link to="/flashcards" className={navItemClass('/flashcards')}>
            <Copy size={18} strokeWidth={1.5} /> Flashcards
          </Link>
          <Link to="/resources-discover" className={navItemClass('/resources-discover')}>
            <Search size={18} strokeWidth={1.5} /> Resources
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-widest px-4 mt-6 mb-2 text-stone-400 font-bold">Academics</div>
          <Link to="/student/assignments" className={navItemClass('/student/assignments')}>
            <FileText size={18} strokeWidth={1.5} /> Assignments
          </Link>
          <Link to="/student/resources" className={navItemClass('/student/resources')}>
            <Lightbulb size={18} strokeWidth={1.5} /> Materials
          </Link>
          <Link to="/student/analytics" className={navItemClass('/student/analytics')}>
            <BarChart2 size={18} strokeWidth={1.5} /> Performance
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-widest px-4 mt-6 mb-2 text-stone-400 font-bold">Account</div>
          <Link to="/student/settings" className={navItemClass('/student/settings')}>
            <Settings size={18} strokeWidth={1.5} /> Settings
          </Link>
        </nav>

        <div className="border-t border-stone-200">
          <div className="px-6 py-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm flex items-center justify-center font-serif font-bold border border-stone-200 shadow-sm bg-stone-50 text-stone-900 flex-shrink-0">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-sans font-bold text-stone-900 truncate">{user.email}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">Student</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-sans font-semibold w-full rounded-sm transition-colors text-stone-500 hover:bg-stone-50 hover:text-stone-900"
            >
              <LogOut size={18} strokeWidth={1.5} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
