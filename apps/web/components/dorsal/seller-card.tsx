import type { PublicUserProfile } from '@dorsal/schemas';
import { Star } from 'lucide-react';

export function SellerCard({ seller }: { seller: PublicUserProfile }) {
  const displayName = seller.full_name ?? 'Vendedor';

  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-secondary">Vendedor</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-lg font-bold">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-3.5 w-3.5 fill-current text-coral" />
            {seller.avg_rating_seller?.toFixed(1) ?? '-'} - {seller.total_sales} ventas
          </p>
        </div>
      </div>
    </div>
  );
}
