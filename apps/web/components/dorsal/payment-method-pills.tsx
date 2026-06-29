'use client';
import type { PaymentMethod } from '@dorsal/schemas';
import { useTranslations } from 'next-intl';

export function PaymentMethodPills({ methods }: { methods: PaymentMethod[] }) {
  const t = useTranslations('payment_methods');
  return (
    <div className="flex flex-wrap gap-1.5">
      {methods.map((m) => (
        <span
          key={m}
          className="rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-xs text-text-secondary"
        >
          {t(m)}
        </span>
      ))}
    </div>
  );
}
