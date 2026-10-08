import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, ChevronDown, CheckCircle2, Clock, LogOut, Settings as SettingsIcon } from 'lucide-react';
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

  const notifications = [
    {
      id: 1,
      title: 'Package TRK-9001 Out for Delivery',
      time: '10 mins ago',
      icon: Clock,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      id: 2,
      title: 'Delivery TRK-9002 Completed',
      time: '1 hour ago',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: 3,
      title: 'Agent Ramesh Collected ₹1,450 COD',
      time: '2 hours ago',
      icon: CheckCircle2,
      color: 'text-amber-500 bg-amber-50',
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 font-sans relative z-30 shrink-0">
      <div className="flex items-center flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-3 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracking #, customer or agent..."
            className="w-full bg-[#f4f6f8] text-xs text-gray-800 rounded-lg pl-9 pr-4 py-2 border border-transparent focus:bg-white focus:border-[#2c5fbf] focus:outline-none focus:ring-2 focus:ring-[#2c5fbf]/15 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="font-bold text-gray-900">Notifications</h4>
                <span className="text-[10px] font-semibold text-[#2c5fbf] bg-blue-50 px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>

              <div className="divide-y divide-gray-100 py-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="py-2.5 flex items-start gap-2.5 hover:bg-gray-50 p-1 rounded-lg transition-colors">
                      <div className={`p-1.5 rounded-lg ${n.color} shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-xs truncate">{n.title}</p>
                        <span className="text-[10px] text-gray-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/deliveries');
                  }}
                  className="text-xs font-semibold text-[#2c5fbf] hover:underline"
                >
                  View all activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#5b89e8] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-none">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-gray-500 mt-1 capitalize font-medium">
                {role} Account
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-900 block truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[11px] text-gray-400 truncate block">
                  {user?.email || 'user@deliverycrm.in'}
                </span>
              </div>

              <div className="py-1">
                {role === 'Admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;