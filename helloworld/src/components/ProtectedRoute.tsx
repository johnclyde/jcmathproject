import type React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  adminOnly = false,
}) => {
  const { currentUser, userProfile, isAdminMode } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && (!userProfile?.isAdmin || !isAdminMode)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
