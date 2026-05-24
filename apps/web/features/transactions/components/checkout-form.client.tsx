'use client';
import { Button } from '@/components/ui/button';
import { BuyerDataNotice } from '@/features/transactions/components/buyer-data-notice.client';
import { useReserveListing } from '@/features/transactions/hooks/use-reserve-listing';
import { getTransactionErrorMessage } from '@/features/transactions/lib/errors';
import { getStripe } from '@/features/transactions/lib/stripe';
import { DEV_AUTH_BYPASS_ENABLED, DEV_PREVIEW_USER_ID } from '@/lib/dev-preview';
import { formatPrice } from '@dorsal/domain';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const stripePromise = getStripe();

function StripePaymentForm({ transactionId }: { transactionId: string }) {
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
        Pagar
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
  const router = useRouter();
  const { data } = useSession();
  const reserve = useReserveListing();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  async function startCheckout() {
    const buyerId = data?.user?.id ?? (DEV_AUTH_BYPASS_ENABLED ? DEV_PREVIEW_USER_ID : null);
    if (!buyerId) {
      toast.error('Inicia sesion para comprar');
      return;
    }
    try {
      const result = await reserve.mutateAsync({ dorsalId, buyerId });
      setTransactionId(result.transaction_id);
      setClientSecret(result.stripe_payment_intent_client_secret);
      const stripe = await stripePromise;
      if (!stripe) router.push(`/compra/confirmada?tx=${result.transaction_id}`);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <p className="text-sm text-text-secondary">Vas a comprar</p>
        <h2 className="mt-1 text-xl font-semibold">{raceName}</h2>
        <p className="mt-3 text-3xl font-bold">{formatPrice(amount)}</p>
      </div>

      <BuyerDataNotice isAuthenticated={Boolean(data?.user?.id)} />

      {!clientSecret || !transactionId ? (
        <Button
          type="button"
          className="w-full"
          disabled={reserve.isPending}
          onClick={startCheckout}
        >
          {reserve.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Continuar al pago' : 'Simular pago'}
        </Button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm transactionId={transactionId} />
        </Elements>
      )}
    </div>
  );
}
