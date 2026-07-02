'use client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/features/users/hooks/use-me';
import type { DorsalStatus } from '@dorsal/schemas';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function BuyButton({
  dorsalId,
  sellerId,
  status,
}: {
  dorsalId: string;
  sellerId: string;
  status: DorsalStatus;
}) {
  const t = useTranslations('buy_button');
  const { data } = useSession();
  const me = useMe();
  const userId = data?.user?.id ?? null;
  const localUserId = me.data?.id ?? userId;
  const checkoutHref = `/compra/checkout/${dorsalId}`;
  const unavailableReason =
    status !== 'published'
      ? 'not_available'
      : userId && me.isLoading
        ? 'checking_profile'
        : localUserId === sellerId
          ? 'own_dorsal'
          : null;

  if (unavailableReason) {
    return (
      <Button type="button" className="mt-5 w-full" disabled>
        <ShoppingCart />
        {t(unavailableReason)}
      </Button>
    );
  }

  const href = userId ? checkoutHref : `/login?callbackUrl=${encodeURIComponent(checkoutHref)}`;

  return (
    <Button asChild className="mt-5 w-full">
      <Link href={href}>
        <ShoppingCart />
        {t('buy')}
      </Link>
    </Button>
  );
}
