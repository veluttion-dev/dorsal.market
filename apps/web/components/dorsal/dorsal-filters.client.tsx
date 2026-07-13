'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FILTER_PARSERS } from '@/features/dorsals/lib/filter-parsers.client';
import type { Distance } from '@dorsal/schemas';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { DistanceChips } from './distance-chips.client';
import { PriceRange } from './price-range.client';

export function DorsalFilters() {
  const t = useTranslations('filters');
  const [q, setQ] = useQueryStates(FILTER_PARSERS);

  function clearAll() {
    void setQ(null);
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('title')}</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          {t('clear')}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="race_name">{t('race_label')}</Label>
        <Input
          id="race_name"
          value={q.race_name ?? ''}
          onChange={(e) => void setQ({ race_name: e.target.value || null, page: null })}
          placeholder={t('race_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('distance_label')}</Label>
        <DistanceChips
          value={(q.distance ?? []) as Distance[]}
          onChange={(next) => void setQ({ distance: next.length ? next : null, page: null })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('price_label')}</Label>
        <PriceRange
          min={q.price_min ?? undefined}
          max={q.price_max ?? undefined}
          onChange={({ min, max }) =>
            void setQ({ price_min: min ?? null, price_max: max ?? null, page: null })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t('location_label')}</Label>
        <Input
          id="location"
          value={q.location ?? ''}
          onChange={(e) => void setQ({ location: e.target.value || null, page: null })}
          placeholder={t('location_placeholder')}
        />
      </div>
    </aside>
  );
}
