import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';

/** The signed-in user's own business. */

export interface BusinessSettings {
  hubAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface Business {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Suspended';
  settings: BusinessSettings;
}

export interface Team {
  id: string;
  name: string;
  city: string | null;
  hub_address: string | null;
  is_default: boolean;
  status: 'Active' | 'Inactive';
}

export const organizationService = {
  async getBusiness(): Promise<Business> {
    const { data } = await api.get<{ data: Business }>(API_ENDPOINTS.ORGANIZATION.BASE);
    return data.data;
  },

  /** Admin only */
  async updateBusiness(input: { name?: string; settings?: BusinessSettings }): Promise<Business> {
    const { data } = await api.put<{ data: Business }>(API_ENDPOINTS.ORGANIZATION.BASE, input);
    return data.data;
  },

  /** Admin: all teams. Manager/Agent: their own. */
  async getTeams(): Promise<Team[]> {
    const { data } = await api.get<{ data: Team[] }>(API_ENDPOINTS.ORGANIZATION.TEAMS);
    return data.data || [];
  },
};
