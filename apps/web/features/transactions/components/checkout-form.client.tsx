'use client';
import { Button } from '@/components/ui/button';
import { BuyerDataNotice } from '@/features/transactions/components/buyer-data-notice.client';
import { useReserveListing } from '@/features/transactions/hooks/use-reserve-listing';
import { getTransactionErrorMessage } from '@/features/transactions/lib/errors';
import { getStripe } from '@/features/transactions/lib/stripe';
import { useMe } from '@/features/users/hooks/use-me';
import { canBuyWithProfile } from '@/features/users/lib/profile-completion';
import { formatPrice } from '@dorsal/domain';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const stripePromise = getStripe();

function StripePaymentForm({ transactionId }: { transactionId: string }) {
  const t = useTranslations('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submitPayment() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/compra/confirmada?tx=${transactionId}`,
      },
      redirect: 'if_required',
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error.message ?? 'No se pudo confirmar el pago');
      return;
    }
    router.push(`/compra/confirmada?tx=${transactionId}`);
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button type="button" className="w-full" disabled={submitting} onClick={submitPayment}>
        {submitting ? <Loader2 className="animate-spin" /> : <CreditCard />}
        {t('pay')}
      </Button>
    </div>
  );
}

export function CheckoutForm({
  dorsalId,
  raceName,
  amount,
}: {
  dorsalId: string;
  raceName: string;
  amount: number;
}) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { data } = useSession();
  const me = useMe();
  const reserve = useReserveListing();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  async function startCheckout() {
    const buyerId = data?.user?.id;
    if (!buyerId) {
      toast.error(t('need_login'));
      return;
    }
    if (me.isLoading) {
      toast.error(t('checking_profile'));
      return;
    }
    if (!canBuyWithProfile(me.data)) {
      toast.error(t('complete_profile'));
      router.push(
        `/perfil/completar?callbackUrl=${encodeURIComponent(`/compra/checkout/${dorsalId}`)}`,
      );
      return;
    }
    try {
      const result = await reserve.mutateAsync({ dorsalId, buyerId });
      setTransactionId(result.transaction_id);
      setClientSecret(result.payment_client_secret);
      const stripe = await stripePromise;
      if (!stripe) router.push(`/compra/confirmada?tx=${result.transaction_id}`);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <p className="text-sm text-text-secondary">{t('buying')}</p>
        <h2 className="mt-1 text-xl font-semibold">{raceName}</h2>
        <p className="mt-3 text-3xl font-bold">{formatPrice(amount)}</p>
      </div>

      <BuyerDataNotice
        isAuthenticated={Boolean(data?.user?.id)}
        isLoading={me.isLoading}
        profile={me.data}
      />

      {!clientSecret || !transactionId ? (
        <Button
          type="button"
          className="w-full"
          disabled={reserve.isPending || me.isLoading}
          onClick={startCheckout}
        >
          {reserve.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? t('continue') : t('simulate')}
        </Button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm transactionId={transactionId} />
        </Elements>
      )}
    </div>
  );
}
