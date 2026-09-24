import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/thunks/authThunks';
import { formatDate } from '@/lib/dayjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

/**
 * Profile page.
 * Left-aligned layout. Account details are presented as a definition list
 * separated by spacing and rules instead of nested bordered cards. The only
 * accent is the identity marker; sign-out is a semantic destructive action.
 */
export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const details = [
    {
      icon: Shield,
      label: 'Account identifier',
      value: user?.id || '—',
      mono: true,
    },
    {
      icon: Mail,
      label: 'Registered email',
      value: user?.email || '—',
      mono: false,
    },
    {
      icon: Calendar,
      label: 'Member since',
      value: user?.created_at ? formatDate(user.created_at, 'MMMM D, YYYY') : 'Recent',
      mono: false,
    },
    {
      icon: CheckCircle2,
      label: 'Security & permissions',
      value: 'Standard access · Bearer JWT authenticated',
      mono: false,
      semantic: 'success' as const,
    },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <header className="border-b border-border pb-6">
        <h1 className="font-heading text-3xl font-bold text-white">Account Profile</h1>
        <p className="mt-2 text-base text-secondary-foreground">
          Manage your credentials, role permissions, and session status.
        </p>
      </header>

      {/* Identity */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-bold text-white">
                {user?.name || 'Investor'}
              </h2>
              <Badge variant="secondary">{user?.role || 'user'}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </Button>
      </section>

      {/* Details */}
      <section>
        <h3 className="font-heading text-xl font-bold text-white">Account details</h3>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon
                    className={
                      item.semantic === 'success' ? 'h-4 w-4 text-success' : 'h-4 w-4'
                    }
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </dt>
                <dd
                  className={`text-sm font-bold text-white sm:text-right ${
                    item.mono ? 'font-mono break-all' : ''
                  }`}
                >
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
};

export default ProfilePage;
