import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { ApiResponse } from '../types/common';

export interface Merchant {
  id: string;
  organization_id: string;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone: string;
  pickup_address: string;
  city?: string | null;
  pincode?: string | null;
  default_team_id?: string | null;
  webhook_url?: string | null;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface MerchantApiKey {
  id: string;
  organization_id: string;
  merchant_id: string;
  name: string;
  key_prefix: string;
  status: 'Active' | 'Revoked';
  last_used_at?: string | null;
  created_at: string;
  apiKey?: string;
}

export interface CreateMerchantInput {
  name: string;
  contactName?: string;
  email?: string;
  phone: string;
  pickupAddress: string;
  city?: string;
  pincode?: string;
  defaultTeamId?: string;
  webhookUrl?: string;
  status?: 'Active' | 'Inactive';
}

export const merchantService = {
  async getMerchants(params?: { search?: string; status?: string }): Promise<Merchant[]> {
    const res = await api.get<ApiResponse<Merchant[]>>(API_ENDPOINTS.MERCHANTS.BASE, { params });
    return res.data.data || [];
  },

  async createMerchant(input: CreateMerchantInput): Promise<Merchant> {
    const res = await api.post<ApiResponse<Merchant>>(API_ENDPOINTS.MERCHANTS.BASE, input);
    return res.data.data;
  },

  async updateMerchant(id: string, input: Partial<CreateMerchantInput>): Promise<Merchant> {
    const res = await api.put<ApiResponse<Merchant>>(API_ENDPOINTS.MERCHANTS.BY_ID(id), input);
    return res.data.data;
  },

  async deleteMerchant(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.MERCHANTS.BY_ID(id));
  },

  async getApiKeys(merchantId: string): Promise<MerchantApiKey[]> {
    const res = await api.get<ApiResponse<MerchantApiKey[]>>(
      API_ENDPOINTS.MERCHANTS.API_KEYS(merchantId)
    );
    return res.data.data || [];
  },

  async createApiKey(merchantId: string, name: string): Promise<MerchantApiKey> {
    const res = await api.post<ApiResponse<MerchantApiKey>>(
      API_ENDPOINTS.MERCHANTS.API_KEYS(merchantId),
      { name }
    );
    return res.data.data;
  },

  async revokeApiKey(merchantId: string, keyId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.MERCHANTS.REVOKE_KEY(merchantId, keyId));
  },
};
