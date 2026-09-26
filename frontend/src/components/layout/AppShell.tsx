import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  SearchCode,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/thunks/authThunks';
import { GlobalSearch } from './GlobalSearch';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Market Overview', to: '/market', icon: BarChart3 },
  { name: 'Investigations', to: '/investigations', icon: SearchCode },
  { name: 'My Profile', to: '/profile', icon: UserIcon },
];

/**
 * Application shell.
 * Layout: navigation occupies the 30% secondary surface (#1f202a); the content
 * area sits on the 60% primary surface (#282a36). All radii are 0.25rem and no
 * blur / gradient / glow effects are used.
 */
export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const isRouteActive = (to: string) => {
    if (to === '/market') return location.pathname.startsWith('/market');
    if (to === '/investigations') return location.pathname.startsWith('/investigations');
    if (to === '/profile') return location.pathname.startsWith('/profile');
    return location.pathname === to;
  };

  return (
    <div className="min-h-screen bg-primary text-foreground font-body flex">
      {/* Mobile navigation overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (30% navigation surface) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-secondary transition-[width,transform] duration-200 lg:sticky lg:inset-y-auto lg:top-0 lg:h-screen',
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center justify-between border-b border-border px-4',
            isSidebarCollapsed && 'lg:justify-center'
          )}
        >
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <NavLink
              to="/market"
              className="flex items-center gap-3 overflow-hidden rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.25rem] bg-accent text-white">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-bold text-white whitespace-nowrap">
                  Ignite<span className="text-accent">Stock</span>
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  IDX Intelligence
                </span>
              </div>
            </NavLink>
          )}

          <div className="flex items-center gap-1">
            {/* Desktop sidebar collapse toggle — top-right of the sidebar brand row */}
            <button
              type="button"
              className="hidden lg:inline-flex rounded-[0.25rem] p-2 text-secondary-foreground hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isSidebarCollapsed}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile close */}
            <button
              type="button"
              className="rounded-[0.25rem] p-2 text-secondary-foreground hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? item.name : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  `flex items-center ${!isSidebarCollapsed ? 'gap-3' : 'justify-center'} rounded-[0.25rem] px-3 py-3 text-sm font-bold transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`,
                  active
                    ? 'bg-accent text-white'
                    : 'text-secondary-foreground hover:bg-surface-hover hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border p-3 space-y-2">
          {(!isSidebarCollapsed || isMobileMenuOpen) ? (
            <div className="flex items-center gap-3 rounded-[0.25rem] bg-primary p-3">
              <Avatar name={user?.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Badge variant="secondary">
                {user?.role || 'user'}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <Avatar name={user?.name} size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content area (60% primary surface) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-secondary px-4 sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              type="button"
              className="rounded-[0.25rem] p-2.5 text-secondary-foreground hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <GlobalSearch className="w-full" />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Engine status — text label plus semantic dot, never color alone */}
            <div className="hidden sm:inline-flex items-center gap-2 text-xs text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              <span>IDX Engine Live</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-[0.25rem] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                aria-label="Open account menu"
              >
                <Avatar name={user?.name} size="md" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="w-64">
                <DropdownMenuLabel>
                  <p className="font-bold text-white truncate">{user?.name || 'Account'}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/market')}>
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span>Market Overview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/investigations')}>
                  <SearchCode className="h-4 w-4" aria-hidden="true" />
                  <span>Investigations</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page container */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
