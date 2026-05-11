import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  BarChart2, 
  Settings, 
  LogOut,
  UploadCloud,
  PlusCircle,
  Users,
  Server
} from 'lucide-react';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
}

// Logo Variants
const LOGO_BLUE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjMWQ5N2Q0Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSI2MCIgZmlsbD0id2hpdGUiPlBSRVBFQVNFPC90ZXh0Pgo8L3N2Zz4=";
const LOGO_WHITE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iNjAiIGZpbGw9IiMxZDk3ZDQiPlBSRVBFQVNFPC90ZXh0Pgo8L3N2Zz4=";

const Layout: React.FC<LayoutProps> = ({ children, role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.includes(path);

  // Theme Logic based on Role
  const getTheme = () => {
    switch (role) {
      case 'student':
        return {
          sidebarBg: 'bg-brand-primary',
          sidebarText: 'text-white',
          sidebarBorder: 'border-white/10',
          logo: LOGO_WHITE,
          activeItem: 'bg-brand-accent text-slate-900 shadow-md',
          inactiveItem: 'text-white/80 hover:bg-white/10 hover:text-white',
          userAvatarBg: 'bg-white text-brand-primary',
          logoutClass: 'text-blue-50 hover:bg-white/10 hover:text-white',
          roleLabel: 'text-blue-50'
        };
      case 'teacher':
        return {
          sidebarBg: 'bg-white',
          sidebarText: 'text-slate-600',
          sidebarBorder: 'border-slate-200 border-r',
          logo: LOGO_BLUE,
          activeItem: 'bg-brand-secondary/10 text-brand-primary font-bold shadow-sm',
          inactiveItem: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
          userAvatarBg: 'bg-blue-50 text-brand-primary',
          logoutClass: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
          roleLabel: 'text-slate-400'
        };
      case 'admin':
        return {
          sidebarBg: 'bg-slate-900',
          sidebarText: 'text-slate-400',
          sidebarBorder: 'border-slate-800 border-r',
          logo: LOGO_WHITE,
          activeItem: 'bg-slate-800 text-brand-secondary border-l-4 border-brand-secondary',
          inactiveItem: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
          userAvatarBg: 'bg-slate-800 text-brand-secondary',
          logoutClass: 'text-slate-400 hover:bg-slate-800 hover:text-white',
          roleLabel: 'text-slate-500'
        };
      default:
        return {
          sidebarBg: 'bg-brand-primary',
          sidebarText: 'text-white',
          sidebarBorder: 'border-white/10',
          logo: LOGO_WHITE,
          activeItem: 'bg-brand-accent text-slate-900 shadow-md',
          inactiveItem: 'text-white/80 hover:bg-white/10 hover:text-white',
          userAvatarBg: 'bg-white text-brand-primary',
          logoutClass: 'text-blue-50 hover:bg-white/10 hover:text-white',
          roleLabel: 'text-blue-50'
        };
    }
  };

  const theme = getTheme();

  const navItemClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all mb-1
    ${isActive(path) ? theme.activeItem : theme.inactiveItem}
  `;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 shadow-xl flex flex-col transition-colors duration-300 ${theme.sidebarBg} ${theme.sidebarText}`}>
        <div className={`flex flex-col items-start px-6 py-8 border-b ${theme.sidebarBorder}`}>
          <img src={theme.logo} alt="PrepEase" className="h-10 w-auto mb-2" />
          <p className={`text-xs uppercase tracking-wider pl-1 font-medium ${theme.roleLabel}`}>{role} Portal</p>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {role === 'student' && (
            <>
              <Link to="/student/dashboard" className={navItemClass('/student/dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className={`text-xs font-bold uppercase px-4 mt-6 mb-2 ${theme.roleLabel}`}>Academics</div>
              <Link to="/student/assignments" className={navItemClass('/student/assignments')}>
                <FileText size={18} /> Assignments
              </Link>
              <Link to="/student/resources" className={navItemClass('/student/resources')}>
                <Lightbulb size={18} /> Resource Discovery
              </Link>
              <Link to="/student/analytics" className={navItemClass('/student/analytics')}>
                <BarChart2 size={18} /> Performance
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className={navItemClass('/teacher/dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className={`text-xs font-bold uppercase px-4 mt-6 mb-2 ${theme.roleLabel}`}>Management</div>
              <Link to="/teacher/materials" className={navItemClass('/teacher/materials')}>
                <UploadCloud size={18} /> Course Materials
              </Link>
              <Link to="/teacher/create-quiz" className={navItemClass('/teacher/create-quiz')}>
                <PlusCircle size={18} /> Create Assessment
              </Link>
              <Link to="/teacher/analytics" className={navItemClass('/teacher/analytics')}>
                <Users size={18} /> Class Analytics
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/admin/users" className={navItemClass('/admin/users')}>
                <Users size={18} /> User Management
              </Link>
              <Link to="/admin/health" className={navItemClass('/admin/health')}>
                <Server size={18} /> System Health
              </Link>
            </>
          )}
        </nav>

        <div className={`p-4 border-t ${theme.sidebarBorder}`}>
          <Link to={`/${role}/settings`} className={navItemClass(`/${role}/settings`)}>
            <Settings size={18} /> Settings
          </Link>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium w-full rounded-lg transition-colors ${theme.logoutClass}`}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {location.pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900">{role === 'student' ? 'Wasiq' : role === 'teacher' ? 'Mr. Suleman' : 'SysAdmin'}</span>
                <span className="text-xs text-slate-500 capitalize">{role}</span>
             </div>
             <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm ${theme.userAvatarBg}`}>
                {role === 'student' ? 'WA' : role === 'teacher' ? 'MS' : 'SA'}
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;