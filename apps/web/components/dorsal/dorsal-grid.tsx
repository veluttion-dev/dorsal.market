import type { DorsalSummary } from '@dorsal/schemas';
import { DorsalCard } from './dorsal-card';

export function DorsalGrid({ items }: { items: DorsalSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-text-secondary">No hay dorsales que coincidan con los filtros.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((d) => (
        <DorsalCard key={d.id} dorsal={d} />
      ))}
    </div>
  );
}
