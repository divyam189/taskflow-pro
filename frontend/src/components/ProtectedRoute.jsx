import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-slate-300">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowRoles && !allowRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
