'use client';
import { Button } from '@/components/ui/button';
import { useOnboardSeller } from '@/features/transactions/hooks/use-onboard-seller';
import { isTransactionsMocked } from '@/features/transactions/lib/environment';
import { getTransactionErrorMessage } from '@/features/transactions/lib/errors';
import { useTranslations } from 'next-intl';
import type { SellerOnboardingResponse } from '@dorsal/schemas';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SellerOnboardingPage() {
  const t = useTranslations('onboarding');
  const { data } = useSession();
  const onboard = useOnboardSeller();
  const [lastResult, setLastResult] = useState<SellerOnboardingResponse | null>(null);
  const mockedTransactions = isTransactionsMocked();
  const status = useSearchParams()?.get('status') ?? null;

  async function start() {
    const sellerId = data?.user?.id;
    if (!sellerId) {
      toast.error(t('need_login'));
      return;
    }
    try {
      const result = await onboard.mutateAsync(sellerId);
      setLastResult(result);
      if (result.onboarding_url) {
        window.open(result.onboarding_url, '_blank', 'noopener,noreferrer');
        toast.success(t('opened_stripe'));
        return;
      }
      if (result.charges_enabled) {
        toast.success(t('account_ready'));
      }
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase text-coral">{t('eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-bold">{t('title')}</h1>
      </header>
      {status === 'complete' && (
        <div className="mb-6 rounded-lg border border-olive/40 bg-olive/10 p-4 text-sm">
          {t('complete_banner')}
        </div>
      )}
      {status === 'refresh' && (
        <div className="mb-6 rounded-lg border border-coral/40 bg-coral/10 p-4 text-sm">
          {t('refresh_banner')}
        </div>
      )}
      <section className="space-y-5 rounded-lg border border-border bg-bg-card p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 text-olive" />
          <div>
            <h2 className="font-semibold">{t('bank_title')}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t('bank_desc')}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-5">
          <p className="text-sm text-text-secondary">{t('status_label')}</p>
          <p className="mt-1 font-semibold">
            {lastResult?.charges_enabled ? t('charges_enabled') : t('charges_pending')}
          </p>
          {mockedTransactions && (
            <p className="mt-2 text-sm text-text-muted">{t('mock_notice')}</p>
          )}
        </div>
        <Button type="button" disabled={onboard.isPending} onClick={start}>
          {onboard.isPending ? <Loader2 className="animate-spin" /> : <ExternalLink />}
          {t('cta')}
        </Button>
      </section>
    </main>
  );
}
