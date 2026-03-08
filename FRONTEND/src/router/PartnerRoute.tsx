import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import LayoutPartner from "@/components/layouts/LayoutPartner";

const PartnerRoute = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole("partner")) {
    return <Navigate to="/forbidden" replace />;
  }

  return <LayoutPartner />;
};

export default PartnerRoute;
