import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname.includes(path);

  const navItemClass = (path) => `
    flex items-center gap-3 px-4 py-3 text-sm font-sans font-semibold rounded-sm transition-all mb-1
    ${isActive(path) ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}
  `;

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { email: "Admin" };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white text-stone-600 shadow-sm flex flex-col border-r border-stone-200">
        <div className="flex flex-col items-start px-6 py-8 border-b border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-stone-900" size={24} strokeWidth={1.5} />
            <div className="font-serif font-bold text-2xl text-stone-900 tracking-tight">PREPEASE</div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest pl-1 font-bold text-stone-400">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <Link to="/admin/dashboard" className={navItemClass('/admin/dashboard')}>
            <LayoutDashboard size={18} strokeWidth={1.5} /> Dashboard
          </Link>
          
          <div className="font-mono text-[10px] uppercase tracking-widest px-4 mt-6 mb-2 font-bold text-stone-400">Management</div>
          
          <Link to="/admin/students" className={navItemClass('/admin/students')}>
            <GraduationCap size={18} strokeWidth={1.5} /> Students
          </Link>
          
          <Link to="/admin/teachers" className={navItemClass('/admin/teachers')}>
            <BookOpen size={18} strokeWidth={1.5} /> Teachers
          </Link>
          
          <Link to="/admin/users" className={navItemClass('/admin/users')}>
            <Users size={18} strokeWidth={1.5} /> All Users
          </Link>

          <div className="font-mono text-[10px] uppercase tracking-widest px-4 mt-6 mb-2 font-bold text-stone-400">Academic</div>
          
          <Link to="/admin/courses" className={navItemClass('/admin/courses')}>
            <BookOpen size={18} strokeWidth={1.5} /> Courses
          </Link>
          
          <Link to="/admin/settings" className={navItemClass('/admin/settings')}>
            <Settings size={18} strokeWidth={1.5} /> Settings
          </Link>
        </nav>

        <div className="border-t border-stone-200">
          <div className="px-6 py-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm flex items-center justify-center font-serif font-bold border border-stone-200 shadow-sm bg-stone-50 text-stone-900">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-sans font-bold text-stone-900 truncate">{user.email}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 font-bold">Admin</span>
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
      <main className="flex-1 ml-64 min-h-screen bg-[#FDFBF7]">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
