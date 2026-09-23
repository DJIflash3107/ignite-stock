import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useFormWithSchema } from '@/hooks/useFormWithSchema';
import { loginSchema, type LoginFormData } from '@/schema/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loginUser } from '@/redux/thunks/authThunks';
import { clearError } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormError } from '@/components/feedback/FormError';

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

  // Clear auth errors when entering page
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // If already authenticated, redirect
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
    <div className="min-h-screen bg-secondary flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary/40 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center text-center z-10">
        <Link to="/" className="flex items-center gap-3 group focus:outline-none mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-xl shadow-accent/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-heading text-2xl font-bold tracking-tight text-white">
            Ignite<span className="text-accent">Stock</span>
          </span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary-foreground/70">
          IDX Market Intelligence & Investigation Agent
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border-border/80 bg-surface shadow-2xl z-10">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to access market intelligence and investigations.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-2">
            {/* Global API Error Alert */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300 animate-fadeIn"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <Label htmlFor="email" error={Boolean(errors.email)}>
                Email address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="investor@example.com"
                  autoComplete="email"
                  autoFocus
                  error={Boolean(errors.email)}
                  {...register('email')}
                />
              </div>
              <FormError error={errors.email} />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" error={Boolean(errors.password)}>
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={Boolean(errors.password)}
                  {...register('password')}
                />
              </div>
              <FormError error={errors.password} />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full shadow-lg shadow-accent/20"
              isLoading={isLoading}
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="text-center text-xs text-secondary-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-accent hover:text-accent-hover hover:underline"
              >
                Create one now
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Footer Link */}
      <div className="mt-8 text-center text-xs text-secondary-foreground/60 z-10">
        <Link to="/" className="hover:text-white transition-colors">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
