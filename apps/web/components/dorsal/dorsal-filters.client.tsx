'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Distance, PaymentMethod } from '@dorsal/schemas';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import { DistanceChips } from './distance-chips.client';
import { PriceRange } from './price-range.client';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];

/**
 * Filter sidebar. State lives entirely in the URL searchParams via nuqs, so the
 * server-rendered listing page picks it up and results are shareable.
 */
export function DorsalFilters() {
  const [q, setQ] = useQueryStates(
    {
      race_name: parseAsString,
      location: parseAsString,
      distance: parseAsArrayOf(parseAsStringEnum(distances)),
      price_min: parseAsInteger,
      price_max: parseAsInteger,
      payment_method: parseAsStringEnum(payments),
      page: parseAsInteger,
    },
    { history: 'push', shallow: false },
  );

  function clearAll() {
    void setQ({
      race_name: null,
      location: null,
      distance: null,
      price_min: null,
      price_max: null,
      payment_method: null,
      page: null,
    });
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Limpiar
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="race_name">Carrera</Label>
        <Input
          id="race_name"
          value={q.race_name ?? ''}
          onChange={(e) => void setQ({ race_name: e.target.value || null, page: null })}
          placeholder="Ej. Valencia"
        />
      </div>

      <div className="space-y-2">
        <Label>Distancia</Label>
        <DistanceChips
          value={(q.distance ?? []) as Distance[]}
          onChange={(next) => void setQ({ distance: next.length ? next : null, page: null })}
        />
      </div>

      <div className="space-y-2">
        <Label>Precio</Label>
        <PriceRange
          min={q.price_min ?? undefined}
          max={q.price_max ?? undefined}
          onChange={({ min, max }) =>
            void setQ({ price_min: min ?? null, price_max: max ?? null, page: null })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={q.location ?? ''}
          onChange={(e) => void setQ({ location: e.target.value || null, page: null })}
          placeholder="Ciudad"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Método de pago</Label>
        <select
          id="payment_method"
          value={q.payment_method ?? ''}
          onChange={(e) =>
            void setQ({
              payment_method: (e.target.value || null) as PaymentMethod | null,
              page: null,
            })
          }
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
        >
          <option value="">Cualquiera</option>
          <option value="bizum">Bizum</option>
          <option value="paypal">PayPal</option>
          <option value="card">Tarjeta</option>
        </select>
      </div>
    </aside>
  );
}
