'use client';
import type { IncludedItems } from '@dorsal/schemas';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function IncludedItemsList({ items }: { items: IncludedItems }) {
  const t = useTranslations('included_items');
  const entries = Object.entries(items) as Array<[keyof IncludedItems, boolean]>;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2 text-sm">
          {v ? <Check className="h-4 w-4 text-olive" /> : <X className="h-4 w-4 text-text-muted" />}
          <span className={v ? '' : 'text-text-muted line-through'}>{t(k)}</span>
        </li>
      ))}
    </ul>
  );
}
