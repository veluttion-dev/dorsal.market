'use client';
import { Button } from '@/components/ui/button';
import { canBuyDorsal } from '@dorsal/domain';
import type { DorsalStatus } from '@dorsal/schemas';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const REASON_LABEL = {
  not_authenticated: 'Inicia sesion para comprar',
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
  const result = canBuyDorsal({
    userId: data?.user?.id ?? null,
    sellerId,
    status,
  });

  if (!result.ok) {
    return (
      <Button type="button" className="mt-5 w-full" disabled>
        <ShoppingCart />
        {REASON_LABEL[result.reason]}
      </Button>
    );
  }

  return (
    <Button asChild className="mt-5 w-full">
      <Link href={`/compra/checkout/${dorsalId}`}>
        <ShoppingCart />
        Comprar dorsal
      </Link>
    </Button>
  );
}
