/** SuperAdmin = platform owner (manages businesses, sees no business data). */
export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Agent';

/** Roles that belong to a business. */
export type BusinessRole = Exclude<UserRole, 'SuperAdmin'>;

export interface Organization {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Suspended';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  token?: string;
  refreshToken?: string;
  status?: 'Active' | 'Inactive';
  /** null for the SuperAdmin */
  organizationId?: string | null;
  organization?: Organization | null;
  /** Manager: teams they manage. Agent: their team. Admin: [] (all teams). */
  teamIds?: string[];
  /** Agent only: their row in the agents table */
  agentId?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}
