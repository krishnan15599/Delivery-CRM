import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  Users,
  Bike,
  IndianRupee,
  MessageSquare,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Download,
  ScanBarcode,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../context/PwaInstallContext';
import type { UserRole } from '../../types/auth';

export interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const { isInstalled, promptInstall } = usePwaInstall();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: 'Operations',
      items: [
        {
          name: 'Dashboard',
          icon: LayoutGrid,
          path: '/dashboard',
        },
        {
          name: 'Deliveries',
          icon: Package,
          path: '/deliveries',
        },
        {
          name: 'Hub Scan',
          icon: ScanBarcode,
          path: '/hub-scan',
        },
        {
          name: 'Merchants',
          icon: Store,
          path: '/merchants',
        },
        {
          name: 'Customers',
          icon: Users,
          path: '/customers',
        },
        {
          name: 'Agents',
          icon: Bike,
          path: '/agents',
        },
        {
          name: 'Collections',
          icon: IndianRupee,
          path: '/collections',
        },
        {
          name: 'Chat',
          icon: MessageSquare,
          path: '/chat',
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        {
          name: 'Reports',
          icon: BarChart2,
          path: '/reports',
        },
        {
          name: 'Businesses',
          icon: Building2,
          path: '/platform',
        },
        {
          name: 'Settings',
          icon: SettingsIcon,
          path: '/settings',
        },
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

  const roleAllowedMap: Record<string, UserRole[]> = {
    Businesses: ['SuperAdmin'],
    Dashboard: ['Admin', 'Manager'],
    Customers: ['Admin', 'Manager'],
    Deliveries: ['Admin', 'Manager', 'Agent'],
    'Hub Scan': ['Admin', 'Manager'],
    Merchants: ['Admin', 'Manager'],
    Agents: ['Admin', 'Manager'],
    Collections: ['Admin'],
    Chat: ['Admin', 'Manager', 'Agent'],
    Reports: ['Admin', 'Manager'],
    Settings: ['Admin', 'Manager'],
  };

  const collapsed = isCollapsed && !isMobile;
  const initials = user?.name?.slice(0, 2).toUpperCase() || 'KK';

  return (
    <aside
      className={`bg-[#0F2A2E] text-[#C9DAD8] h-full flex flex-col font-sans transition-[width] duration-200 ease-in-out relative select-none shrink-0 overflow-y-auto px-3 py-4 gap-1.5 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      aria-label="Main navigation"
    >
      {/* ── Brand Header ── */}
      <div
        className={`flex items-center pb-3 pt-1 ${
          collapsed ? 'justify-center px-0' : 'justify-between px-2'
        }`}
      >
        <div
          onClick={() => {
            navigate(role === 'Agent' ? '/deliveries' : role === 'SuperAdmin' ? '/platform' : '/dashboard');
            handleLinkClick();
          }}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
        >
          {/* Claude Golden Logo Box */}
          <span className="w-8 h-8 rounded-[9px] bg-[#F2B705] text-[#2A2000] flex items-center justify-center shrink-0 shadow-sm">
            <svg
              className="w-4.5 h-4.5 stroke-[1.8] fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />
            </svg>
          </span>

          {!collapsed && (
            <span className="font-['Bricolage_Grotesque',sans-serif] font-bold text-[18px] text-white tracking-tight leading-tight truncate">
              Delivery CRM
            </span>
          )}
        </div>

        {/* Collapse toggle button for desktop */}
        {!isMobile && !collapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md text-[#7E9C99] hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center justify-center"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Close button for mobile */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-[#7E9C99] hover:text-white hover:bg-white/10 transition-colors cursor-pointer md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="py-2 flex justify-center">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-md text-[#7E9C99] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Navigation Sections (Clean, Direct Links Only) ── */}
      <div className="flex-1 flex flex-col gap-3 mt-1">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => role && roleAllowedMap[item.name]?.includes(role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="flex flex-col gap-1">
              {!collapsed && (
                <div className="text-[12px] font-medium text-[#7E9C99] px-2.5 pt-2 pb-0.5 tracking-wide">
                  {group.title}
                </div>
              )}

              <nav className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrentActive = isItemActive(item.path);

                  return (
                    <div key={item.name} className="relative group/item">
                      <NavLink
                        to={item.path}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 rounded-lg text-[14px] transition-colors relative py-2.5 ${
                          collapsed ? 'justify-center px-0' : 'px-2.5'
                        } ${
                          isCurrentActive
                            ? 'bg-[#18424A] text-white font-semibold before:content-[""] before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-[#F2B705]'
                            : 'text-[#C9DAD8] hover:bg-white/6 hover:text-white'
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 ${
                            isCurrentActive ? 'text-white' : 'text-[#C9DAD8]'
                          }`}
                        />

                        {!collapsed && <span className="truncate">{item.name}</span>}

                        {!collapsed && item.badge !== undefined && (
                          <span className="ml-auto text-[12px] font-semibold bg-[#F2B705] text-[#2A2000] rounded-full px-2 py-0.2 min-w-[22px] text-center leading-tight">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Collapsed Tooltip */}
                      {collapsed && (
                        <div className="fixed left-20 hidden group-hover/item:flex items-center z-50 pointer-events-none">
                          <div className="bg-[#18424A] text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-xl border border-white/10 whitespace-nowrap">
                            {item.name}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* ── Install App Button (shown when not installed as PWA) ── */}
      {!isInstalled && (
        <div className="px-1 pt-2">
          <button
            type="button"
            onClick={() => {
              void promptInstall();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            title="Install Delivery CRM App"
            className={`w-full flex items-center gap-2.5 rounded-lg py-2 text-xs font-semibold bg-[#18424A] text-[#F2B705] hover:bg-[#1E525B] transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <Download className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Install App</span>}
          </button>
        </div>
      )}

      {/* ── User Profile Footer (.me) ── */}
      <div className="mt-auto pt-3 px-1 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-[34px] h-[34px] rounded-full bg-[#2B5B62] text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {initials}
          </span>
          {!collapsed && (
            <div className="truncate">
              <b className="text-white text-xs font-semibold block leading-tight truncate">
                {user?.name || 'Krishnan'}
              </b>
              <small className="block text-[#8FB0AD] text-[11px] leading-tight truncate mt-0.5">
                {role === 'SuperAdmin' ? 'Platform Owner' : role || 'Admin'}
              </small>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
              handleLinkClick();
            }}
            title="Sign out"
            className="p-1.5 rounded text-[#7E9C99] hover:text-[#F2B705] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
