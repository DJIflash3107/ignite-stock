import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  companyTicker: z
    .string()
    .min(1, 'Ticker symbol is required')
    .max(10, 'Ticker symbol is too long')
    .transform((val) => val.trim().toUpperCase()),
  targetDate: z
    .string()
    .min(1, 'Target date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  question: z
    .string()
    .max(2000, 'Question must be under 2000 characters')
    .optional(),
  indexCode: z
    .string()
    .default('IHSG')
    .transform((val) => val.trim().toUpperCase()),
});

export type AnalyzeRequestFormData = z.infer<typeof analyzeRequestSchema>;

export const agentChatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  companyTicker: z
    .string()
    .max(10)
    .optional()
    .transform((val) => (val ? val.trim().toUpperCase() : undefined)),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
});

export type AgentChatFormData = z.infer<typeof agentChatSchema>;
