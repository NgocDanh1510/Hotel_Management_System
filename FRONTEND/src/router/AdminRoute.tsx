import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

import LayoutAdmin from "@/components/layouts/LayoutAdmin";

const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole("admin")) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <LayoutAdmin>
      <Outlet />
    </LayoutAdmin>
  );
};

export default AdminRoute;
