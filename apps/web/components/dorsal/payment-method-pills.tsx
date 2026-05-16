import type { PaymentMethod } from '@dorsal/schemas';

const LABELS: Record<PaymentMethod, string> = {
  bizum: 'Bizum',
  paypal: 'PayPal',
  card: 'Tarjeta',
};

export function PaymentMethodPills({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {methods.map((m) => (
        <span
          key={m}
          className="rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-xs text-text-secondary"
        >
          {LABELS[m]}
        </span>
      ))}
    </div>
  );
}
