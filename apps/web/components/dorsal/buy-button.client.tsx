'use client';
import { Button } from '@/components/ui/button';
import type { DorsalStatus } from '@dorsal/schemas';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const REASON_LABEL = {
  own_dorsal: 'Es tu dorsal',
  not_available: 'No disponible',
} as const;

export function BuyButton({
  dorsalId,
  sellerId,
  status,
}: {
  dorsalId: string;
  sellerId: string;
  status: DorsalStatus;
}) {
  const { data } = useSession();
  const userId = data?.user?.id ?? null;
  const checkoutHref = `/compra/checkout/${dorsalId}`;
  const unavailableReason =
    status !== 'published' ? 'not_available' : userId === sellerId ? 'own_dorsal' : null;

  if (unavailableReason) {
    return (
      <Button type="button" className="mt-5 w-full" disabled>
        <ShoppingCart />
        {REASON_LABEL[unavailableReason]}
      </Button>
    );
  }

  const href = userId ? checkoutHref : `/login?callbackUrl=${encodeURIComponent(checkoutHref)}`;

  return (
    <Button asChild className="mt-5 w-full">
      <Link href={href}>
        <ShoppingCart />
        Comprar dorsal
      </Link>
    </Button>
  );
}
