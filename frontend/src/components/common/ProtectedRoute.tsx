import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth, getDefaultRouteForRole } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';
import { Button } from './Button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          Your current account role is <span className="font-semibold text-slate-900">"{role}"</span>.
          This section requires {allowedRoles.join(' or ')} privileges.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(getDefaultRouteForRole(role))}
          >
            Go to Allowed Workspace
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
