'use client';
import { Button } from '@/components/ui/button';
import { useOnboardSeller } from '@/features/transactions/hooks/use-onboard-seller';
import { isTransactionsMocked } from '@/features/transactions/lib/environment';
import { getTransactionErrorMessage } from '@/features/transactions/lib/errors';
import { useMe } from '@/features/users/hooks/use-me';
import type { SellerOnboardingResponse } from '@dorsal/schemas';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SellerOnboardingPage() {
  const { data } = useSession();
  const me = useMe();
  const onboard = useOnboardSeller();
  const [lastResult, setLastResult] = useState<SellerOnboardingResponse | null>(null);
  const mockedTransactions = isTransactionsMocked();
  const status = useSearchParams().get('status');

  async function start() {
    if (!data?.user?.id) {
      toast.error('Inicia sesion para configurar pagos');
      return;
    }
    if (me.isLoading) {
      toast.error('Estamos comprobando tu perfil');
      return;
    }
    const sellerId = me.data?.id;
    if (!sellerId) {
      toast.error('No se pudo identificar tu usuario local. Vuelve a iniciar sesion.');
      return;
    }
    try {
      const result = await onboard.mutateAsync(sellerId);
      setLastResult(result);
      if (result.onboarding_url) {
        window.open(result.onboarding_url, '_blank', 'noopener,noreferrer');
        toast.success('Hemos abierto Stripe Connect en una nueva pestana');
        return;
      }
      if (result.charges_enabled) {
        toast.success('Cuenta de cobros lista');
      }
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase text-coral">Stripe Connect</p>
        <h1 className="mt-1 text-3xl font-bold">Configura tus cobros</h1>
      </header>
      {status === 'complete' && (
        <div className="mb-6 rounded-lg border border-olive/40 bg-olive/10 p-4 text-sm">
          Has vuelto de Stripe. Estamos verificando tu cuenta; en cuanto quede lista podras publicar.
        </div>
      )}
      {status === 'refresh' && (
        <div className="mb-6 rounded-lg border border-coral/40 bg-coral/10 p-4 text-sm">
          El enlace de Stripe caduco. Pulsa &quot;Configurar pagos&quot; para reanudar.
        </div>
      )}
      <section className="space-y-5 rounded-lg border border-border bg-bg-card p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 text-olive" />
          <div>
            <h2 className="font-semibold">Cuenta bancaria para vender</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Antes de publicar o transferir fondos, conecta tu cuenta de cobros.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-5">
          <p className="text-sm text-text-secondary">Estado Stripe Connect</p>
          <p className="mt-1 font-semibold">
            {lastResult?.charges_enabled ? 'Cuenta lista para cobrar' : 'Pendiente de configurar'}
          </p>
          {mockedTransactions && (
            <p className="mt-2 text-sm text-text-muted">
              Modo local: Transaction esta mockeado, asi que Stripe no abrira una URL real.
            </p>
          )}
        </div>
        <Button type="button" disabled={onboard.isPending} onClick={start}>
          {onboard.isPending ? <Loader2 className="animate-spin" /> : <ExternalLink />}
          Configurar pagos
        </Button>
      </section>
    </main>
  );
}
