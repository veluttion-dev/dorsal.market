'use client';
import { ProofUploader } from '@/components/transaction/proof-uploader.client';
import { Button } from '@/components/ui/button';
import { useTransferInProgress } from '@/features/transactions/hooks/use-transfer-in-progress';
import { useTranslations } from 'next-intl';
import type { TransactionStatus } from '@dorsal/schemas';
import { Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

export function TransferActions({
  transactionId,
  sellerId,
  status,
}: {
  transactionId: string;
  sellerId: string;
  status: TransactionStatus;
}) {
  const t = useTranslations('seller_actions');
  const transfer = useTransferInProgress(transactionId);
  const canStart = status === 'PAYMENT_RECEIVED';
  const canUpload = status === 'TRANSFER_IN_PROGRESS' || status === 'PAYMENT_RECEIVED';

  async function start() {
    await transfer.mutateAsync(sellerId);
    toast.success(t('started_toast'));
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
      <h2 className="font-semibold">{t('title')}</h2>
      {canStart && (
        <Button type="button" disabled={transfer.isPending} onClick={start}>
          {transfer.isPending ? <Loader2 className="animate-spin" /> : <PlayCircle />}
          {t('mark_started')}
        </Button>
      )}
      {canUpload && <ProofUploader transactionId={transactionId} sellerId={sellerId} />}
    </div>
  );
}
