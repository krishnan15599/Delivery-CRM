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
  ORGANIZATION: {
    BASE: '/organization',
    TEAMS: '/organization/teams',
  },
  PLATFORM: {
    ORGANIZATIONS: '/platform/organizations',
    ORGANIZATION_BY_ID: (id: string) => `/platform/organizations/${id}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    VAPID_PUBLIC_KEY: '/notifications/vapid-public-key',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
} as const;

export default API_ENDPOINTS;

