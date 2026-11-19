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
  // undefined = user hasn't toggled anything yet, so the current route's section is open
  const [expandedMenu, setExpandedMenu] = useState<string | null | undefined>(undefined);

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

  const isItemActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const isMenuOpen = (item: NavItem) =>
    expandedMenu === undefined ? isItemActive(item.path) : expandedMenu === item.name;

  const toggleSubmenu = (item: NavItem) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenu(isMenuOpen(item) ? null : item.name);
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

  const collapsed = isCollapsed && !isMobile;
  const initials = user?.name?.slice(0, 2).toUpperCase() || 'US';

  return (
    <aside
      className={`bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full font-sans transition-[width] duration-300 relative select-none shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 px-4 flex items-center border-b border-slate-800 shrink-0 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div
          onClick={() => {
            navigate(role === 'Agent' ? '/deliveries' : role === 'SuperAdmin' ? '/platform' : '/dashboard');
            handleLinkClick();
          }}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-950/40 ring-1 ring-white/10 shrink-0">
            <Truck className="w-[18px] h-[18px]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-semibold text-white tracking-tight whitespace-nowrap leading-tight">
                Delivery CRM
              </span>
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {role === 'SuperAdmin' ? 'Platform' : role} workspace
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {!isMobile && !collapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="mx-auto mt-3 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </p>
        )}
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isCurrentActive = isItemActive(item.path);
          const hasSubmenu = !!item.subItems && item.subItems.length > 1;
          const isSubOpen = hasSubmenu && isMenuOpen(item);

          return (
            <div key={item.name}>
              <div
                className={`group flex items-center rounded-lg transition-colors ${
                  isCurrentActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (hasSubmenu) setExpandedMenu(item.name);
                    handleLinkClick();
                  }}
                  className={`flex items-center gap-3 flex-1 min-w-0 py-2 ${
                    collapsed ? 'justify-center px-0' : 'px-3'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="relative shrink-0">
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isCurrentActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    {collapsed && item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-slate-900" />
                    )}
                  </span>
                  {!collapsed && <span className="text-sm font-medium truncate">{item.name}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`ml-auto min-w-5 text-center text-[11px] font-semibold px-1.5 py-px rounded-full ${
                        isCurrentActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>

                {/* Submenu expand toggle */}
                {!collapsed && hasSubmenu && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubmenu(item);
                    }}
                    className={`p-1.5 mr-1.5 rounded-md transition-colors cursor-pointer ${
                      isCurrentActive
                        ? 'text-indigo-100 hover:bg-white/10'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                    aria-label={`${isSubOpen ? 'Collapse' : 'Expand'} ${item.name} menu`}
                    aria-expanded={isSubOpen}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {/* Sub-items accordion */}
              {!collapsed && isSubOpen && item.subItems && (
                <div className="ml-[21px] mt-1 mb-2 pl-3 border-l border-slate-700/70 space-y-0.5">
                  {item.subItems.map((sub) => {
                    const isSubActive = location.pathname + location.search === sub.path;
                    return (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        onClick={handleLinkClick}
                        className={`block py-1.5 px-3 rounded-md text-[13px] transition-colors ${
                          isSubActive
                            ? 'text-white bg-white/10 font-medium'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
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
      <div className="p-3 border-t border-slate-800 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-white block truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {role === 'SuperAdmin' ? 'Platform Owner' : role}
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
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
