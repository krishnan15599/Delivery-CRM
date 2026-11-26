import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const notifications = [
    {
      id: 1,
      title: 'Package TRK-9001 Out for Delivery',
      time: '10 mins ago',
      icon: Clock,
      color: 'text-[#2563C9] bg-[#E0EAFB]',
    },
    {
      id: 2,
      title: 'Delivery TRK-9002 Completed',
      time: '1 hour ago',
      icon: CheckCircle2,
      color: 'text-[#1E8E5A] bg-[#DDF3E7]',
    },
    {
      id: 3,
      title: 'Agent Ramesh Collected ₹1,450 COD',
      time: '2 hours ago',
      icon: CheckCircle2,
      color: 'text-[#A66A00] bg-[#FCEFCF]',
    },
  ];

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
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          aria-label="Notifications"
          className="relative border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 text-[#5E716F] hover:text-[#10201F] transition-colors cursor-pointer flex items-center justify-center"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C23B3B]" />
        </button>

        {isNotificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DDE5E3] rounded-xl shadow-xl shadow-slate-900/10 p-3.5 z-50 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DDE5E3]">
              <h4 className="font-semibold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
                Notifications
              </h4>
              <span className="text-[11px] font-semibold text-[#2A2000] bg-[#F2B705] px-2 py-0.5 rounded-full">
                3 New
              </span>
            </div>

            <div className="divide-y divide-[#DDE5E3]/60 py-1.5 max-h-72 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/deliveries');
                    }}
                    className="py-2 px-1 flex items-start gap-2.5 hover:bg-[#F2F5F4] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className={`p-1.5 rounded-lg ${n.color} shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#10201F] text-xs truncate">{n.title}</p>
                      <span className="text-[10px] text-[#5E716F]">{n.time}</span>
                    </div>
                  </div>
                );
              })}
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
