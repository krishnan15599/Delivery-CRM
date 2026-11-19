import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, role, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Your role (<strong className="text-gray-800">{role}</strong>) does not have
            permission to access this section ({allowedRoles.join(' or ')} required).
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(role === 'Agent' ? '/deliveries' : '/dashboard')}
              className="w-full"
            >
              Go to Allowed Workspace
            </Button>
            {import.meta.env.DEV && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchRole('Admin')}
                className="w-full"
              >
                Switch to Admin (Demo)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
