import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  Home,
  Users,
  Package,
  User,
  IndianRupee,
  MessageSquare,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

export interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

interface NavSubItem {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  subItems?: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      name: 'Businesses',
      icon: Building2,
      path: '/platform',
      subItems: [{ name: 'All Businesses', path: '/platform' }],
    },
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      subItems: [{ name: 'Overview', path: '/dashboard' }],
    },
    {
      name: 'Customers',
      icon: Users,
      path: '/customers',
      subItems: [
        { name: 'All Customers', path: '/customers' },
        { name: 'Add Customer', path: '/customers/add' },
      ],
    },
    {
      name: 'Deliveries',
      icon: Package,
      path: '/deliveries',
      subItems: [
        { name: 'All Deliveries', path: '/deliveries' },
        ...(role !== 'Agent' ? [{ name: 'Create Delivery', path: '/deliveries/new' }] : []),
        { name: 'Unassigned', path: '/deliveries?status=Unassigned' },
        { name: 'In Transit', path: '/deliveries?status=In%20Transit' },
        { name: 'Delivered', path: '/deliveries?status=Delivered' },
        { name: 'Failed / Return', path: '/deliveries?status=Failed' },
      ],
    },
    {
      name: 'Agents',
      icon: User,
      path: '/agents',
      subItems: [
        { name: 'All Agents', path: '/agents' },
        { name: 'Add Agent', path: '/agents?action=add' },
        { name: 'Agent Performance', path: '/reports?tab=agent' },
      ],
    },
    {
      name: 'Collections',
      icon: IndianRupee,
      path: '/collections',
      subItems: [
        { name: 'Pending Collections', path: '/collections?tab=pending' },
        { name: 'Settled Cash', path: '/collections?tab=settled' },
      ],
    },
    {
      name: 'Chat',
      icon: MessageSquare,
      path: '/chat',
      badge: 1,
      subItems: [{ name: 'Inbox', path: '/chat' }],
    },
    {
      name: 'Reports',
      icon: BarChart2,
      path: '/reports',
      subItems: [
        { name: 'Delivery Report', path: '/reports?tab=delivery' },
        { name: 'Collection Report', path: '/reports?tab=collection' },
        { name: 'Agent Report', path: '/reports?tab=agent' },
        { name: 'Customer Report', path: '/reports?tab=customer' },
      ],
    },
    {
      name: 'Settings',
      icon: SettingsIcon,
      path: '/settings',
      subItems: [
        { name: 'Profile', path: '/settings?tab=profile' },
        { name: 'Company', path: '/settings?tab=company' },
        { name: 'Users & Roles', path: '/settings?tab=roles' },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const toggleSubmenu = (menuName: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const roleAllowedMap: Record<string, UserRole[]> = {
    Businesses: ['SuperAdmin'],
    Dashboard: ['Admin', 'Manager'],
    Customers: ['Admin', 'Manager'],
    Deliveries: ['Admin', 'Manager', 'Agent'],
    Agents: ['Admin', 'Manager'],
    Collections: ['Admin'],
    Chat: ['Admin', 'Manager', 'Agent'],
    Reports: ['Admin', 'Manager'],
    Settings: ['Admin', 'Manager'],
  };

  const visibleNavItems = navItems.filter((item) =>
    role && roleAllowedMap[item.name]?.includes(role)
  );

  return (
    <aside
      className={`bg-black text-neutral-400 border-r border-neutral-800 flex flex-col h-full font-sans transition-all duration-300 relative select-none shrink-0 ${
        isCollapsed && !isMobile ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between text-white border-b border-neutral-800">
        <div
          onClick={() => {
            navigate(role === 'Agent' ? '/deliveries' : '/dashboard');
            handleLinkClick();
          }}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden"
        >
          <div className="p-2 rounded-xl bg-[#84cc16] text-black shadow-md shadow-[#84cc16]/20 shrink-0">
            <Truck className="w-5 h-5 text-black" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight whitespace-nowrap leading-tight">
                Delivery CRM
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                {role} Console
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isCurrentActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const isSubOpen = expandedMenu === item.name;

          return (
            <div key={item.name} className="space-y-1">
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isCollapsed && !isMobile ? 'justify-center' : ''
                } ${
                  isCurrentActive
                    ? 'bg-[#84cc16] text-black shadow-sm font-bold'
                    : 'hover:bg-slate-800 hover:text-white text-[#aebbd0]'
                }`}
              >
                <NavLink
                  to={item.path}
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 flex-1 min-w-0"
                  title={isCollapsed && !isMobile ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium text-xs truncate">{item.name}</span>
                  )}
                  {item.badge !== undefined && (
                    <span className="ml-auto bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/40 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>

                {/* Submenu expand toggle */}
                {(!isCollapsed || isMobile) && item.subItems && item.subItems.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubmenu(item.name);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded transition-colors ml-1"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isSubOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Sub-items accordion */}
              {(!isCollapsed || isMobile) && isSubOpen && item.subItems && (
                <div className="pl-9 pr-2 py-1 space-y-1 animate-in fade-in duration-200">
                  {item.subItems.map((sub) => {
                    const isSubActive = location.pathname + location.search === sub.path;
                    return (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        onClick={handleLinkClick}
                        className={`block py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                          isSubActive
                            ? 'text-white bg-indigo-600/25 text-indigo-300 font-medium'
                            : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        {sub.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info & Sign Out Footer */}
      <div className="p-3 border-t border-neutral-800 space-y-2">
        {(!isCollapsed || isMobile) && user && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 bg-neutral-950 rounded-xl border border-neutral-800">
            <div
              className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${
                'bg-[#84cc16] text-black'
              }`}
            >
              {user.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white block truncate leading-tight">
                {user.name}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider block ${
                  role === 'Admin'
                    ? 'text-[#84cc16]'
                    : role === 'Manager'
                    ? 'text-purple-400'
                    : 'text-emerald-400'
                }`}
              >
                {role}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
            handleLinkClick();
          }}
          title={isCollapsed && !isMobile ? 'Logout' : undefined}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-neutral-900 hover:text-[#84cc16] text-neutral-400 transition-colors cursor-pointer ${
            isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isMobile) && <span className="font-medium text-xs">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;