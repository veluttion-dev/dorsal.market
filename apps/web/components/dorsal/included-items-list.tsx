import type { IncludedItems } from '@dorsal/schemas';
import { Check, X } from 'lucide-react';

const LABELS: Record<keyof IncludedItems, string> = {
  chip: 'Chip cronometraje',
  shirt: 'Camiseta',
  bag: 'Bolsa corredor',
  medal: 'Medalla finisher',
  refreshments: 'Avituallamientos',
};

export function IncludedItemsList({ items }: { items: IncludedItems }) {
  const entries = Object.entries(items) as Array<[keyof IncludedItems, boolean]>;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2 text-sm">
          {v ? <Check className="h-4 w-4 text-olive" /> : <X className="h-4 w-4 text-text-muted" />}
          <span className={v ? '' : 'text-text-muted line-through'}>{LABELS[k]}</span>
        </li>
      ))}
    </ul>
  );
}
