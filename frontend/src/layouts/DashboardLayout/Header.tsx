import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  BellRing,
  Menu,
  Moon,
  Sun,
  Package,
  LogOut,
  Settings as SettingsIcon,
  Check,
  X,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { notificationService, type AppNotification } from '../../services/notificationService';
import { useToast } from '../../components/common';

export interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationService.getPermissionState()
  );
  const [subscribingPush, setSubscribingPush] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await notificationService.getNotifications(20);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    notificationService.syncExistingSubscription();

    const interval = window.setInterval(fetchNotifications, 30000);
    const onFocus = () => fetchNotifications();
    const onRefresh = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    window.addEventListener('notifications:refresh', onRefresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('notifications:refresh', onRefresh);
    };
  }, [isAuthenticated, fetchNotifications]);

  const handleEnablePush = async () => {
    try {
      setSubscribingPush(true);
      const result = await notificationService.subscribeToPush();
      setPushPermission(notificationService.getPermissionState());
      if (result.ok) {
        toast.success('Push notifications enabled for delivery assignments.');
      } else if (result.reason) {
        toast.error(result.reason);
      }
    } finally {
      setSubscribingPush(false);
    }
  };

  const handleMarkAsRead = (n: AppNotification) => {
    setIsNotificationsOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      setUnreadCount((c) => Math.max(0, c - 1));
      void notificationService.markAsRead(n.id);
    }
    navigate(n.delivery_id ? `/deliveries/${n.delivery_id}` : '/deliveries');
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    await notificationService.markAllAsRead();
  };

  const formatTimeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/deliveries?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
  };

  const initials = user?.name?.slice(0, 2).toUpperCase() || 'KK';

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-7 py-3.5 bg-white border-b border-[#DDE5E3] font-sans shrink-0">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="md:hidden border border-[#DDE5E3] rounded-lg p-2 text-[#5E716F] hover:text-[#10201F] hover:bg-[#F2F5F4] transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* Search Input matching Claude design */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[420px]">
        <label className="flex items-center gap-2 border border-[#DDE5E3] rounded-[10px] px-3 py-2 text-[#5E716F] bg-[#F2F5F4] focus-within:border-[#F2B705] focus-within:bg-white transition-all cursor-text">
          <Search className="w-4 h-4 text-[#5E716F] shrink-0" />
          <input
            id="q"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order ID, customer or agent"
            aria-label="Search"
            className="border-0 bg-transparent outline-none flex-1 font-sans text-xs sm:text-sm text-[#10201F] placeholder:text-[#5E716F] min-w-0"
          />
        </label>
      </form>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Quick Push Notification Prompt for Agents when permission is not yet granted */}
      {role === 'Agent' && pushPermission === 'default' && (
        <button
          type="button"
          onClick={handleEnablePush}
          disabled={subscribingPush}
          className="hidden sm:inline-flex items-center gap-1.5 bg-[#FCEFCF] hover:bg-[#F2B705] text-[#2A2000] border border-[#F2B705]/60 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>{subscribingPush ? 'Enabling...' : 'Enable Push Alerts'}</span>
        </button>
      )}

      {/* Install App Button (shown when not already installed as PWA) */}
      {!isInstalled && (
        <button
          type="button"
          onClick={promptInstall}
          aria-label="Install app"
          title="Install Delivery CRM app"
          className="border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 sm:px-2.5 sm:py-1.5 text-[#5E716F] hover:text-[#10201F] transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          <span className="hidden lg:inline">Install App</span>
        </button>
      )}

      {/* Theme Toggle Button */}
      <button
        type="button"
        id="theme"
        onClick={toggleTheme}
        aria-label="Switch theme"
        className="border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 text-[#5E716F] hover:text-[#10201F] transition-colors cursor-pointer flex items-center justify-center"
      >
        {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      {/* Notifications Popover */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          onClick={() => {
            const next = !isNotificationsOpen;
            setIsNotificationsOpen(next);
            if (next) fetchNotifications();
          }}
          aria-label="Notifications"
          className="relative border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 text-[#5E716F] hover:text-[#10201F] transition-colors cursor-pointer flex items-center justify-center"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#C23B3B] text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isNotificationsOpen && (
          <>
            {/* Mobile backdrop so tapping anywhere outside closes the popover */}
            <div
              className="fixed inset-0 bg-slate-900/20 z-40 sm:hidden"
              onClick={() => setIsNotificationsOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white border border-[#DDE5E3] rounded-xl shadow-xl shadow-slate-900/10 p-3.5 z-50 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#DDE5E3]">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold text-[#2A2000] bg-[#F2B705] px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563C9] hover:underline cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded-md text-[#5E716F] hover:text-[#10201F] hover:bg-[#F2F5F4] sm:hidden cursor-pointer"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* PWA Push Subscription Status Bar */}
            {pushPermission !== 'unsupported' && (
              <div className="flex items-center justify-between py-2 px-2 mt-2 rounded-lg bg-[#F2F5F4] border border-[#DDE5E3]">
                <span className="text-[11px] text-[#5E716F] font-medium">
                  {pushPermission === 'granted'
                    ? 'PWA Push Alerts Active'
                    : pushPermission === 'denied'
                    ? 'Push blocked in browser'
                    : 'Get notified on new assignments'}
                </span>
                {pushPermission === 'default' && (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={subscribingPush}
                    className="text-[11px] font-semibold bg-[#F2B705] text-[#2A2000] px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    {subscribingPush ? '...' : 'Enable'}
                  </button>
                )}
                {pushPermission === 'granted' && (
                  <span className="text-[10px] font-semibold text-[#1E8E5A] bg-[#DDF3E7] px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            )}

            <div className="divide-y divide-[#DDE5E3]/60 py-1.5 max-h-72 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`py-2 px-1.5 flex items-start gap-2.5 hover:bg-[#F2F5F4] rounded-lg transition-colors cursor-pointer ${
                      !n.read ? 'bg-[#F2F5F4]/60' : ''
                    }`}
                  >
                    <div className="p-1.5 rounded-lg text-[#2563C9] bg-[#E0EAFB] shrink-0 mt-0.5">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${!n.read ? 'font-semibold text-[#10201F]' : 'font-medium text-[#5E716F]'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#5E716F] truncate">{n.body}</p>
                      <span className="text-[10px] text-[#5E716F]/80">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#F2B705] shrink-0 mt-1.5" />}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[#5E716F] text-xs">
                  No notifications yet.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DDE5E3] text-center">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate('/deliveries');
                }}
                className="text-xs font-semibold text-[#2563C9] hover:underline cursor-pointer"
              >
                View all deliveries
              </button>
            </div>
            </div>
          </>
        )}
      </div>

      {/* User Profile dropdown trigger */}
      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F2F5F4] transition-colors cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full bg-[#2B5B62] text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {initials}
          </span>
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-[#DDE5E3] rounded-xl shadow-xl shadow-slate-900/10 p-1.5 z-50 text-xs">
            <div className="px-3 py-2 border-b border-[#DDE5E3]">
              <span className="font-semibold text-[#10201F] block truncate">
                {user?.name || 'Krishnan'}
              </span>
              <span className="text-[11px] text-[#5E716F] truncate block">
                {user?.email || 'admin@deliverycrm.in'}
              </span>
            </div>

            <div className="py-1">
              {(role === 'Admin' || role === 'Manager') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#10201F] hover:bg-[#F2F5F4] rounded-lg transition-colors text-left cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-[#5E716F]" />
                  <span>Settings</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[#C23B3B] hover:bg-[#FADFDF] rounded-lg transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
