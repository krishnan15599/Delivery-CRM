import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';

/**
 * Platform owner (SuperAdmin) API: create, list and suspend businesses.
 * No mock fallback — these actions must always hit the real backend.
 */

export type OrganizationStatus = 'Active' | 'Suspended';

export interface PlatformOrganization {
  id: string;
  name: string;
  code: string;
  status: OrganizationStatus;
  created_at: string;
  counts: { users: number; agents: number; deliveries: number };
  primaryAdmin: { name: string; email: string } | null;
}

export interface CreateOrganizationInput {
  name: string;
  code: string;
  admin: {
    name: string;
    email: string;
    phone?: string;
    temporaryPassword: string;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const platformService = {
  async listOrganizations(): Promise<PlatformOrganization[]> {
    const { data } = await api.get<ApiEnvelope<PlatformOrganization[]>>(API_ENDPOINTS.PLATFORM.ORGANIZATIONS);
    return data.data || [];
  },

  async createOrganization(input: CreateOrganizationInput): Promise<{ message: string }> {
    const { data } = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.PLATFORM.ORGANIZATIONS, input);
    return { message: data.message || 'Business created' };
  },

  async setStatus(id: string, status: OrganizationStatus): Promise<void> {
    await api.patch(API_ENDPOINTS.PLATFORM.ORGANIZATION_BY_ID(id), { status });
  },
};

/** Pull the backend's error message out of an axios error. */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};
