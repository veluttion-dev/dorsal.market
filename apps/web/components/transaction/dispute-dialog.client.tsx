'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useOpenDispute } from '@/features/transactions/hooks/use-open-dispute';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export function DisputeDialog({ transactionId }: { transactionId: string }) {
  const t = useTranslations('dispute');
  const dispute = useOpenDispute(transactionId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 20;

  async function submit() {
    if (!valid) return;
    await dispute.mutateAsync({ reason: reason.trim() });
    toast.success(t('opened_toast'));
    setOpen(false);
    setReason('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <AlertTriangle />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <textarea
          className="min-h-28 rounded-md border border-border bg-bg-elevated p-3 text-sm outline-none focus:ring-1 focus:ring-coral"
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
        />
        <Button type="button" disabled={!valid || dispute.isPending} onClick={submit}>
          {t('submit')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
