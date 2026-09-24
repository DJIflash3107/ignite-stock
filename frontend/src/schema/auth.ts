import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(255, 'Password cannot exceed 255 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Name cannot exceed 255 characters'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(255, 'Password cannot exceed 255 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
