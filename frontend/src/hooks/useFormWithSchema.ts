import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

export function useFormWithSchema<TFieldValues extends FieldValues = FieldValues>(
  schema: ZodSchema<TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema as never),
  });
}

export default useFormWithSchema;
