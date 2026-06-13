# Public Dorsals Login Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dorsal browsing public and require login only when an anonymous user attempts to buy.

**Architecture:** Keep route protection in Auth.js focused on private workflows (`/compra`, `/perfil`, `/vender`). Make the buy CTA login-aware: anonymous buyers get a login link with checkout callback, authenticated buyers go directly to checkout.

**Tech Stack:** Next.js 16 App Router, Auth.js v5, React 19, Vitest, Testing Library, pnpm.

---

### Task 1: Test And Extract Protected Path Boundary

**Files:**
- Modify: `apps/web/auth.config.ts`
- Create: `apps/web/features/users/__tests__/protected-paths.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { isProtectedPath } from '@/auth.config';
import { describe, expect, it } from 'vitest';

describe('isProtectedPath', () => {
  it('keeps dorsal browsing public', () => {
    expect(isProtectedPath('/dorsales')).toBe(false);
    expect(isProtectedPath('/dorsales/550e8400-e29b-41d4-a716-446655440010')).toBe(false);
  });

  it('protects private purchase, selling and profile workflows', () => {
    expect(isProtectedPath('/compra/checkout/550e8400-e29b-41d4-a716-446655440010')).toBe(true);
    expect(isProtectedPath('/perfil')).toBe(true);
    expect(isProtectedPath('/perfil/completar')).toBe(true);
    expect(isProtectedPath('/vender')).toBe(true);
    expect(isProtectedPath('/vender/onboarding')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @dorsal/web exec vitest run features/users/__tests__/protected-paths.test.ts`

Expected: FAIL because `isProtectedPath` is not exported from `auth.config.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
export function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/vender') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/compra')
  );
}
```

Update the callback to use:

```ts
const isProtected = isProtectedPath(nextUrl.pathname);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @dorsal/web exec vitest run features/users/__tests__/protected-paths.test.ts`

Expected: PASS.

### Task 2: Make Anonymous Buy CTA Start Login

**Files:**
- Modify: `apps/web/components/dorsal/buy-button.client.tsx`
- Create: `apps/web/components/dorsal/__tests__/buy-button.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyButton } from '../buy-button.client';

const mocks = vi.hoisted(() => ({
  session: null as { user?: { id?: string } } | null,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session }),
}));

describe('BuyButton', () => {
  beforeEach(() => {
    mocks.session = null;
  });

  it('links anonymous buyers to login with checkout callback', () => {
    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="published"
      />,
    );

    expect(screen.getByRole('link', { name: /comprar dorsal/i })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Fcompra%2Fcheckout%2F550e8400-e29b-41d4-a716-446655440010',
    );
  });

  it('links authenticated buyers directly to checkout', () => {
    mocks.session = { user: { id: 'buyer-1' } };

    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="published"
      />,
    );

    expect(screen.getByRole('link', { name: /comprar dorsal/i })).toHaveAttribute(
      'href',
      '/compra/checkout/550e8400-e29b-41d4-a716-446655440010',
    );
  });

  it('keeps unavailable dorsals disabled', () => {
    render(
      <BuyButton
        dorsalId="550e8400-e29b-41d4-a716-446655440010"
        sellerId="seller-1"
        status="sold"
      />,
    );

    expect(screen.getByRole('button', { name: /no disponible/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @dorsal/web exec vitest run components/dorsal/__tests__/buy-button.test.tsx`

Expected: FAIL because anonymous buyers currently see a disabled "Inicia sesion para comprar" button.

- [ ] **Step 3: Write minimal implementation**

Replace the `BuyButton` decision flow with:

```tsx
const userId = data?.user?.id ?? null;
const checkoutHref = `/compra/checkout/${dorsalId}`;

if (status !== 'published') {
  return (
    <Button type="button" className="mt-5 w-full" disabled>
      <ShoppingCart />
      No disponible
    </Button>
  );
}

if (userId === sellerId) {
  return (
    <Button type="button" className="mt-5 w-full" disabled>
      <ShoppingCart />
      Es tu dorsal
    </Button>
  );
}

const href = userId ? checkoutHref : `/login?callbackUrl=${encodeURIComponent(checkoutHref)}`;

return (
  <Button asChild className="mt-5 w-full">
    <Link href={href}>
      <ShoppingCart />
      Comprar dorsal
    </Link>
  </Button>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @dorsal/web exec vitest run components/dorsal/__tests__/buy-button.test.tsx`

Expected: PASS.

### Task 3: Targeted Verification And Publish

**Files:**
- Modify only files changed by Tasks 1 and 2 plus the spec and plan docs.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --filter @dorsal/web exec vitest run features/users/__tests__/protected-paths.test.ts components/dorsal/__tests__/buy-button.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run package tests**

Run: `pnpm --filter @dorsal/web test`

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @dorsal/web typecheck`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-14-public-dorsals-login-boundary-design.md docs/superpowers/plans/2026-06-14-public-dorsals-login-boundary.md apps/web/auth.config.ts apps/web/features/users/__tests__/protected-paths.test.ts apps/web/components/dorsal/buy-button.client.tsx apps/web/components/dorsal/__tests__/buy-button.test.tsx
git commit -m "fix(dorsals): allow public browsing before login"
```

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/dorsales
```

Open a draft PR from `feat/dorsales` into `feat/foundation` with a body covering the public browsing decision, login callback behavior and verification commands.
