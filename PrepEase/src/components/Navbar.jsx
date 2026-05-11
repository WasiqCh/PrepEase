import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith("/student") || location.pathname.startsWith("/teacher") || location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/login");
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const getPortalPath = (role) => {
    if (role === "Teacher") return "/teacher/dashboard";
    if (role === "Admin") return "/admin/dashboard";
    return "/student/dashboard";
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  if (isPortalRoute || isAuthRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-[#FDFBF7]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-stone-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-stone-100 text-stone-900">
            ⚡
          </span>
          <span className="text-lg font-serif font-bold tracking-tight">PrepEase</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-sans">
          {!token ? (
            <NavLink
              to="/login"
              className="rounded-sm bg-stone-900 px-3 py-2 font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Login
            </NavLink>
          ) : (
            <>
              <NavLink
                to={getPortalPath(user?.role)}
                className="rounded-sm px-3 py-2 text-stone-600 transition hover:text-stone-900"
              >
                Portal
              </NavLink>
              {user?.role && (
                <span className="rounded-sm border border-stone-900 px-3 py-2 text-xs font-mono uppercase tracking-widest font-bold text-stone-900">
                  {user.role}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-sm border border-stone-200 px-3 py-2 text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
