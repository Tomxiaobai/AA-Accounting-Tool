import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Receipt,
  User,
  LogOut,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: '账单', icon: Receipt },
];

const Layout = () => {
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Hide nav on detail pages
  const showBottomNav = !location.pathname.startsWith('/bills/') || location.pathname === '/bills';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Glass effect */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 safe-area-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">AA记账</span>
          </div>

          {/* User Avatar */}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all"
          >
            <User className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-md mx-auto px-4 py-4">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-around h-16">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-5 h-5 mb-1 transition-transform ${
                          isActive ? 'scale-110' : ''
                        }`}
                      />
                      <span className="text-xs font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Safe area spacer for bottom nav */}
      {showBottomNav && <div className="h-16" />}
    </div>
  );
};

export default Layout;
