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
  const { role, logout, switchRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const navItems: NavItem[] = [
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
        { name: 'Create Delivery', path: '/deliveries/new' },
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
    Dashboard: ['Admin', 'Manager'],
    Customers: ['Admin', 'Manager'],
    Deliveries: ['Admin', 'Manager', 'Agent'],
    Agents: ['Admin', 'Manager'],
    Collections: ['Admin'],
    Chat: ['Admin', 'Manager', 'Agent'],
    Reports: ['Admin', 'Manager'],
    Settings: ['Admin'],
  };

  const visibleNavItems = navItems.filter((item) =>
    roleAllowedMap[item.name]?.includes(role)
  );

  return (
    <aside
      className={`bg-[#263141] text-[#aebbd0] flex flex-col h-full font-sans transition-all duration-300 relative select-none shrink-0 ${
        isCollapsed && !isMobile ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between text-white border-b border-[#374558]/50">
        <div
          onClick={() => {
            navigate('/dashboard');
            handleLinkClick();
          }}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden"
        >
          <div className="p-2 rounded-xl bg-[#2c5fbf]/20 text-[#5b89e8] shrink-0">
            <Truck className="w-5 h-5 text-[#5b89e8]" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight whitespace-nowrap leading-tight">
                Delivery CRM
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
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
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2e3b4e] transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0"
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
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2e3b4e] transition-colors cursor-pointer md:hidden"
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
                    ? 'bg-[#2c5fbf] text-white shadow-sm font-semibold'
                    : 'hover:bg-[#2e3b4e] hover:text-white text-[#aebbd0]'
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
                    <span className="ml-auto bg-[#5b89e8] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
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
                            ? 'text-white bg-[#2c5fbf]/40'
                            : 'text-gray-400 hover:text-white hover:bg-[#2e3b4e]/60'
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

      {/* Role Switcher & User Profile in Footer */}
      <div className="p-3 border-t border-[#374558]/50 space-y-2">
        {(!isCollapsed || isMobile) && (
          <div className="bg-[#1e2736] p-2.5 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Active Role
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  role === 'Admin'
                    ? 'bg-blue-500/20 text-blue-300'
                    : role === 'Manager'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {role}
              </span>
            </div>
            <div className="flex gap-1 pt-0.5">
              {(['Admin', 'Manager', 'Agent'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  className={`flex-1 text-[10px] py-1 rounded font-medium transition-colors ${
                    role === r
                      ? 'bg-[#2c5fbf] text-white shadow-xs'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
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
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-rose-500/20 hover:text-rose-300 text-[#aebbd0] transition-colors cursor-pointer ${
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