'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSellerProblemReport } from '@/features/transactions/hooks/use-seller-problem-report';
import type { SellerProblemCategory } from '@dorsal/schemas';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const CATEGORIES: Array<{ value: SellerProblemCategory; label: string }> = [
  { value: 'buyer_data_issue', label: 'Datos del comprador' },
  { value: 'race_rejected_transfer', label: 'Carrera rechazo el cambio' },
  { value: 'payment_or_payout_issue', label: 'Pago o cobro' },
  { value: 'other', label: 'Otro' },
];

export function SellerProblemReport({ transactionId }: { transactionId: string }) {
  const report = useSellerProblemReport(transactionId);
  const [category, setCategory] = useState<SellerProblemCategory>('buyer_data_issue');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const valid = message.trim().length >= 10 && message.trim().length <= 1000;

  async function submit() {
    if (!valid) return;
    await report.mutateAsync({ category, message: message.trim(), files });
    toast.success('Reporte enviado');
    setMessage('');
    setFiles([]);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
      <h2 className="font-semibold">Soporte post-resolucion</h2>
      <Select
        value={category}
        onValueChange={(value) => setCategory(value as SellerProblemCategory)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <textarea
        className="min-h-28 w-full rounded-md border border-border bg-bg-elevated p-3 text-sm outline-none focus:ring-1 focus:ring-coral"
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
      />
      <Input
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(event) => setFiles(Array.from(event.currentTarget.files ?? []).slice(0, 3))}
      />
      <Button type="button" disabled={!valid || report.isPending} onClick={submit}>
        <Send />
        Enviar reporte
      </Button>
    </div>
  );
}
