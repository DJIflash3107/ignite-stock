import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/thunks/authThunks';
import { formatDate } from '@/lib/dayjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Account Profile
        </h1>
        <p className="mt-1 text-sm text-secondary-foreground">
          Manage your credentials, role permissions, and session status.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-border/80 bg-surface shadow-xl">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name} size="xl" />
              <div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{user?.name || 'Investor'}</span>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {user?.role || 'user'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm text-secondary-foreground mt-0.5">
                  {user?.email}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-rose-900/60 text-rose-300 hover:bg-rose-950/40 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User ID Field */}
            <div className="rounded-xl border border-border/60 bg-secondary-light/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70 mb-1">
                <Shield className="h-3.5 w-3.5 text-accent" />
                <span>Account Identifier</span>
              </div>
              <p className="font-mono text-xs text-white break-all">{user?.id || '—'}</p>
            </div>

            {/* Email Field */}
            <div className="rounded-xl border border-border/60 bg-secondary-light/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70 mb-1">
                <Mail className="h-3.5 w-3.5 text-accent" />
                <span>Registered Email</span>
              </div>
              <p className="text-sm font-medium text-white">{user?.email || '—'}</p>
            </div>

            {/* Member Since Field */}
            <div className="rounded-xl border border-border/60 bg-secondary-light/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70 mb-1">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span>Member Since</span>
              </div>
              <p className="text-sm font-medium text-white">
                {user?.created_at ? formatDate(user.created_at, 'MMMM D, YYYY') : 'Recent'}
              </p>
            </div>

            {/* Account Role */}
            <div className="rounded-xl border border-border/60 bg-secondary-light/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Security & Permissions</span>
              </div>
              <p className="text-sm font-medium text-white">
                Standard Access • Bearer JWT Authenticated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
