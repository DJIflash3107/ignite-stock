import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { useFormWithSchema } from '@/hooks/useFormWithSchema';
import { analyzeRequestSchema, type AnalyzeRequestFormData } from '@/schema/investigation';
import { apiPost } from '@/lib/api-client';
import { extractErrorMessage } from '@/lib/api-error';
import { dayjs } from '@/lib/dayjs';
import type {
  InvestigationAnalyzeRequest,
  InvestigationDetailResponse,
} from '@/models/investigation';

/**
 * New Investigation dialog.
 * Runs POST /api/investigations/analyze and navigates to the created report.
 * A failed analyze surfaces the real backend error inline — it never creates
 * placeholder results or navigates to a fabricated investigation.
 */

export interface NewInvestigationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTicker?: string;
}

export const NewInvestigationDialog: React.FC<NewInvestigationDialogProps> = ({
  open,
  onOpenChange,
  defaultTicker,
}) => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithSchema<AnalyzeRequestFormData>(analyzeRequestSchema, {
    defaultValues: {
      companyTicker: defaultTicker ?? '',
      targetDate: dayjs().format('YYYY-MM-DD'),
      question: '',
      indexCode: 'IHSG',
    },
  });

  // Keep the ticker in sync when the dialog is reopened with a new context.
  React.useEffect(() => {
    if (open && defaultTicker) {
      reset((prev) => ({ ...prev, companyTicker: defaultTicker }));
    }
  }, [open, defaultTicker, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload: InvestigationAnalyzeRequest = {
      company_ticker: values.companyTicker,
      target_date: values.targetDate,
      question: values.question?.trim() ? values.question.trim() : undefined,
      index_code: values.indexCode,
    };
    try {
      const response = await apiPost<InvestigationDetailResponse>(
        '/investigations/analyze',
        payload
      );
      const created = response.data.investigation;
      onOpenChange(false);
      navigate(`/investigations/${created.id}`);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Investigation</DialogTitle>
          <DialogDescription>
            Run the deterministic analysis pipeline for an IDX ticker. This orchestrates stock
            movement, market &amp; sector context, peers, news, filings, and financials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <Label htmlFor="companyTicker">Ticker symbol</Label>
            <Input
              id="companyTicker"
              placeholder="e.g. BBCA"
              autoComplete="off"
              error={Boolean(errors.companyTicker)}
              {...register('companyTicker')}
            />
            <FormError error={errors.companyTicker} />
          </div>

          <div>
            <Label htmlFor="targetDate">Target date</Label>
            <Input
              id="targetDate"
              type="date"
              error={Boolean(errors.targetDate)}
              {...register('targetDate')}
            />
            <FormError error={errors.targetDate} />
          </div>

          <div>
            <Label htmlFor="indexCode">Benchmark index</Label>
            <Input
              id="indexCode"
              placeholder="IHSG"
              autoComplete="off"
              error={Boolean(errors.indexCode)}
              {...register('indexCode')}
            />
            <FormError error={errors.indexCode} />
          </div>

          <div>
            <Label htmlFor="question">Question (optional)</Label>
            <Input
              id="question"
              placeholder="What drove this movement?"
              autoComplete="off"
              error={Boolean(errors.question)}
              {...register('question')}
            />
            <FormError error={errors.question} />
          </div>

          {submitError && (
            <div
              className="rounded-[0.25rem] border border-danger/40 bg-danger/10 p-3"
              role="alert"
            >
              <p className="text-sm text-danger">{submitError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              <SearchCode className="h-4 w-4" aria-hidden="true" />
              <span>Run analysis</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
