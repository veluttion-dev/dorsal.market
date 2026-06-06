# feat/transacciones Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the current `feat/transacciones` branch so it can merge cleanly into `feat/foundation` and become a stable base for `feat/usuarios`.

**Architecture:** Keep Transaction responsible for purchase/sale orchestration, Stripe Connect onboarding, reservation, tracking, and robust API states. Do not move user profile forms into this branch; instead, expose clear UX placeholders and integration contracts for `feat/usuarios` to fill. Preserve current repo patterns: Zod schemas, API client ports/adapters, TanStack Query hooks, client components for interactive flows, and Vitest/Playwright coverage.

**Tech Stack:** Next.js App Router, React Hook Form, TanStack Query, NextAuth/Auth.js, MSW, Vitest, Playwright, Biome, `@dorsal/api-client`, `@dorsal/schemas`, `@dorsal/domain`.

---

## Review Inputs

These notes came from manual QA of the current `feat/transacciones` flow:

- Note 1: Returning from `/vender/onboarding` to `/vender` should preserve any draft data already typed into the sell form.
- Note 2: `/vender/onboarding` is incomplete against the original plan: it should show Stripe Connect account state and explain what the CTA result means.
- Note 3: The onboarding CTA can throw `NetworkError: Failed to fetch` instead of showing a controlled state when Transaction backend is unavailable.
- Note 4: Checkout can fail on `reserveListing` with `HTTP 400`; backend logs showed `Dorsal ... is not available (status: published)`, so UI/backend availability rules need alignment or at least a controlled error.
- Note 5: Checkout feels too thin without buyer operation data, but most of that belongs to `feat/usuarios`. This plan only prepares the integration surface.

---

## Branch Ownership

| Concern | Primary Branch | Dependency |
|---|---|---|
| Seller Stripe Connect onboarding state and API errors | `feat/transacciones` | Backend Transaction |
| Persist sell form when navigating to onboarding | `feat/transacciones` integration fix | `feat/dorsales` owns original publish form |
| Reservation API error handling and contract checks | `feat/transacciones` | Backend Transaction and Catalog |
| Buyer identity/profile data before purchase | `feat/usuarios` | `feat/transacciones` should show dependency clearly |
| Final auth guard behavior | `feat/usuarios` | Temporary local preview bypass must not be a merge requirement |

---

## File Structure

```text
apps/web/
  app/(app)/vender/page.tsx
  app/(app)/vender/onboarding/page.tsx
  features/dorsals/components/publish-wizard.client.tsx
  features/dorsals/components/__tests__/publish-wizard.test.tsx
  features/dorsals/lib/publish-draft-storage.ts
  features/dorsals/lib/__tests__/publish-draft-storage.test.ts
  features/transactions/components/checkout-form.client.tsx
  features/transactions/components/__tests__/checkout-form.test.tsx
  features/transactions/components/buyer-data-notice.client.tsx
  features/transactions/lib/environment.ts
  features/transactions/lib/errors.ts
  features/transactions/lib/__tests__/errors.test.ts
  features/transactions/hooks/use-onboard-seller.ts
  components/dorsal/buy-button.client.tsx

packages/api-client/src/
  errors.ts
  __tests__/http.test.ts

docs/
  reviews/2026-05-24-feat-transacciones-qa-notes.md
```

---

## Task 1: Persist `/vender` Draft Across Onboarding Navigation

**Files:**
- Create: `apps/web/features/dorsals/lib/publish-draft-storage.ts`
- Create: `apps/web/features/dorsals/lib/__tests__/publish-draft-storage.test.ts`
- Modify: `apps/web/features/dorsals/components/publish-wizard.client.tsx`
- Modify: `apps/web/features/dorsals/components/__tests__/publish-wizard.test.tsx`
- Modify: `apps/web/app/(app)/vender/page.tsx`

- [ ] **Step 1: Add storage helper tests**

Create `apps/web/features/dorsals/lib/__tests__/publish-draft-storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PUBLISH_DRAFT_STORAGE_KEY,
  clearPublishDraft,
  loadPublishDraft,
  savePublishDraft,
} from '../publish-draft-storage';

describe('publish draft storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads form-shaped draft values', () => {
    savePublishDraft({
      publish: true,
      photo_url: 'https://example.com/photo.jpg',
      race_name: 'Media Madrid',
      bib_number: '42',
      race_date: '2027-04-12',
      location: 'Madrid',
      distance: '21k',
      start_corral: 'B',
      included_items: { chip: true, shirt: false, bag: false, medal: true, refreshments: true },
      price_amount: 45,
      payment_methods: ['bizum'],
      contact: { phone: '600000000', email: '', phone_visible: true, email_visible: true },
      sale_reason: 'Viaje de trabajo',
    });

    expect(loadPublishDraft()?.race_name).toBe('Media Madrid');
    expect(localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY)).toContain('Media Madrid');
  });

  it('returns null and clears corrupted local storage', () => {
    localStorage.setItem(PUBLISH_DRAFT_STORAGE_KEY, '{bad json');

    expect(loadPublishDraft()).toBeNull();
    expect(localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('clears the saved draft', () => {
    savePublishDraft({ publish: true, photo_url: 'https://example.com/photo.jpg' });

    clearPublishDraft();

    expect(loadPublishDraft()).toBeNull();
  });
});
```

- [ ] **Step 2: Implement the storage helper**

Create `apps/web/features/dorsals/lib/publish-draft-storage.ts`:

```ts
import type { PublishDorsalInput } from '@dorsal/schemas';

export const PUBLISH_DRAFT_STORAGE_KEY = 'dorsal.market.publish-draft.v1';

type PublishDraft = Partial<PublishDorsalInput>;

export function loadPublishDraft(): PublishDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublishDraft;
  } catch {
    window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function savePublishDraft(value: PublishDraft) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUBLISH_DRAFT_STORAGE_KEY, JSON.stringify(value));
}

export function clearPublishDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
}
```

- [ ] **Step 3: Run helper tests red/green**

Run: `pnpm --filter @dorsal/web test -- publish-draft-storage.test.ts`

Expected after implementation: PASS.

- [ ] **Step 4: Wire draft persistence into `PublishWizard`**

Modify `apps/web/features/dorsals/components/publish-wizard.client.tsx`:

```ts
import {
  clearPublishDraft,
  loadPublishDraft,
  savePublishDraft,
} from '@/features/dorsals/lib/publish-draft-storage';
import { useEffect } from 'react';
```

Inside `PublishWizard`, derive default values:

```ts
const persistedDraft = loadPublishDraft();
const form = useForm<FormInput, unknown, FormValues>({
  resolver: zodResolver(PublishDorsalInput),
  defaultValues: {
    publish: true,
    photo_url: '',
    included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
    payment_methods: [],
    contact: { phone: '', email: '', phone_visible: true, email_visible: true },
    ...persistedDraft,
  },
});

useEffect(() => {
  const subscription = form.watch((value) => {
    savePublishDraft(value);
  });
  return () => subscription.unsubscribe();
}, [form]);
```

Clear saved draft on publish success:

```ts
onSuccess: ({ dorsal_id }) => {
  clearPublishDraft();
  toast.success(publishMode ? 'Dorsal publicado' : 'Borrador guardado');
  router.push(`/dorsales/${dorsal_id}`);
},
```

- [ ] **Step 5: Add component regression test**

Append to `apps/web/features/dorsals/components/__tests__/publish-wizard.test.tsx`:

```ts
it('restores draft fields after navigating away and back', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<PublishWizard />);

  await user.type(screen.getByLabelText('Nombre carrera'), 'Carrera guardada');
  await user.type(screen.getByLabelText(/Precio/), '35');
  unmount();

  render(<PublishWizard />);

  expect(screen.getByLabelText('Nombre carrera')).toHaveValue('Carrera guardada');
  expect(screen.getByLabelText(/Precio/)).toHaveValue(35);
});
```

- [ ] **Step 6: Clarify `/vender` navigation copy**

Modify `apps/web/app/(app)/vender/page.tsx` so the onboarding link communicates that draft data is preserved:

```tsx
<p className="mt-2 text-sm text-text-secondary">
  Puedes configurar cobros ahora y volver al formulario sin perder lo que hayas escrito.
</p>
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/web test -- publish-wizard.test.tsx publish-draft-storage.test.ts
pnpm --filter @dorsal/web typecheck
```

Commit:

```bash
git add apps/web/features/dorsals apps/web/app/\(app\)/vender/page.tsx
git commit -m "fix(transactions): preserve sell draft through onboarding"
```

---

## Task 2: Complete Seller Onboarding State and Mock/Real Clarity

**Files:**
- Create: `apps/web/features/transactions/lib/environment.ts`
- Create: `apps/web/features/transactions/lib/__tests__/environment.test.ts`
- Modify: `apps/web/app/(app)/vender/onboarding/page.tsx`
- Modify: `apps/web/features/transactions/hooks/use-onboard-seller.ts`
- Test: `apps/web/features/transactions/components/__tests__/seller-onboarding-page.test.tsx`

- [ ] **Step 1: Add environment helper tests**

Create `apps/web/features/transactions/lib/__tests__/environment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isTransactionsMocked } from '../environment';

describe('transaction environment helpers', () => {
  it('detects mocked transactions when transactions is absent from real modules', () => {
    expect(isTransactionsMocked('dorsals,users')).toBe(true);
  });

  it('detects real transactions when present in the csv', () => {
    expect(isTransactionsMocked('dorsals,transactions')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement environment helper**

Create `apps/web/features/transactions/lib/environment.ts`:

```ts
export function isTransactionsMocked(realModules = process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '') {
  return !realModules
    .split(',')
    .map((part) => part.trim())
    .includes('transactions');
}
```

- [ ] **Step 3: Make onboarding hook return result only**

Keep `apps/web/features/transactions/hooks/use-onboard-seller.ts` focused on API state:

```ts
'use client';
import { useApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';

export function useOnboardSeller() {
  const api = useApi();
  return useMutation({
    mutationFn: (sellerId: string) => api.transactions.onboardSeller(sellerId),
  });
}
```

- [ ] **Step 4: Move onboarding result UX into page**

Modify `apps/web/app/(app)/vender/onboarding/page.tsx` to keep last result in local state:

```ts
const [lastResult, setLastResult] = useState<SellerOnboardingResponse | null>(null);
const mockedTransactions = isTransactionsMocked();
```

Use a controlled start handler:

```ts
try {
  const result = await onboard.mutateAsync(sellerId);
  setLastResult(result);
  if (result.onboarding_url) {
    window.open(result.onboarding_url, '_blank', 'noopener,noreferrer');
    toast.success('Hemos abierto Stripe Connect en una nueva pestana');
    return;
  }
  if (result.charges_enabled) toast.success('Cuenta de cobros lista');
} catch (error) {
  toast.error(getTransactionErrorMessage(error));
}
```

Render visible state:

```tsx
<div className="rounded-lg border border-border bg-bg-card p-5">
  <p className="text-sm text-text-secondary">Estado Stripe Connect</p>
  <p className="mt-1 font-semibold">
    {lastResult?.charges_enabled ? 'Cuenta lista para cobrar' : 'Pendiente de configurar'}
  </p>
  {mockedTransactions && (
    <p className="mt-2 text-sm text-text-muted">
      Modo local: Transaction esta mockeado, asi que Stripe no abrira una URL real.
    </p>
  )}
</div>
```

- [ ] **Step 5: Add page tests**

Create `apps/web/features/transactions/components/__tests__/seller-onboarding-page.test.tsx` with hook mocks:

```ts
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SellerOnboardingPage from '@/app/(app)/vender/onboarding/page';

const mutateAsync = vi.fn();

vi.mock('@/features/transactions/hooks/use-onboard-seller', () => ({
  useOnboardSeller: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'seller-1' } } }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('SellerOnboardingPage', () => {
  it('shows charges enabled after successful onboarding', async () => {
    mutateAsync.mockResolvedValueOnce({
      account_id: 'acct_1',
      onboarding_url: null,
      charges_enabled: true,
    });
    const user = userEvent.setup();
    render(<SellerOnboardingPage />);

    await user.click(screen.getByRole('button', { name: /Configurar pagos/ }));

    await waitFor(() => expect(screen.getByText('Cuenta lista para cobrar')).toBeInTheDocument());
  });
});
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/web test -- environment.test.ts seller-onboarding-page.test.tsx
pnpm --filter @dorsal/web typecheck
```

Commit:

```bash
git add apps/web/app/\(app\)/vender/onboarding/page.tsx apps/web/features/transactions
git commit -m "feat(transactions): clarify seller onboarding state"
```

---

## Task 3: Controlled Transaction API Error UX

**Files:**
- Create: `apps/web/features/transactions/lib/errors.ts`
- Create: `apps/web/features/transactions/lib/__tests__/errors.test.ts`
- Modify: `apps/web/app/(app)/vender/onboarding/page.tsx`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Test: `apps/web/features/transactions/components/__tests__/checkout-form.test.tsx`

- [ ] **Step 1: Add error helper tests**

Create `apps/web/features/transactions/lib/__tests__/errors.test.ts`:

```ts
import { ApiError, NetworkError } from '@dorsal/api-client';
import { describe, expect, it } from 'vitest';
import { getTransactionErrorMessage } from '../errors';

describe('getTransactionErrorMessage', () => {
  it('maps network failures to a retryable backend message', () => {
    expect(getTransactionErrorMessage(new NetworkError())).toBe(
      'No se pudo conectar con el modulo de transacciones. Revisa que el backend este levantado o usa el modo mock.',
    );
  });

  it('includes backend detail string for bad reservation requests', () => {
    expect(
      getTransactionErrorMessage(new ApiError('HTTP 400', 400, { detail: 'Dorsal is not available' })),
    ).toBe('Dorsal is not available');
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(getTransactionErrorMessage(new Error('boom'))).toBe(
      'No se pudo completar la operacion. Intentalo de nuevo en unos minutos.',
    );
  });
});
```

- [ ] **Step 2: Implement transaction error helper**

Create `apps/web/features/transactions/lib/errors.ts`:

```ts
import { ApiError, NetworkError } from '@dorsal/api-client';

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const value = (detail as { detail?: unknown }).detail;
    if (typeof value === 'string') return value;
  }
  return null;
}

export function getTransactionErrorMessage(error: unknown) {
  if (error instanceof NetworkError) {
    return 'No se pudo conectar con el modulo de transacciones. Revisa que el backend este levantado o usa el modo mock.';
  }
  if (error instanceof ApiError) {
    return detailToMessage(error.detail) ?? `El backend rechazo la operacion (${error.status}).`;
  }
  return 'No se pudo completar la operacion. Intentalo de nuevo en unos minutos.';
}
```

- [ ] **Step 3: Use helper in onboarding**

In `apps/web/app/(app)/vender/onboarding/page.tsx`, catch mutation errors and show `toast.error(getTransactionErrorMessage(error))`.

- [ ] **Step 4: Use helper in checkout**

Modify `startCheckout` in `apps/web/features/transactions/components/checkout-form.client.tsx`:

```ts
try {
  const result = await reserve.mutateAsync({ dorsalId, buyerId });
  setTransactionId(result.transaction_id);
  setClientSecret(result.stripe_payment_intent_client_secret);
  const stripe = await stripePromise;
  if (!stripe) router.push(`/compra/confirmada?tx=${result.transaction_id}`);
} catch (error) {
  toast.error(getTransactionErrorMessage(error));
}
```

- [ ] **Step 5: Add checkout error regression test**

Create `apps/web/features/transactions/components/__tests__/checkout-form.test.tsx`:

```ts
import { ApiError } from '@dorsal/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '../checkout-form.client';

const mutateAsync = vi.fn();
const toastError = vi.fn();

vi.mock('@/features/transactions/hooks/use-reserve-listing', () => ({
  useReserveListing: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'buyer-1' } } }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { error: toastError },
}));

describe('CheckoutForm', () => {
  it('shows backend reservation failures without throwing runtime overlay', async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError('HTTP 400', 400, {
        detail: 'Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)',
      }),
    );
    const user = userEvent.setup();

    render(<CheckoutForm dorsalId="55555555-5555-4555-8555-555555555555" raceName="Madrid" amount={35} />);
    await user.click(screen.getByRole('button', { name: /Simular pago|Continuar al pago/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)',
      ),
    );
  });
});
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/web test -- errors.test.ts checkout-form.test.tsx
pnpm --filter @dorsal/web typecheck
```

Commit:

```bash
git add apps/web/features/transactions apps/web/app/\(app\)/vender/onboarding/page.tsx
git commit -m "fix(transactions): handle onboarding and reservation errors"
```

---

## Task 4: Align Reservation Contract With Backend Availability Rules

**Files:**
- Modify: `packages/api-client/src/__tests__/transactions-http.test.ts`
- Modify: `packages/api-client/src/adapters/transactions-http.ts`
- Modify: `docs/reviews/2026-05-24-feat-transacciones-qa-notes.md`

- [ ] **Step 1: Add contract note test for reserve payload**

Extend `packages/api-client/src/__tests__/transactions-http.test.ts`:

```ts
it('does not invent availability state when reserving a listing', async () => {
  const post = vi.fn(async () => ({
    transaction_id: '11111111-1111-4111-8111-111111111111',
    stripe_payment_intent_client_secret: 'pi_secret_x',
    amount: '35.00',
    expires_at: '2026-05-24T18:33:20Z',
  }));
  const http = createHttpStub({ post });
  const adapter = new TransactionsHttpAdapter(http, 'http://api.test');

  await adapter.reserveListing({
    dorsalId: '55555555-5555-4555-8555-555555555555',
    buyerId: '22222222-2222-4222-8222-222222222222',
  });

  expect(post).toHaveBeenCalledWith('api/v1/transactions', {
    body: {
      dorsal_id: '55555555-5555-4555-8555-555555555555',
      buyer_id: '22222222-2222-4222-8222-222222222222',
    },
  });
});
```

- [ ] **Step 2: Remove unused backend base URL getter**

If no code uses `TransactionsHttpAdapter.getBackendBaseUrl()`, remove the `baseUrl` constructor field and method:

```ts
export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient) {}
}
```

Update `packages/api-client/src/factory.ts`:

```ts
transactions: new TransactionsHttpAdapter(http),
```

- [ ] **Step 3: Document backend discrepancy**

Create `docs/reviews/2026-05-24-feat-transacciones-qa-notes.md`:

```md
# feat/transacciones QA Notes

## Blocking Before Merge

- Checkout reservation currently receives `HTTP 400` from `POST /api/v1/transactions` in at least one local backend state.
- Backend detail observed on 2026-05-24:

```json
{
  "path": "/api/v1/transactions",
  "detail": "Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)",
  "event": "domain_exception"
}
```

## Interpretation

Frontend currently sends the expected reserve payload: `dorsal_id` and `buyer_id`.
The phrase `not available (status: published)` is contract-inconsistent unless backend intentionally requires another status for reservable dorsals.

## Required Resolution

- If `published` is reservable, fix backend Transaction availability rule or error message.
- If another status is required, update Catalog UI and Transaction frontend copy to expose that precondition before checkout.
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/api-client test -- transactions-http.test.ts
pnpm --filter @dorsal/api-client typecheck
```

Commit:

```bash
git add packages/api-client/src docs/reviews/2026-05-24-feat-transacciones-qa-notes.md
git commit -m "chore(transactions): document reservation contract discrepancy"
```

---

## Task 5: Add Buyer Data Integration Notice Without Owning User Forms

**Files:**
- Create: `apps/web/features/transactions/components/buyer-data-notice.client.tsx`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Test: `apps/web/features/transactions/components/__tests__/buyer-data-notice.test.tsx`

- [ ] **Step 1: Add component test**

Create `apps/web/features/transactions/components/__tests__/buyer-data-notice.test.tsx`:

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuyerDataNotice } from '../buyer-data-notice.client';

describe('BuyerDataNotice', () => {
  it('explains that profile data will be used by the transfer flow', () => {
    render(<BuyerDataNotice isAuthenticated />);

    expect(screen.getByText(/datos de tu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revisar perfil/i })).toHaveAttribute(
      'href',
      '/perfil',
    );
  });

  it('asks anonymous users to sign in once feat usuarios owns auth', () => {
    render(<BuyerDataNotice isAuthenticated={false} />);

    expect(screen.getByText(/cuando el login este listo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement notice component**

Create `apps/web/features/transactions/components/buyer-data-notice.client.tsx`:

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { IdCard } from 'lucide-react';
import Link from 'next/link';

export function BuyerDataNotice({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <div className="flex items-start gap-3">
        <IdCard className="mt-0.5 h-5 w-5 text-coral" />
        <div className="min-w-0">
          <h2 className="font-semibold">Datos para la transferencia</h2>
          <p className="mt-1 text-sm text-text-secondary">
            La compra usara los datos de tu perfil para que el vendedor pueda tramitar el cambio
            de titularidad del dorsal.
          </p>
          {!isAuthenticated && (
            <p className="mt-2 text-sm text-text-muted">
              Cuando el login este listo, este paso validara el perfil antes del pago.
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href="/perfil">Revisar perfil</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Render notice in checkout**

Modify `apps/web/features/transactions/components/checkout-form.client.tsx`:

```tsx
<BuyerDataNotice isAuthenticated={Boolean(data?.user?.id)} />
```

Place it between the dorsal summary and the payment CTA.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/web test -- buyer-data-notice.test.tsx checkout-form.test.tsx
pnpm --filter @dorsal/web typecheck
```

Commit:

```bash
git add apps/web/features/transactions/components
git commit -m "feat(transactions): prepare checkout for user profile data"
```

---

## Task 6: Clean Up Temporary Auth Preview Before Merge

**Files:**
- Review: `apps/web/auth.config.ts`
- Review: `apps/web/lib/dev-preview.ts`
- Review: `apps/web/lib/api-client.ts`
- Review: `apps/web/.env.local`
- Review: `apps/web/components/dorsal/buy-button.client.tsx`
- Review: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Review: `apps/web/app/(app)/vender/onboarding/page.tsx`

- [ ] **Step 1: Decide preview policy**

Use this merge rule:

```text
The PR must not require auth bypass to pass tests or demos.
If the bypass remains, it must be development-only, env-gated, documented, and disabled by default.
`.env.local` must not be committed.
```

- [ ] **Step 2: Prefer test helpers over production bypass**

Keep E2E login via `apps/web/e2e/helpers/auth.ts`. Do not make purchase flow depend on `NEXT_PUBLIC_DISABLE_AUTH_GUARD=true`.

- [ ] **Step 3: Remove preview-only code if `feat/usuarios` starts immediately**

If `feat/usuarios` will start right after merge, remove these imports/usages before merge:

```ts
DEV_AUTH_BYPASS_ENABLED
DEV_PREVIEW_USER_ID
DEV_PREVIEW_SELLER_ID
```

Then delete `apps/web/lib/dev-preview.ts`.

- [ ] **Step 4: Or document preview-only behavior if kept**

If the team wants the preview mode available for local QA, add a short README section:

````md
## Local transaction preview without login

For local visual QA only:

```env
NEXT_PUBLIC_DISABLE_AUTH_GUARD=true
NEXT_PUBLIC_DEV_PREVIEW_USER_ID=550e8400-e29b-41d4-a716-446655440002
NEXT_PUBLIC_DEV_PREVIEW_SELLER_ID=550e8400-e29b-41d4-a716-446655440001
```

Do not use this in deployed environments.
````

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/web test:e2e -- e2e/purchase.spec.ts
git status --short
```

Expected: no `.env.local` changes staged.

Commit:

```bash
git add apps/web
git reset apps/web/.env.local
git commit -m "chore(transactions): finalize auth preview boundary"
```

---

## Task 7: Final Verification and Merge Readiness

**Files:**
- No new files.

- [ ] **Step 1: Run focused checks**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/api-client test
pnpm --filter @dorsal/web test
pnpm --filter @dorsal/web test:e2e -- e2e/purchase.spec.ts
```

- [ ] **Step 2: Run build**

```bash
pnpm --filter @dorsal/web build
```

- [ ] **Step 3: Run targeted Biome**

```bash
pnpm exec biome check \
  apps/web/features/dorsals \
  apps/web/features/transactions \
  apps/web/app/\(app\)/vender \
  apps/web/components/dorsal/buy-button.client.tsx \
  packages/api-client/src
```

- [ ] **Step 4: Document known global lint limitation**

If `pnpm turbo run lint --continue` still fails only because of repository-wide CRLF formatting, add this to the PR:

```md
Known verification note:
`pnpm turbo run lint --continue` currently fails on pre-existing CRLF formatting across untouched files.
Targeted Biome checks on files touched by this branch pass.
```

- [ ] **Step 5: Merge criteria**

Only merge `feat/transacciones` into `feat/foundation` when all are true:

- Onboarding page does not runtime-crash when Transaction backend is down.
- Checkout reservation errors render as controlled UI/toast states.
- `/vender` draft survives navigation to `/vender/onboarding` and back.
- Backend reservation contract discrepancy is either fixed or documented as a backend blocker.
- No temporary `.env.local` preview flag is committed.
- `feat/usuarios` has a clear handoff: it owns real identity/profile validation before checkout.

---

## Handoff to `feat/usuarios`

After this plan is implemented, `feat/usuarios` should own:

- Real login and session source of `Session.user.id` and `Session.user.token`.
- Profile completeness checks for buyer data: full name, DNI, email, phone, birth date, runner details.
- Profile edit surfaces used before checkout.
- Replacing the checkout notice with actual profile validation and a direct edit path.
- Removing any remaining local auth preview behavior.

`feat/transacciones` should not own profile forms. It should only call Transaction endpoints with a valid authenticated buyer/seller identity and show clear state when that identity is missing.

---

## Self-Review

**Spec coverage:** Notes 1-4 are covered by Tasks 1-4. Note 5 is intentionally split: Transaction adds a visible integration notice in Task 5; `feat/usuarios` owns real profile completion.

**Placeholder scan:** No task relies on vague future-work markers or unspecified handling. Each behavior has files, test commands, and expected commits.

**Type consistency:** The plan uses existing names: `PublishDorsalInput`, `SellerOnboardingResponse`, `TransactionsHttpAdapter`, `ApiError`, `NetworkError`, `CheckoutForm`, and `PublishWizard`.

**Merge stance:** This plan should leave Transaction stable enough for `feat/foundation`; `feat/usuarios` should start after Task 7 unless backend reservation remains unresolved.
