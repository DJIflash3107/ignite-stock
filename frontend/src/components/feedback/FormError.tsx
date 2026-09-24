import * as React from 'react';
import type { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Inline field error.
 * Caption scale (14px). Semantic danger color plus an icon.
 */
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
        'mt-2 flex items-center gap-1.5 text-sm font-normal text-danger animate-fadeIn',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{errorMessage}</span>
    </div>
  );
};
