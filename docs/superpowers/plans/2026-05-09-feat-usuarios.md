# feat/usuarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Identity feature surface (UC-01 registro/login, UC-09 perfil, UC-10 historial integration, UC-11 resenas) on top of the current `feat/transacciones` work, without breaking the Transaction contracts that already exist.

**Architecture:** Auth.js remains the session boundary. Because `MVP-Dorsales` still has no real Identity or Review REST controllers, `users` and `reviews` stay mocked in development, but Credentials login needs an explicit server-side mock bridge because browser MSW does not intercept `apps/web/lib/auth.ts`. Profile completion is enforced where it matters for Transaction (`/compra/checkout` and seller-facing flows), not as a broad `(app)` layout redirect. UC-10 history reuses the page and hooks already created in `feat/transacciones`.

**Tech Stack:** Next.js App Router, Auth.js v5, React Hook Form, Zod, TanStack Query, MSW, Vitest, Playwright, Biome, `@dorsal/api-client`, `@dorsal/schemas`.

**Reviewed against:** `feat/transacciones` after optimization commit `1d0a363` and backend folder `../MVP-Dorsales` on 2026-05-24.

---

## Current Reality Check

The original users plan was created before `feat/transacciones` was implemented. These are now hard constraints:

- `apps/web/app/(app)/perfil/historial/page.tsx` already exists and is owned by `feat/transacciones`.
- Transaction history uses `useMyPurchases()` and `useMySales()`, not `api.transactions.listMine()`.
- `apps/web/features/transactions/components/buyer-data-notice.client.tsx` already reserves the buyer-profile integration point.
- `apps/web/features/transactions/components/checkout-form.client.tsx` already starts reservation using the logged-in `session.user.id`.
- `apps/web/lib/auth.ts` calls `api.users.login()` on the server. Browser MSW cannot mock this request.
- `../MVP-Dorsales` exposes Transaction and Catalog, but Identity and Review controllers are still empty placeholders.

Backend Transaction currently expects these Identity fields through SQL queries:

```text
users.id
users.email
users.full_name
users.phone_number
users.dni
users.connect_account_id
users.onboarding_complete

runner_profiles.user_id
runner_profiles.whatsapp_number
runner_profiles.t_shirt_size
runner_profiles.estimated_time
runner_profiles.medical_info
runner_profiles.emergency_contact
```

Do not design the frontend profile around `runner.club` or `runner.allergies`; those fields do not feed the current backend transfer profile.

---

## Branching

Preferred path after `feat/transacciones` is merged:

```bash
git switch feat/foundation
git pull
git switch -c feat/usuarios
```

Temporary path if users starts before the merge:

```bash
git switch feat/transacciones
git pull
git switch -c feat/usuarios
```

Open the PR against `feat/foundation` once `feat/transacciones` is already in it. If users is branched from `feat/transacciones`, rebase onto the updated `feat/foundation` before opening the PR.

---

## Ownership

Freely owned by this branch:

```text
apps/web/app/(auth)/login/page.tsx
apps/web/app/(auth)/registro/page.tsx
apps/web/app/(app)/perfil/page.tsx
apps/web/app/(app)/perfil/completar/page.tsx
apps/web/features/users/**
apps/web/e2e/auth.spec.ts
apps/web/e2e/profile.spec.ts
packages/schemas/src/user.ts
packages/schemas/src/review.ts
packages/api-client/src/ports/users.ts
packages/api-client/src/adapters/users-http.ts
packages/api-client/src/msw/users.ts
packages/api-client/src/ports/reviews.ts
packages/api-client/src/adapters/reviews-http.ts
packages/api-client/src/msw/reviews.ts
```

Shared files that this branch may touch carefully:

```text
apps/web/lib/auth.ts
apps/web/auth.config.ts
apps/web/features/transactions/components/buyer-data-notice.client.tsx
apps/web/features/transactions/components/checkout-form.client.tsx
apps/web/app/(app)/compra/[transactionId]/page.tsx
apps/web/app/(app)/perfil/historial/page.tsx
```

Do not overwrite Transaction history. Keep the existing `useMyPurchases` and `useMySales` flow.

---

## File Structure

```text
apps/web/
  app/(auth)/
    login/page.tsx
    registro/page.tsx
  app/(app)/perfil/
    page.tsx
    completar/page.tsx
    historial/page.tsx                  # already created by feat/transacciones; only verify/link
  app/(app)/compra/[transactionId]/page.tsx
  features/users/
    components/
      login-form.client.tsx
      oauth-buttons.client.tsx
      register-form.client.tsx
      profile-identity-form.client.tsx
      profile-contact-form.client.tsx
      profile-runner-form.client.tsx
      profile-completion-notice.client.tsx
      review-form.client.tsx
      review-list.tsx
    hooks/
      use-me.ts
      use-update-profile.ts
      use-create-review.ts
      use-user-reviews.ts
    lib/
      environment.ts
      profile-completion.ts
    __tests__/
      environment.test.ts
      profile-completion.test.ts
      review-form.test.tsx
      register-form.test.tsx

packages/schemas/src/
  user.ts
  review.ts

packages/api-client/src/
  msw/users.ts
  msw/reviews.ts
  ports/users.ts
  ports/reviews.ts
  adapters/users-http.ts
  adapters/reviews-http.ts
```

---

## Task 1: Branch Setup And Contract Baseline

**Files:**
- Read: `docs/branches/feat-usuarios.md`
- Read: `docs/superpowers/plans/2026-05-24-feat-transacciones-optimization.md`
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/input/rest/schemas/transaction_schemas.py`
- Read: `../MVP-Dorsales/dorsales_api/infrastructure/adapters/output/persistence/transaction/repositories/user_repository_adapter.py`

- [ ] **Step 1: Create branch from the correct base**

Use the branching commands above. Confirm current branch:

```bash
git branch --show-current
```

Expected: `feat/usuarios`.

- [ ] **Step 2: Confirm Transaction files exist**

```bash
Test-Path "apps/web/app/(app)/perfil/historial/page.tsx"
Test-Path "apps/web/features/transactions/components/buyer-data-notice.client.tsx"
Test-Path "apps/web/features/transactions/hooks/use-my-purchases.ts"
Test-Path "apps/web/features/transactions/hooks/use-my-sales.ts"
```

Expected: all commands print `True`.

- [ ] **Step 3: Baseline verification**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/web typecheck
```

Expected: all pass before implementation starts.

---

## Task 2: Align User Schemas With Transaction Backend

**Files:**
- Modify: `packages/schemas/src/user.ts`
- Modify: `packages/api-client/src/msw/store.ts`
- Modify: `packages/api-client/src/msw/users.ts`
- Modify: `packages/api-client/src/ports/users.ts`

- [ ] **Step 1: Update `RunnerProfile` and contact naming**

Use backend-compatible field names while keeping the frontend forms readable:

```ts
export const RunnerProfile = z.object({
  whatsapp_number: z.string().nullable().optional(),
  t_shirt_size: ShirtSize.nullable().optional(),
  estimated_time: z.string().nullable().optional(),
  medical_info: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
});

export const ContactAddress = z.object({
  phone_number: z.string().nullable().optional(),
  address_line: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});
```

Do not keep `runner.club`, `runner.allergies`, `runner.shirt_size`, or `runner.estimated_time_min` in the final schema.

- [ ] **Step 2: Update the MSW seed user**

In `packages/api-client/src/msw/store.ts`, the seed user must contain:

```ts
contact: {
  phone_number: '612345678',
  address_line: 'Calle Mayor 1',
  city: 'Madrid',
  postal_code: '28001',
  country: 'ES',
},
runner: {
  whatsapp_number: '612345678',
  t_shirt_size: 'L',
  estimated_time: '01:35:00',
  medical_info: null,
  emergency_contact: 'Contacto emergencia +34600999888',
},
```

- [ ] **Step 3: Keep `updateProfile` merge behavior**

In `packages/api-client/src/msw/users.ts`, keep the current deep merge, but make sure it merges the renamed fields:

```ts
const updated: User = {
  ...user,
  ...patch,
  contact: { ...(user.contact ?? {}), ...(patch.contact ?? {}) },
  runner: { ...(user.runner ?? {}), ...(patch.runner ?? {}) },
  updated_at: new Date().toISOString(),
};
```

- [ ] **Step 4: Verify schemas**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client test -- factory.test.ts
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/user.ts packages/api-client/src/msw/store.ts packages/api-client/src/msw/users.ts packages/api-client/src/ports/users.ts
git commit -m "feat(users): align profile schema with transaction transfer data"
```

---

## Task 3: Server-Side Mock Bridge For Auth.js Credentials

**Files:**
- Create: `apps/web/features/users/lib/environment.ts`
- Create: `apps/web/features/users/__tests__/environment.test.ts`
- Modify: `apps/web/lib/auth.ts`

Browser MSW handles `api.users.register()` and `api.users.getMe()` from Client Components, but Auth.js Credentials runs on the server in `apps/web/lib/auth.ts`. Add a small development-only bridge so `/login` works while backend Identity is still absent.

- [ ] **Step 1: Add environment helper tests**

```ts
import { describe, expect, it } from 'vitest';
import { isUsersMocked } from '../lib/environment';

describe('users environment helpers', () => {
  it('detects users mocked when absent from real modules', () => {
    expect(isUsersMocked('dorsals,transactions')).toBe(true);
  });

  it('detects users real when present in real modules', () => {
    expect(isUsersMocked('dorsals,users,transactions')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement helper**

```ts
export function isUsersMocked(realModules = process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '') {
  return !realModules
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .includes('users');
}
```

- [ ] **Step 3: Extend Credentials input**

In `apps/web/lib/auth.ts`, make the credential schema accept a development registration handoff:

```ts
const Creds = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  dev_user_id: z.string().uuid().optional(),
  dev_name: z.string().optional(),
});
```

- [ ] **Step 4: Add server mock fallback**

In `authorize`, after the real backend attempt fails, return a mock user only in development and only when `users` is mocked:

```ts
const usersMocked = !process.env.NEXT_PUBLIC_REAL_API_MODULES?.split(',').map((m) => m.trim()).includes('users');
const allowMock = process.env.NODE_ENV === 'development' && usersMocked;

if (allowMock && parsed.data.dev_user_id) {
  return {
    id: parsed.data.dev_user_id,
    email: parsed.data.email,
    name: parsed.data.dev_name ?? parsed.data.email,
    image: null,
  };
}

if (allowMock && parsed.data.email === 'demo@dorsal.market' && parsed.data.password === 'demo1234') {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'demo@dorsal.market',
    name: 'Carlos Martinez',
    image: null,
  };
}
```

Do not enable this fallback in production.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @dorsal/web test -- environment.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/users/lib/environment.ts apps/web/features/users/__tests__/environment.test.ts apps/web/lib/auth.ts
git commit -m "feat(users): support mocked credentials in development"
```

---

## Task 4: Login Form With Credentials And Optional OAuth

**Files:**
- Create: `apps/web/features/users/components/oauth-buttons.client.tsx`
- Create: `apps/web/features/users/components/login-form.client.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`

- [ ] **Step 1: OAuth buttons**

Render OAuth buttons only when the server page passes both required provider env flags:

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export function OAuthButtons({
  google,
  facebook,
  callbackUrl = '/',
}: {
  google: boolean;
  facebook: boolean;
  callbackUrl?: string;
}) {
  if (!google && !facebook) return null;
  return (
    <div className="space-y-2">
      {google && (
        <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl })}>
          Continuar con Google
        </Button>
      )}
      {facebook && (
        <Button variant="outline" className="w-full" onClick={() => signIn('facebook', { callbackUrl })}>
          Continuar con Facebook
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Login form**

Use static import, not `require()`:

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput } from '@dorsal/schemas';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OAuthButtons } from './oauth-buttons.client';

export function LoginForm({ google, facebook }: { google: boolean; facebook: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginInput) });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const res = await signIn('credentials', { ...values, redirect: false, callbackUrl });
    if (res?.error) {
      setError('Credenciales incorrectas');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-bg-card p-8">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-sm text-text-secondary">Entra para comprar y vender dorsales.</p>
      </header>
      <OAuthButtons google={google} facebook={facebook} callbackUrl={callbackUrl} />
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contrasena</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Server page**

```tsx
import { LoginForm } from '@/features/users/components/login-form.client';

export const metadata = { title: 'Entrar' };

export default function LoginPage() {
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebook = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
  return <LoginForm google={google} facebook={facebook} />;
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/users/components/oauth-buttons.client.tsx apps/web/features/users/components/login-form.client.tsx "apps/web/app/(auth)/login/page.tsx"
git commit -m "feat(users): add credentials login form"
```

---

## Task 5: Registration Form With Mocked Sign-In Handoff

**Files:**
- Create: `apps/web/features/users/components/register-form.client.tsx`
- Create: `apps/web/features/users/components/__tests__/register-form.test.tsx`
- Modify: `apps/web/app/(auth)/registro/page.tsx`

- [ ] **Step 1: Registration behavior**

The form calls `api.users.register(values)`. When `users` is mocked, pass the returned id to Auth.js Credentials:

```ts
const created = await api.users.register(values);
const res = await signIn('credentials', {
  email: values.email,
  password: values.password,
  dev_user_id: created.id,
  dev_name: created.name,
  redirect: false,
  callbackUrl: '/perfil/completar',
});
```

This keeps the NextAuth session id aligned with the MSW user id created in the browser.

- [ ] **Step 2: Fields**

Use the current `RegisterInput` fields:

```text
email
password
full_name
dni
gender
birth_date
```

Password must satisfy `LoginInput` and `RegisterInput`: minimum 8 characters.

- [ ] **Step 3: Register page**

```tsx
import { RegisterForm } from '@/features/users/components/register-form.client';

export const metadata = { title: 'Crear cuenta' };

export default function RegistroPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 4: Regression test**

Mock `useApi().users.register` returning `{ id, email, name, image: null }`, mock `signIn`, submit the form, and assert `signIn` receives `dev_user_id`.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @dorsal/web test -- register-form.test.tsx
pnpm --filter @dorsal/web typecheck
git add apps/web/features/users/components/register-form.client.tsx apps/web/features/users/components/__tests__/register-form.test.tsx "apps/web/app/(auth)/registro/page.tsx"
git commit -m "feat(users): add registration with mocked sign-in handoff"
```

---

## Task 6: Profile Hooks And Completion Helper

**Files:**
- Create: `apps/web/features/users/hooks/use-me.ts`
- Create: `apps/web/features/users/hooks/use-update-profile.ts`
- Create: `apps/web/features/users/lib/profile-completion.ts`
- Create: `apps/web/features/users/__tests__/profile-completion.test.ts`

- [ ] **Step 1: Completion tests**

```ts
import type { User } from '@dorsal/schemas';
import { describe, expect, it } from 'vitest';
import { getMissingProfileFields, isProfileComplete } from '../lib/profile-completion';

const baseUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'demo@dorsal.market',
  full_name: 'Demo User',
  dni: '12345678X',
  gender: 'male',
  birth_date: '1990-01-01',
  avatar_url: null,
  rating_average: null,
  total_sales: 0,
  total_purchases: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('profile completion', () => {
  it('requires phone_number and t_shirt_size', () => {
    expect(isProfileComplete(baseUser)).toBe(false);
    expect(getMissingProfileFields(baseUser)).toEqual(['phone_number', 't_shirt_size']);
  });

  it('accepts a profile ready for Transaction transfer data', () => {
    expect(
      isProfileComplete({
        ...baseUser,
        contact: { phone_number: '612345678' },
        runner: { t_shirt_size: 'M' },
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Implement helper**

```ts
import type { User } from '@dorsal/schemas';

export type MissingProfileField = 'phone_number' | 't_shirt_size';

export function getMissingProfileFields(user: User): MissingProfileField[] {
  const missing: MissingProfileField[] = [];
  if (!user.contact?.phone_number) missing.push('phone_number');
  if (!user.runner?.t_shirt_size) missing.push('t_shirt_size');
  return missing;
}

export function isProfileComplete(user: User): boolean {
  return getMissingProfileFields(user).length === 0;
}
```

- [ ] **Step 3: Hooks**

```ts
'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useMe() {
  const api = useApi();
  const { data } = useSession();
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.getMe(),
    enabled: Boolean(data?.user?.id),
    staleTime: 60 * 1000,
  });
}
```

```ts
'use client';
import { useApi } from '@/lib/api-client';
import type { RunnerProfile, User } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateProfile() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { contact?: User['contact']; runner?: RunnerProfile; full_name?: string }) =>
      api.users.updateProfile(input),
    onSuccess: (user) => {
      qc.setQueryData(['users', 'me'], user);
    },
  });
}
```

- [ ] **Step 4: Verify and commit**

```bash
pnpm --filter @dorsal/web test -- profile-completion.test.ts
pnpm --filter @dorsal/web typecheck
git add apps/web/features/users/hooks apps/web/features/users/lib/profile-completion.ts apps/web/features/users/__tests__/profile-completion.test.ts
git commit -m "feat(users): add profile hooks and completion helper"
```

---

## Task 7: Profile Pages And Forms

**Files:**
- Create: `apps/web/features/users/components/profile-identity-form.client.tsx`
- Create: `apps/web/features/users/components/profile-contact-form.client.tsx`
- Create: `apps/web/features/users/components/profile-runner-form.client.tsx`
- Modify: `apps/web/app/(app)/perfil/page.tsx`
- Create: `apps/web/app/(app)/perfil/completar/page.tsx`

- [ ] **Step 1: Identity form**

Editable: `full_name`. Read-only: `email`, `dni`, `gender`, `birth_date`.

- [ ] **Step 2: Contact form**

Persist:

```text
contact.phone_number
contact.address_line
contact.city
contact.postal_code
contact.country
```

- [ ] **Step 3: Runner form**

Persist:

```text
runner.whatsapp_number
runner.t_shirt_size
runner.estimated_time
runner.medical_info
runner.emergency_contact
```

Use UI labels in Spanish:

```text
WhatsApp
Talla camiseta
Tiempo estimado
Informacion medica
Contacto de emergencia
```

- [ ] **Step 4: `/perfil` page**

Use `useMe()`. Render loading, empty/error state, then the three form sections. Do not fetch the profile server-side while Identity is mocked.

- [ ] **Step 5: `/perfil/completar` page**

Use the same contact and runner forms. If `isProfileComplete(user)` becomes true, redirect to `callbackUrl` query param or `/perfil`.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/web test -- profile-completion.test.ts
git add apps/web/features/users/components/profile-*.tsx "apps/web/app/(app)/perfil/page.tsx" "apps/web/app/(app)/perfil/completar/page.tsx"
git commit -m "feat(users): add profile pages and transfer data forms"
```

---

## Task 8: Gate Checkout On Complete Profile

**Files:**
- Create: `apps/web/features/users/components/profile-completion-notice.client.tsx`
- Modify: `apps/web/features/transactions/components/buyer-data-notice.client.tsx`
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`

Do not add a broad redirect to `apps/web/app/(app)/layout.tsx`. It would run server-side and cannot reliably read mocked users from browser MSW.

- [ ] **Step 1: Completion notice component**

```tsx
'use client';
import { Button } from '@/components/ui/button';
import type { MissingProfileField } from '@/features/users/lib/profile-completion';
import Link from 'next/link';

const LABELS: Record<MissingProfileField, string> = {
  phone_number: 'Telefono',
  t_shirt_size: 'Talla camiseta',
};

export function ProfileCompletionNotice({
  missing,
  callbackUrl,
}: {
  missing: MissingProfileField[];
  callbackUrl: string;
}) {
  if (missing.length === 0) return null;
  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <h2 className="font-semibold">Completa tus datos para comprar</h2>
      <p className="mt-1 text-sm text-text-secondary">
        El vendedor necesita estos datos para tramitar el cambio de titularidad.
      </p>
      <p className="mt-2 text-sm text-text-muted">Falta: {missing.map((field) => LABELS[field]).join(', ')}</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href={`/perfil/completar?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Completar perfil</Link>
      </Button>
    </section>
  );
}
```

- [ ] **Step 2: Checkout integration**

In `CheckoutForm`, call `useMe()` and `getMissingProfileFields(user)`. Before `reserve.mutateAsync`, block checkout when the profile is incomplete:

```ts
if (user && missingProfileFields.length > 0) {
  toast.error('Completa tu perfil antes de comprar');
  return;
}
```

Render `ProfileCompletionNotice` above the payment button when fields are missing. Keep the existing `BuyerDataNotice` copy, but remove the old text that says "Cuando el login este listo".

- [ ] **Step 3: Verify and commit**

```bash
pnpm --filter @dorsal/web test -- checkout-form.test.tsx profile-completion.test.ts
pnpm --filter @dorsal/web typecheck
git add apps/web/features/users/components/profile-completion-notice.client.tsx apps/web/features/transactions/components/buyer-data-notice.client.tsx apps/web/features/transactions/components/checkout-form.client.tsx
git commit -m "feat(users): require complete profile before checkout"
```

---

## Task 9: Preserve Transaction History Integration

**Files:**
- Verify: `apps/web/app/(app)/perfil/historial/page.tsx`
- Verify: `apps/web/features/transactions/hooks/use-my-purchases.ts`
- Verify: `apps/web/features/transactions/hooks/use-my-sales.ts`

- [ ] **Step 1: Do not create `HistoryTabs` or `transaction-row` under users**

The old plan asked for:

```text
apps/web/features/users/components/history-tabs.client.tsx
apps/web/features/users/components/transaction-row.tsx
api.transactions.listMine()
```

Do not implement those. They are obsolete.

- [ ] **Step 2: Verify current history page**

The page should still import:

```ts
import { useMyPurchases } from '@/features/transactions/hooks/use-my-purchases';
import { useMySales } from '@/features/transactions/hooks/use-my-sales';
```

- [ ] **Step 3: Optional profile link**

If profile navigation needs a link to history, add it from `/perfil`, not by replacing the history page.

- [ ] **Step 4: Commit only if files changed**

```bash
git add "apps/web/app/(app)/perfil/page.tsx" "apps/web/app/(app)/perfil/historial/page.tsx"
git commit -m "feat(users): link profile to transaction history"
```

---

## Task 10: Reviews MVP And Transaction Detail Integration

**Files:**
- Create: `apps/web/features/users/hooks/use-create-review.ts`
- Create: `apps/web/features/users/hooks/use-user-reviews.ts`
- Create: `apps/web/features/users/components/review-form.client.tsx`
- Create: `apps/web/features/users/components/review-list.tsx`
- Create: `apps/web/features/users/components/__tests__/review-form.test.tsx`
- Modify: `apps/web/app/(app)/compra/[transactionId]/page.tsx`

Backend Review controllers are not implemented in `MVP-Dorsales`; use MSW until they exist.

- [ ] **Step 1: Hooks**

```ts
'use client';
import { useApi } from '@/lib/api-client';
import type { CreateReviewInput } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateReview() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => api.reviews.create(input),
    onSuccess: (review) => {
      void qc.invalidateQueries({ queryKey: ['reviews', 'user', review.reviewee_id] });
    },
  });
}
```

```ts
'use client';
import { useApi } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export function useUserReviews(userId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => api.reviews.listForUser(userId as string),
    enabled: Boolean(userId),
  });
}
```

- [ ] **Step 2: Review form**

Create a 1-5 rating form plus optional comment. Submit:

```ts
create.mutate({
  transaction_id: transactionId,
  rating,
  comment: comment.trim() || undefined,
});
```

- [ ] **Step 3: Attach to transaction tracking**

In `apps/web/app/(app)/compra/[transactionId]/page.tsx`, show `ReviewForm` in the aside when:

```ts
['confirmed', 'released_to_seller'].includes(tx.status)
```

Use the same transaction id for buyer and seller. The backend/MSW decides `reviewee_id`.

- [ ] **Step 4: Verify and commit**

```bash
pnpm --filter @dorsal/web test -- review-form.test.tsx
pnpm --filter @dorsal/web typecheck
git add apps/web/features/users/hooks/use-create-review.ts apps/web/features/users/hooks/use-user-reviews.ts apps/web/features/users/components/review-form.client.tsx apps/web/features/users/components/review-list.tsx apps/web/features/users/components/__tests__/review-form.test.tsx "apps/web/app/(app)/compra/[transactionId]/page.tsx"
git commit -m "feat(users): add review form to completed transactions"
```

---

## Task 11: E2E Auth And Profile

**Files:**
- Create: `apps/web/e2e/auth.spec.ts`
- Create: `apps/web/e2e/profile.spec.ts`

- [ ] **Step 1: Auth E2E**

Cover:

```text
/login with demo@dorsal.market / demo1234 redirects to /
/registro creates a mocked user and lands on /perfil/completar
```

- [ ] **Step 2: Profile E2E**

Cover:

```text
logged-in user can update phone_number
logged-in user can update t_shirt_size
checkout blocks when profile is incomplete
checkout allows continuing when profile is complete
```

Use the existing E2E auth helper when a test only needs a session cookie.

- [ ] **Step 3: Run**

```bash
pnpm --filter @dorsal/web test:e2e -- e2e/auth.spec.ts e2e/profile.spec.ts
```

Expected: passes when the dev app is running with MSW and backend Catalog/Transaction state required by checkout tests is available.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/auth.spec.ts apps/web/e2e/profile.spec.ts
git commit -m "test(users): cover auth and profile completion flows"
```

---

## Task 12: Final Verification And PR

- [ ] **Step 1: Local verification**

```bash
pnpm --filter @dorsal/schemas typecheck
pnpm --filter @dorsal/api-client typecheck
pnpm --filter @dorsal/api-client test
pnpm --filter @dorsal/web typecheck
pnpm --filter @dorsal/web test
pnpm --filter @dorsal/web build
```

- [ ] **Step 2: Targeted formatting**

```bash
pnpm exec biome check packages/schemas/src/user.ts packages/schemas/src/review.ts packages/api-client/src/msw/users.ts packages/api-client/src/msw/reviews.ts apps/web/features/users "apps/web/app/(auth)" "apps/web/app/(app)/perfil" "apps/web/app/(app)/compra/[transactionId]/page.tsx" apps/web/features/transactions/components/buyer-data-notice.client.tsx apps/web/features/transactions/components/checkout-form.client.tsx apps/web/lib/auth.ts
```

If full repo Biome still fails on pre-existing CRLF noise, report that separately and do not format unrelated files.

- [ ] **Step 3: E2E**

```bash
pnpm --filter @dorsal/web test:e2e -- e2e/auth.spec.ts e2e/profile.spec.ts
```

If backend Catalog/Transaction is down, document the blocker with the failing URL.

- [ ] **Step 4: Push and PR**

```bash
git push -u origin feat/usuarios
```

PR:

```text
Title: feat(usuarios): Identity, profile completion and reviews MVP
Base: feat/foundation
```

PR notes:

```text
- Identity and Reviews remain mocked because MVP-Dorsales has no REST controllers for those BCs yet.
- Auth.js Credentials has a development-only server mock bridge while users is absent from NEXT_PUBLIC_REAL_API_MODULES.
- Profile fields are aligned with Transaction backend transfer data.
- UC-10 history is reused from feat/transacciones.
```

---

## Self-Review

Spec coverage:

| UC | Task |
|---|---|
| UC-01 registro/login | Tasks 3, 4, 5 |
| UC-09 perfil corredor | Tasks 2, 6, 7, 8 |
| UC-10 historial | Task 9 |
| UC-11 resenas | Task 10 |

Backend compatibility:

| Backend fact | Plan response |
|---|---|
| No Identity controllers in `MVP-Dorsales` | Keep users mocked and add Auth.js server bridge |
| No Review controllers in `MVP-Dorsales` | Keep reviews mocked |
| Transaction expects `phone_number` | Rename contact field |
| Transaction expects `t_shirt_size` | Rename runner field |
| Transaction history already exists | Reuse existing history page and hooks |

Open follow-ups after this branch:

- Replace mocked Auth.js bridge when backend Identity exposes `/api/v1/auth/login` and `/api/v1/auth/register`.
- Add `users` to `NEXT_PUBLIC_REAL_API_MODULES` only after the backend contract matches `packages/schemas/src/user.ts`.
- Add `reviews` to `NEXT_PUBLIC_REAL_API_MODULES` only after backend Review controllers exist.
- Decide whether address fields beyond `phone_number` belong to the real Identity backend or stay frontend-only for MVP.
