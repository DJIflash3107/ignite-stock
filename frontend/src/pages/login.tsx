import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFormWithSchema } from '@/hooks/useFormWithSchema';
import { loginSchema, type LoginFormData } from '@/schema/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loginUser } from '@/redux/thunks/authThunks';
import { clearError } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import Logo from '/logo_ignitestock.png';

/**
 * Login page.
 * Surfaces: page on the 30% secondary (#1f202a), form panel on the 60% primary
 * (#282a36). A single accent CTA ("Sign In"). Left-aligned content, 0.25rem
 * radii, no glow or gradient effects.
 */
export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/market';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormWithSchema<LoginFormData>(loginSchema, {
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    const resultAction = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          to="/"
          className="mb-8 gap-2 flex rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <img src={Logo} alt="IgniteStock logo" className="h-10" />
          <span className="font-heading text-2xl font-bold text-foreground mt-auto">
            IgniteStock
          </span>
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground">Sign in</h1>
        <p className="mt-2 text-base text-secondary-foreground">
          Access market intelligence and investigations for the Indonesian Stock Exchange.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error && <ErrorDisplay compact message={error} />}

          <div>
            <Label htmlFor="email" error={Boolean(errors.email)}>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="investor@example.com"
              autoComplete="email"
              autoFocus
              error={Boolean(errors.email)}
              {...register('email')}
            />
            <FormError error={errors.email} />
          </div>

          <div>
            <Label htmlFor="password" error={Boolean(errors.password)}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
            <FormError error={errors.password} />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="mt-6 text-sm text-secondary-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-accent underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>

        <div className="mt-8 border-t border-border pt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
