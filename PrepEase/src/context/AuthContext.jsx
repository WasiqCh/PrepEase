// Deprecated: AuthContext was removed in favor of localStorage-based auth.
// Keep no-op exports to avoid accidental imports.

export const AuthProvider = ({ children }) => children;

export const useAuth = () => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  login: () => ({ ok: false }),
  logout: () => {},
});
