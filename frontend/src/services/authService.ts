import api from './api';
import type { User, UserRole, LoginResponse } from '../types/auth';
import { API_ENDPOINTS } from '../constants/endpoints';

const TOKEN_KEY = 'delivery_crm_auth_token';
const USER_KEY = 'delivery_crm_auth_user';

// ---------------------------------------------------------------------------
// DEMO_USERS is only used by switchRole(), which the UI exposes in dev builds
// only. login() never uses it — it always goes through the backend.
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
   * Stores the backend-issued token so every subsequent API call is authenticated.
   * There is NO local/demo fallback: if the backend does not accept the
   * credentials, login fails. A fake local session would only show mock data
   * and make a wrong password look like it worked.
   */
  async login(email: string, password?: string): Promise<LoginResponse> {
    const cleanEmail = email.trim().toLowerCase();

    let body: { success: boolean; data: { user: User; token: string; expiresIn: number } } | undefined;
    try {
      const response = await api.post<{
        success: boolean;
        data: { user: User; token: string; expiresIn: number };
      }>(API_ENDPOINTS.AUTH.LOGIN, { email: cleanEmail, password: password ?? '' });
      body = response.data;
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      if (status === 401) {
        throw new Error('Invalid email or password.');
      }
      if (status === 403) {
        throw new Error(err.response?.data?.message || 'Your account is not allowed to sign in.');
      }
      if (!err?.response || (status !== undefined && status >= 500)) {
        // Render free tier can take ~1 minute to wake up after being idle
        throw new Error('Server is not reachable right now (it may be waking up). Please try again in a minute.');
      }
      throw new Error(err.response?.data?.message || 'Login failed. Please try again.');
    }

    if (!body?.data?.user || !body?.data?.token) {
      throw new Error('Login failed: unexpected response from server.');
    }

    const { user, token, expiresIn } = body.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return {
      user,
      token,
      refreshToken: '',
      expiresIn,
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
