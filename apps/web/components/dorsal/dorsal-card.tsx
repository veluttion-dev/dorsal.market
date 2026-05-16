import { distanceLabel } from '@/features/dorsals/lib/distances';
import { formatPrice, formatRaceDate } from '@dorsal/domain';
import type { DorsalSummary } from '@dorsal/schemas';
import Image from 'next/image';
import Link from 'next/link';
import { PaymentMethodPills } from './payment-method-pills';

export function DorsalCard({ dorsal }: { dorsal: DorsalSummary }) {
  return (
    <Link
      href={`/dorsales/${dorsal.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-bg-card shadow-card transition hover:border-border-hover hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={dorsal.photo_url}
          alt={dorsal.race_name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-md bg-bg-primary/80 px-2 py-1 text-xs font-bold backdrop-blur">
            {distanceLabel(dorsal.distance)}
          </span>
          <span className="rounded-md bg-olive-subtle px-2 py-1 text-xs font-medium text-olive">
            En venta
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-tight">{dorsal.race_name}</h3>
        <p className="text-sm text-text-secondary">
          {formatRaceDate(dorsal.race_date)} · {dorsal.location}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(dorsal.price_amount)}</span>
          <PaymentMethodPills methods={dorsal.payment_methods} />
        </div>
      </div>
    </Link>
  );
}
