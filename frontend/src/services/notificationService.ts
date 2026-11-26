import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { ApiResponse } from '../types/common';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  delivery_id?: string | null;
  tracking_number?: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isPushSupported()) return 'unsupported';
    return Notification.permission;
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return registration;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  },

  async getVapidPublicKey(): Promise<string | null> {
    try {
      const res = await api.get<ApiResponse<{ publicKey: string | null }>>(
        API_ENDPOINTS.NOTIFICATIONS.VAPID_PUBLIC_KEY
      );
      return res.data.data?.publicKey || null;
    } catch {
      return null;
    }
  },

  async subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isPushSupported()) {
      return { ok: false, reason: 'Push notifications are not supported in this browser.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: 'Notification permission was denied.' };
    }

    const registration = (await this.registerServiceWorker()) || (await navigator.serviceWorker.ready);
    if (!registration) {
      return { ok: false, reason: 'Could not register service worker.' };
    }

    const publicKey = await this.getVapidPublicKey();
    if (!publicKey) {
      return { ok: false, reason: 'Push notifications are not configured on the server.' };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
    }

    await api.post(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, {
      subscription: subscription.toJSON(),
    });

    return { ok: true };
  },

  async syncExistingSubscription(): Promise<void> {
    if (!this.isPushSupported() || Notification.permission !== 'granted') return;
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const publicKey = await this.getVapidPublicKey();
        if (!publicKey) return;
        const appServerKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      await api.post(API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE, {
        subscription: subscription.toJSON(),
      });
    } catch {
      // Silent background sync
    }
  },

  async unsubscribeFromPush(): Promise<void> {
    if (!this.isPushSupported()) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.post(API_ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE, {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
    } catch (err) {
      console.warn('Failed to unsubscribe from push:', err);
    }
  },

  async getNotifications(limit = 20): Promise<NotificationListResponse> {
    try {
      const res = await api.get<ApiResponse<NotificationListResponse>>(
        API_ENDPOINTS.NOTIFICATIONS.BASE,
        { params: { limit } }
      );
      return res.data.data || { notifications: [], unreadCount: 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ(id));
    } catch {
      // Ignore if offline
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
    } catch {
      // Ignore if offline
    }
  },
};
