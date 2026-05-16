import { formatPrice, formatRaceDate } from '@dorsal/domain';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { IncludedItemsList } from '@/components/dorsal/included-items-list';
import { PaymentMethodPills } from '@/components/dorsal/payment-method-pills';
import { SellerCard } from '@/components/dorsal/seller-card';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { getDorsalDetail } from '@/features/dorsals/server/get-detail';
import { getServerApi } from '@/lib/api';

export const revalidate = 300;

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getDorsalDetail(id);
  if (!d) return { title: 'Dorsal no encontrado' };
  const title = `${d.race_name} ${distanceLabel(d.distance)}`;
  return {
    title,
    description: `Dorsal en venta para ${d.race_name} (${d.location}, ${formatRaceDate(
      d.race_date,
    )}). ${formatPrice(d.price_amount)}.`,
    openGraph: { title, images: [d.photo_url] },
    twitter: { card: 'summary_large_image', title: d.race_name, images: [d.photo_url] },
  };
}

export default async function DorsalDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const d = await getDorsalDetail(id);
  if (!d) notFound();

  // Identity module is mocked client-side only; on the server this resolves to
  // null until the backend exposes /users/{id}. The seller card degrades gracefully.
  const api = await getServerApi();
  const seller = await api.users.getById(d.seller_id).catch(() => null);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-bg-elevated">
            <Image src={d.photo_url} alt={d.race_name} fill className="object-cover" priority />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-bold">
                {distanceLabel(d.distance)}
              </span>
              <span className="rounded-md bg-olive-subtle px-2 py-1 text-xs font-medium text-olive">
                En venta
              </span>
            </div>
            <h1 className="text-3xl font-bold">{d.race_name}</h1>
            <p className="mt-1 text-text-secondary">
              {formatRaceDate(d.race_date)} · {d.location}
              {d.bib_number ? ` · Dorsal #${d.bib_number}` : ''}
              {d.start_corral ? ` · Cajón ${d.start_corral}` : ''}
            </p>
          </div>
          {d.sale_reason && (
            <section className="rounded-lg border border-border bg-bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Motivo de venta</h2>
              <p>{d.sale_reason}</p>
            </section>
          )}
          <section className="rounded-lg border border-border bg-bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-secondary">¿Qué incluye?</h2>
            <IncludedItemsList items={d.included_items} />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-card p-5">
            <p className="text-sm text-text-secondary">Precio</p>
            <p className="text-3xl font-bold">{formatPrice(d.price_amount)}</p>
            <div className="mt-3">
              <PaymentMethodPills methods={d.payment_methods} />
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-md bg-coral py-3 font-semibold text-white hover:bg-coral-hover"
            >
              Comprar dorsal
            </button>
            <p className="mt-2 text-center text-xs text-text-muted">
              Pago en custodia · feat/transacciones
            </p>
          </div>
          {seller && <SellerCard seller={seller} />}
          {(d.contact_phone || d.contact_email) && (
            <div className="rounded-lg border border-border bg-bg-card p-5 text-sm">
              <h3 className="mb-2 font-semibold">Contacto</h3>
              {d.contact_phone && <p>📞 {d.contact_phone}</p>}
              {d.contact_email && <p>✉️ {d.contact_email}</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
