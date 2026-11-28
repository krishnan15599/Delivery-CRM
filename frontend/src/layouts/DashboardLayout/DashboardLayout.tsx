import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const isFullBleedPage = location.pathname.startsWith('/chat');

  return (
    <div className="flex h-screen bg-[#F2F5F4] font-sans text-[#10201F] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close mobile navigation"
          />
          <div className="relative z-10 w-[260px] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setIsMobileOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 bg-[#F2F5F4]">
        <Header onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} />
        <main className={isFullBleedPage ? 'flex-1 overflow-hidden min-h-0' : 'flex-1 overflow-y-auto'}>
          {isFullBleedPage ? (
            <div className="h-full w-full">
              <Outlet />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-7 pb-12">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
