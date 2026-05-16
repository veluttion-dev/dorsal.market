'use client';
import { Input } from '@/components/ui/input';

export interface PriceRangeValue {
  min?: number | undefined;
  max?: number | undefined;
}

export function PriceRange({
  min,
  max,
  onChange,
}: PriceRangeValue & { onChange: (next: PriceRangeValue) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        placeholder="Mín €"
        value={min ?? ''}
        onChange={(e) =>
          onChange({ min: e.target.value ? Number(e.target.value) : undefined, max })
        }
      />
      <span className="text-text-muted">—</span>
      <Input
        type="number"
        min={0}
        placeholder="Máx €"
        value={max ?? ''}
        onChange={(e) =>
          onChange({ min, max: e.target.value ? Number(e.target.value) : undefined })
        }
      />
    </div>
  );
}
