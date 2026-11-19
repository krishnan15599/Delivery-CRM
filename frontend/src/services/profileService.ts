import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { User, UserRole } from '../types/auth';
import type { ApiResponse } from '../types/common';

export interface ProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatarUrl?: string;
  temporaryPassword?: string;
  vehicleType?: string;
  hubLocation?: string;
}

const PROFILES_STORAGE_KEY = 'delivery_crm_profiles';

const getInitialProfiles = (): User[] => [
  {
    id: 'USR-001',
    name: 'Krishnan K.',
    email: 'admin@deliverycrm.in',
    role: 'Admin',
    phone: '+91 98450 12345',
  },
  {
    id: 'USR-002',
    name: 'Sarah Jenkins',
    email: 'manager@deliverycrm.in',
    role: 'Manager',
    phone: '+91 98765 43210',
  },
  {
    id: 'USR-003',
    name: 'Rahul Sharma',
    email: 'agent@deliverycrm.in',
    role: 'Agent',
    phone: '+91 98111 22334',
  },
];

const getStoredProfiles = (): User[] => {
  const data = localStorage.getItem(PROFILES_STORAGE_KEY);
  if (!data) {
    const initial = getInitialProfiles();
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch {
    return getInitialProfiles();
  }
};

const saveStoredProfiles = (profiles: User[]) => {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
};

export const profileService = {
  /**
   * Fetch currently authenticated user's profile
   */
  async getCurrentProfile(): Promise<User | null> {
    try {
      const response = await api.get<ApiResponse<User>>(API_ENDPOINTS.PROFILES.CURRENT);
      return response.data.data;
    } catch (error) {
      console.warn('Failed to fetch current profile from API:', error);
      return null;
    }
  },

  /**
   * Fetch all user profiles (Admin / Manager)
   */
  async getProfiles(): Promise<User[]> {
    try {
      const response = await api.get<ApiResponse<User[]>>(API_ENDPOINTS.PROFILES.BASE);
      const list = response.data.data || [];
      if (list.length > 0) {
        saveStoredProfiles(list);
      }
      return list;
    } catch (error) {
      console.warn('Failed to fetch profiles from API, using cached/local profiles:', error);
      return getStoredProfiles();
    }
  },

  /**
   * Fetch user profile by ID
   */
  async getProfileById(id: string): Promise<User | null> {
    try {
      const response = await api.get<ApiResponse<User>>(API_ENDPOINTS.PROFILES.BY_ID(id));
      return response.data.data;
    } catch (error) {
      console.warn(`Failed to fetch profile ${id}:`, error);
      return getStoredProfiles().find((p) => p.id === id) || null;
    }
  },

  /**
   * Create new profile (Admin can create Manager/Agent; Manager can create Agent)
   */
  async createProfile(input: ProfileInput): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>(API_ENDPOINTS.PROFILES.BASE, input);
      const created = response.data.data;
      const list = getStoredProfiles();
      saveStoredProfiles([...list, created]);
      return created;
    } catch (error: any) {
      // Fall back to mock/local storage ONLY on true network errors (no response from server)
      if (error?.response) {
        throw error;
      }
      console.warn('Backend API unavailable, saving profile locally:', error);
      const newProfile: User = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: input.name || 'New Staff Member',
        email: (input.email || '').toLowerCase().trim(),
        role: input.role || 'Agent',
        phone: input.phone || '',
      };
      const list = getStoredProfiles();
      saveStoredProfiles([...list, newProfile]);
      return newProfile;
    }
  },

  /**
   * Update profile (Admin or current user profile update)
   */
  async updateProfile(id: string, input: ProfileInput): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>(API_ENDPOINTS.PROFILES.BY_ID(id), input);
      return response.data.data;
    } catch (error) {
      console.warn('Backend API unavailable, updating profile locally:', error);
      const list = getStoredProfiles();
      const idx = list.findIndex((p) => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...input };
        saveStoredProfiles(list);
        return list[idx];
      }
      throw error;
    }
  },

  /**
   * Delete profile (Admin only)
   */
  async deleteProfile(id: string): Promise<boolean> {
    try {
      await api.delete(API_ENDPOINTS.PROFILES.BY_ID(id));
    } catch (error) {
      console.warn('Backend API unavailable, deleting profile locally:', error);
    }
    const list = getStoredProfiles().filter((p) => p.id !== id);
    saveStoredProfiles(list);
    return true;
  },
};

