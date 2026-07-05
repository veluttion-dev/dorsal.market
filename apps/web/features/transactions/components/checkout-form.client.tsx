'use client';
import { IncludedItemsList } from '@/components/dorsal/included-items-list';
import { PaymentMethodPills } from '@/components/dorsal/payment-method-pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { BuyerDataNotice } from '@/features/transactions/components/buyer-data-notice.client';
import { useReserveListing } from '@/features/transactions/hooks/use-reserve-listing';
import { getTransactionErrorMessage } from '@/features/transactions/lib/errors';
import { getStripe } from '@/features/transactions/lib/stripe';
import { useMe } from '@/features/users/hooks/use-me';
import { canBuyWithProfile } from '@/features/users/lib/profile-completion';
import { SESSION_EXPIRED_MESSAGE, isSessionAuthError } from '@/features/users/lib/session-errors';
import { formatPrice, formatRaceDate } from '@dorsal/domain';
import { type DorsalDetail, type RunnerDataInput, ShirtSize } from '@dorsal/schemas';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const stripePromise = getStripe();
const CHECKOUT_RUNNER_DATA_STORAGE_PREFIX = 'dorsal.market.checkout-runner-data.v1';

type CheckoutRunnerDataState = {
  estimated_time: string;
  t_shirt_size: string;
  emergency_contact: string;
};

function getCheckoutRunnerDataStorageKey(dorsalId: string) {
  return `${CHECKOUT_RUNNER_DATA_STORAGE_PREFIX}.${dorsalId}`;
}

function loadCheckoutRunnerData(dorsalId: string): CheckoutRunnerDataState | null {
  if (typeof window === 'undefined') return null;
  const key = getCheckoutRunnerDataStorageKey(dorsalId);
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutRunnerDataState>;
    return {
      estimated_time: typeof parsed.estimated_time === 'string' ? parsed.estimated_time : '',
      t_shirt_size: typeof parsed.t_shirt_size === 'string' ? parsed.t_shirt_size : '',
      emergency_contact:
        typeof parsed.emergency_contact === 'string' ? parsed.emergency_contact : '',
    };
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function saveCheckoutRunnerData(dorsalId: string, value: CheckoutRunnerDataState) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(getCheckoutRunnerDataStorageKey(dorsalId), JSON.stringify(value));
  } catch {
    // Storage can fail in restricted browser modes; the checkout should still work.
  }
}

function clearCheckoutRunnerData(dorsalId: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(getCheckoutRunnerDataStorageKey(dorsalId));
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated px-3 py-2">
      <dt className="text-xs font-medium uppercase text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text-primary">{value || '-'}</dd>
    </div>
  );
}

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
  dorsal,
}: {
  dorsal: DorsalDetail;
}) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { data } = useSession();
  const me = useMe();
  const reserve = useReserveListing();
  const stripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const dorsalId = dorsal.id;
  const purchaseRequirements = dorsal.purchase_requirements;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const restoredRunnerDataRef = useRef<CheckoutRunnerDataState | null>(null);
  const [runnerData, setRunnerData] = useState<CheckoutRunnerDataState>(() => {
    const restored = loadCheckoutRunnerData(dorsalId);
    restoredRunnerDataRef.current = restored;
    return (
      restored ?? {
        estimated_time: '',
        t_shirt_size: '',
        emergency_contact: '',
      }
    );
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const emergencyContactEdited = useRef(Boolean(restoredRunnerDataRef.current));

  useEffect(() => {
    if (
      !emergencyContactEdited.current &&
      !runnerData.emergency_contact &&
      me.data?.emergency_contact
    ) {
      setRunnerData((current) => ({
        ...current,
        emergency_contact: me.data?.emergency_contact ?? '',
      }));
    }
  }, [me.data?.emergency_contact, runnerData.emergency_contact]);

  useEffect(() => {
    saveCheckoutRunnerData(dorsalId, runnerData);
  }, [dorsalId, runnerData]);

  async function startCheckout() {
    if (!data?.user?.id) {
      toast.error(t('need_login'));
      return;
    }
    if (me.isLoading) {
      toast.error(t('checking_profile'));
      return;
    }
    if (isSessionAuthError(me.error)) {
      toast.error(SESSION_EXPIRED_MESSAGE);
      await signOut({
        callbackUrl: `/login?callbackUrl=${encodeURIComponent(`/compra/checkout/${dorsalId}`)}`,
      });
      return;
    }
    if (me.isError) {
      toast.error('No se pudo comprobar tu perfil. Intentalo de nuevo en unos minutos.');
      return;
    }
    const buyerId = me.data?.id;
    if (!buyerId) {
      toast.error('No se pudo identificar tu usuario local. Vuelve a iniciar sesion.');
      return;
    }
    if (!canBuyWithProfile(me.data)) {
      toast.error('Completa tus datos de identidad antes de comprar');
      router.push(
        `/perfil/completar?callbackUrl=${encodeURIComponent(`/compra/checkout/${dorsalId}`)}`,
      );
      return;
    }

    const errors: Record<string, string> = {};
    if (
      purchaseRequirements.requires_estimated_time &&
      !/^\d{2}:\d{2}:\d{2}$/.test(runnerData.estimated_time.trim())
    ) {
      errors.estimated_time = 'Introduce el tiempo en formato HH:MM:SS';
    }
    if (purchaseRequirements.requires_shirt_size && !runnerData.t_shirt_size) {
      errors.t_shirt_size = 'Selecciona una talla';
    }
    if (purchaseRequirements.requires_emergency_contact && !runnerData.emergency_contact.trim()) {
      errors.emergency_contact = 'Introduce un contacto de emergencia';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const checkoutRunnerData: RunnerDataInput = {};
    if (purchaseRequirements.requires_estimated_time) {
      checkoutRunnerData.estimated_time = runnerData.estimated_time.trim();
    }
    if (purchaseRequirements.requires_shirt_size) {
      checkoutRunnerData.t_shirt_size = runnerData.t_shirt_size as RunnerDataInput['t_shirt_size'];
    }
    if (purchaseRequirements.requires_emergency_contact) {
      checkoutRunnerData.emergency_contact = runnerData.emergency_contact.trim();
    }

    try {
      const hasRunnerData = Object.keys(checkoutRunnerData).length > 0;
      const result = await reserve.mutateAsync({
        dorsalId,
        buyerId,
        ...(hasRunnerData ? { runnerData: checkoutRunnerData } : {}),
      });
      setTransactionId(result.transaction_id);
      setClientSecret(result.payment_client_secret);
      clearCheckoutRunnerData(dorsalId);
      const stripe = await stripePromise;
      if (!stripe) router.push(`/compra/confirmada?tx=${result.transaction_id}`);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">{t('buying')}</p>
            <h2 className="mt-1 text-2xl font-semibold">{dorsal.race_name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {formatRaceDate(dorsal.race_date)} - {dorsal.location}
            </p>
          </div>
          <p className="text-3xl font-bold">{formatPrice(dorsal.price_amount)}</p>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailItem label="Fecha" value={formatRaceDate(dorsal.race_date)} />
          <DetailItem label="Ubicacion" value={dorsal.location} />
          <DetailItem label="Distancia" value={distanceLabel(dorsal.distance)} />
          <DetailItem label="Numero de dorsal" value={dorsal.bib_number} />
          <DetailItem label="Cajon" value={dorsal.start_corral} />
          <DetailItem label="Estado" value={dorsal.status} />
        </dl>

        <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">Incluye</h3>
            <IncludedItemsList items={dorsal.included_items} />
          </section>
          <section className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text-secondary">Metodos de pago</h3>
              <PaymentMethodPills methods={dorsal.payment_methods} />
            </div>
            {(dorsal.contact_phone || dorsal.contact_email) && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text-secondary">
                  Contacto del vendedor
                </h3>
                <div className="space-y-1 text-sm">
                  {dorsal.contact_phone && <p>{dorsal.contact_phone}</p>}
                  {dorsal.contact_email && <p>{dorsal.contact_email}</p>}
                </div>
              </div>
            )}
          </section>
        </div>

        {dorsal.sale_reason && (
          <section className="mt-5 border-t border-border pt-5">
            <h3 className="mb-2 text-sm font-semibold text-text-secondary">Motivo de venta</h3>
            <p className="text-sm">{dorsal.sale_reason}</p>
          </section>
        )}
      </div>

      <BuyerDataNotice
        isAuthenticated={Boolean(data?.user?.id)}
        isLoading={me.isLoading}
        profile={me.data}
      />

      {(purchaseRequirements.requires_estimated_time ||
        purchaseRequirements.requires_shirt_size ||
        purchaseRequirements.requires_emergency_contact ||
        purchaseRequirements.fixed_shirt_size) && (
        <section className="space-y-4 rounded-lg border border-border bg-bg-card p-5">
          <div>
            <h2 className="font-semibold">Datos que faltan para esta compra</h2>
            <p className="mt-1 text-sm text-text-muted">
              Se guardarán solo en esta compra y no modificarán tu perfil.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {purchaseRequirements.requires_estimated_time && (
              <div className="space-y-1.5">
                <Label htmlFor="checkout-estimated-time">Tiempo estimado</Label>
                <Input
                  id="checkout-estimated-time"
                  aria-label="Tiempo estimado"
                  placeholder="HH:MM:SS"
                  value={runnerData.estimated_time}
                  onChange={(event) =>
                    setRunnerData((current) => ({
                      ...current,
                      estimated_time: event.target.value,
                    }))
                  }
                />
                {fieldErrors.estimated_time && (
                  <p className="text-sm text-red-500">{fieldErrors.estimated_time}</p>
                )}
              </div>
            )}
            {purchaseRequirements.requires_shirt_size && (
              <div className="space-y-1.5">
                <Label htmlFor="checkout-shirt-size">Talla</Label>
                <select
                  id="checkout-shirt-size"
                  aria-label="Talla"
                  className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
                  value={runnerData.t_shirt_size}
                  onChange={(event) =>
                    setRunnerData((current) => ({
                      ...current,
                      t_shirt_size: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona</option>
                  {ShirtSize.options.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                {fieldErrors.t_shirt_size && (
                  <p className="text-sm text-red-500">{fieldErrors.t_shirt_size}</p>
                )}
              </div>
            )}
            {purchaseRequirements.fixed_shirt_size && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Talla de camiseta incluida</p>
                <p className="text-sm text-text-secondary">
                  {purchaseRequirements.fixed_shirt_size}
                </p>
              </div>
            )}
            {purchaseRequirements.requires_emergency_contact && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="checkout-emergency-contact">Contacto de emergencia</Label>
                <Input
                  id="checkout-emergency-contact"
                  aria-label="Contacto de emergencia"
                  value={runnerData.emergency_contact}
                  onChange={(event) => {
                    emergencyContactEdited.current = true;
                    setRunnerData((current) => ({
                      ...current,
                      emergency_contact: event.target.value,
                    }));
                  }}
                />
                {fieldErrors.emergency_contact && (
                  <p className="text-sm text-red-500">{fieldErrors.emergency_contact}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {!(
        purchaseRequirements.requires_estimated_time ||
        purchaseRequirements.requires_shirt_size ||
        purchaseRequirements.requires_emergency_contact ||
        purchaseRequirements.fixed_shirt_size
      ) && (
        <section className="rounded-lg border border-border bg-bg-card p-5">
          <h2 className="font-semibold">Datos que faltan para esta compra</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Este dorsal no requiere datos adicionales antes del pago.
          </p>
        </section>
      )}

      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="font-semibold">Pago</h2>
        {stripeConfigured ? (
          <p className="mt-1 text-sm text-text-secondary">
            Al continuar, reservaremos el dorsal y aqui aparecera el formulario seguro de tarjeta de
            Stripe.
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">
            Stripe no esta configurado en local. Esta compra se confirmara con pago simulado.
            Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para mostrar el formulario real de pago.
          </p>
        )}
      </section>

      {!clientSecret || !transactionId ? (
        <Button
          type="button"
          className="w-full"
          disabled={reserve.isPending || me.isLoading}
          onClick={startCheckout}
        >
          {reserve.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {stripeConfigured ? t('continue') : t('simulate')}
        </Button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm transactionId={transactionId} />
        </Elements>
      )}
    </div>
  );
}
