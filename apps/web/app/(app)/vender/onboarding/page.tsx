'use client';
import { Button } from '@/components/ui/button';
import { useOnboardSeller } from '@/features/transactions/hooks/use-onboard-seller';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function SellerOnboardingPage() {
  const { data } = useSession();
  const onboard = useOnboardSeller();

  async function start() {
    const sellerId = data?.user?.id;
    if (!sellerId) {
      toast.error('Inicia sesion para configurar pagos');
      return;
    }
    const result = await onboard.mutateAsync(sellerId);
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
        <Button type="button" disabled={onboard.isPending} onClick={start}>
          {onboard.isPending ? <Loader2 className="animate-spin" /> : <ExternalLink />}
          Configurar pagos
        </Button>
      </section>
    </main>
  );
}
