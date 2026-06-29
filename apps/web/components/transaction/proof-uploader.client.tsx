'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitProof } from '@/features/transactions/hooks/use-submit-proof';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProofUploader({
  transactionId,
  sellerId,
}: { transactionId: string; sellerId: string }) {
  const t = useTranslations('proof');
  const submitProof = useSubmitProof(transactionId);
  const [file, setFile] = useState<File | null>(null);

  async function submit() {
    if (!file) return;
    await submitProof.mutateAsync({ sellerId, file });
    toast.success(t('sent_toast'));
    setFile(null);
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={!file || submitProof.isPending}
        onClick={submit}
      >
        <Upload />
        {t('upload')}
      </Button>
    </div>
  );
}
