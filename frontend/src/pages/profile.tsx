import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Shield,
  Calendar,
  LogOut,
  CheckCircle2,
  User as UserIcon,
  KeyRound,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/thunks/authThunks';
import { updateUser } from '@/redux/slices/authSlice';
import { formatDate } from '@/lib/dayjs';
import { apiPatch } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import { useFormWithSchema } from '@/hooks/useFormWithSchema';
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/schema/auth';
import type { UserResponse } from '@/models/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

/**
 * Profile page.
 * ---------------------------------------------------------------------------
 * Left-aligned. Account details are a definition list separated by rules
 * (not nested bordered cards). The identity marker is the only accent; sign-out
 * is the single semantic destructive action. Profile details and password are
 * edited through real backend calls — the page never fabricates a saved state,
 * and failures surface the real backend message.
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
      value: user?.created_at ? formatDate(user.created_at, 'MMMM D, YYYY') : '—',
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
    <div className="max-w-3xl space-y-10">
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
                {user?.name || '—'}
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

      {/* Editable sections (require an authenticated user) */}
      {user ? (
        <>
          <ProfileDetailsForm
            userId={user.id}
            defaultName={user.name}
            defaultEmail={user.email}
            onSaved={(updated) => dispatch(updateUser(updated))}
          />
          <ChangePasswordForm userId={user.id} />
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------------- */
/* Profile details                                                           */
/* ------------------------------------------------------------------------- */

interface ProfileDetailsFormProps {
  userId: string;
  defaultName: string;
  defaultEmail: string;
  onSaved: (user: UserResponse['data']['user']) => void;
}

const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({
  userId,
  defaultName,
  defaultEmail,
  onSaved,
}) => {
  const [status, setStatus] = useState<StatusMessage>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useFormWithSchema<ProfileUpdateFormData>(profileUpdateSchema, {
    defaultValues: { name: defaultName, email: defaultEmail },
  });

  // Keep the form in sync if the profile is refreshed elsewhere.
  useEffect(() => {
    reset({ name: defaultName, email: defaultEmail });
  }, [defaultName, defaultEmail, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const response = await apiPatch<UserResponse>(`/users/${userId}`, {
        name: values.name,
        email: values.email,
      });
      onSaved(response.data.user);
      reset({ name: response.data.user.name, email: response.data.user.email });
      setStatus({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', text: extractErrorMessage(err) });
    }
  });

  return (
    <section aria-labelledby="profile-details-heading">
      <div className="flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 id="profile-details-heading" className="font-heading text-xl font-bold text-white">
          Profile details
        </h3>
      </div>
      <p className="mt-1 text-sm text-secondary-foreground">
        Update your display name and email address.
      </p>

      <form onSubmit={onSubmit} className="mt-4 max-w-md space-y-5" noValidate>
        {status?.type === 'error' && <ErrorDisplay compact message={status.text} />}

        <div>
          <Label htmlFor="profile-name" error={Boolean(errors.name)}>
            Full name
          </Label>
          <Input
            id="profile-name"
            type="text"
            autoComplete="name"
            error={Boolean(errors.name)}
            {...register('name')}
          />
          <FormError error={errors.name} />
        </div>

        <div>
          <Label htmlFor="profile-email" error={Boolean(errors.email)}>
            Email address
          </Label>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            error={Boolean(errors.email)}
            {...register('email')}
          />
          <FormError error={errors.email} />
        </div>

        {status?.type === 'success' && (
          <p className="flex items-center gap-1.5 text-sm text-success" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {status.text}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset({ name: defaultName, email: defaultEmail });
              setStatus(null);
            }}
            disabled={!isDirty || isSubmitting}
          >
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
};

/* ------------------------------------------------------------------------- */
/* Change password                                                           */
/* ------------------------------------------------------------------------- */

interface ChangePasswordFormProps {
  userId: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ userId }) => {
  const [status, setStatus] = useState<StatusMessage>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithSchema<ChangePasswordFormData>(changePasswordSchema, {
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      await apiPatch<UserResponse>(`/users/${userId}`, { password: values.password });
      reset({ password: '', confirmPassword: '' });
      setStatus({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', text: extractErrorMessage(err) });
    }
  });

  return (
    <section aria-labelledby="change-password-heading">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 id="change-password-heading" className="font-heading text-xl font-bold text-white">
          Change password
        </h3>
      </div>
      <p className="mt-1 text-sm text-secondary-foreground">
        Set a new password for your account. Use at least 8 characters.
      </p>
      <p className="mt-2 rounded-[0.25rem] border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
        Note: this account endpoint does not currently verify your existing password. For your
        security, avoid changing the password on a shared device.
      </p>

      <form onSubmit={onSubmit} className="mt-4 max-w-md space-y-5" noValidate>
        {status?.type === 'error' && <ErrorDisplay compact message={status.text} />}

        <div>
          <Label htmlFor="new-password" error={Boolean(errors.password)}>
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            error={Boolean(errors.password)}
            {...register('password')}
          />
          <FormError error={errors.password} />
        </div>

        <div>
          <Label htmlFor="confirm-password" error={Boolean(errors.confirmPassword)}>
            Confirm new password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          <FormError error={errors.confirmPassword} />
        </div>

        {status?.type === 'success' && (
          <p className="flex items-center gap-1.5 text-sm text-success" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {status.text}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Change password
        </Button>
      </form>
    </section>
  );
};

export default ProfilePage;
