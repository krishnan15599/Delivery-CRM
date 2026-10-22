import type { User, UserRole, LoginResponse } from '../types/auth';

const TOKEN_KEY = 'delivery_crm_auth_token';
const REFRESH_TOKEN_KEY = 'delivery_crm_refresh_token';
const USER_KEY = 'delivery_crm_auth_user';

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

  getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
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

  async login(email: string, _password?: string): Promise<LoginResponse> {
    // Artificial latency
    await new Promise((res) => setTimeout(res, 300));

    // Determine user by email or default to Admin
    let user: User = DEMO_USERS.Admin;
    const lowerEmail = email.toLowerCase().trim();

    if (lowerEmail.includes('manager')) {
      user = DEMO_USERS.Manager;
    } else if (lowerEmail.includes('agent')) {
      user = DEMO_USERS.Agent;
    } else if (lowerEmail.includes('admin')) {
      user = DEMO_USERS.Admin;
    }

    const token = `jwt_mock_${user.role.toLowerCase()}_${Date.now()}`;
    const refreshToken = `jwt_mock_refresh_${Date.now()}`;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return {
      user,
      token,
      refreshToken,
      expiresIn: 3600,
    };
  },

  async refreshToken(): Promise<string> {
    await new Promise((res) => setTimeout(res, 200));
    const current = this.getStoredRefreshToken();
    if (!current) throw new Error('No refresh token available');

    const currentUser = this.getStoredUser() || DEMO_USERS.Admin;
    const newToken = `jwt_mock_${currentUser.role.toLowerCase()}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  switchRole(role: UserRole): User {
    const user = DEMO_USERS[role];
    const token = `jwt_mock_${role.toLowerCase()}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },
};
