'use client';
import { Button } from '@/components/ui/button';
import { useBuyerTransaction } from '@/features/transactions/hooks/use-buyer-transaction';
import { STATUS_LABEL } from '@/features/transactions/lib/labels';
import { CheckCircle2, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('tx');
  const tx = useBuyerTransaction(transactionId);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="space-y-6 rounded-lg border border-border bg-bg-card p-6">
        <CheckCircle2 className="h-10 w-10 text-olive" />
        <div>
          <h1 className="text-3xl font-bold">Compra confirmada</h1>
          <p className="mt-2 text-text-secondary">
            {tx.data
              ? `Estado actual: ${STATUS_LABEL[tx.data.status]}`
              : 'Estamos preparando el estado de tu compra.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {transactionId && (
            <Button asChild>
              <Link href={`/compra/${transactionId}`}>
                <ListChecks />
                Ver seguimiento
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/perfil/historial">Mi historial</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
