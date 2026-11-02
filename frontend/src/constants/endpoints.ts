/**
 * Centralized API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
    DELIVERIES: (id: string) => `/customers/${id}/deliveries`,
  },
  AGENTS: {
    BASE: '/agents',
    BY_ID: (id: string) => `/agents/${id}`,
    STATUS: (id: string) => `/agents/${id}/status`,
  },
  DELIVERIES: {
    BASE: '/deliveries',
    BY_ID: (id: string) => `/deliveries/${id}`,
    TRACKING: (trackingNumber: string) => `/deliveries/tracking/${trackingNumber}`,
    STATUS: (id: string) => `/deliveries/${id}/status`,
    BULK_ASSIGN: '/deliveries/bulk-assign',
  },
  PROFILES: {
    BASE: '/profiles',
    CURRENT: '/profiles/current',
    ME: '/profiles/me',
    BY_ID: (id: string) => `/profiles/${id}`,
  },
} as const;

export default API_ENDPOINTS;

