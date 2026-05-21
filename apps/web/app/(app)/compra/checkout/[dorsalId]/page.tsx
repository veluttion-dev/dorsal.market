import { getDorsalDetail } from '@/features/dorsals/server/get-detail';
import { CheckoutForm } from '@/features/transactions/components/checkout-form.client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ dorsalId: string }>;
}) {
  const { dorsalId } = await params;
  const dorsal = await getDorsalDetail(dorsalId);
  if (!dorsal) notFound();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase text-coral">Pago seguro</p>
        <h1 className="mt-1 text-3xl font-bold">Reserva tu dorsal</h1>
      </header>
      <CheckoutForm dorsalId={dorsal.id} raceName={dorsal.race_name} amount={dorsal.price_amount} />
    </main>
  );
}
