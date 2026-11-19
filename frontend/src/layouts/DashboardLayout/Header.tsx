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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 font-sans relative z-30 shrink-0">
      <div className="flex items-center flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg mr-3 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracking #, customer or agent..."
            className="w-full bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-semibold text-slate-900">Notifications</h4>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>

              <div className="divide-y divide-slate-100 py-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50 p-1 rounded-lg transition-colors">
                      <div className={`p-1.5 rounded-lg ${n.color} shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-xs truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/deliveries');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
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
            className="flex items-center gap-2.5 cursor-pointer py-1.5 pl-1.5 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || (role === 'Agent' ? 'AG' : role === 'Manager' ? 'MG' : 'AD')}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[13px] font-semibold text-slate-900 leading-tight">
                {user?.name || (role === 'Agent' ? 'Rahul Sharma' : role === 'Manager' ? 'Sarah Jenkins' : 'Krishnan K.')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 leading-tight mt-0.5">
                <span>{role === 'SuperAdmin' ? 'Platform Owner' : role}</span>
                {user?.organization?.name && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="truncate max-w-[140px]" title={user.organization.name}>
                      {user.organization.name}
                    </span>
                  </>
                )}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 p-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900 block truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {user?.email || 'user@deliverycrm.in'}
                </span>
                {user?.organization?.name && (
                  <span className="text-[11px] text-slate-600 truncate block mt-0.5">
                    {user.organization.name}
                  </span>
                )}
              </div>

              <div className="py-1">
                {(role === 'Admin' || role === 'Manager') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
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