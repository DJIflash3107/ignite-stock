import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  SearchCode,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
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
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Market Overview', to: '/market', icon: BarChart3 },
  { name: 'Investigations', to: '/investigations', icon: SearchCode },
  { name: 'My Profile', to: '/profile', icon: UserIcon },
];

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
    <div className="min-h-screen bg-secondary text-foreground font-body flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-primary transition-all duration-300 ease-in-out lg:static',
          // Mobile state
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
          // Desktop state
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4">
          <NavLink
            to="/market"
            className="flex items-center gap-3 overflow-hidden focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/25">
              <Sparkles className="h-5 w-5" />
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="flex flex-col">
                <span className="font-heading text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  Ignite<span className="text-accent">Stock</span>
                </span>
                <span className="text-[10px] font-semibold text-secondary-foreground/70 uppercase tracking-widest">
                  IDX Intelligence
                </span>
              </div>
            )}
          </NavLink>

          {/* Close button for mobile */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-secondary-foreground/70 hover:bg-surface-hover hover:text-white lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none',
                  active
                    ? 'bg-accent/15 text-white border border-accent/30 shadow-sm shadow-accent/10'
                    : 'text-secondary-foreground hover:bg-surface-hover hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-secondary-foreground/70 group-hover:text-white'
                  )}
                />
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="truncate">{item.name}</span>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-accent" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border/70 p-3 space-y-2">
          {/* User mini badge in sidebar */}
          {(!isSidebarCollapsed || isMobileMenuOpen) ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface/60 border border-border/50 p-2.5">
              <Avatar name={user?.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-secondary-foreground/70 truncate">{user?.email}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {user?.role || 'user'}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <Avatar name={user?.name} size="sm" />
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-secondary-foreground/70 hover:bg-surface-hover hover:text-white transition-colors border border-transparent hover:border-border/60"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-secondary/90 px-4 sm:px-6 backdrop-blur-md">
          {/* Left: Mobile Hamburger & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              type="button"
              className="rounded-lg p-2 text-secondary-foreground hover:bg-surface hover:text-white lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Component */}
            <GlobalSearch className="w-full" />
          </div>

          {/* Right: Engine Status & User Menu */}
          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            {/* Live Engine Status Badge */}
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-900/40 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>IDX Engine Live</span>
            </div>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full ring-offset-2 ring-offset-secondary hover:ring-2 hover:ring-accent transition-all">
                <Avatar name={user?.name} size="md" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-white truncate">{user?.name || 'Account'}</p>
                  <p className="text-[11px] font-normal text-secondary-foreground/70 truncate normal-case">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/market')}>
                  <BarChart3 className="h-4 w-4 text-secondary-foreground/80" />
                  <span>Market Overview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/investigations')}>
                  <SearchCode className="h-4 w-4 text-secondary-foreground/80" />
                  <span>Investigations</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="h-4 w-4 text-secondary-foreground/80" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
