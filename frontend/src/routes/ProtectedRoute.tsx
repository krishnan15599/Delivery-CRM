import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export type UserRole = 'Admin' | 'Manager' | 'Agent';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  // In a real app, read from AuthContext / Zustand
  // Default logged-in mock user is Admin
  const currentUser: { name: string; role: UserRole } | null = {
    name: 'Krishnan',
    role: 'Admin',
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Your role (<strong className="text-gray-800">{currentUser.role}</strong>) does not have
            permission to access this section.
          </p>
          <Link to="/dashboard">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
