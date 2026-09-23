import * as React from 'react';
import type { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormErrorProps {
  error?: FieldError | string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  if (!errorMessage) return null;

  return (
    <div
      className={cn(
        'mt-1.5 flex items-center gap-1.5 text-xs text-rose-400 font-medium animate-fadeIn',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
};
