import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  getDefaultRoute: () => string;
}

export const getDefaultRouteForRole = (role?: UserRole | null): string => {
  switch (role) {
    case 'SuperAdmin':
      return '/platform';
    case 'Agent':
      return '/deliveries';
    case 'Manager':
    case 'Admin':
      return '/dashboard';
    default:
      return '/login';
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Route access matrix by role
export const ROLE_ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  SuperAdmin: ['/platform'],
  Admin: [
    '/dashboard',
    '/customers',
    '/deliveries',
    '/agents',
    '/collections',
    '/chat',
    '/reports',
    '/settings',
    '/components',
  ],
  Manager: [
    '/dashboard',
    '/customers',
    '/deliveries',
    '/agents',
    '/chat',
    '/reports',
    '/settings',
  ],
  Agent: [
    '/deliveries',
    '/chat',
  ],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = authService.getStoredToken();
    if (!token) return null;
    return authService.getStoredUser();
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(user && authService.getStoredToken());
  const role: UserRole | null = user?.role || null;

  useEffect(() => {
    const token = authService.getStoredToken();
    if (token) {
      authService.getMe().then((me) => {
        if (me) setUser(me);
      });
    }
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);


  const hasRole = useCallback(
    (allowedRoles: UserRole[]): boolean => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  const canAccessRoute = useCallback(
    (pathname: string): boolean => {
      if (!user) return false;
      const allowed = ROLE_ROUTE_PERMISSIONS[user.role] || [];
      return allowed.some((route) => pathname.startsWith(route));
    },
    [user]
  );

  const getDefaultRoute = useCallback((): string => {
    return getDefaultRouteForRole(role);
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasRole,
        canAccessRoute,
        getDefaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
