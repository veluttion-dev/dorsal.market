import { getServerApi } from '@/lib/api';
import { SellerCard } from './seller-card';

/**
 * Streams the seller card independently of the dorsal detail. Fetching the
 * public profile is a second backend hop (and 404s while a seller has no public
 * profile yet), so it lives behind a <Suspense> boundary to avoid blocking the
 * page render.
 */
export async function SellerSection({ sellerId }: { sellerId: string }) {
  const api = await getServerApi();
  const seller = await api.users.getPublicProfile(sellerId).catch(() => null);
  if (!seller) return null;
  return <SellerCard seller={seller} />;
}

export function SellerCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <div className="mb-3 h-4 w-20 animate-pulse rounded bg-bg-elevated" />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-bg-elevated" />
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-bg-elevated" />
          <div className="h-3 w-24 animate-pulse rounded bg-bg-elevated" />
        </div>
      </div>
    </div>
  );
}
