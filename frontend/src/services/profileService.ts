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
}

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
      return response.data.data || [];
    } catch (error) {
      console.warn('Failed to fetch profiles from API:', error);
      return [];
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
      return null;
    }
  },

  /**
   * Create new profile (Admin only)
   */
  async createProfile(input: ProfileInput): Promise<User> {
    const response = await api.post<ApiResponse<User>>(API_ENDPOINTS.PROFILES.BASE, input);
    return response.data.data;
  },

  /**
   * Update profile (Admin or current user profile update)
   */
  async updateProfile(id: string, input: ProfileInput): Promise<User> {
    const response = await api.put<ApiResponse<User>>(API_ENDPOINTS.PROFILES.BY_ID(id), input);
    return response.data.data;
  },

  /**
   * Delete profile (Admin only)
   */
  async deleteProfile(id: string): Promise<boolean> {
    await api.delete(API_ENDPOINTS.PROFILES.BY_ID(id));
    return true;
  },
};

