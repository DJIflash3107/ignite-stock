import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFormWithSchema } from '@/hooks/useFormWithSchema';
import { registerSchema, type RegisterFormData } from '@/schema/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { registerUser } from '@/redux/thunks/authThunks';
import { clearError } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay';

/**
 * Register page.
 * Mirrors the login layout: 30% secondary page surface, single accent CTA,
 * left-aligned form, 0.25rem radii, no decorative effects.
 */
export const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormWithSchema<RegisterFormData>(registerSchema, {
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/market', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    const resultAction = await dispatch(
      registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      })
    );
    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/market', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          to="/"
          className="mb-8 flex items-center gap-3 rounded-[0.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[0.25rem] bg-accent text-white">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="font-heading text-2xl font-bold text-white">
            Ignite<span className="text-accent">Stock</span>
          </span>
        </Link>

        <h1 className="font-heading text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-base text-secondary-foreground">
          Analyze market anomalies, investigate stock movements, and consult the AI agent.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error && <ErrorDisplay compact message={error} />}

          <div>
            <Label htmlFor="name" error={Boolean(errors.name)}>
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              autoFocus
              error={Boolean(errors.name)}
              {...register('name')}
            />
            <FormError error={errors.name} />
          </div>

          <div>
            <Label htmlFor="email" error={Boolean(errors.email)}>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="investor@example.com"
              autoComplete="email"
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
            <FormError error={errors.password} />
          </div>

          <div>
            <Label htmlFor="confirmPassword" error={Boolean(errors.confirmPassword)}>
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            <FormError error={errors.confirmPassword} />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="mt-6 text-sm text-secondary-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-accent underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-8 border-t border-border pt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
