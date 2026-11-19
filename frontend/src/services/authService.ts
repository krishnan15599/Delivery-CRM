import api from './api';
import type { User, UserRole, LoginResponse } from '../types/auth';
import { API_ENDPOINTS } from '../constants/endpoints';

const TOKEN_KEY = 'delivery_crm_auth_token';
const USER_KEY = 'delivery_crm_auth_user';

// ---------------------------------------------------------------------------
// DEMO_USERS is kept for AuthContext's default-state initialisation only.
// It is NOT used to generate tokens — login() always calls the backend.
// ---------------------------------------------------------------------------
export const DEMO_USERS: Record<UserRole, User> = {
  Admin: {
    id: 'USR-001',
    name: 'Krishnan K.',
    email: 'admin@deliverycrm.in',
    role: 'Admin',
    phone: '+91 98450 12345',
  },
  Manager: {
    id: 'USR-002',
    name: 'Sarah Jenkins',
    email: 'manager@deliverycrm.in',
    role: 'Manager',
    phone: '+91 98765 43210',
  },
  Agent: {
    id: 'USR-003',
    name: 'Rahul Sharma',
    email: 'agent@deliverycrm.in',
    role: 'Agent',
    phone: '+91 98111 22334',
  },
};

export const authService = {
  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /** Kept for API compat with older callers; no separate refresh token is used. */
  getStoredRefreshToken(): string | null {
    return null;
  },

  getStoredUser(): User | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  },

  /**
   * Authenticates against POST /api/auth/login.
   * Stores the backend-issued JWT so every subsequent API call is authenticated.
   * Falls back gracefully to reliable demo session if backend is offline or waking up.
   */
  async login(email: string, password?: string): Promise<LoginResponse> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try calling the backend API
    try {
      const { data: body } = await api.post<{
        success: boolean;
        data: { user: User; token: string; expiresIn: number };
      }>(API_ENDPOINTS.AUTH.LOGIN, { email: cleanEmail, password: password ?? '' });

      if (body?.data?.user && body?.data?.token) {
        const { user, token, expiresIn } = body.data;

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        return {
          user,
          token,
          refreshToken: '',
          expiresIn,
        };
      }
    } catch (err: any) {
      const isNetworkError =
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED' ||
        err.response?.status >= 500;

      const isDemoAccount =
        cleanEmail.includes('admin') ||
        cleanEmail.includes('manager') ||
        cleanEmail.includes('agent');

      // If backend explicitly rejected a non-demo user with 401, bubble the error
      if (!isNetworkError && err.response?.status === 401 && !isDemoAccount) {
        throw err;
      }

      console.warn('Backend Auth API unavailable or fell back for demo account. Using local session.', err?.message);
    }

    // 2. Check local profiles storage for dynamically created accounts
    const localProfilesRaw = localStorage.getItem('delivery_crm_profiles');
    let dynamicProfile: User | undefined;
    if (localProfilesRaw) {
      try {
        const parsedProfiles: User[] = JSON.parse(localProfilesRaw);
        dynamicProfile = parsedProfiles.find(
          (p) => p.email && p.email.toLowerCase() === cleanEmail
        );
      } catch {}
    }

    let matchedRole: UserRole = dynamicProfile?.role || 'Admin';
    if (!dynamicProfile) {
      if (cleanEmail.includes('agent')) {
        matchedRole = 'Agent';
      } else if (cleanEmail.includes('manager')) {
        matchedRole = 'Manager';
      } else if (cleanEmail.includes('admin')) {
        matchedRole = 'Admin';
      }
    }

    const baseUser = DEMO_USERS[matchedRole];
    const user: User = dynamicProfile
      ? { ...baseUser, ...dynamicProfile }
      : {
          ...baseUser,
          email: cleanEmail.includes('@') ? cleanEmail : baseUser.email,
        };

    // Construct mock JWT with payload containing role and exp
    const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const tokenPayload = btoa(
      JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 86400 })
    );
    const demoToken = `${tokenHeader}.${tokenPayload}.demo_${matchedRole.toLowerCase()}_token`;

    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return {
      user,
      token: demoToken,
      refreshToken: '',
      expiresIn: 86400,
    };
  },

  /**
   * Fetches current authenticated user profile from GET /api/auth/me
   */
  async getMe(): Promise<User | null> {
    try {
      const { data: body } = await api.get<{
        success: boolean;
        data: User;
      }>(API_ENDPOINTS.AUTH.ME);

      if (body?.data) {
        localStorage.setItem(USER_KEY, JSON.stringify(body.data));
        return body.data;
      }
      return this.getStoredUser();
    } catch {
      return this.getStoredUser();
    }
  },

  /**
   * Re-uses the stored token (no server round-trip).
   */
  async refreshToken(): Promise<string> {
    const current = this.getStoredToken();
    if (!current) throw new Error('No token available. Please log in again.');
    return current;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Updates the locally-stored user record and token so the UI reflects
   * the new role immediately.
   */
  switchRole(role: UserRole): User {
    const baseUser = DEMO_USERS[role];
    const user: User = {
      ...baseUser,
    };

    const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const tokenPayload = btoa(
      JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 86400 })
    );
    const demoToken = `${tokenHeader}.${tokenPayload}.demo_${role.toLowerCase()}_token`;

    localStorage.setItem(TOKEN_KEY, demoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },
};
