import { Star } from 'lucide-react';

export interface SellerInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating_average: number | null;
  total_sales: number;
}

export function SellerCard({ seller }: { seller: SellerInfo }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-secondary">Vendedor</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-lg font-bold">
          {seller.full_name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{seller.full_name}</p>
          <p className="flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-3.5 w-3.5 fill-current text-coral" />
            {seller.rating_average?.toFixed(1) ?? '—'} · {seller.total_sales} ventas
          </p>
        </div>
      </div>
    </div>
  );
}
