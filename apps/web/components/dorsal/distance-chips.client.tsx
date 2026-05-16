'use client';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { cn } from '@/lib/utils';
import type { Distance } from '@dorsal/schemas';

const ALL: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];

export function DistanceChips({
  value,
  onChange,
}: {
  value: Distance[];
  onChange: (next: Distance[]) => void;
}) {
  function toggle(d: Distance) {
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {ALL.map((d) => {
        const active = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              active
                ? 'border-coral bg-coral-subtle text-coral'
                : 'border-border bg-bg-elevated text-text-secondary hover:border-border-hover',
            )}
          >
            {distanceLabel(d)}
          </button>
        );
      })}
    </div>
  );
}
