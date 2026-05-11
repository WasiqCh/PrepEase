import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Check if token exists
  if (!token) {
    console.log("[ProtectedRoute] No token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles?.length && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user?.role)) {
        console.log("[ProtectedRoute] Role not allowed:", user?.role);
        return <Navigate to="/dashboard" replace />;
      }
    } catch (err) {
      console.error("[ProtectedRoute] Error parsing user:", err);
      return <Navigate to="/login" replace />;
    }
  }

  console.log("[ProtectedRoute] Access granted");
  return <Outlet />;
};

export default ProtectedRoute;
