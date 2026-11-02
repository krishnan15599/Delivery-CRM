import api from './api';
import type { User, UserRole, LoginResponse } from '../types/auth';

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
   *
   * Throws on network error, 401 (bad credentials), or 503 (DB down).
   */
  async login(email: string, password?: string): Promise<LoginResponse> {
    const { data: body } = await api.post<{
      success: boolean;
      data: { user: User; token: string; expiresIn: number };
    }>('/auth/login', { email, password: password ?? '' });

    const { user, token, expiresIn } = body.data;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return {
      user,
      token,
      // Backend doesn't issue a separate refresh token yet
      refreshToken: '',
      expiresIn,
    };
  },

  /**
   * Re-uses the stored token (no server round-trip).
   * When Supabase Auth is adopted this becomes supabase.auth.refreshSession().
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
   * Updates the locally-stored user record and re-stores it so the UI reflects
   * the new role immediately (dev/demo only — the backend still owns the real role).
   *
   * TODO: once Supabase Auth is in place, issue a profile update instead.
   */
  switchRole(role: UserRole): User {
    const user: User = { ...(this.getStoredUser() ?? DEMO_USERS[role]), role };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // No token change — the backend will enforce the real role from the JWT.
    return user;
  },
};
