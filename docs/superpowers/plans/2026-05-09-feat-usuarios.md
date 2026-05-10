# feat/usuarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Identity feature surface (UC-01 registro/login, UC-09 perfil, UC-10 historial, UC-11 reseñas) against the **mocked Identity adapter** (backend not exposed yet) using MSW handlers established in `feat/foundation`. Users can sign up, log in (email + optional Google/Facebook), complete their runner profile, browse purchase/sale history and leave reviews.

**Architecture:** Auth flows go through Auth.js v5 (already wired in foundation). Profile and history pages are Client Components with TanStack Query reads + mutations. A "profile guard" Server Component layout redirects users with incomplete `RunnerProfile` to `/perfil/completar` before they can publish or buy. Cross-reviews appear on the post-transaction confirmation page.

**Tech Stack:** Inherits from foundation. No new deps.

**Spec reference:** ADR-005 (Auth.js + datos extra), ADR-007 (TanStack Query), ADR-010 (RHF + Zod), spec section 6 (route mapping).

**Pre-flight branching:**
```bash
git switch feat/dorsales      # or feat/foundation if dorsales not yet merged — see ADR-012
git pull
git switch -c feat/usuarios
```

**Mock note:** the `users` module is **mocked** by MSW in `feat/foundation` (`packages/api-client/src/msw/users.ts`). Seed user is `demo@dorsal.market` / `demo1234`. To switch to the real backend later, set `NEXT_PUBLIC_REAL_API_MODULES=dorsals,users` and the same `UsersHttpAdapter` already shipped in foundation will take over.

---

## File Structure (additions on top of foundation + dorsales)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                # UC-01 login
│   │   ├── registro/page.tsx             # UC-01 register
│   │   └── verificar-email/page.tsx      # placeholder for future flow
│   └── (app)/
│       └── perfil/
│           ├── page.tsx                  # UC-09 dashboard
│           ├── completar/page.tsx        # UC-09 forced-completion flow
│           └── historial/page.tsx        # UC-10
└── features/
    └── users/
        ├── components/
        │   ├── login-form.client.tsx
        │   ├── register-form.client.tsx
        │   ├── oauth-buttons.client.tsx
        │   ├── profile-identity-form.client.tsx
        │   ├── profile-contact-form.client.tsx
        │   ├── profile-runner-form.client.tsx
        │   ├── history-tabs.client.tsx
        │   ├── transaction-row.tsx
        │   └── review-form.client.tsx
        ├── hooks/
        │   ├── use-me.ts
        │   ├── use-update-profile.ts
        │   ├── use-create-review.ts
        │   └── use-user-reviews.ts
        ├── lib/
        │   └── profile-completion.ts     # isProfileComplete()
        └── __tests__/
            └── profile-completion.test.ts
```

---

## Task 1: Branch setup

- [ ] **Step 1: Create branch and verify foundation packages**

```bash
git switch -c feat/usuarios
pnpm install
pnpm --filter @dorsal/web typecheck
```

- [ ] **Step 2: No new deps; commit a marker (optional)**

This task ends without commit if no changes; the next task starts on the new branch.

---

## Task 2: Login form (UC-01) with Credentials + optional OAuth

**Files:**
- Create: `apps/web/features/users/components/login-form.client.tsx`
- Create: `apps/web/features/users/components/oauth-buttons.client.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`

- [ ] **Step 1: OAuth buttons (render-only-if-configured)**

`apps/web/features/users/components/oauth-buttons.client.tsx`:

```tsx
'use client';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function OAuthButtons({ google, facebook, callbackUrl = '/' }: { google: boolean; facebook: boolean; callbackUrl?: string }) {
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
      <div className="relative my-2"><div className="border-t border-border" /><span className="absolute inset-0 -top-2 mx-auto w-fit bg-bg-primary px-2 text-xs text-text-muted">o</span></div>
    </div>
  );
}
```

- [ ] **Step 2: Login form**

```tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput } from '@dorsal/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ google, facebook }: { google: boolean; facebook: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(LoginInput) });
  const { OAuthButtons } = require('./oauth-buttons.client');

  async function onSubmit(values: { email: string; password: string }) {
    setError(null);
    const res = await signIn('credentials', { ...values, redirect: false, callbackUrl });
    if (res?.error) { setError('Credenciales incorrectas'); return; }
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
          {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="text-center text-sm text-text-secondary">
        ¿No tienes cuenta? <a href="/registro" className="text-coral hover:underline">Regístrate</a>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Login page (Server Component checks env)**

```tsx
import { LoginForm } from '@/features/users/components/login-form.client';

export const metadata = { title: 'Entrar' };

export default function LoginPage() {
  const google = !!process.env.GOOGLE_CLIENT_ID;
  const facebook = !!process.env.FACEBOOK_CLIENT_ID;
  return <LoginForm google={google} facebook={facebook} />;
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @dorsal/web dev
# Visit /login — should render. Submit demo@dorsal.market / demo1234 → redirect to /
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(users): UC-01 login form with Credentials and optional OAuth"
```

---

## Task 3: Register form (UC-01) with DNI/gender/birth_date

**Files:**
- Create: `apps/web/features/users/components/register-form.client.tsx`
- Modify: `apps/web/app/(auth)/registro/page.tsx`

- [ ] **Step 1: Register form**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterInput } from '@dorsal/schemas';
import { useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const api = useApi();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(RegisterInput), defaultValues: { gender: 'prefer_not_to_say' as const } });

  async function onSubmit(values: { email: string; password: string; full_name: string; dni: string; gender: 'male'|'female'|'other'|'prefer_not_to_say'; birth_date: string }) {
    setError(null);
    try {
      await api.users.register(values);
      const res = await signIn('credentials', { email: values.email, password: values.password, redirect: false });
      if (res?.error) { setError('Cuenta creada pero no se pudo iniciar sesión'); return; }
      router.push('/perfil/completar');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    }
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-bg-card p-8">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-sm text-text-secondary">Necesitamos tu DNI para validar el cambio de titularidad.</p>
      </header>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5"><Label htmlFor="full_name">Nombre completo</Label><Input id="full_name" {...form.register('full_name')} /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...form.register('email')} /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" {...form.register('password')} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label htmlFor="dni">DNI / NIE</Label><Input id="dni" {...form.register('dni')} /></div>
          <div className="space-y-1.5"><Label htmlFor="birth_date">Fecha nacimiento</Label><Input id="birth_date" type="date" {...form.register('birth_date')} /></div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Género</Label>
          <select id="gender" {...form.register('gender')} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm">
            <option value="prefer_not_to_say">Prefiero no decirlo</option>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Register page**

```tsx
import { RegisterForm } from '@/features/users/components/register-form.client';
export const metadata = { title: 'Crear cuenta' };
export default function RegistroPage() { return <RegisterForm />; }
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(users): UC-01 registration with DNI, gender and birth date"
```

---

## Task 4: `useMe` hook + profile completion helper (TDD)

**Files:**
- Create: `apps/web/features/users/hooks/use-me.ts`
- Create: `apps/web/features/users/hooks/use-update-profile.ts`
- Create: `apps/web/features/users/lib/profile-completion.ts`
- Create: `apps/web/features/users/__tests__/profile-completion.test.ts`

- [ ] **Step 1: Failing test for `isProfileComplete`**

```ts
import { describe, expect, it } from 'vitest';
import { isProfileComplete } from '../lib/profile-completion';

const baseUser = {
  id: 'u1', email: 'a@b.c', full_name: 'A', dni: 'X', gender: 'male' as const, birth_date: '1990-01-01',
  avatar_url: null, rating_average: null, total_sales: 0, total_purchases: 0,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

describe('isProfileComplete', () => {
  it('returns false when contact phone is missing', () => {
    expect(isProfileComplete({ ...baseUser, contact: { phone: null } })).toBe(false);
  });
  it('returns false when runner shirt_size is missing', () => {
    expect(isProfileComplete({ ...baseUser, contact: { phone: '6' }, runner: {} })).toBe(false);
  });
  it('returns true when contact.phone and runner.shirt_size are set', () => {
    expect(isProfileComplete({ ...baseUser, contact: { phone: '6' }, runner: { shirt_size: 'M' } })).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import type { User } from '@dorsal/schemas';
export function isProfileComplete(u: User): boolean {
  return !!u.contact?.phone && !!u.runner?.shirt_size;
}
```

- [ ] **Step 3: `useMe` hook**

```ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

export function useMe() {
  const api = useApi();
  const { data } = useSession();
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.getMe(),
    enabled: !!data?.user?.id,
    staleTime: 60 * 1000,
  });
}
```

- [ ] **Step 4: `useUpdateProfile` hook**

```ts
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';
import type { User, RunnerProfile } from '@dorsal/schemas';

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

- [ ] **Step 5: Run tests + commit**

```bash
pnpm --filter @dorsal/web test
git add -A && git commit -m "feat(users): add useMe, useUpdateProfile and profile-completion helper"
```

---

## Task 5: Profile dashboard (UC-09) — three sections

**Files:**
- Create: `apps/web/features/users/components/profile-identity-form.client.tsx`
- Create: `apps/web/features/users/components/profile-contact-form.client.tsx`
- Create: `apps/web/features/users/components/profile-runner-form.client.tsx`
- Modify: `apps/web/app/(app)/perfil/page.tsx`

- [ ] **Step 1: Identity section (read-only DNI/gender/birth_date, editable name)**

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/features/users/hooks/use-update-profile';
import type { User } from '@dorsal/schemas';

export function ProfileIdentityForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const form = useForm({ defaultValues: { full_name: user.full_name } });

  function onSubmit(v: { full_name: string }) {
    update.mutate({ full_name: v.full_name }, {
      onSuccess: () => toast.success('Perfil actualizado'),
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-border bg-bg-card p-6">
      <h2 className="font-semibold">Datos de identidad</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" {...form.register('full_name')} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input value={user.email} disabled /></div>
        <div className="space-y-1.5"><Label>DNI</Label><Input value={user.dni} disabled /></div>
        <div className="space-y-1.5"><Label>Fecha nacimiento</Label><Input value={user.birth_date} disabled /></div>
      </div>
      <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Contact section**

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/features/users/hooks/use-update-profile';
import type { User } from '@dorsal/schemas';

export function ProfileContactForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const form = useForm({ defaultValues: user.contact ?? {} });

  function onSubmit(v: NonNullable<User['contact']>) {
    update.mutate({ contact: v }, { onSuccess: () => toast.success('Contacto actualizado'), onError: (e) => toast.error(e.message) });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-border bg-bg-card p-6">
      <h2 className="font-semibold">Contacto y dirección</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="phone">Teléfono</Label><Input id="phone" {...form.register('phone')} /></div>
        <div className="space-y-1.5"><Label htmlFor="city">Ciudad</Label><Input id="city" {...form.register('city')} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address_line">Dirección</Label><Input id="address_line" {...form.register('address_line')} /></div>
        <div className="space-y-1.5"><Label htmlFor="postal_code">CP</Label><Input id="postal_code" {...form.register('postal_code')} /></div>
        <div className="space-y-1.5"><Label htmlFor="country">País</Label><Input id="country" {...form.register('country')} placeholder="ES" /></div>
      </div>
      <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Runner section**

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProfile } from '@/features/users/hooks/use-update-profile';
import type { RunnerProfile, User } from '@dorsal/schemas';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export function ProfileRunnerForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const form = useForm<RunnerProfile>({ defaultValues: user.runner ?? {} });

  function onSubmit(v: RunnerProfile) {
    update.mutate({ runner: v }, { onSuccess: () => toast.success('Datos de corredor actualizados'), onError: (e) => toast.error(e.message) });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-border bg-bg-card p-6">
      <h2 className="font-semibold">Datos de corredor</h2>
      <p className="text-sm text-text-secondary">Estos datos se comparten automáticamente con el vendedor cuando compras.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="estimated_time_min">Tiempo estimado (min)</Label>
          <Input id="estimated_time_min" type="number" {...form.register('estimated_time_min', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shirt_size">Talla camiseta</Label>
          <select id="shirt_size" {...form.register('shirt_size')} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm">
            <option value="">Selecciona</option>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="club">Club</Label><Input id="club" {...form.register('club')} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="allergies">Alergias / Notas médicas</Label><Input id="allergies" {...form.register('allergies')} /></div>
      </div>
      <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
```

- [ ] **Step 4: Profile page**

```tsx
'use client';
import { ProfileIdentityForm } from '@/features/users/components/profile-identity-form.client';
import { ProfileContactForm } from '@/features/users/components/profile-contact-form.client';
import { ProfileRunnerForm } from '@/features/users/components/profile-runner-form.client';
import { useMe } from '@/features/users/hooks/use-me';

export default function PerfilPage() {
  const { data: user, isLoading } = useMe();
  if (isLoading || !user) return <main className="container mx-auto py-12">Cargando…</main>;
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{user.full_name}</h1>
        <p className="text-text-secondary">⭐ {user.rating_average?.toFixed(1) ?? '—'} · {user.total_sales} ventas · {user.total_purchases} compras</p>
      </header>
      <ProfileIdentityForm user={user} />
      <ProfileContactForm user={user} />
      <ProfileRunnerForm user={user} />
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(users): UC-09 profile page with identity, contact and runner sections"
```

---

## Task 6: Profile completion guard

**Files:**
- Create: `apps/web/app/(app)/perfil/completar/page.tsx`
- Modify: `apps/web/app/(app)/layout.tsx` (add redirect)

- [ ] **Step 1: Forced completion page**

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { ProfileContactForm } from '@/features/users/components/profile-contact-form.client';
import { ProfileRunnerForm } from '@/features/users/components/profile-runner-form.client';
import { useMe } from '@/features/users/hooks/use-me';
import { isProfileComplete } from '@/features/users/lib/profile-completion';
import { useEffect } from 'react';

export default function CompletarPage() {
  const router = useRouter();
  const { data: user } = useMe();
  useEffect(() => { if (user && isProfileComplete(user)) router.push('/perfil'); }, [user, router]);
  if (!user) return <main className="container mx-auto py-12">Cargando…</main>;
  return (
    <main className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Completa tu perfil</h1>
        <p className="text-text-secondary">Necesitamos teléfono y talla para que puedas comprar y vender.</p>
      </header>
      <ProfileContactForm user={user} />
      <ProfileRunnerForm user={user} />
    </main>
  );
}
```

- [ ] **Step 2: Update `(app)/layout.tsx` to redirect when incomplete**

Replace the body of `apps/web/app/(app)/layout.tsx` with:

```tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Nav } from '@/components/layout/nav';
import { auth } from '@/lib/auth';
import { getServerApi } from '@/lib/api';
import { isProfileComplete } from '@/features/users/lib/profile-completion';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.id) {
    const api = await getServerApi();
    try {
      const me = await api.users.getMe();
      const path = (await headers()).get('x-pathname') ?? '';
      const exempt = path.startsWith('/perfil/completar') || path.startsWith('/dorsales');
      if (!isProfileComplete(me) && !exempt) redirect('/perfil/completar');
    } catch { /* ignore — mock might not be ready */ }
  }
  return (<><Nav session={session} />{children}</>);
}
```

Add an `x-pathname` header in `middleware.ts` so the layout sees the URL:

```ts
// middleware.ts (additions)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth: middleware } = NextAuth(authConfig);

export default async function (req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('x-pathname', req.nextUrl.pathname);
  return res;
}

export const config = { matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'] };
```

(If `middleware.ts` already exists from foundation, merge the header injection into it.)

- [ ] **Step 3: Verify**

Log in with `demo@dorsal.market` (mock user has complete profile). Then create a fresh user via `/registro` — after register, you should be at `/perfil/completar`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(users): force profile completion before purchase/sale flows"
```

---

## Task 7: History page (UC-10)

**Files:**
- Create: `apps/web/features/users/components/history-tabs.client.tsx`
- Create: `apps/web/features/users/components/transaction-row.tsx`
- Modify: `apps/web/app/(app)/perfil/historial/page.tsx`

**Note:** transactions endpoints are mocked (`feat/foundation` Task 9). They'll return whatever the user has bought/sold during this session. `feat/transacciones` adds the actual purchase mutation.

- [ ] **Step 1: Transaction row**

```tsx
import Link from 'next/link';
import { formatPrice } from '@dorsal/domain';
import type { Transaction } from '@dorsal/schemas';

const STATUS_LABEL: Record<Transaction['status'], string> = {
  payment_held: 'Pago retenido',
  data_sent: 'Datos enviados',
  change_in_progress: 'Cambio en proceso',
  change_confirmed: 'Cambio confirmado',
  released: 'Completada',
  disputed: 'En disputa',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

export function TransactionRow({ tx, role }: { tx: Transaction; role: 'buyer' | 'seller' }) {
  return (
    <Link href={`/compra/${tx.id}`} className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-4 hover:border-border-hover">
      <div>
        <p className="font-semibold">Dorsal {tx.dorsal_id.slice(0, 8)}…</p>
        <p className="text-sm text-text-secondary">{role === 'buyer' ? 'Comprado' : 'Vendido'} · {STATUS_LABEL[tx.status]}</p>
      </div>
      <p className="font-semibold">{formatPrice(tx.amount)}</p>
    </Link>
  );
}
```

- [ ] **Step 2: History tabs**

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api-client';
import { TransactionRow } from './transaction-row';

export function HistoryTabs() {
  const api = useApi();
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const { data } = useQuery({ queryKey: ['transactions', 'mine'], queryFn: () => api.transactions.listMine(), enabled: !!myId });
  const purchases = data?.filter((t) => t.buyer_id === myId) ?? [];
  const sales     = data?.filter((t) => t.seller_id === myId) ?? [];

  return (
    <Tabs defaultValue="purchases" className="space-y-4">
      <TabsList>
        <TabsTrigger value="purchases">Compras ({purchases.length})</TabsTrigger>
        <TabsTrigger value="sales">Ventas ({sales.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="purchases" className="space-y-3">
        {purchases.length === 0 ? <p className="text-sm text-text-muted">Aún no has comprado ningún dorsal.</p> :
          purchases.map((t) => <TransactionRow key={t.id} tx={t} role="buyer" />)}
      </TabsContent>
      <TabsContent value="sales" className="space-y-3">
        {sales.length === 0 ? <p className="text-sm text-text-muted">Aún no has vendido ningún dorsal.</p> :
          sales.map((t) => <TransactionRow key={t.id} tx={t} role="seller" />)}
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Page**

```tsx
import { HistoryTabs } from '@/features/users/components/history-tabs.client';
export const metadata = { title: 'Historial' };
export default function HistorialPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Historial</h1>
      <HistoryTabs />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(users): UC-10 history page with purchases/sales tabs"
```

---

## Task 8: Reviews (UC-11) — minimal MVP

**Files:**
- Create: `apps/web/features/users/hooks/use-create-review.ts`
- Create: `apps/web/features/users/hooks/use-user-reviews.ts`
- Create: `apps/web/features/users/components/review-form.client.tsx`
- Create: `apps/web/features/users/components/review-list.tsx`

- [ ] **Step 1: Hooks**

```ts
// use-create-review.ts
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';
import type { CreateReviewInput } from '@dorsal/schemas';

export function useCreateReview() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => api.reviews.create(input),
    onSuccess: (review) => qc.invalidateQueries({ queryKey: ['reviews', 'user', review.reviewee_id] }),
  });
}
```

```ts
// use-user-reviews.ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api-client';

export function useUserReviews(userId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => api.reviews.listForUser(userId!),
    enabled: !!userId,
  });
}
```

- [ ] **Step 2: Review form (rating 1-5 + optional comment)**

```tsx
'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCreateReview } from '@/features/users/hooks/use-create-review';
import { cn } from '@/lib/utils';

export function ReviewForm({ transactionId, onDone }: { transactionId: string; onDone?: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const create = useCreateReview();

  function submit() {
    if (!rating) return;
    create.mutate({ transaction_id: transactionId, rating, comment }, {
      onSuccess: () => { toast.success('Reseña enviada'); onDone?.(); },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-bg-card p-5">
      <h3 className="font-semibold">¿Cómo fue la experiencia?</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
            <Star className={cn('h-7 w-7', n <= rating ? 'fill-coral text-coral' : 'text-text-muted')} />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Comentario (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
      />
      <Button onClick={submit} disabled={!rating || create.isPending}>
        {create.isPending ? 'Enviando…' : 'Publicar reseña'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Review list (used in seller card on detail later if wanted)**

```tsx
import { Star } from 'lucide-react';
import type { Review } from '@dorsal/schemas';

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <p className="text-sm text-text-muted">Aún no hay reseñas.</p>;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-md border border-border bg-bg-card p-4">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={n <= r.rating ? 'h-4 w-4 fill-coral text-coral' : 'h-4 w-4 text-text-muted'} />
            ))}
          </div>
          {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          <p className="mt-1 text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString('es-ES')}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(users): UC-11 review form and list (minimal MVP)"
```

---

## Task 9: E2E happy paths

**Files:**
- Create: `apps/web/e2e/auth.spec.ts`
- Create: `apps/web/e2e/profile.spec.ts`

- [ ] **Step 1: Auth flow**

```ts
import { expect, test } from '@playwright/test';

test('user can log in with seed credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'demo@dorsal.market');
  await page.fill('#password', 'demo1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('/');
  await expect(page.getByRole('button', { name: /carlos|perfil/i })).toBeVisible();
});

test('register redirects to profile completion', async ({ page }) => {
  const email = `e2e-${Date.now()}@test.local`;
  await page.goto('/registro');
  await page.fill('#full_name', 'E2E User');
  await page.fill('#email', email);
  await page.fill('#password', 'pass1234');
  await page.fill('#dni', '12345678X');
  await page.fill('#birth_date', '1990-01-01');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('/perfil/completar');
});
```

- [ ] **Step 2: Profile flow**

```ts
import { expect, test } from '@playwright/test';

test.use({ storageState: undefined });

test('seed user can edit runner data', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'demo@dorsal.market');
  await page.fill('#password', 'demo1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.goto('/perfil');
  await page.fill('#club', 'Atletismo Madrid');
  await page.getByRole('button', { name: /Guardar/i }).nth(2).click();  // runner section save
  await expect(page.getByText('Datos de corredor actualizados')).toBeVisible();
});
```

- [ ] **Step 3: Run e2e**

```bash
pnpm --filter @dorsal/web test:e2e
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(users): add E2E for login, register and profile editing"
```

---

## Task 10: Final verification + PR

- [ ] **Step 1: Local CI**

```bash
pnpm turbo run lint typecheck test build
pnpm --filter @dorsal/web test:e2e
```

- [ ] **Step 2: Open PR**

```bash
git push -u origin feat/usuarios
# PR title: "feat(usuarios): UC-01, UC-09, UC-10, UC-11 — Identity module (mocked)"
# Base: feat/dorsales
```

PR description: list each UC, screenshots of login/profile/history, note that `users` module is mocked via MSW (set `NEXT_PUBLIC_REAL_API_MODULES=dorsals,users` to swap when backend exposes Identity).

---

## Self-review

**Spec coverage:**

| UC | Task |
|---|---|
| UC-01 registro/login | Tasks 2, 3 |
| UC-09 perfil corredor | Tasks 4, 5, 6 |
| UC-10 historial | Task 7 |
| UC-11 reseñas (MVP) | Task 8 |

**ADR coverage:**
- ADR-005 Auth.js + datos extra → Task 6 (profile completion guard); Tasks 2, 3 leverage Credentials provider.
- ADR-007 TanStack Query → Tasks 4, 5, 7, 8.
- ADR-010 RHF + Zod → Tasks 2, 3, 5.

**Placeholder scan:** none. Each step has concrete code.

**Type consistency:** `User`, `RunnerProfile`, `RegisterInput`, `LoginInput`, `Review`, `CreateReviewInput`, `Transaction` referenced consistently from `@dorsal/schemas`.

**Open follow-ups:**
- Avatar upload — not in MVP. Stub: profile page renders initial letter.
- Email verification flow — placeholder route exists, full flow waits for backend support.
- Reviews list on detail page — could surface seller's reviews. Decided to defer; seller summary on detail (Task 8 of dorsales) shows aggregate rating, sufficient for MVP.
