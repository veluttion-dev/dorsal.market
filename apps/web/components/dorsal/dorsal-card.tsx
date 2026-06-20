import { distanceLabel } from '@/features/dorsals/lib/distances';
import { cn } from '@/lib/utils';
import { formatPrice, formatRaceDate } from '@dorsal/domain';
import type { DorsalStatus, DorsalSummary } from '@dorsal/schemas';
import Image from 'next/image';
import Link from 'next/link';
import { PaymentMethodPills } from './payment-method-pills';

export const STATUS_BADGE: Record<DorsalStatus, { label: string; className: string }> = {
  published: { label: 'En venta', className: 'bg-olive-subtle text-olive' },
  sold: { label: 'Vendido', className: 'bg-bg-elevated text-text-muted' },
  draft: { label: 'Borrador', className: 'bg-bg-elevated text-text-secondary' },
  cancelled: { label: 'Cancelada', className: 'bg-bg-elevated text-text-muted' },
};

export function DorsalCard({ dorsal }: { dorsal: DorsalSummary }) {
  const status = STATUS_BADGE[dorsal.status];

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
      </div>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-bold">
            {distanceLabel(dorsal.distance)}
          </span>
          <span className={cn('rounded-md px-2 py-1 text-xs font-medium', status.className)}>
            {status.label}
          </span>
        </div>
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
