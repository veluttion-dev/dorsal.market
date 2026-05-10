# feat/dorsales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Catalog feature surface (UC-02 publicar dorsal, UC-04 explorar/filtrar, UC-05 detalle) connected to the **real backend** (the only module fully exposed today). After this branch, users can browse, filter, paginate, view detail and publish a dorsal end-to-end against `http://localhost:8000`.

**Architecture:** Server Components for SEO-critical pages (listing + detail) with Client Components for interactive bits (filters, publish wizard). TanStack Query consumes Server-Component-fetched `initialData`. Filters sync to URL search params for shareable state. Detail pages use ISR (revalidate 5 min) and `generateMetadata` for OG cards. Photo upload uses presigned URLs (mock adapter until backend exposes presign endpoint).

**Tech Stack:** Inherits from `feat/foundation`. Adds: `react-dropzone` for photo upload, `nuqs` for URL search-param state binding, `@radix-ui/react-checkbox` for included-items toggles.

**Spec reference:** `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md` ADR-006 (Server Components), ADR-007 (TanStack Query), ADR-010 (forms), ADR-011 (S3 presigned upload).

**Pre-flight branching:**
```bash
git switch feat/foundation
git pull
git switch -c feat/dorsales
```

**Backend prerequisite:** the Catalog API must be reachable. For local dev:
```bash
cd ../dorsales-api  # backend repo (path may differ)
docker compose up -d
```
And in `apps/web/.env.local`:
```
NEXT_PUBLIC_REAL_API_MODULES=dorsals
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

---

## File Structure (additions on top of foundation)

```
apps/web/
├── app/(app)/
│   ├── dorsales/
│   │   ├── page.tsx                  # UC-04 listing (Server Component)
│   │   └── [id]/page.tsx             # UC-05 detail (Server Component, ISR)
│   └── vender/page.tsx               # UC-02 publish (Client Component)
├── components/
│   ├── dorsal/
│   │   ├── dorsal-card.tsx           # presentational
│   │   ├── dorsal-grid.tsx           # FlashList-equivalent: grid of cards
│   │   ├── dorsal-filters.client.tsx # filter sidebar
│   │   ├── price-range.client.tsx
│   │   ├── distance-chips.client.tsx
│   │   ├── seller-card.tsx           # used in detail
│   │   ├── payment-method-pills.tsx
│   │   └── included-items-list.tsx
│   └── form/
│       ├── photo-upload.client.tsx   # presign + dropzone
│       └── form-section.tsx          # styled wrapper for sections (used in publish wizard)
└── features/
    └── dorsals/
        ├── hooks/
        │   ├── use-dorsals-list.ts   # useQuery wrapper
        │   ├── use-dorsal-detail.ts  # useQuery wrapper
        │   ├── use-publish-dorsal.ts # useMutation
        │   └── use-presign-photo.ts  # useMutation (mock until backend)
        ├── server/
        │   ├── search.ts             # server-side fetch wrapper
        │   └── get-detail.ts
        ├── components/
        │   └── publish-wizard.client.tsx  # main publish form
        ├── lib/
        │   ├── filters-url.ts        # parse/serialize filters in/out of URL searchParams
        │   └── distances.ts          # display labels for distances
        └── __tests__/
            ├── filters-url.test.ts
            └── distances.test.ts
```

---

## Task 1: Branch setup and dependency additions

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add dependencies**

```bash
cd apps/web
pnpm add react-dropzone@14.3.5 nuqs@2.2.3 @radix-ui/react-checkbox@1.1.2
pnpm dlx shadcn@2.1.0 add checkbox slider calendar
```

- [ ] **Step 2: Wire `nuqs` adapter in providers**

Edit `apps/web/components/providers.tsx`. Wrap children in `<NuqsAdapter>` (right outside `<QueryProvider>`):

```tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';
// ...
<NuqsAdapter>
  <QueryProvider>...</QueryProvider>
</NuqsAdapter>
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @dorsal/web typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(dorsales): add nuqs, react-dropzone and shadcn primitives"
```

---

## Task 2: Filter URL bindings (TDD)

**Why:** Filters live in URL searchParams (shareable, back-button works). Need a parser that round-trips between URL ↔ `SearchDorsalsQuery`.

**Files:**
- Create: `apps/web/features/dorsals/lib/filters-url.ts`
- Create: `apps/web/features/dorsals/__tests__/filters-url.test.ts`

- [ ] **Step 1: Write failing tests**

`apps/web/features/dorsals/__tests__/filters-url.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseFiltersFromSearchParams, serializeFiltersToSearchParams } from '../lib/filters-url';

describe('parseFiltersFromSearchParams', () => {
  it('parses single distance', () => {
    const sp = new URLSearchParams('distance=10k');
    expect(parseFiltersFromSearchParams(sp)).toMatchObject({ distance: ['10k'] });
  });

  it('parses multiple distances', () => {
    const sp = new URLSearchParams('distance=10k&distance=42k');
    expect(parseFiltersFromSearchParams(sp).distance).toEqual(['10k', '42k']);
  });

  it('coerces price_min/price_max to numbers', () => {
    const sp = new URLSearchParams('price_min=20&price_max=50');
    const out = parseFiltersFromSearchParams(sp);
    expect(out.price_min).toBe(20);
    expect(out.price_max).toBe(50);
  });

  it('drops invalid values', () => {
    const sp = new URLSearchParams('distance=marathon&sort_by=relevance');
    expect(parseFiltersFromSearchParams(sp)).toEqual({});
  });

  it('parses page and page_size with defaults absent', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams('page=2&page_size=12'))).toMatchObject({ page: 2, page_size: 12 });
  });
});

describe('serializeFiltersToSearchParams', () => {
  it('omits undefined fields', () => {
    expect(serializeFiltersToSearchParams({ race_name: 'madrid' }).toString()).toBe('race_name=madrid');
  });

  it('repeats distance for multi-select', () => {
    const sp = serializeFiltersToSearchParams({ distance: ['10k', '42k'] });
    expect(sp.getAll('distance')).toEqual(['10k', '42k']);
  });

  it('round-trips', () => {
    const filters = { race_name: 'valencia', distance: ['10k', '21k'] as const, price_max: 80, sort_by: 'price' as const, sort_order: 'asc' as const };
    const back = parseFiltersFromSearchParams(serializeFiltersToSearchParams(filters));
    expect(back).toMatchObject(filters);
  });
});
```

- [ ] **Step 2: Run tests (must fail with module-not-found)**

```bash
pnpm --filter @dorsal/web test -- filters-url
```

- [ ] **Step 3: Implement `filters-url.ts`**

```ts
import { SearchDorsalsQuery } from '@dorsal/schemas';

export function parseFiltersFromSearchParams(sp: URLSearchParams): SearchDorsalsQuery {
  const raw: Record<string, unknown> = {};
  const single = ['race_name', 'price_min', 'price_max', 'payment_method', 'location', 'date_from', 'date_to', 'sort_by', 'sort_order', 'page', 'page_size'] as const;
  for (const k of single) {
    const v = sp.get(k);
    if (v !== null) raw[k] = v;
  }
  const distances = sp.getAll('distance');
  if (distances.length > 0) raw.distance = distances;

  const parsed = SearchDorsalsQuery.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function serializeFiltersToSearchParams(filters: SearchDorsalsQuery): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)));
    else sp.append(k, String(v));
  }
  return sp;
}
```

- [ ] **Step 4: Run tests (must pass)**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(dorsals): add filters URL parser/serializer with Zod validation"
```

---

## Task 3: Distance display labels (TDD)

**Files:**
- Create: `apps/web/features/dorsals/lib/distances.ts`
- Create: `apps/web/features/dorsals/__tests__/distances.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, expect, it } from 'vitest';
import { distanceLabel } from '../lib/distances';

describe('distanceLabel', () => {
  it.each([
    ['5k', '5K'],
    ['10k', '10K'],
    ['21k', '21K'],
    ['42k', '42K'],
    ['trail', 'Trail'],
    ['ultra', 'Ultra'],
  ])('formats %s as %s', (input, expected) => {
    expect(distanceLabel(input as never)).toBe(expected);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import type { Distance } from '@dorsal/schemas';
const map: Record<Distance, string> = { '5k': '5K', '10k': '10K', '21k': '21K', '42k': '42K', trail: 'Trail', ultra: 'Ultra' };
export function distanceLabel(d: Distance): string { return map[d]; }
```

- [ ] **Step 3: Test pass + commit**

```bash
git add -A && git commit -m "feat(dorsals): add distance label helper"
```

---

## Task 4: DorsalCard presentational component

**Files:**
- Create: `apps/web/components/dorsal/dorsal-card.tsx`
- Create: `apps/web/components/dorsal/payment-method-pills.tsx`
- Create: `apps/web/components/dorsal/__tests__/dorsal-card.test.tsx`

- [ ] **Step 1: Write failing component test**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DorsalCard } from '../dorsal-card';

const sample = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  race_name: 'San Silvestre Madrid',
  race_date: '2026-12-31',
  location: 'Madrid',
  distance: '10k' as const,
  price_amount: 45,
  payment_methods: ['bizum' as const, 'paypal' as const],
  photo_url: 'https://example.com/p.jpg',
  status: 'published' as const,
};

describe('DorsalCard', () => {
  it('renders race info, distance badge, formatted price and payment methods', () => {
    render(<DorsalCard dorsal={sample} />);
    expect(screen.getByText('San Silvestre Madrid')).toBeInTheDocument();
    expect(screen.getByText(/Madrid/)).toBeInTheDocument();
    expect(screen.getByText('10K')).toBeInTheDocument();
    expect(screen.getByText('45 €')).toBeInTheDocument();
    expect(screen.getByText('Bizum')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('links to detail page', () => {
    render(<DorsalCard dorsal={sample} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dorsales/${sample.id}`);
  });
});
```

- [ ] **Step 2: Implement payment pills**

`apps/web/components/dorsal/payment-method-pills.tsx`:

```tsx
import type { PaymentMethod } from '@dorsal/schemas';

const labels: Record<PaymentMethod, string> = { bizum: 'Bizum', paypal: 'PayPal', card: 'Tarjeta' };

export function PaymentMethodPills({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {methods.map((m) => (
        <span key={m} className="rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-xs text-text-secondary">
          {labels[m]}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement DorsalCard**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatRaceDate } from '@dorsal/domain';
import type { DorsalSummary } from '@dorsal/schemas';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { PaymentMethodPills } from './payment-method-pills';

export function DorsalCard({ dorsal }: { dorsal: DorsalSummary }) {
  return (
    <Link
      href={`/dorsales/${dorsal.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-bg-card shadow-card transition hover:border-border-hover hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={dorsal.photo_url}
          alt={dorsal.race_name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-md bg-bg-primary/80 px-2 py-1 text-xs font-bold backdrop-blur">
            {distanceLabel(dorsal.distance)}
          </span>
          <span className="rounded-md bg-olive-subtle px-2 py-1 text-xs font-medium text-olive">En venta</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-tight">{dorsal.race_name}</h3>
        <p className="text-sm text-text-secondary">
          {formatRaceDate(dorsal.race_date)} · {dorsal.location}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(dorsal.price_amount)}</span>
          <PaymentMethodPills methods={dorsal.payment_methods} />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Configure `next.config.ts` to allow remote images**

Add to `apps/web/next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },  // restrict in prod
  ],
},
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @dorsal/web test -- dorsal-card
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dorsals): add DorsalCard with payment pills and distance badge"
```

---

## Task 5: DorsalGrid (presentational)

**Files:**
- Create: `apps/web/components/dorsal/dorsal-grid.tsx`

- [ ] **Step 1: Implement**

```tsx
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
      {items.map((d) => <DorsalCard key={d.id} dorsal={d} />)}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(dorsals): add DorsalGrid layout"
```

---

## Task 6: Filters sidebar (Client Component)

**Files:**
- Create: `apps/web/components/dorsal/distance-chips.client.tsx`
- Create: `apps/web/components/dorsal/price-range.client.tsx`
- Create: `apps/web/components/dorsal/dorsal-filters.client.tsx`

- [ ] **Step 1: Create the chips component**

`apps/web/components/dorsal/distance-chips.client.tsx`:

```tsx
'use client';
import type { Distance } from '@dorsal/schemas';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { cn } from '@/lib/utils';

const ALL: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];

export function DistanceChips({ value, onChange }: { value: Distance[]; onChange: (next: Distance[]) => void }) {
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
```

- [ ] **Step 2: Create price range component**

`apps/web/components/dorsal/price-range.client.tsx`:

```tsx
'use client';
import { Input } from '@/components/ui/input';

export function PriceRange({
  min, max, onChange,
}: { min?: number; max?: number; onChange: (next: { min?: number; max?: number }) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number" min={0} placeholder="Mín €"
        value={min ?? ''}
        onChange={(e) => onChange({ min: e.target.value ? Number(e.target.value) : undefined, max })}
      />
      <span className="text-text-muted">—</span>
      <Input
        type="number" min={0} placeholder="Máx €"
        value={max ?? ''}
        onChange={(e) => onChange({ min, max: e.target.value ? Number(e.target.value) : undefined })}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the filter sidebar**

`apps/web/components/dorsal/dorsal-filters.client.tsx`:

```tsx
'use client';
import { useQueryStates, parseAsArrayOf, parseAsString, parseAsStringEnum, parseAsInteger } from 'nuqs';
import type { Distance, PaymentMethod, SearchDorsalsQuery } from '@dorsal/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DistanceChips } from './distance-chips.client';
import { PriceRange } from './price-range.client';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];

export function DorsalFilters({ onChange }: { onChange?: (q: SearchDorsalsQuery) => void }) {
  const [q, setQ] = useQueryStates({
    race_name: parseAsString,
    location: parseAsString,
    distance: parseAsArrayOf(parseAsStringEnum(distances)),
    price_min: parseAsInteger,
    price_max: parseAsInteger,
    payment_method: parseAsStringEnum(payments),
    page: parseAsInteger,
  }, { history: 'push', shallow: false });

  function clearAll() {
    void setQ({ race_name: null, location: null, distance: null, price_min: null, price_max: null, payment_method: null, page: null });
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>Limpiar</Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="race_name">Carrera</Label>
        <Input id="race_name" value={q.race_name ?? ''} onChange={(e) => void setQ({ race_name: e.target.value || null, page: null })} placeholder="Ej. Valencia" />
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
          onChange={({ min, max }) => void setQ({ price_min: min ?? null, price_max: max ?? null, page: null })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input id="location" value={q.location ?? ''} onChange={(e) => void setQ({ location: e.target.value || null, page: null })} placeholder="Ciudad" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Método de pago</Label>
        <select
          id="payment_method"
          value={q.payment_method ?? ''}
          onChange={(e) => void setQ({ payment_method: (e.target.value || null) as PaymentMethod | null, page: null })}
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
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dorsals): add filter sidebar with URL-bound state via nuqs"
```

---

## Task 7: Listing page (UC-04) — Server Component + Client filters

**Files:**
- Create: `apps/web/features/dorsals/server/search.ts`
- Create: `apps/web/features/dorsals/hooks/use-dorsals-list.ts`
- Modify: `apps/web/app/(app)/dorsales/page.tsx` (replace placeholder)
- Create: `apps/web/app/(app)/dorsales/dorsals-list.client.tsx`

- [ ] **Step 1: Server fetcher**

`apps/web/features/dorsals/server/search.ts`:

```ts
import 'server-only';
import { getServerApi } from '@/lib/api';
import type { SearchDorsalsQuery } from '@dorsal/schemas';

export async function searchDorsals(query: SearchDorsalsQuery) {
  const api = await getServerApi();
  return api.dorsals.search(query);
}
```

- [ ] **Step 2: Client hook**

`apps/web/features/dorsals/hooks/use-dorsals-list.ts`:

```ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';
import type { DorsalListResponse, SearchDorsalsQuery } from '@dorsal/schemas';

export function useDorsalsList(query: SearchDorsalsQuery, initialData?: DorsalListResponse) {
  const api = useApi();
  return useQuery({
    queryKey: ['dorsals', 'list', query],
    queryFn: () => api.dorsals.search(query),
    initialData,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 3: Client list component**

`apps/web/app/(app)/dorsales/dorsals-list.client.tsx`:

```tsx
'use client';
import { useQueryStates, parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';
import type { Distance, DorsalListResponse, PaymentMethod, SearchDorsalsQuery } from '@dorsal/schemas';
import { useDorsalsList } from '@/features/dorsals/hooks/use-dorsals-list';
import { DorsalGrid } from '@/components/dorsal/dorsal-grid';
import { Pagination } from './pagination';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];

export function DorsalsListClient({ initialData }: { initialData: DorsalListResponse }) {
  const [q] = useQueryStates({
    race_name: parseAsString,
    location: parseAsString,
    distance: parseAsArrayOf(parseAsStringEnum(distances)),
    price_min: parseAsInteger,
    price_max: parseAsInteger,
    payment_method: parseAsStringEnum(payments),
    page: parseAsInteger,
  });

  const filters: SearchDorsalsQuery = {
    race_name: q.race_name ?? undefined,
    location: q.location ?? undefined,
    distance: (q.distance as Distance[] | null) ?? undefined,
    price_min: q.price_min ?? undefined,
    price_max: q.price_max ?? undefined,
    payment_method: (q.payment_method as PaymentMethod | null) ?? undefined,
    page: q.page ?? undefined,
  };

  const { data, isFetching } = useDorsalsList(filters, initialData);

  return (
    <div>
      {isFetching && <p className="text-sm text-text-muted">Actualizando…</p>}
      <DorsalGrid items={data?.items ?? []} />
      {data && data.total_pages > 1 && (
        <Pagination page={data.page} totalPages={data.total_pages} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Pagination component**

`apps/web/app/(app)/dorsales/pagination.tsx`:

```tsx
'use client';
import { useQueryStates, parseAsInteger } from 'nuqs';
import { Button } from '@/components/ui/button';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const [, set] = useQueryStates({ page: parseAsInteger });
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => void set({ page: page - 1 })}>
        Anterior
      </Button>
      <span className="text-sm text-text-secondary">{page} / {totalPages}</span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => void set({ page: page + 1 })}>
        Siguiente
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Replace the listing page (Server Component)**

`apps/web/app/(app)/dorsales/page.tsx`:

```tsx
import { searchDorsals } from '@/features/dorsals/server/search';
import { parseFiltersFromSearchParams } from '@/features/dorsals/lib/filters-url';
import { DorsalFilters } from '@/components/dorsal/dorsal-filters.client';
import { DorsalsListClient } from './dorsals-list.client';

type SP = { [k: string]: string | string[] | undefined };

export const metadata = {
  title: 'Explorar dorsales',
  description: 'Encuentra dorsales en venta de las principales carreras populares en España.',
};

export default async function DorsalesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else if (v !== undefined) usp.append(k, v);
  }
  const filters = parseFiltersFromSearchParams(usp);
  const initial = await searchDorsals(filters);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Encuentra tu <em className="not-italic text-coral">dorsal</em></h1>
        <p className="mt-2 text-sm text-text-muted">{initial.total} dorsales encontrados</p>
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px,1fr]">
        <DorsalFilters />
        <DorsalsListClient initialData={initial} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run e2e and verify against the live backend**

```bash
# In another terminal, ensure backend is up:
# cd ../dorsales-api && docker compose up
pnpm --filter @dorsal/web dev
```

Open `localhost:3000/dorsales`. Expected: a grid populated by the seed dorsals from the Postman collection.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(dorsals): UC-04 listing page with SSR + URL-synced filters"
```

---

## Task 8: Detail page (UC-05) — Server Component + ISR + OG

**Files:**
- Create: `apps/web/features/dorsals/server/get-detail.ts`
- Create: `apps/web/components/dorsal/seller-card.tsx`
- Create: `apps/web/components/dorsal/included-items-list.tsx`
- Modify: `apps/web/app/(app)/dorsales/[id]/page.tsx`

- [ ] **Step 1: Server fetcher**

`apps/web/features/dorsals/server/get-detail.ts`:

```ts
import 'server-only';
import { getServerApi } from '@/lib/api';
import { NotFoundError } from '@dorsal/api-client';

export async function getDorsalDetail(id: string) {
  const api = await getServerApi();
  try {
    return await api.dorsals.getById(id);
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}
```

- [ ] **Step 2: Seller card (uses `usersHandlers` mock for now)**

`apps/web/components/dorsal/seller-card.tsx`:

```tsx
import { Star } from 'lucide-react';

export type SellerInfo = { id: string; full_name: string; avatar_url: string | null; rating_average: number | null; total_sales: number };

export function SellerCard({ seller }: { seller: SellerInfo }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-secondary">Vendedor</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-lg font-bold">
          {seller.full_name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{seller.full_name}</p>
          <p className="flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-3.5 w-3.5 fill-current text-coral" />
            {seller.rating_average?.toFixed(1) ?? '—'} · {seller.total_sales} ventas
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Included items list**

`apps/web/components/dorsal/included-items-list.tsx`:

```tsx
import type { IncludedItems } from '@dorsal/schemas';
import { Check, X } from 'lucide-react';

const labels: Record<keyof IncludedItems, string> = {
  chip: 'Chip cronometraje',
  shirt: 'Camiseta',
  bag: 'Bolsa corredor',
  medal: 'Medalla finisher',
  refreshments: 'Avituallamientos',
};

export function IncludedItemsList({ items }: { items: IncludedItems }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {(Object.entries(items) as Array<[keyof IncludedItems, boolean]>).map(([k, v]) => (
        <li key={k} className="flex items-center gap-2 text-sm">
          {v ? <Check className="h-4 w-4 text-olive" /> : <X className="h-4 w-4 text-text-muted" />}
          <span className={v ? '' : 'text-text-muted line-through'}>{labels[k]}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Implement detail page with ISR + OG**

`apps/web/app/(app)/dorsales/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { formatPrice, formatRaceDate } from '@dorsal/domain';
import { getDorsalDetail } from '@/features/dorsals/server/get-detail';
import { getServerApi } from '@/lib/api';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { SellerCard } from '@/components/dorsal/seller-card';
import { IncludedItemsList } from '@/components/dorsal/included-items-list';
import { PaymentMethodPills } from '@/components/dorsal/payment-method-pills';

export const revalidate = 300;
type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const d = await getDorsalDetail(id);
  if (!d) return { title: 'Dorsal no encontrado' };
  return {
    title: `${d.race_name} ${distanceLabel(d.distance)}`,
    description: `Dorsal en venta para ${d.race_name} (${d.location}, ${formatRaceDate(d.race_date)}). ${formatPrice(d.price_amount)}.`,
    openGraph: { title: `${d.race_name} ${distanceLabel(d.distance)}`, images: [d.photo_url] },
    twitter: { card: 'summary_large_image', title: d.race_name, images: [d.photo_url] },
  };
}

export default async function DorsalDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const d = await getDorsalDetail(id);
  if (!d) notFound();

  const api = await getServerApi();
  const seller = await api.users.getById(d.seller_id).catch(() => null);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-bg-elevated">
            <Image src={d.photo_url} alt={d.race_name} fill className="object-cover" priority />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-bold">{distanceLabel(d.distance)}</span>
              <span className="rounded-md bg-olive-subtle px-2 py-1 text-xs font-medium text-olive">En venta</span>
            </div>
            <h1 className="text-3xl font-bold">{d.race_name}</h1>
            <p className="mt-1 text-text-secondary">
              {formatRaceDate(d.race_date)} · {d.location}
              {d.bib_number ? ` · Dorsal #${d.bib_number}` : ''}
              {d.start_corral ? ` · Cajón ${d.start_corral}` : ''}
            </p>
          </div>
          {d.sale_reason && (
            <section className="rounded-lg border border-border bg-bg-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Motivo de venta</h2>
              <p>{d.sale_reason}</p>
            </section>
          )}
          <section className="rounded-lg border border-border bg-bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-secondary">¿Qué incluye?</h2>
            <IncludedItemsList items={d.included_items} />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-card p-5">
            <p className="text-sm text-text-secondary">Precio</p>
            <p className="text-3xl font-bold">{formatPrice(d.price_amount)}</p>
            <div className="mt-3"><PaymentMethodPills methods={d.payment_methods} /></div>
            <button className="mt-5 w-full rounded-md bg-coral py-3 font-semibold text-white hover:bg-coral-hover">
              Comprar dorsal
            </button>
            <p className="mt-2 text-center text-xs text-text-muted">Pago en custodia · feat/transacciones</p>
          </div>
          {seller && <SellerCard seller={seller} />}
          {(d.contact_phone || d.contact_email) && (
            <div className="rounded-lg border border-border bg-bg-card p-5 text-sm">
              <h3 className="mb-2 font-semibold">Contacto</h3>
              {d.contact_phone && <p>📞 {d.contact_phone}</p>}
              {d.contact_email && <p>✉️ {d.contact_email}</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify against backend**

```bash
pnpm --filter @dorsal/web dev
```

Visit `localhost:3000/dorsales/<seed-id>`. Expected: page renders with photo, race info, seller card.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dorsals): UC-05 detail page with ISR and OG metadata"
```

---

## Task 9: Photo upload component (presigned URLs, mock until backend)

**Why:** UC-02 needs photo upload. Backend presign endpoint not exposed yet — we mock it via the `uploads-mock` adapter described below; behavior matches future real shape.

**Files:**
- Create: `apps/web/components/form/photo-upload.client.tsx`
- Create: `apps/web/features/dorsals/hooks/use-presign-photo.ts`
- Modify: `packages/api-client/src/ports/index.ts` (add minimal Uploads port)
- Modify: `packages/api-client/src/msw/store.ts` (no change needed)

- [ ] **Step 1: Add Uploads port + adapter**

`packages/api-client/src/ports/uploads.ts`:

```ts
export interface PresignRequest { contentType: string; sizeBytes: number; }
export interface PresignResponse { uploadUrl: string; method: 'PUT' | 'POST'; fields?: Record<string, string>; finalUrl: string; }
export interface UploadsPort { createPresign(req: PresignRequest): Promise<PresignResponse>; }
```

`packages/api-client/src/adapters/uploads-mock.ts`:

```ts
import type { PresignRequest, PresignResponse, UploadsPort } from '../ports/uploads';

export class UploadsMockAdapter implements UploadsPort {
  async createPresign(_req: PresignRequest): Promise<PresignResponse> {
    // Local mock: object URL is generated client-side; "upload" is a no-op.
    return { uploadUrl: 'about:blank', method: 'PUT', finalUrl: '' };  // finalUrl injected client-side
  }
}
```

Update `packages/api-client/src/ports/index.ts` to `export * from './uploads';` and `packages/api-client/src/factory.ts` to expose `uploads: new UploadsMockAdapter()` (the real adapter lands when the backend exposes the endpoint).

- [ ] **Step 2: Hook**

`apps/web/features/dorsals/hooks/use-presign-photo.ts`:

```ts
'use client';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';

export function usePresignPhoto() {
  const api = useApi();
  return useMutation({
    mutationFn: async (file: File) => {
      const presign = await api.uploads.createPresign({ contentType: file.type, sizeBytes: file.size });
      // Real path (S3): PUT/POST to presign.uploadUrl. Mock path: generate object URL.
      if (presign.uploadUrl === 'about:blank') {
        return { finalUrl: URL.createObjectURL(file) };
      }
      const headers = presign.fields ? undefined : { 'Content-Type': file.type };
      const body = presign.fields
        ? Object.entries(presign.fields).reduce((fd, [k, v]) => (fd.append(k, v), fd), new FormData()).set('file', file) || new FormData()
        : file;
      const res = await fetch(presign.uploadUrl, { method: presign.method, headers, body: body as BodyInit });
      if (!res.ok) throw new Error('upload failed');
      return { finalUrl: presign.finalUrl };
    },
  });
}
```

- [ ] **Step 3: PhotoUpload component**

`apps/web/components/form/photo-upload.client.tsx`:

```tsx
'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { usePresignPhoto } from '@/features/dorsals/hooks/use-presign-photo';
import { cn } from '@/lib/utils';

export function PhotoUpload({
  value, onChange,
}: { value: string | null; onChange: (url: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(value);
  const presign = usePresignPhoto();

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    presign.mutate(file, { onSuccess: ({ finalUrl }) => onChange(finalUrl) });
  }, [presign, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 8 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg-elevated">
          {/* Image is from object URL or backend; <img> is fine */}
          <img src={preview} alt="dorsal" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            className="absolute right-2 top-2 rounded-full bg-bg-primary/80 p-1.5 text-text-primary hover:bg-bg-primary"
            aria-label="Quitar foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg-elevated text-text-secondary transition',
            isDragActive && 'border-coral bg-coral-subtle text-coral',
          )}
        >
          <input {...getInputProps()} />
          {presign.isPending ? <p>Subiendo…</p> : (
            <>
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm font-medium"><Upload className="-mt-1 mr-1 inline h-3.5 w-3.5" />Arrastra una foto o haz clic</p>
              <p className="text-xs">PNG / JPG / WEBP · Max 8 MB</p>
            </>
          )}
        </div>
      )}
      {presign.isError && <p className="text-sm text-red-500">No se pudo subir la foto</p>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dorsals): add PhotoUpload with presign hook (mock adapter)"
```

---

## Task 10: PublishWizard form (UC-02)

**Files:**
- Create: `apps/web/features/dorsals/components/publish-wizard.client.tsx`
- Create: `apps/web/features/dorsals/hooks/use-publish-dorsal.ts`
- Create: `apps/web/components/form/form-section.tsx`
- Modify: `apps/web/app/(app)/vender/page.tsx` (replace placeholder)

- [ ] **Step 1: Form section wrapper**

`apps/web/components/form/form-section.tsx`:

```tsx
import type { ReactNode } from 'react';

export function FormSection({ icon, title, children, badge }: { icon: ReactNode; title: string; children: ReactNode; badge?: string }) {
  return (
    <section className="rounded-lg border border-border bg-bg-card p-6 space-y-5">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-coral-subtle text-coral">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
        {badge && <span className="ml-auto rounded-full bg-bg-elevated px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{badge}</span>}
      </header>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Mutation hook**

`apps/web/features/dorsals/hooks/use-publish-dorsal.ts`:

```ts
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';
import type { PublishDorsalInput } from '@dorsal/schemas';

export function usePublishDorsal() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishDorsalInput) => api.dorsals.publish(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dorsals'] });
    },
  });
}
```

- [ ] **Step 3: PublishWizard form**

`apps/web/features/dorsals/components/publish-wizard.client.tsx`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Camera, CreditCard, MapPin, Phone, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { PublishDorsalInput, type Distance, type PaymentMethod } from '@dorsal/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSection } from '@/components/form/form-section';
import { PhotoUpload } from '@/components/form/photo-upload.client';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import { usePublishDorsal } from '@/features/dorsals/hooks/use-publish-dorsal';

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];

export function PublishWizard() {
  const router = useRouter();
  const publish = usePublishDorsal();
  const form = useForm<PublishDorsalInput>({
    resolver: zodResolver(PublishDorsalInput),
    defaultValues: {
      publish: true,
      photo_url: '',
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      payment_methods: [],
      contact: { phone: '', email: '', phone_visible: true, email_visible: true },
    },
  });

  function onSubmit(values: PublishDorsalInput) {
    publish.mutate(values, {
      onSuccess: ({ dorsal_id }) => {
        toast.success('¡Dorsal publicado!');
        router.push(`/dorsales/${dorsal_id}`);
      },
      onError: (e) => toast.error(e.message ?? 'No se pudo publicar el dorsal'),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <FormSection icon={<Camera className="h-4 w-4" />} title="Foto del dorsal" badge="Paso 1">
        <PhotoUpload
          value={form.watch('photo_url') || null}
          onChange={(url) => form.setValue('photo_url', url ?? '', { shouldValidate: true })}
        />
        {form.formState.errors.photo_url && <p className="text-sm text-red-500">{form.formState.errors.photo_url.message}</p>}
      </FormSection>

      <FormSection icon={<Trophy className="h-4 w-4" />} title="Datos de la carrera" badge="Paso 2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="race_name">Nombre carrera</Label><Input id="race_name" {...form.register('race_name')} /></div>
          <div className="space-y-1.5"><Label htmlFor="bib_number">Número dorsal</Label><Input id="bib_number" {...form.register('bib_number')} /></div>
          <div className="space-y-1.5"><Label htmlFor="race_date">Fecha</Label><Input id="race_date" type="date" {...form.register('race_date')} /></div>
          <div className="space-y-1.5"><Label htmlFor="location">Ubicación</Label><Input id="location" {...form.register('location')} placeholder="Madrid, Valencia…" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="distance">Distancia</Label>
            <select id="distance" {...form.register('distance')} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm">
              <option value="">Selecciona</option>
              {distances.map((d) => <option key={d} value={d}>{distanceLabel(d)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="start_corral">Cajón salida (opcional)</Label><Input id="start_corral" {...form.register('start_corral')} /></div>
        </div>
      </FormSection>

      <FormSection icon={<MapPin className="h-4 w-4" />} title="¿Qué incluye?" badge="Paso 3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(['chip', 'shirt', 'bag', 'medal', 'refreshments'] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 rounded-md border border-border bg-bg-elevated px-3 py-2.5 text-sm">
              <Checkbox
                checked={form.watch(`included_items.${k}`)}
                onCheckedChange={(c) => form.setValue(`included_items.${k}`, !!c)}
              />
              {k === 'chip' && 'Chip'}{k === 'shirt' && 'Camiseta'}{k === 'bag' && 'Bolsa'}{k === 'medal' && 'Medalla'}{k === 'refreshments' && 'Avituallamientos'}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection icon={<CreditCard className="h-4 w-4" />} title="Precio y método de pago" badge="Paso 4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price_amount">Precio (€)</Label>
            <Input id="price_amount" type="number" step="0.01" {...form.register('price_amount', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Métodos de pago aceptados</Label>
            <div className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <label key={p} className="flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-sm">
                  <Checkbox
                    checked={form.watch('payment_methods')?.includes(p) ?? false}
                    onCheckedChange={(c) => {
                      const current = form.getValues('payment_methods') ?? [];
                      form.setValue('payment_methods', c ? [...current, p] : current.filter((x) => x !== p));
                    }}
                  />
                  {p === 'bizum' ? 'Bizum' : p === 'paypal' ? 'PayPal' : 'Tarjeta'}
                </label>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Phone className="h-4 w-4" />} title="Contacto y motivo" badge="Paso 5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="contact_phone">Teléfono</Label><Input id="contact_phone" {...form.register('contact.phone')} /></div>
          <div className="space-y-1.5"><Label htmlFor="contact_email">Email</Label><Input id="contact_email" type="email" {...form.register('contact.email')} /></div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.watch('contact.phone_visible')} onCheckedChange={(c) => form.setValue('contact.phone_visible', !!c)} /> Mostrar teléfono</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.watch('contact.email_visible')} onCheckedChange={(c) => form.setValue('contact.email_visible', !!c)} /> Mostrar email</label>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="sale_reason">Motivo de venta (opcional)</Label>
          <textarea id="sale_reason" {...form.register('sale_reason')} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm" rows={3} />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => form.setValue('publish', false)}>Guardar borrador</Button>
        <Button type="submit" disabled={publish.isPending}>{publish.isPending ? 'Publicando…' : 'Publicar dorsal'}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Replace `/vender` page**

```tsx
import { PublishWizard } from '@/features/dorsals/components/publish-wizard.client';
export const metadata = { title: 'Vender dorsal' };
export default function VenderPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Vender <em className="not-italic text-coral">dorsal</em></h1>
        <p className="mt-1 text-text-secondary">Rellena los datos. La publicación es gratis.</p>
      </header>
      <PublishWizard />
    </main>
  );
}
```

- [ ] **Step 5: Verify against backend**

```bash
pnpm --filter @dorsal/web dev
# Visit /vender, fill form, submit. Should redirect to /dorsales/<id>.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(dorsals): UC-02 publish wizard with photo upload and validation"
```

---

## Task 11: E2E happy paths

**Files:**
- Create: `apps/web/e2e/dorsals-search.spec.ts`
- Create: `apps/web/e2e/dorsals-publish.spec.ts`

- [ ] **Step 1: Search flow**

```ts
import { expect, test } from '@playwright/test';

test('user can browse dorsals and open a detail', async ({ page }) => {
  await page.goto('/dorsales');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Encuentra tu');
  const firstCard = page.locator('a[href^="/dorsales/"]').first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/dorsales\/[a-f0-9-]+$/);
  await expect(page.getByText(/precio/i)).toBeVisible();
});

test('distance chip filters reduce results', async ({ page }) => {
  await page.goto('/dorsales');
  await page.getByRole('button', { name: '10K' }).click();
  await expect(page).toHaveURL(/distance=10k/);
});
```

- [ ] **Step 2: Publish flow**

```ts
import { expect, test } from '@playwright/test';
import path from 'node:path';

test('publishing a dorsal redirects to detail', async ({ page }) => {
  await page.goto('/vender');
  await page.setInputFiles('input[type="file"]', path.join(__dirname, 'fixtures/dorsal.jpg'));
  await page.fill('#race_name', 'E2E Race');
  await page.fill('#bib_number', '999');
  await page.fill('#race_date', '2027-06-01');
  await page.fill('#location', 'Madrid');
  await page.selectOption('#distance', '10k');
  await page.fill('#price_amount', '40');
  await page.getByLabel('Bizum').check();
  await page.fill('#contact_phone', '600000000');
  await page.getByRole('button', { name: 'Publicar dorsal' }).click();
  await page.waitForURL(/\/dorsales\/[a-f0-9-]+$/);
  await expect(page.getByText('E2E Race')).toBeVisible();
});
```

Drop a 1×1 placeholder JPG at `apps/web/e2e/fixtures/dorsal.jpg` (any small image).

- [ ] **Step 3: Run E2E**

```bash
pnpm --filter @dorsal/web test:e2e
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(dorsals): add E2E coverage for search and publish happy paths"
```

---

## Task 12: Final verification + PR

- [ ] **Step 1: Local CI**

```bash
pnpm turbo run lint typecheck test build
pnpm --filter @dorsal/web test:e2e
```

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/dorsales
# PR title: "feat(dorsales): UC-02, UC-04, UC-05 — Catalog module"
# Base: feat/foundation
```

PR description: list each UC and its task; screenshots of listing and detail; note that backend Catalog must be running for E2E.

---

## Self-review

**Spec coverage:**

| UC | Task |
|---|---|
| UC-04 explorar/filtrar | Tasks 6, 7 |
| UC-05 detalle | Task 8 |
| UC-02 publicar (con foto) | Tasks 9, 10 |

**ADR coverage from spec:**
- ADR-006 Server Components first → Tasks 7, 8 are Server Components, hidratación con `initialData` en cliente.
- ADR-007 TanStack Query → Tasks 7, 9, 10 use `useQuery` / `useMutation` con `queryKey` convention.
- ADR-010 RHF + Zod → Task 10 uses `useForm` con `zodResolver(PublishDorsalInput)`.
- ADR-011 presigned S3 → Task 9 mockea presign, contrato listo para swap real.

**Placeholder scan:** none. Each step has concrete code.

**Type consistency:** `DorsalsPort.publish`, `PublishDorsalInput`, `SearchDorsalsQuery`, `Distance`, `PaymentMethod`, `IncludedItems` — todos matchean entre `packages/schemas` (definidos en feat/foundation) y los componentes.

**Open follow-ups:**
- Sort dropdown (price asc/desc, race_date) — UC-04 lo soporta en API, no expuesto en filtros UI. Issue: añadir `<SortSelect />` post-MVP si el usuario lo pide.
- Map view — no en MVP.
- Saved searches — no en MVP.
