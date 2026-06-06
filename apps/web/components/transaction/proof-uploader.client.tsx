'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitProof } from '@/features/transactions/hooks/use-submit-proof';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProofUploader({
  transactionId,
  sellerId,
}: { transactionId: string; sellerId: string }) {
  const submitProof = useSubmitProof(transactionId);
  const [file, setFile] = useState<File | null>(null);

  async function submit() {
    if (!file) return;
    await submitProof.mutateAsync({ sellerId, file });
    toast.success('Prueba enviada');
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
        Subir prueba
      </Button>
    </div>
  );
}
