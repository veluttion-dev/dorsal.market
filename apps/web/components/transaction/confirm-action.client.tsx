'use client';
import { DisputeDialog } from '@/components/transaction/dispute-dialog.client';
import { Button } from '@/components/ui/button';
import { useConfirmTransfer } from '@/features/transactions/hooks/use-confirm-transfer';
import { useTranslations } from 'next-intl';
import type { TransactionStatus } from '@dorsal/schemas';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DISPUTABLE: TransactionStatus[] = [
  'PAYMENT_RECEIVED',
  'TRANSFER_IN_PROGRESS',
  'TRANSFER_SUBMITTED',
  'IN_DISPUTE',
];

export function ConfirmAction({
  transactionId,
  buyerId,
  status,
}: {
  transactionId: string;
  buyerId: string;
  status: TransactionStatus;
}) {
  const t = useTranslations('buyer_actions');
  const confirm = useConfirmTransfer(transactionId);
  const canConfirm = status === 'TRANSFER_SUBMITTED' || status === 'TRANSFER_IN_PROGRESS';

  async function submit() {
    await confirm.mutateAsync(buyerId);
    toast.success(t('confirmed_toast'));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-bg-card p-5">
      <h2 className="font-semibold">{t('title')}</h2>
      <div className="flex flex-wrap gap-3">
        {canConfirm && (
          <Button type="button" disabled={confirm.isPending} onClick={submit}>
            <CheckCircle2 />
            {t('confirm')}
          </Button>
        )}
        {DISPUTABLE.includes(status) && (
          <DisputeDialog transactionId={transactionId} buyerId={buyerId} />
        )}
      </div>
    </div>
  );
}
