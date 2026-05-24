'use client';
import { Button } from '@/components/ui/button';
import { useOnboardSeller } from '@/features/transactions/hooks/use-onboard-seller';
import { isTransactionsMocked } from '@/features/transactions/lib/environment';
import { DEV_AUTH_BYPASS_ENABLED, DEV_PREVIEW_SELLER_ID } from '@/lib/dev-preview';
import type { SellerOnboardingResponse } from '@dorsal/schemas';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SellerOnboardingPage() {
  const { data } = useSession();
  const onboard = useOnboardSeller();
  const [lastResult, setLastResult] = useState<SellerOnboardingResponse | null>(null);
  const mockedTransactions = isTransactionsMocked();

  async function start() {
    const sellerId = data?.user?.id ?? (DEV_AUTH_BYPASS_ENABLED ? DEV_PREVIEW_SELLER_ID : null);
    if (!sellerId) {
      toast.error('Inicia sesion para configurar pagos');
      return;
    }
    const result = await onboard.mutateAsync(sellerId);
    setLastResult(result);
    if (result.onboarding_url) {
      window.open(result.onboarding_url, '_blank', 'noopener,noreferrer');
      toast.success('Hemos abierto Stripe Connect en una nueva pestana');
      return;
    }
    if (result.charges_enabled && !result.onboarding_url) {
      toast.success('Cuenta de cobros lista');
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase text-coral">Stripe Connect</p>
        <h1 className="mt-1 text-3xl font-bold">Configura tus cobros</h1>
      </header>
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
