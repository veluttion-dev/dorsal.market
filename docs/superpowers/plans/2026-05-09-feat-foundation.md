# feat/foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the dorsal-market monorepo with all shared infrastructure (packages, web app scaffolding, design system, auth scaffolding, mock layer, CI). After this plan, three feature branches (`feat/dorsales`, `feat/usuarios`, `feat/transacciones`) can begin work in parallel against a working foundation.

**Architecture:** pnpm workspaces + Turborepo monorepo. `apps/web` (Next.js 15 App Router) is the only application app for now (`apps/mobile` is reserved). Shared logic lives in `packages/{schemas, api-client, domain, ui-tokens, tsconfig}`. UI uses Tailwind + shadcn/ui with CSS-vars-based theming. Auth via Auth.js v5 with mock provider. Mock layer for unimplemented backend modules (Identity, Transaction, Review) via MSW.

**Tech Stack:** Node 20 LTS, pnpm 9, Turborepo, TypeScript 5.6+ strict, Next.js 15 (App Router, RSC), Tailwind CSS, shadcn/ui, next-themes, Auth.js v5, TanStack Query v5, react-hook-form + Zod, MSW v2, Vitest, Playwright, Biome, GitHub Actions, Vercel.

**Spec reference:** `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md` (ADR-001 through ADR-016).

**Pre-flight branching:**
```bash
git switch feat/react-native-development
git pull
git switch -c feat/foundation
```
All commits in this plan land on `feat/foundation`. Final PR target: `feat/react-native-development`.

---

## File Structure

After this plan, the repo will look like:

```
dorsal.market/
├── .github/workflows/ci.yml
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (marketing)/{page,layout}.tsx
│       │   ├── (app)/{layout}.tsx + placeholder pages
│       │   ├── (auth)/{login,registro}/page.tsx + layout.tsx
│       │   ├── api/auth/[...nextauth]/route.ts
│       │   ├── layout.tsx
│       │   ├── globals.css
│       │   ├── error.tsx
│       │   └── not-found.tsx
│       ├── components/{ui,layout,feedback}/
│       ├── features/  (empty, populated by feature branches)
│       ├── lib/{auth.ts, api.ts, env.ts, utils.ts}
│       ├── hooks/
│       ├── e2e/
│       ├── public/
│       ├── tailwind.config.ts
│       ├── postcss.config.mjs
│       ├── next.config.ts
│       ├── biome.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       └── package.json
├── packages/
│   ├── tsconfig/{base.json, nextjs.json, react-native.json, package.json}
│   ├── ui-tokens/{src/index.ts, package.json, tsconfig.json}
│   ├── schemas/{src/{common,dorsal,user,transaction,review}.ts, src/index.ts, package.json, tsconfig.json, vitest.config.ts}
│   ├── domain/{src/index.ts + utilities, package.json, tsconfig.json}
│   └── api-client/
│       ├── src/
│       │   ├── http.ts
│       │   ├── errors.ts
│       │   ├── factory.ts
│       │   ├── ports/{dorsals.ts, users.ts, transactions.ts, reviews.ts, index.ts}
│       │   ├── adapters/{dorsals-http.ts, dorsals-mock.ts, users-mock.ts, transactions-mock.ts, reviews-mock.ts, index.ts}
│       │   ├── msw/{handlers.ts, browser.ts, node.ts}
│       │   ├── hooks/{query-client.tsx, index.ts}
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── docs/
│   └── superpowers/
│       ├── specs/2026-05-09-frontend-architecture-design.md  (already exists)
│       └── plans/  (this dir)
├── mockups/  (moved from root)
│   ├── index.html, dorsales.html, dorsal-detalle.html, vender-dorsal.html, compra-confirmada.html, perfil.html
├── biome.json
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .npmrc
├── .nvmrc
├── README.md
└── .env.example
```

---

## Task 1: Move existing mockups to `mockups/` directory

**Why:** Spec ADR-012 + section 4 says mockups go in `mockups/`. Cleaning the root before any other work avoids future merge churn.

**Files:**
- Move: `index.html`, `dorsales.html`, `dorsal-detalle.html`, `vender-dorsal.html`, `compra-confirmada.html`, `perfil.html` → `mockups/`
- Modify: `README.md` (point to spec + new mockup location)

- [ ] **Step 1: Create directory and move HTML files**

```bash
mkdir -p mockups
git mv index.html dorsales.html dorsal-detalle.html vender-dorsal.html compra-confirmada.html perfil.html mockups/
```

- [ ] **Step 2: Replace README.md with a project pointer**

```markdown
# dorsal.market

Marketplace de dorsales de carreras populares con escrow.

## Documentación

- **Arquitectura:** [docs/superpowers/specs/2026-05-09-frontend-architecture-design.md](docs/superpowers/specs/2026-05-09-frontend-architecture-design.md)
- **Planes de implementación:** [docs/superpowers/plans/](docs/superpowers/plans/)
- **Mockups visuales (HTML):** [mockups/](mockups/)

## Quickstart

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Web app: http://localhost:3000
```

- [ ] **Step 3: Verify the move**

```bash
ls mockups/  # should list 6 .html files
ls *.html 2>&1 | head  # should say "No such file or directory"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: move HTML mockups to mockups/ and update README"
```

---

## Task 2: Initialize pnpm monorepo at root

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `turbo.json`, `biome.json`, `.gitignore` (replace), `.env.example`

- [ ] **Step 1: Create `.nvmrc`**

```
20
```

- [ ] **Step 2: Create `.npmrc`**

```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create root `package.json`**

```json
{
  "name": "dorsal-market",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "biome format --write .",
    "format:check": "biome format ."
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "turbo": "2.3.3",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 5: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "tsconfig.json", "biome.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": ["NODE_ENV"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e": { "dependsOn": ["^build", "build"], "outputs": ["playwright-report/**"], "env": ["BASE_URL"] }
  }
}
```

- [ ] **Step 6: Create root `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "ignore": ["**/.next", "**/dist", "**/node_modules", "**/.turbo", "mockups/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error", "noUnusedImports": "error" },
      "style": { "useImportType": "error", "noNonNullAssertion": "warn" },
      "suspicious": { "noExplicitAny": "warn" }
    }
  }
}
```

- [ ] **Step 7: Replace root `.gitignore`**

```
# Dependencies
node_modules/

# Build outputs
.next/
dist/
out/
build/

# Turbo
.turbo

# Test outputs
coverage/
playwright-report/
.playwright/

# Environment
.env
.env.local
.env.*.local

# OS / editor
.DS_Store
*.log
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
```

- [ ] **Step 8: Create root `.env.example`**

```
# Backend (Catalog real, otros mock por defecto)
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Mock layer: csv de módulos que usan adapter HTTP real
NEXT_PUBLIC_REAL_API_MODULES=dorsals

# Auth.js
NEXTAUTH_SECRET=replace-me-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OAuth (opcional — sin estos, solo login email+password)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Stripe (cuando llegue)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# S3 / presign (cuando llegue)
AWS_REGION=
S3_BUCKET=

# Observabilidad (opcional, vacío = no envía)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 9: Install root deps and verify**

```bash
pnpm install
pnpm format:check  # should succeed (no files to format yet beyond configs)
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: initialize pnpm monorepo with turborepo and biome"
```

---

## Task 3: Create `packages/tsconfig` shared TypeScript configs

**Files:**
- Create: `packages/tsconfig/{base.json, nextjs.json, react-native.json, library.json, package.json}`

- [ ] **Step 1: Create `packages/tsconfig/package.json`**

```json
{
  "name": "@dorsal/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-native.json", "library.json"]
}
```

- [ ] **Step 2: Create `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "incremental": true,
    "declaration": false,
    "noEmit": true
  },
  "exclude": ["node_modules", "dist", ".next", "coverage", "playwright-report"]
}
```

- [ ] **Step 3: Create `packages/tsconfig/library.json`** (for shared packages that emit types)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Create `packages/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "allowJs": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 5: Create `packages/tsconfig/react-native.json`** (placeholder for future mobile app)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "moduleResolution": "Node"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(tsconfig): add shared TypeScript configs"
```

---

## Task 4: Create `packages/ui-tokens` design tokens package

**Why:** Spec ADR-008 + ADR-009 — single source of truth for design tokens, consumed by Tailwind in web and (later) by Expo styles in mobile. Tokens are TypeScript constants paired with CSS custom properties so the runtime can swap themes without rebuilding.

**Files:**
- Create: `packages/ui-tokens/{src/index.ts, src/css-vars.ts, src/tokens.test.ts, package.json, tsconfig.json, vitest.config.ts}`

- [ ] **Step 1: Create `packages/ui-tokens/package.json`**

```json
{
  "name": "@dorsal/ui-tokens",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@dorsal/tsconfig": "workspace:*",
    "typescript": "5.6.3",
    "vitest": "2.1.5"
  }
}
```

- [ ] **Step 2: Create `packages/ui-tokens/tsconfig.json`**

```json
{
  "extends": "@dorsal/tsconfig/base.json",
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/ui-tokens/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 4: Write the failing test for tokens shape**

`packages/ui-tokens/src/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { colors, radius, fonts, shadows, transitions } from './index';

describe('design tokens', () => {
  it('exposes coral palette with required shades', () => {
    expect(colors.coral).toMatchObject({
      DEFAULT: expect.any(String),
      hover: expect.any(String),
      glow: expect.any(String),
      subtle: expect.any(String),
    });
  });

  it('exposes olive palette with required shades', () => {
    expect(colors.olive).toMatchObject({
      DEFAULT: expect.any(String),
      dark: expect.any(String),
      subtle: expect.any(String),
    });
  });

  it('exposes background, text and border tokens as CSS-var references', () => {
    expect(colors.bg.primary).toMatch(/^var\(--/);
    expect(colors.text.primary).toMatch(/^var\(--/);
    expect(colors.border.DEFAULT).toMatch(/^var\(--/);
  });

  it('exposes radius scale (sm,md,lg,xl)', () => {
    expect(radius).toMatchObject({
      sm: expect.any(String),
      md: expect.any(String),
      lg: expect.any(String),
      xl: expect.any(String),
    });
  });

  it('exposes font family CSS variables', () => {
    expect(fonts.sans).toBe('var(--font-outfit)');
    expect(fonts.mono).toBe('var(--font-space-mono)');
  });

  it('exposes shadows and transitions', () => {
    expect(shadows.card).toMatch(/var\(--/);
    expect(transitions.DEFAULT).toMatch(/cubic-bezier|ease/);
  });
});
```

- [ ] **Step 5: Run test (must fail with "module not found")**

```bash
cd packages/ui-tokens
pnpm vitest run
```

Expected: tests fail because `./index` does not exist.

- [ ] **Step 6: Create `packages/ui-tokens/src/index.ts`**

```ts
export const colors = {
  coral: {
    DEFAULT: 'var(--coral)',
    hover: 'var(--coral-hover)',
    glow: 'var(--coral-glow)',
    subtle: 'var(--coral-subtle)',
  },
  olive: {
    DEFAULT: 'var(--olive)',
    dark: 'var(--olive-dark)',
    subtle: 'var(--olive-subtle)',
  },
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    card: 'var(--bg-card)',
    elevated: 'var(--bg-elevated)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },
  border: {
    DEFAULT: 'var(--border)',
    hover: 'var(--border-hover)',
  },
} as const;

export const radius = {
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
} as const;

export const fonts = {
  sans: 'var(--font-outfit)',
  mono: 'var(--font-space-mono)',
} as const;

export const shadows = {
  card: 'var(--shadow-card)',
  elevated: 'var(--shadow-elevated)',
} as const;

export const transitions = {
  DEFAULT: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
```

- [ ] **Step 7: Create `packages/ui-tokens/src/css-vars.ts`** (literal CSS for `globals.css` to import)

```ts
export const cssVarsLight = `
  --bg-primary: #fafaf8; --bg-secondary: #f2f1ed; --bg-card: #ffffff; --bg-elevated: #f7f6f3;
  --text-primary: #1a1a1f; --text-secondary: #5a5a68; --text-muted: #8a8a96;
  --coral: #e8552d; --coral-hover: #d44a24; --coral-glow: rgba(232,85,45,0.2); --coral-subtle: rgba(232,85,45,0.08);
  --olive: #4a7c3f; --olive-dark: #3d6834; --olive-subtle: rgba(74,124,63,0.1);
  --border: rgba(0,0,0,0.08); --border-hover: rgba(0,0,0,0.15);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  --shadow-elevated: 0 12px 40px rgba(0,0,0,0.1);
`;

export const cssVarsDark = `
  --bg-primary: #111113; --bg-secondary: #1a1a1f; --bg-card: #1f1f26; --bg-elevated: #26262e;
  --text-primary: #f0efec; --text-secondary: #a0a0ac; --text-muted: #6a6a78;
  --coral: #e8552d; --coral-hover: #f06a3f; --coral-glow: rgba(232,85,45,0.25); --coral-subtle: rgba(232,85,45,0.08);
  --olive: #6dab5e; --olive-dark: #4a7c3f; --olive-subtle: rgba(109,171,94,0.1);
  --border: rgba(255,255,255,0.08); --border-hover: rgba(255,255,255,0.16);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.3);
  --shadow-elevated: 0 12px 40px rgba(0,0,0,0.4);
`;
```

- [ ] **Step 8: Run test (must pass)**

```bash
pnpm vitest run
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui-tokens): add design tokens package mirroring mockup palette"
```

---

## Task 5: Create `packages/schemas` — Zod schemas for shared contracts

**Why:** Spec ADR-004 — Zod schemas are the single source of truth for types and runtime validation across web, future mobile and adapters. Defined now so feature branches consume them as-is.

**Files:**
- Create: `packages/schemas/{src/{common,dorsal,user,transaction,review,index}.ts, src/__tests__/dorsal.test.ts, package.json, tsconfig.json, vitest.config.ts}`

- [ ] **Step 1: Create `packages/schemas/package.json`**

```json
{
  "name": "@dorsal/schemas",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@dorsal/tsconfig": "workspace:*",
    "typescript": "5.6.3",
    "vitest": "2.1.5"
  }
}
```

- [ ] **Step 2: Create `packages/schemas/tsconfig.json`** and `vitest.config.ts` analogous to ui-tokens.

```json
{ "extends": "@dorsal/tsconfig/base.json", "include": ["src/**/*"] }
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 3: Create `packages/schemas/src/common.ts`**

```ts
import { z } from 'zod';

export const Uuid = z.string().uuid();
export type Uuid = z.infer<typeof Uuid>;

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
export const IsoDateTime = z.string().datetime();

export const Pagination = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof Pagination>;

export const ErrorResponse = z.object({
  detail: z.union([z.string(), z.array(z.object({ loc: z.array(z.union([z.string(), z.number()])), msg: z.string(), type: z.string() }))]),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
```

- [ ] **Step 4: Create `packages/schemas/src/dorsal.ts`** (mirrors Postman collection exactly)

```ts
import { z } from 'zod';
import { IsoDate, IsoDateTime, Pagination, Uuid } from './common';

export const Distance = z.enum(['5k', '10k', '21k', '42k', 'trail', 'ultra']);
export type Distance = z.infer<typeof Distance>;

export const PaymentMethod = z.enum(['bizum', 'paypal', 'card']);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const DorsalStatus = z.enum(['draft', 'published', 'sold', 'cancelled']);
export type DorsalStatus = z.infer<typeof DorsalStatus>;

export const IncludedItems = z.object({
  chip: z.boolean(),
  shirt: z.boolean(),
  bag: z.boolean(),
  medal: z.boolean(),
  refreshments: z.boolean(),
});
export type IncludedItems = z.infer<typeof IncludedItems>;

export const ContactInfo = z.object({
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone_visible: z.boolean(),
  email_visible: z.boolean(),
});
export type ContactInfo = z.infer<typeof ContactInfo>;

export const DorsalSummary = z.object({
  id: Uuid,
  race_name: z.string(),
  race_date: IsoDate.nullable(),
  location: z.string(),
  distance: Distance,
  price_amount: z.coerce.number().nonnegative(),
  payment_methods: z.array(PaymentMethod),
  photo_url: z.string().url(),
  status: DorsalStatus,
});
export type DorsalSummary = z.infer<typeof DorsalSummary>;

export const DorsalDetail = DorsalSummary.extend({
  bib_number: z.string().nullable(),
  start_corral: z.string().nullable(),
  included_items: IncludedItems,
  contact_phone: z.string().nullable(),
  contact_email: z.string().email().nullable(),
  sale_reason: z.string().nullable(),
  seller_id: Uuid,
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type DorsalDetail = z.infer<typeof DorsalDetail>;

export const DorsalListResponse = z.object({
  items: z.array(DorsalSummary),
}).merge(Pagination);
export type DorsalListResponse = z.infer<typeof DorsalListResponse>;

export const PublishDorsalInput = z.object({
  publish: z.boolean(),
  photo_url: z.string().url(),
  race_name: z.string().min(1).optional(),
  bib_number: z.string().min(1).optional(),
  race_date: IsoDate.optional(),
  location: z.string().min(1).optional(),
  distance: Distance.optional(),
  start_corral: z.string().nullable().optional(),
  included_items: IncludedItems.optional(),
  price_amount: z.coerce.number().nonnegative().optional(),
  payment_methods: z.array(PaymentMethod).optional(),
  contact: ContactInfo.optional(),
  sale_reason: z.string().nullable().optional(),
}).refine(
  (v) => !v.publish || (v.race_name && v.race_date && v.location && v.distance && v.included_items && v.price_amount !== undefined && v.payment_methods?.length && v.contact),
  { message: 'When publish=true, all required fields must be provided', path: ['publish'] },
);
export type PublishDorsalInput = z.infer<typeof PublishDorsalInput>;

export const PublishDorsalResponse = z.object({
  dorsal_id: Uuid,
  status: DorsalStatus,
});
export type PublishDorsalResponse = z.infer<typeof PublishDorsalResponse>;

export const SearchDorsalsQuery = z.object({
  race_name: z.string().optional(),
  distance: z.array(Distance).optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  payment_method: PaymentMethod.optional(),
  location: z.string().optional(),
  date_from: IsoDate.optional(),
  date_to: IsoDate.optional(),
  sort_by: z.enum(['price', 'race_date', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
});
export type SearchDorsalsQuery = z.infer<typeof SearchDorsalsQuery>;
```

- [ ] **Step 5: Write failing tests for dorsal schemas**

`packages/schemas/src/__tests__/dorsal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DorsalDetail, DorsalListResponse, Distance, PaymentMethod, PublishDorsalInput, SearchDorsalsQuery } from '../dorsal';

describe('Distance enum', () => {
  it('accepts known distances', () => {
    expect(Distance.parse('10k')).toBe('10k');
  });
  it('rejects unknown distances', () => {
    expect(() => Distance.parse('marathon')).toThrow();
  });
});

describe('PaymentMethod enum', () => {
  it('rejects cash', () => {
    expect(() => PaymentMethod.parse('cash')).toThrow();
  });
});

describe('DorsalDetail', () => {
  it('parses a fully populated dorsal from Postman seed', () => {
    const sample = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      seller_id: '550e8400-e29b-41d4-a716-446655440001',
      photo_url: 'https://example.com/p.jpg',
      race_name: 'San Silvestre Madrid',
      race_date: '2026-12-31',
      location: 'Madrid',
      distance: '10k',
      bib_number: '1234',
      start_corral: 'B',
      included_items: { chip: true, shirt: true, bag: false, medal: true, refreshments: false },
      price_amount: 45,
      payment_methods: ['bizum', 'paypal'],
      contact_phone: '612345678',
      contact_email: 'seller@example.com',
      sale_reason: 'I broke my ankle',
      status: 'published',
      created_at: '2026-04-19T20:00:00Z',
      updated_at: '2026-04-19T20:00:00Z',
    };
    const parsed = DorsalDetail.parse(sample);
    expect(parsed.distance).toBe('10k');
  });

  it('coerces price_amount from string (backend may serialize Decimal as string)', () => {
    const parsed = DorsalDetail.parse({
      id: '550e8400-e29b-41d4-a716-446655440010',
      seller_id: '550e8400-e29b-41d4-a716-446655440001',
      photo_url: 'https://example.com/p.jpg',
      race_name: 'Test', race_date: null, location: 'Madrid', distance: '10k',
      bib_number: null, start_corral: null,
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      price_amount: '45.00',
      payment_methods: ['bizum'],
      contact_phone: null, contact_email: null, sale_reason: null,
      status: 'published',
      created_at: '2026-04-19T20:00:00Z',
      updated_at: '2026-04-19T20:00:00Z',
    });
    expect(parsed.price_amount).toBe(45);
  });
});

describe('DorsalListResponse', () => {
  it('requires items + pagination fields', () => {
    const empty = { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
    expect(DorsalListResponse.parse(empty)).toEqual(empty);
  });
});

describe('PublishDorsalInput', () => {
  it('accepts a draft (publish=false) with only photo_url', () => {
    expect(PublishDorsalInput.parse({ publish: false, photo_url: 'https://x/y.jpg' })).toMatchObject({ publish: false });
  });

  it('rejects publish=true without required fields', () => {
    expect(() => PublishDorsalInput.parse({ publish: true, photo_url: 'https://x/y.jpg' })).toThrow();
  });
});

describe('SearchDorsalsQuery', () => {
  it('coerces numeric strings (price_min/max from URL)', () => {
    const q = SearchDorsalsQuery.parse({ price_min: '20', page: '2' });
    expect(q.price_min).toBe(20);
    expect(q.page).toBe(2);
  });

  it('rejects sort_by=relevance', () => {
    expect(() => SearchDorsalsQuery.parse({ sort_by: 'relevance' })).toThrow();
  });
});
```

- [ ] **Step 6: Create user/transaction/review schema skeletons**

`packages/schemas/src/user.ts`:

```ts
import { z } from 'zod';
import { Uuid, IsoDateTime } from './common';

export const Gender = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export const ShirtSize = z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  dni: z.string().min(8).max(12),
  gender: Gender,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({ email: z.string().email(), password: z.string().min(8) });
export type LoginInput = z.infer<typeof LoginInput>;

export const RunnerProfile = z.object({
  estimated_time_min: z.number().int().positive().nullable().optional(),
  shirt_size: ShirtSize.nullable().optional(),
  club: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
});
export type RunnerProfile = z.infer<typeof RunnerProfile>;

export const ContactAddress = z.object({
  phone: z.string().nullable().optional(),
  address_line: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export const User = z.object({
  id: Uuid,
  email: z.string().email(),
  full_name: z.string(),
  dni: z.string(),
  gender: Gender,
  birth_date: z.string(),
  avatar_url: z.string().url().nullable(),
  rating_average: z.number().min(0).max(5).nullable(),
  total_sales: z.number().int().nonnegative().default(0),
  total_purchases: z.number().int().nonnegative().default(0),
  contact: ContactAddress.optional(),
  runner: RunnerProfile.optional(),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type User = z.infer<typeof User>;

export const SessionUser = z.object({ id: Uuid, email: z.string().email(), name: z.string(), image: z.string().url().nullable().optional() });
export type SessionUser = z.infer<typeof SessionUser>;
```

`packages/schemas/src/transaction.ts`:

```ts
import { z } from 'zod';
import { Uuid, IsoDateTime } from './common';

export const TransactionStatus = z.enum([
  'payment_held',     // Paso 1: pago retenido en escrow
  'data_sent',        // Paso 2: datos del comprador enviados al vendedor
  'change_in_progress', // Paso 3: cambio de titularidad iniciado por vendedor
  'change_confirmed', // Paso 4: cambio confirmado por organizador o ambas partes
  'released',         // Paso 5: dinero liberado al vendedor
  'disputed',
  'cancelled',
  'refunded',
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const TimelineStepKey = z.enum(['payment_held', 'data_sent', 'change_in_progress', 'change_confirmed', 'released']);
export const TimelineStep = z.object({ step: TimelineStepKey, completed: z.boolean(), completed_at: IsoDateTime.nullable() });
export type TimelineStep = z.infer<typeof TimelineStep>;

export const PurchaseInput = z.object({ dorsal_id: Uuid, payment_method: z.enum(['card']) });
export type PurchaseInput = z.infer<typeof PurchaseInput>;

export const Transaction = z.object({
  id: Uuid,
  dorsal_id: Uuid,
  buyer_id: Uuid,
  seller_id: Uuid,
  amount: z.number().nonnegative(),
  currency: z.literal('EUR'),
  status: TransactionStatus,
  stripe_payment_intent_id: z.string().nullable(),
  timeline: z.array(TimelineStep),
  created_at: IsoDateTime,
  updated_at: IsoDateTime,
});
export type Transaction = z.infer<typeof Transaction>;

export const Dispute = z.object({
  id: Uuid,
  transaction_id: Uuid,
  opened_by: Uuid,
  reason: z.string(),
  evidence_urls: z.array(z.string().url()).default([]),
  status: z.enum(['open', 'investigating', 'resolved_buyer', 'resolved_seller']),
  created_at: IsoDateTime,
});
export type Dispute = z.infer<typeof Dispute>;

export const ChatMessage = z.object({
  id: Uuid,
  transaction_id: Uuid,
  sender_id: Uuid,
  content: z.string(),
  created_at: IsoDateTime,
});
export type ChatMessage = z.infer<typeof ChatMessage>;
```

`packages/schemas/src/review.ts`:

```ts
import { z } from 'zod';
import { Uuid, IsoDateTime } from './common';

export const Review = z.object({
  id: Uuid,
  transaction_id: Uuid,
  reviewer_id: Uuid,
  reviewee_id: Uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: IsoDateTime,
});
export type Review = z.infer<typeof Review>;

export const CreateReviewInput = z.object({
  transaction_id: Uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;
```

`packages/schemas/src/index.ts`:

```ts
export * from './common';
export * from './dorsal';
export * from './user';
export * from './transaction';
export * from './review';
```

- [ ] **Step 7: Run all tests (must pass)**

```bash
pnpm install  # picks up zod
cd packages/schemas
pnpm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(schemas): add Zod schemas for dorsal, user, transaction, review domains"
```

---

## Task 6: Create `packages/domain` — pure business logic utilities

**Why:** Spec ADR-001 — pure functions sharable web↔mobile.

**Files:**
- Create: `packages/domain/{src/{index.ts,can-buy.ts,format.ts,timeline.ts}, src/__tests__/, package.json, tsconfig.json, vitest.config.ts}`

- [ ] **Step 1: Create `packages/domain/package.json`** (analogous to schemas)

```json
{
  "name": "@dorsal/domain",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@dorsal/schemas": "workspace:*"
  },
  "devDependencies": {
    "@dorsal/tsconfig": "workspace:*",
    "typescript": "5.6.3",
    "vitest": "2.1.5"
  }
}
```

`tsconfig.json`: `{ "extends": "@dorsal/tsconfig/base.json", "include": ["src/**/*"] }`
`vitest.config.ts`: same as ui-tokens.

- [ ] **Step 2: Write failing tests for canBuyDorsal**

`packages/domain/src/__tests__/can-buy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canBuyDorsal } from '../can-buy';

describe('canBuyDorsal', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440001';
  const sellerId = '550e8400-e29b-41d4-a716-446655440002';

  it('blocks buying own dorsal', () => {
    expect(canBuyDorsal({ userId: sellerId, sellerId, status: 'published' })).toEqual({ ok: false, reason: 'own_dorsal' });
  });

  it('blocks buying non-published dorsal', () => {
    expect(canBuyDorsal({ userId, sellerId, status: 'sold' })).toEqual({ ok: false, reason: 'not_available' });
    expect(canBuyDorsal({ userId, sellerId, status: 'draft' })).toEqual({ ok: false, reason: 'not_available' });
  });

  it('blocks anonymous users', () => {
    expect(canBuyDorsal({ userId: null, sellerId, status: 'published' })).toEqual({ ok: false, reason: 'not_authenticated' });
  });

  it('allows buying a published dorsal from another user', () => {
    expect(canBuyDorsal({ userId, sellerId, status: 'published' })).toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: Implement `packages/domain/src/can-buy.ts`**

```ts
import type { DorsalStatus } from '@dorsal/schemas';

export type CanBuyInput = { userId: string | null; sellerId: string; status: DorsalStatus };
export type CanBuyResult = { ok: true } | { ok: false; reason: 'own_dorsal' | 'not_available' | 'not_authenticated' };

export function canBuyDorsal({ userId, sellerId, status }: CanBuyInput): CanBuyResult {
  if (!userId) return { ok: false, reason: 'not_authenticated' };
  if (userId === sellerId) return { ok: false, reason: 'own_dorsal' };
  if (status !== 'published') return { ok: false, reason: 'not_available' };
  return { ok: true };
}
```

- [ ] **Step 4: Write failing tests for formatPrice**

`packages/domain/src/__tests__/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatPrice, formatRaceDate } from '../format';

describe('formatPrice', () => {
  it('formats EUR with es-ES locale by default', () => {
    expect(formatPrice(45)).toBe('45 €');
    expect(formatPrice(45.5)).toBe('45,50 €');
    expect(formatPrice(1200.99)).toBe('1.200,99 €');
  });

  it('respects locale override', () => {
    expect(formatPrice(45, 'en-US')).toBe('€45.00');
  });
});

describe('formatRaceDate', () => {
  it('formats ISO date as "01 Dic 2026" in Spanish', () => {
    expect(formatRaceDate('2026-12-01')).toBe('01 dic 2026');
  });
  it('returns dash for null', () => {
    expect(formatRaceDate(null)).toBe('—');
  });
});
```

- [ ] **Step 5: Implement `packages/domain/src/format.ts`**

```ts
export function formatPrice(amount: number, locale: string = 'es-ES', currency: string = 'EUR'): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
  return fmt.format(amount);
}

export function formatRaceDate(isoDate: string | null, locale: string = 'es-ES'): string {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}
```

- [ ] **Step 6: Write failing tests + implement timeline helper**

`packages/domain/src/__tests__/timeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeTimelineProgress } from '../timeline';
import type { TimelineStep } from '@dorsal/schemas';

describe('computeTimelineProgress', () => {
  const baseSteps: TimelineStep[] = [
    { step: 'payment_held', completed: true, completed_at: '2026-05-01T10:00:00Z' },
    { step: 'data_sent', completed: true, completed_at: '2026-05-01T10:05:00Z' },
    { step: 'change_in_progress', completed: false, completed_at: null },
    { step: 'change_confirmed', completed: false, completed_at: null },
    { step: 'released', completed: false, completed_at: null },
  ];

  it('returns the index of the next pending step', () => {
    expect(computeTimelineProgress(baseSteps)).toEqual({ currentIndex: 2, percent: 40, isComplete: false });
  });

  it('marks complete when all steps done', () => {
    const done = baseSteps.map((s) => ({ ...s, completed: true }));
    expect(computeTimelineProgress(done)).toEqual({ currentIndex: 5, percent: 100, isComplete: true });
  });
});
```

`packages/domain/src/timeline.ts`:

```ts
import type { TimelineStep } from '@dorsal/schemas';

export type TimelineProgress = { currentIndex: number; percent: number; isComplete: boolean };

export function computeTimelineProgress(steps: readonly TimelineStep[]): TimelineProgress {
  const completed = steps.filter((s) => s.completed).length;
  const currentIndex = completed;
  const percent = Math.round((completed / steps.length) * 100);
  return { currentIndex, percent, isComplete: completed === steps.length };
}
```

- [ ] **Step 7: Create `packages/domain/src/index.ts`**

```ts
export * from './can-buy';
export * from './format';
export * from './timeline';
```

- [ ] **Step 8: Run tests (must pass)**

```bash
cd packages/domain
pnpm test
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(domain): add pure business utilities (canBuy, format, timeline)"
```

---

## Task 7: Create `packages/api-client` — HTTP client, ports and errors

**Why:** Spec ADR-004. The HTTP client is the only point that knows about `X-User-Id` (or future `Authorization: Bearer`). Errors are typed so UI can branch on them.

**Files:**
- Create: `packages/api-client/{src/{http.ts, errors.ts, ports/{dorsals.ts, users.ts, transactions.ts, reviews.ts, index.ts}, factory.ts, index.ts}, src/__tests__/, package.json, tsconfig.json, vitest.config.ts}`

- [ ] **Step 1: Create `packages/api-client/package.json`**

```json
{
  "name": "@dorsal/api-client",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@dorsal/schemas": "workspace:*",
    "@tanstack/react-query": "5.59.20",
    "msw": "2.6.6",
    "react": "19.0.0",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@dorsal/tsconfig": "workspace:*",
    "@testing-library/react": "16.0.1",
    "@types/react": "19.0.0",
    "happy-dom": "15.11.7",
    "typescript": "5.6.3",
    "vitest": "2.1.5"
  },
  "peerDependencies": { "react": ">=19" }
}
```

- [ ] **Step 2: Create `tsconfig.json`** for api-client

```json
{
  "extends": "@dorsal/tsconfig/base.json",
  "compilerOptions": { "lib": ["ES2022", "DOM"], "jsx": "react-jsx" },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/api-client/src/errors.ts`**

```ts
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly detail?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
export class UnauthorizedError extends ApiError { constructor(d?: unknown) { super('Unauthorized', 401, d); this.name = 'UnauthorizedError'; } }
export class ForbiddenError    extends ApiError { constructor(d?: unknown) { super('Forbidden',    403, d); this.name = 'ForbiddenError';    } }
export class NotFoundError     extends ApiError { constructor(d?: unknown) { super('Not found',    404, d); this.name = 'NotFoundError';     } }
export class ValidationError   extends ApiError { constructor(d?: unknown) { super('Validation',   422, d); this.name = 'ValidationError';   } }
export class ServerError       extends ApiError { constructor(s = 500, d?: unknown) { super('Server', s, d); this.name = 'ServerError'; } }
export class NetworkError      extends Error    { constructor(cause?: unknown) { super('Network'); this.cause = cause; this.name = 'NetworkError'; } }

export function fromHttpStatus(status: number, detail?: unknown): ApiError {
  if (status === 401) return new UnauthorizedError(detail);
  if (status === 403) return new ForbiddenError(detail);
  if (status === 404) return new NotFoundError(detail);
  if (status === 422) return new ValidationError(detail);
  if (status >= 500)  return new ServerError(status, detail);
  return new ApiError(`HTTP ${status}`, status, detail);
}
```

- [ ] **Step 4: Write failing test for HttpClient**

`packages/api-client/src/__tests__/http.test.ts`:

```ts
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createHttp } from '../http';
import { NotFoundError, ValidationError } from '../errors';

const fetchMock = vi.fn();
beforeAll(() => { vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { fetchMock.mockReset(); });

describe('createHttp', () => {
  const http = createHttp({ baseUrl: 'http://api.test', getUserId: () => 'user-1' });

  it('attaches X-User-Id header when getUserId returns a value', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"items":[]}', { status: 200, headers: { 'content-type': 'application/json' } }));
    await http.get('/api/v1/dorsals');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBe('user-1');
  });

  it('omits X-User-Id when getUserId returns null', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const anon = createHttp({ baseUrl: 'http://api.test', getUserId: () => null });
    await anon.get('/api/v1/dorsals');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBeNull();
  });

  it('throws NotFoundError on 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"detail":"not found"}', { status: 404, headers: { 'content-type': 'application/json' } }));
    await expect(http.get('/missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError on 422 with detail', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"detail":[{"loc":["body","email"],"msg":"invalid","type":"value_error"}]}', { status: 422 }));
    await expect(http.post('/x', { body: {} })).rejects.toBeInstanceOf(ValidationError);
  });

  it('serializes URLSearchParams for repeated query params', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await http.get('/api/v1/dorsals', { query: { distance: ['10k', '42k'], price_max: 50 } });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('distance=10k');
    expect(url).toContain('distance=42k');
    expect(url).toContain('price_max=50');
  });
});
```

- [ ] **Step 5: Implement `packages/api-client/src/http.ts`**

```ts
import { fromHttpStatus, NetworkError } from './errors';

export type GetUserId = () => string | null | undefined;

export interface HttpRequest {
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface HttpClient {
  get<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  post<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  put<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  patch<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
  delete<T = unknown>(path: string, opts?: HttpRequest): Promise<T>;
}

export interface HttpClientOptions {
  baseUrl: string;
  getUserId: GetUserId;
}

function buildUrl(base: string, path: string, query?: HttpRequest['query']): string {
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, String(item)));
      else url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

export function createHttp(opts: HttpClientOptions): HttpClient {
  async function request<T>(method: string, path: string, init?: HttpRequest): Promise<T> {
    const headers = new Headers(init?.headers);
    if (init?.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const userId = opts.getUserId();
    if (userId) headers.set('X-User-Id', userId);

    let response: Response;
    try {
      response = await fetch(buildUrl(opts.baseUrl, path, init?.query), {
        method,
        headers,
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: init?.signal,
      });
    } catch (e) {
      throw new NetworkError(e);
    }

    if (!response.ok) {
      let detail: unknown;
      try { detail = await response.json(); } catch { /* ignore */ }
      throw fromHttpStatus(response.status, detail);
    }

    if (response.status === 204) return undefined as T;
    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return (await response.json()) as T;
    return (await response.text()) as unknown as T;
  }

  return {
    get:    (p, o) => request('GET', p, o),
    post:   (p, o) => request('POST', p, o),
    put:    (p, o) => request('PUT', p, o),
    patch:  (p, o) => request('PATCH', p, o),
    delete: (p, o) => request('DELETE', p, o),
  };
}
```

- [ ] **Step 6: Define ports**

`packages/api-client/src/ports/dorsals.ts`:

```ts
import type { DorsalDetail, DorsalListResponse, PublishDorsalInput, PublishDorsalResponse, SearchDorsalsQuery } from '@dorsal/schemas';

export interface DorsalsPort {
  search(query: SearchDorsalsQuery): Promise<DorsalListResponse>;
  getById(id: string): Promise<DorsalDetail>;
  publish(input: PublishDorsalInput): Promise<PublishDorsalResponse>;
}
```

`packages/api-client/src/ports/users.ts`:

```ts
import type { LoginInput, RegisterInput, RunnerProfile, SessionUser, User } from '@dorsal/schemas';

export interface UsersPort {
  register(input: RegisterInput): Promise<SessionUser>;
  login(email: string, password: string): Promise<SessionUser>;
  getMe(): Promise<User>;
  updateProfile(input: { contact?: User['contact']; runner?: RunnerProfile; full_name?: string }): Promise<User>;
  getById(id: string): Promise<Pick<User, 'id' | 'full_name' | 'avatar_url' | 'rating_average' | 'total_sales'>>;
}
```

`packages/api-client/src/ports/transactions.ts`:

```ts
import type { ChatMessage, Dispute, PurchaseInput, Transaction } from '@dorsal/schemas';

export interface TransactionsPort {
  purchase(input: PurchaseInput): Promise<{ transaction_id: string; client_secret: string }>;
  confirmPayment(transactionId: string): Promise<Transaction>;
  getById(id: string): Promise<Transaction>;
  listMine(): Promise<Transaction[]>;
  advanceStep(transactionId: string, step: Transaction['timeline'][number]['step']): Promise<Transaction>;
  openDispute(transactionId: string, reason: string, evidenceUrls: string[]): Promise<Dispute>;
  listMessages(transactionId: string): Promise<ChatMessage[]>;
  sendMessage(transactionId: string, content: string): Promise<ChatMessage>;
}
```

`packages/api-client/src/ports/reviews.ts`:

```ts
import type { CreateReviewInput, Review } from '@dorsal/schemas';

export interface ReviewsPort {
  create(input: CreateReviewInput): Promise<Review>;
  listForUser(userId: string): Promise<Review[]>;
}
```

`packages/api-client/src/ports/index.ts`:

```ts
export * from './dorsals';
export * from './users';
export * from './transactions';
export * from './reviews';
```

- [ ] **Step 7: Run tests (must pass)**

```bash
pnpm install
cd packages/api-client
pnpm test
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(api-client): add HttpClient, errors and port interfaces"
```

---

## Task 8: Implement HTTP adapter for Catalog (real backend) and mock adapters

**Why:** Catalog backend exists, build its real adapter. Mock adapters for the rest are hand-rolled but obey the same port shape — these are TypeScript implementations; the MSW layer (Task 9) is what intercepts `fetch` and feeds them when the HTTP client points at mocked endpoints.

**Note on the Two-Layer Mock Strategy:**
- **Layer A (TypeScript mock adapter):** the `*-mock.ts` adapters that return in-memory data directly. Used for unit/integration tests that bypass the HTTP layer entirely.
- **Layer B (MSW handlers):** intercept actual `fetch` calls to backend URLs and respond with the same data. Used for dev mode and any test that exercises the real `HttpClient`.

The factory (Task 10) decides per-module which to wire up. For the MVP we expose **HTTP adapters everywhere + MSW intercepting non-real modules**. This keeps a single code path through `HttpClient` (so swapping a module from mock to real is just deactivating MSW handlers + flipping the env var).

**Files:**
- Create: `packages/api-client/src/adapters/{dorsals-http.ts, users-http.ts, transactions-http.ts, reviews-http.ts, index.ts}`

- [ ] **Step 1: Create `dorsals-http.ts`**

```ts
import { DorsalDetail, DorsalListResponse, PublishDorsalInput, PublishDorsalResponse, SearchDorsalsQuery } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { DorsalsPort } from '../ports';

export class DorsalsHttpAdapter implements DorsalsPort {
  constructor(private http: HttpClient) {}

  async search(query: SearchDorsalsQuery): Promise<DorsalListResponse> {
    const raw = await this.http.get<unknown>('api/v1/dorsals', { query });
    return DorsalListResponse.parse(raw);
  }

  async getById(id: string): Promise<DorsalDetail> {
    const raw = await this.http.get<unknown>(`api/v1/dorsals/${id}`);
    return DorsalDetail.parse(raw);
  }

  async publish(input: PublishDorsalInput): Promise<PublishDorsalResponse> {
    const validated = PublishDorsalInput.parse(input);
    const raw = await this.http.post<unknown>('api/v1/dorsals', { body: validated });
    return PublishDorsalResponse.parse(raw);
  }
}
```

- [ ] **Step 2: Create `users-http.ts`**

```ts
import { LoginInput, RegisterInput, RunnerProfile, SessionUser, User } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { UsersPort } from '../ports';

export class UsersHttpAdapter implements UsersPort {
  constructor(private http: HttpClient) {}
  async register(input: RegisterInput) {
    return SessionUser.parse(await this.http.post('api/v1/auth/register', { body: RegisterInput.parse(input) }));
  }
  async login(email: string, password: string) {
    return SessionUser.parse(await this.http.post('api/v1/auth/login', { body: LoginInput.parse({ email, password }) }));
  }
  async getMe() {
    return User.parse(await this.http.get('api/v1/users/me'));
  }
  async updateProfile(input) {
    return User.parse(await this.http.patch('api/v1/users/me', { body: input }));
  }
  async getById(id: string) {
    return User.pick({ id: true, full_name: true, avatar_url: true, rating_average: true, total_sales: true }).parse(await this.http.get(`api/v1/users/${id}`));
  }
}
```

- [ ] **Step 3: Create `transactions-http.ts`**

```ts
import { ChatMessage, Dispute, PurchaseInput, Transaction } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { TransactionsPort } from '../ports';
import { z } from 'zod';

const PurchaseResponse = z.object({ transaction_id: z.string().uuid(), client_secret: z.string() });

export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient) {}
  async purchase(input: PurchaseInput) {
    return PurchaseResponse.parse(await this.http.post('api/v1/transactions', { body: PurchaseInput.parse(input) }));
  }
  async confirmPayment(id: string) { return Transaction.parse(await this.http.post(`api/v1/transactions/${id}/confirm`)); }
  async getById(id: string)        { return Transaction.parse(await this.http.get(`api/v1/transactions/${id}`)); }
  async listMine()                 { return z.array(Transaction).parse(await this.http.get('api/v1/transactions/mine')); }
  async advanceStep(id, step)      { return Transaction.parse(await this.http.post(`api/v1/transactions/${id}/advance`, { body: { step } })); }
  async openDispute(id, reason, evidenceUrls) { return Dispute.parse(await this.http.post(`api/v1/transactions/${id}/dispute`, { body: { reason, evidence_urls: evidenceUrls } })); }
  async listMessages(id)           { return z.array(ChatMessage).parse(await this.http.get(`api/v1/transactions/${id}/messages`)); }
  async sendMessage(id, content)   { return ChatMessage.parse(await this.http.post(`api/v1/transactions/${id}/messages`, { body: { content } })); }
}
```

- [ ] **Step 4: Create `reviews-http.ts`**

```ts
import { CreateReviewInput, Review } from '@dorsal/schemas';
import type { HttpClient } from '../http';
import type { ReviewsPort } from '../ports';
import { z } from 'zod';

export class ReviewsHttpAdapter implements ReviewsPort {
  constructor(private http: HttpClient) {}
  async create(input: CreateReviewInput) { return Review.parse(await this.http.post('api/v1/reviews', { body: CreateReviewInput.parse(input) })); }
  async listForUser(userId: string)      { return z.array(Review).parse(await this.http.get(`api/v1/users/${userId}/reviews`)); }
}
```

- [ ] **Step 5: Index adapters**

`packages/api-client/src/adapters/index.ts`:

```ts
export * from './dorsals-http';
export * from './users-http';
export * from './transactions-http';
export * from './reviews-http';
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api-client): add HTTP adapters for all 4 ports"
```

---

## Task 9: MSW handlers for mocked modules (Identity, Transaction, Review)

**Why:** Spec ADR-004 — feature branches that depend on Identity/Transaction/Review need realistic mock responses. MSW intercepts `fetch` at the boundary so the same `HttpClient` works in dev without backend.

**Files:**
- Create: `packages/api-client/src/msw/{users.ts, transactions.ts, reviews.ts, store.ts, browser.ts, node.ts, index.ts}`

- [ ] **Step 1: Create in-memory store with seed**

`packages/api-client/src/msw/store.ts`:

```ts
import type { Review, Transaction, User } from '@dorsal/schemas';

const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

export const mockStore = {
  users: new Map<string, User>([
    [SEED_USER_ID, {
      id: SEED_USER_ID,
      email: 'demo@dorsal.market',
      full_name: 'Carlos Martínez',
      dni: '12345678X',
      gender: 'male',
      birth_date: '1990-06-15',
      avatar_url: null,
      rating_average: 4.7,
      total_sales: 12,
      total_purchases: 5,
      contact: { phone: '612345678', address_line: 'Calle Mayor 1', city: 'Madrid', postal_code: '28001', country: 'ES' },
      runner: { estimated_time_min: 95, shirt_size: 'L', club: 'Runners Madrid', allergies: null },
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2026-04-19T20:00:00Z',
    }],
  ]),
  passwords: new Map<string, string>([['demo@dorsal.market', 'demo1234']]),
  transactions: new Map<string, Transaction>(),
  reviews: new Map<string, Review>(),
  SEED_USER_ID,
};

export function resetStore() {
  // For tests; preserves the seed user
  mockStore.transactions.clear();
  mockStore.reviews.clear();
}
```

- [ ] **Step 2: Create users handlers**

`packages/api-client/src/msw/users.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { LoginInput, RegisterInput, User } from '@dorsal/schemas';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

export const usersHandlers = [
  http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = LoginInput.parse(await request.json());
    const stored = mockStore.passwords.get(body.email);
    if (!stored || stored !== body.password) return HttpResponse.json({ detail: 'invalid credentials' }, { status: 401 });
    const user = [...mockStore.users.values()].find((u) => u.email === body.email);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ id: user.id, email: user.email, name: user.full_name, image: user.avatar_url });
  }),

  http.post(`${BASE}/api/v1/auth/register`, async ({ request }) => {
    const body = RegisterInput.parse(await request.json());
    if ([...mockStore.users.values()].some((u) => u.email === body.email)) return HttpResponse.json({ detail: 'email exists' }, { status: 409 });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const user = User.parse({
      id, email: body.email, full_name: body.full_name, dni: body.dni, gender: body.gender, birth_date: body.birth_date,
      avatar_url: null, rating_average: null, total_sales: 0, total_purchases: 0,
      created_at: now, updated_at: now,
    });
    mockStore.users.set(id, user);
    mockStore.passwords.set(body.email, body.password);
    return HttpResponse.json({ id, email: user.email, name: user.full_name, image: null }, { status: 201 });
  }),

  http.get(`${BASE}/api/v1/users/me`, ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'missing X-User-Id' }, { status: 401 });
    const user = mockStore.users.get(userId);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(user);
  }),

  http.patch(`${BASE}/api/v1/users/me`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'missing X-User-Id' }, { status: 401 });
    const user = mockStore.users.get(userId);
    if (!user) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    const patch = await request.json() as Partial<typeof user>;
    const updated: typeof user = {
      ...user,
      ...patch,
      contact: { ...user.contact, ...patch.contact },
      runner: { ...user.runner, ...patch.runner },
      updated_at: new Date().toISOString(),
    };
    mockStore.users.set(userId, updated);
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/api/v1/users/:id`, ({ params }) => {
    const u = mockStore.users.get(params.id as string);
    if (!u) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json({ id: u.id, full_name: u.full_name, avatar_url: u.avatar_url, rating_average: u.rating_average, total_sales: u.total_sales });
  }),
];
```

- [ ] **Step 3: Create transactions handlers**

`packages/api-client/src/msw/transactions.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { PurchaseInput, type Transaction, type TimelineStep } from '@dorsal/schemas';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

const TIMELINE_TEMPLATE: TimelineStep[] = [
  { step: 'payment_held',       completed: false, completed_at: null },
  { step: 'data_sent',          completed: false, completed_at: null },
  { step: 'change_in_progress', completed: false, completed_at: null },
  { step: 'change_confirmed',   completed: false, completed_at: null },
  { step: 'released',           completed: false, completed_at: null },
];

export const transactionsHandlers = [
  http.post(`${BASE}/api/v1/transactions`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const body = PurchaseInput.parse(await request.json());
    const tx_id = crypto.randomUUID();
    const now = new Date().toISOString();
    const tx: Transaction = {
      id: tx_id,
      dorsal_id: body.dorsal_id,
      buyer_id: userId,
      seller_id: '550e8400-e29b-41d4-a716-446655440002',  // mocked seller
      amount: 50,
      currency: 'EUR',
      status: 'payment_held',
      stripe_payment_intent_id: `pi_mock_${tx_id.slice(0, 8)}`,
      timeline: [{ ...TIMELINE_TEMPLATE[0], completed: true, completed_at: now }, ...TIMELINE_TEMPLATE.slice(1)],
      created_at: now,
      updated_at: now,
    };
    mockStore.transactions.set(tx_id, tx);
    return HttpResponse.json({ transaction_id: tx_id, client_secret: `mock_secret_${tx_id}` }, { status: 201 });
  }),

  http.get(`${BASE}/api/v1/transactions/mine`, ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const list = [...mockStore.transactions.values()].filter((t) => t.buyer_id === userId || t.seller_id === userId);
    return HttpResponse.json(list);
  }),

  http.get(`${BASE}/api/v1/transactions/:id`, ({ params }) => {
    const t = mockStore.transactions.get(params.id as string);
    if (!t) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    return HttpResponse.json(t);
  }),

  http.post(`${BASE}/api/v1/transactions/:id/advance`, async ({ params, request }) => {
    const t = mockStore.transactions.get(params.id as string);
    if (!t) return HttpResponse.json({ detail: 'not found' }, { status: 404 });
    const { step } = await request.json() as { step: TimelineStep['step'] };
    const now = new Date().toISOString();
    const timeline = t.timeline.map((s) => (s.step === step ? { ...s, completed: true, completed_at: now } : s));
    const allDone = timeline.every((s) => s.completed);
    const updated: Transaction = { ...t, timeline, status: allDone ? 'released' : t.status, updated_at: now };
    mockStore.transactions.set(t.id, updated);
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/api/v1/transactions/:id/messages`, () => HttpResponse.json([])),
  http.post(`${BASE}/api/v1/transactions/:id/messages`, async ({ params, request }) => {
    const userId = request.headers.get('x-user-id');
    const body = await request.json() as { content: string };
    return HttpResponse.json({
      id: crypto.randomUUID(),
      transaction_id: params.id as string,
      sender_id: userId ?? mockStore.SEED_USER_ID,
      content: body.content,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),
];
```

- [ ] **Step 4: Create reviews handlers**

`packages/api-client/src/msw/reviews.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { CreateReviewInput, Review } from '@dorsal/schemas';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

export const reviewsHandlers = [
  http.post(`${BASE}/api/v1/reviews`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const body = CreateReviewInput.parse(await request.json());
    const review: Review = {
      id: crypto.randomUUID(),
      transaction_id: body.transaction_id,
      reviewer_id: userId,
      reviewee_id: '550e8400-e29b-41d4-a716-446655440002',
      rating: body.rating,
      comment: body.comment ?? null,
      created_at: new Date().toISOString(),
    };
    mockStore.reviews.set(review.id, review);
    return HttpResponse.json(review, { status: 201 });
  }),

  http.get(`${BASE}/api/v1/users/:id/reviews`, ({ params }) => {
    const list = [...mockStore.reviews.values()].filter((r) => r.reviewee_id === params.id);
    return HttpResponse.json(list);
  }),
];
```

- [ ] **Step 5: Aggregate handlers per module + browser/node entry points**

`packages/api-client/src/msw/index.ts`:

```ts
import { reviewsHandlers } from './reviews';
import { transactionsHandlers } from './transactions';
import { usersHandlers } from './users';

export const handlersByModule = {
  users: usersHandlers,
  transactions: transactionsHandlers,
  reviews: reviewsHandlers,
} as const;

export type ApiModule = keyof typeof handlersByModule;

export function buildHandlers(mocked: ApiModule[]) {
  return mocked.flatMap((m) => handlersByModule[m]);
}

export { mockStore, resetStore } from './store';
```

`packages/api-client/src/msw/browser.ts`:

```ts
import { setupWorker } from 'msw/browser';
import { buildHandlers, type ApiModule } from './index';

export function startMockWorker(mocked: ApiModule[]) {
  if (mocked.length === 0) return;
  const worker = setupWorker(...buildHandlers(mocked));
  return worker.start({ onUnhandledRequest: 'bypass' });
}
```

`packages/api-client/src/msw/node.ts`:

```ts
import { setupServer } from 'msw/node';
import { buildHandlers, type ApiModule } from './index';
export function startMockServer(mocked: ApiModule[]) {
  return setupServer(...buildHandlers(mocked));
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api-client): add MSW handlers for mocked Identity/Transaction/Review modules"
```

---

## Task 10: API factory selecting modules per env var + TanStack Query plumbing

**Files:**
- Create: `packages/api-client/src/{factory.ts, hooks/query-client.tsx, hooks/index.ts, index.ts}`

- [ ] **Step 1: Create the factory**

`packages/api-client/src/factory.ts`:

```ts
import { DorsalsHttpAdapter, ReviewsHttpAdapter, TransactionsHttpAdapter, UsersHttpAdapter } from './adapters';
import { createHttp, type HttpClient, type HttpClientOptions } from './http';
import type { DorsalsPort, ReviewsPort, TransactionsPort, UsersPort } from './ports';

export interface Api {
  http: HttpClient;
  dorsals: DorsalsPort;
  users: UsersPort;
  transactions: TransactionsPort;
  reviews: ReviewsPort;
}

export interface ApiFactoryOptions extends HttpClientOptions {}

export function createApi(opts: ApiFactoryOptions): Api {
  const http = createHttp(opts);
  return {
    http,
    dorsals:      new DorsalsHttpAdapter(http),
    users:        new UsersHttpAdapter(http),
    transactions: new TransactionsHttpAdapter(http),
    reviews:      new ReviewsHttpAdapter(http),
  };
}

export type ApiModule = 'dorsals' | 'users' | 'transactions' | 'reviews';

export function parseRealModules(csv: string | undefined): ApiModule[] {
  const all: ApiModule[] = ['dorsals', 'users', 'transactions', 'reviews'];
  if (!csv) return [];
  return csv.split(',').map((s) => s.trim()).filter((m): m is ApiModule => all.includes(m as ApiModule));
}

export function deriveMockedModules(real: ApiModule[]): ApiModule[] {
  const all: ApiModule[] = ['dorsals', 'users', 'transactions', 'reviews'];
  return all.filter((m) => !real.includes(m));
}
```

- [ ] **Step 2: TanStack Query provider**

`packages/api-client/src/hooks/query-client.tsx`:

```tsx
'use client';
import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (count, error) => {
          const status = (error as { status?: number } | null)?.status;
          if (status === 401 || status === 403 || status === 404) return false;
          return count < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

let browserClient: QueryClient | undefined;
function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => getQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Public package exports**

`packages/api-client/src/hooks/index.ts`:

```ts
export { QueryProvider } from './query-client';
```

`packages/api-client/src/index.ts`:

```ts
export * from './errors';
export * from './http';
export * from './ports';
export * from './adapters';
export * from './factory';
export * from './hooks';
export type { ApiModule } from './msw';
export { handlersByModule, buildHandlers, mockStore, resetStore } from './msw';
export { startMockServer } from './msw/node';
```

- [ ] **Step 4: Test the factory pure functions**

`packages/api-client/src/__tests__/factory.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createApi, deriveMockedModules, parseRealModules } from '../factory';

describe('parseRealModules', () => {
  it('returns empty for undefined', () => {
    expect(parseRealModules(undefined)).toEqual([]);
  });
  it('parses csv ignoring whitespace', () => {
    expect(parseRealModules('dorsals, users')).toEqual(['dorsals', 'users']);
  });
  it('drops unknown modules', () => {
    expect(parseRealModules('dorsals,foo,reviews')).toEqual(['dorsals', 'reviews']);
  });
});

describe('deriveMockedModules', () => {
  it('returns the complement of real modules', () => {
    expect(deriveMockedModules(['dorsals'])).toEqual(['users', 'transactions', 'reviews']);
    expect(deriveMockedModules([])).toEqual(['dorsals', 'users', 'transactions', 'reviews']);
  });
});

describe('createApi', () => {
  it('produces an api object with all 4 ports', () => {
    const api = createApi({ baseUrl: 'http://test', getUserId: () => null });
    expect(api).toMatchObject({
      dorsals: expect.objectContaining({ search: expect.any(Function) }),
      users: expect.any(Object),
      transactions: expect.any(Object),
      reviews: expect.any(Object),
    });
  });
});
```

- [ ] **Step 5: Run all api-client tests**

```bash
cd packages/api-client
pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api-client): add factory, env parsing and TanStack Query provider"
```

---

## Task 11: Initialize `apps/web` Next.js application

**Files:**
- Create: `apps/web/{package.json, tsconfig.json, next.config.ts, postcss.config.mjs, tailwind.config.ts, biome.json, .gitignore, app/{layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx}, public/}`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@dorsal/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@dorsal/api-client": "workspace:*",
    "@dorsal/domain": "workspace:*",
    "@dorsal/schemas": "workspace:*",
    "@dorsal/ui-tokens": "workspace:*",
    "@hookform/resolvers": "3.9.1",
    "@radix-ui/react-dialog": "1.1.2",
    "@radix-ui/react-dropdown-menu": "2.1.2",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-popover": "1.1.2",
    "@radix-ui/react-select": "2.1.2",
    "@radix-ui/react-slot": "1.1.0",
    "@radix-ui/react-tabs": "1.1.1",
    "@tanstack/react-query": "5.59.20",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "lucide-react": "0.460.0",
    "next": "15.0.3",
    "next-auth": "5.0.0-beta.25",
    "next-themes": "0.4.4",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-hook-form": "7.53.2",
    "sonner": "1.7.0",
    "tailwind-merge": "2.5.4",
    "tailwindcss-animate": "1.0.7",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@dorsal/tsconfig": "workspace:*",
    "@playwright/test": "1.48.2",
    "@tailwindcss/forms": "0.5.9",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.0.1",
    "@testing-library/user-event": "14.5.2",
    "@types/node": "22.9.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "@vitejs/plugin-react": "4.3.3",
    "autoprefixer": "10.4.20",
    "happy-dom": "15.11.7",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.14",
    "typescript": "5.6.3",
    "vitest": "2.1.5"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "@dorsal/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/features/*": ["./features/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "dist", "playwright-report", "e2e"]
}
```

- [ ] **Step 3: Create `apps/web/next.config.ts`**

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ['@dorsal/ui-tokens', '@dorsal/schemas', '@dorsal/api-client', '@dorsal/domain'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
```

- [ ] **Step 4: Create Tailwind + PostCSS configs**

`apps/web/postcss.config.mjs`:

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`apps/web/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
import { colors, radius, fonts, shadows } from '@dorsal/ui-tokens';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors,
      borderRadius: radius,
      fontFamily: { sans: [fonts.sans, 'sans-serif'], mono: [fonts.mono, 'monospace'] },
      boxShadow: { card: shadows.card, elevated: shadows.elevated },
      transitionTimingFunction: { 'dorsal': 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/forms')],
};
export default config;
```

- [ ] **Step 5: Create `apps/web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #111113; --bg-secondary: #1a1a1f; --bg-card: #1f1f26; --bg-elevated: #26262e;
  --text-primary: #f0efec; --text-secondary: #a0a0ac; --text-muted: #6a6a78;
  --coral: #e8552d; --coral-hover: #f06a3f; --coral-glow: rgba(232,85,45,0.25); --coral-subtle: rgba(232,85,45,0.08);
  --olive: #6dab5e; --olive-dark: #4a7c3f; --olive-subtle: rgba(109,171,94,0.1);
  --border: rgba(255,255,255,0.08); --border-hover: rgba(255,255,255,0.16);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.3);
  --shadow-elevated: 0 12px 40px rgba(0,0,0,0.4);
}

[data-theme="light"] {
  --bg-primary: #fafaf8; --bg-secondary: #f2f1ed; --bg-card: #ffffff; --bg-elevated: #f7f6f3;
  --text-primary: #1a1a1f; --text-secondary: #5a5a68; --text-muted: #8a8a96;
  --coral: #e8552d; --coral-hover: #d44a24; --coral-glow: rgba(232,85,45,0.2); --coral-subtle: rgba(232,85,45,0.08);
  --olive: #4a7c3f; --olive-dark: #3d6834; --olive-subtle: rgba(74,124,63,0.1);
  --border: rgba(0,0,0,0.08); --border-hover: rgba(0,0,0,0.15);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  --shadow-elevated: 0 12px 40px rgba(0,0,0,0.1);
}

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-bg-primary text-text-primary font-sans antialiased; }
  * { @apply border-border; }
}
```

- [ ] **Step 6: Create root layout with fonts and providers**

`apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Outfit, Space_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'dorsal.market', template: '%s · dorsal.market' },
  description: 'Marketplace de dorsales de carrera con pago en custodia.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create error and not-found pages**

`apps/web/app/error.tsx`:

```tsx
'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Algo salió mal</h1>
        <p className="text-text-secondary">{error.message}</p>
        <button onClick={reset} className="rounded-md bg-coral px-4 py-2 text-white">Reintentar</button>
      </div>
    </div>
  );
}
```

`apps/web/app/not-found.tsx`:

```tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-text-secondary">No encontramos esta página.</p>
        <Link href="/" className="text-coral hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create temporary landing page**

`apps/web/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="container mx-auto px-6 py-16">
      <h1 className="font-mono text-5xl">dorsal<span className="text-coral">.</span>market</h1>
      <p className="mt-4 text-text-secondary">Foundation scaffold listo. Las features llegan en feat/dorsales.</p>
    </main>
  );
}
```

- [ ] **Step 9: Install and verify dev server**

```bash
pnpm install
pnpm --filter @dorsal/web dev
```

Expected: server starts at `localhost:3000` and the home page renders with coral dot.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(web): initialize Next.js 15 app with Tailwind, fonts and theme tokens"
```

---

## Task 12: shadcn/ui base components and `cn()` helper

**Files:**
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/components/ui/{button.tsx, input.tsx, label.tsx, dialog.tsx, sonner.tsx, form.tsx, select.tsx, dropdown-menu.tsx, tabs.tsx, sheet.tsx, popover.tsx}`

- [ ] **Step 1: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Initialize shadcn/ui via CLI**

```bash
cd apps/web
pnpm dlx shadcn@2.1.0 init -d
```

When asked, accept defaults but override:
- Style: `default`
- Base color: `neutral`
- CSS variables: `yes`
- Tailwind config: `tailwind.config.ts`
- Path alias for components: `@/components`
- Path alias for utils: `@/lib/utils`

This creates `components/ui/` placeholder and `components.json`.

- [ ] **Step 3: Add the components we need now**

```bash
pnpm dlx shadcn@2.1.0 add button input label form dialog dropdown-menu select sheet popover tabs sonner
```

- [ ] **Step 4: Customize the Button to use our coral**

Open `apps/web/components/ui/button.tsx`. Replace the `variants.variant.default` line with our coral palette (the file is generated; only the buttonVariants's default variant changes):

```ts
// inside buttonVariants(...)
default: 'bg-coral text-white shadow hover:bg-coral-hover',
destructive: 'bg-red-600 text-white shadow hover:bg-red-700',
outline: 'border border-border bg-transparent hover:bg-bg-elevated hover:text-text-primary',
secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-card',
ghost: 'hover:bg-bg-elevated hover:text-text-primary',
link: 'text-coral underline-offset-4 hover:underline',
```

- [ ] **Step 5: Override `globals.css` if shadcn re-wrote it**

Re-paste the css content from Task 11 step 5 (shadcn init may have replaced it). Diff visually before committing.

- [ ] **Step 6: Verify build still works**

```bash
pnpm --filter @dorsal/web build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): add shadcn/ui base components with coral theming"
```

---

## Task 13: Theme toggle (next-themes) and root Providers

**Files:**
- Create: `apps/web/components/providers.tsx`
- Create: `apps/web/components/layout/theme-toggle.tsx`

- [ ] **Step 1: Create the Providers wrapper**

`apps/web/components/providers.tsx`:

```tsx
'use client';
import { QueryProvider } from '@dorsal/api-client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Create the theme toggle**

`apps/web/components/layout/theme-toggle.tsx`:

```tsx
'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button variant="ghost" size="icon" aria-label={`Cambiar a ${next}`} onClick={() => setTheme(next)}>
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  );
}
```

- [ ] **Step 3: Render the toggle in the landing page**

Edit `apps/web/app/page.tsx` to import and render `<ThemeToggle />` somewhere visible to validate the toggle works.

- [ ] **Step 4: Verify the toggle visually**

```bash
pnpm --filter @dorsal/web dev
```

Open `localhost:3000`, click toggle, confirm `data-theme` attribute on `<html>` switches and palette changes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): wire up next-themes, providers and ThemeToggle"
```

---

## Task 14: Env validation, API instance and Auth.js v5 with mock provider

**Files:**
- Create: `apps/web/lib/{env.ts, api.ts, auth.ts}`
- Create: `apps/web/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/auth.config.ts`
- Create: `apps/web/types/next-auth.d.ts`

- [ ] **Step 1: Create env validator**

`apps/web/lib/env.ts`:

```ts
import { z } from 'zod';

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  BACKEND_API_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
});

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
  NEXT_PUBLIC_REAL_API_MODULES: z.string().default(''),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsedServer = ServerEnvSchema.safeParse(process.env);
if (!parsedServer.success) {
  console.error('Invalid server env:', parsedServer.error.flatten().fieldErrors);
  throw new Error('Invalid server environment variables');
}

const parsedPublic = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  NEXT_PUBLIC_REAL_API_MODULES: process.env.NEXT_PUBLIC_REAL_API_MODULES,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
if (!parsedPublic.success) {
  throw new Error('Invalid public env');
}

export const env = { ...parsedServer.data, ...parsedPublic.data };
```

- [ ] **Step 2: Create API instance helpers**

`apps/web/lib/api.ts`:

```ts
import 'server-only';
import { auth } from './auth';
import { createApi } from '@dorsal/api-client';
import { env } from './env';

export async function getServerApi() {
  const session = await auth();
  return createApi({
    baseUrl: env.BACKEND_API_URL,
    getUserId: () => session?.user?.id ?? null,
  });
}
```

`apps/web/lib/api-client.ts`:

```ts
'use client';
import { createApi } from '@dorsal/api-client';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useApi() {
  const { data } = useSession();
  return useMemo(
    () => createApi({
      baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL!,
      getUserId: () => data?.user?.id ?? null,
    }),
    [data?.user?.id],
  );
}
```

- [ ] **Step 3: Create Auth.js config (split for edge-safe middleware)**

`apps/web/auth.config.ts`:

```ts
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith('/vender')
        || nextUrl.pathname.startsWith('/perfil')
        || nextUrl.pathname.startsWith('/compra');
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.userId = (user as { id?: string }).id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
```

- [ ] **Step 4: Create the full Auth.js setup with providers**

`apps/web/lib/auth.ts`:

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { authConfig } from '../auth.config';
import { env } from './env';
import { createApi } from '@dorsal/api-client';

const Creds = z.object({ email: z.string().email(), password: z.string().min(8) });

const providers = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = Creds.safeParse(raw);
      if (!parsed.success) return null;
      const api = createApi({ baseUrl: env.BACKEND_API_URL, getUserId: () => null });
      try {
        const user = await api.users.login(parsed.data.email, parsed.data.password);
        return user;
      } catch {
        return null;
      }
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }));
}
if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  providers.push(Facebook({ clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET }));
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  session: { strategy: 'jwt' },
  secret: env.NEXTAUTH_SECRET,
});
```

- [ ] **Step 5: Create the route handler**

`apps/web/app/api/auth/[...nextauth]/route.ts`:

```ts
export { GET, POST } from '@/lib/auth';
```

Wait — Auth.js v5 export pattern. Use:

```ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 6: Create middleware (edge-safe, no Node API)**

`apps/web/middleware.ts`:

```ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 7: Augment next-auth types**

`apps/web/types/next-auth.d.ts`:

```ts
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
  interface User { id: string }
}
declare module 'next-auth/jwt' {
  interface JWT { userId?: string }
}
```

Add `"types/**/*.d.ts"` to `apps/web/tsconfig.json` `include`.

- [ ] **Step 8: Verify typecheck**

```bash
pnpm --filter @dorsal/web typecheck
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(web): add env validation, server/client api instances and Auth.js v5 setup"
```

---

## Task 15: MSW dev integration (worker init in browser)

**Why:** With `NEXT_PUBLIC_REAL_API_MODULES=dorsals`, only Catalog talks to the backend. Identity/Transaction/Review must be intercepted in the browser by MSW so feature branches can develop against realistic responses.

**Files:**
- Create: `apps/web/components/msw-provider.tsx`
- Create: `apps/web/public/mockServiceWorker.js` (generated)
- Modify: `apps/web/components/providers.tsx`

- [ ] **Step 1: Generate the MSW worker file**

```bash
cd apps/web
pnpm dlx msw@2 init public/ --save
```

This produces `public/mockServiceWorker.js`.

- [ ] **Step 2: Create MSWProvider**

`apps/web/components/msw-provider.tsx`:

```tsx
'use client';
import { type ReactNode, useEffect, useState } from 'react';
import { deriveMockedModules, parseRealModules, type ApiModule } from '@dorsal/api-client';

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== 'development');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const real = parseRealModules(process.env.NEXT_PUBLIC_REAL_API_MODULES);
    const mocked: ApiModule[] = deriveMockedModules(real);
    if (mocked.length === 0) { setReady(true); return; }
    (async () => {
      const { startMockWorker } = await import('@dorsal/api-client/src/msw/browser');
      await startMockWorker(mocked);
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Wire MSWProvider in providers**

Edit `apps/web/components/providers.tsx` — wrap children with `<MSWProvider>` between `SessionProvider` and `QueryProvider`:

```tsx
import { MSWProvider } from './msw-provider';
// ...
<SessionProvider>
  <MSWProvider>
    <QueryProvider>
      {children}
      <Toaster richColors position="bottom-right" />
    </QueryProvider>
  </MSWProvider>
</SessionProvider>
```

- [ ] **Step 4: Verify the worker registers in dev**

```bash
pnpm --filter @dorsal/web dev
```

Open browser dev tools → Network → look for "mockServiceWorker.js" registered. Console should not log MSW errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): integrate MSW worker for mocked API modules in development"
```

---

## Task 16: Route groups and placeholder pages

**Why:** The 3 feature branches will fill these in. Foundation creates the layouts and empty placeholder pages so each rama only adds page contents.

**Files:**
- Create: `apps/web/app/(marketing)/{layout.tsx, page.tsx}`
- Create: `apps/web/app/(app)/{layout.tsx, dorsales/{page.tsx, [id]/page.tsx}, vender/page.tsx, perfil/{page.tsx, historial/page.tsx}, compra/{[transactionId]/page.tsx, confirmada/page.tsx}}`
- Create: `apps/web/app/(auth)/{layout.tsx, login/page.tsx, registro/page.tsx}`
- Move: `apps/web/app/page.tsx` → `apps/web/app/(marketing)/page.tsx` (root group)
- Create: `apps/web/components/layout/{nav.tsx, footer.tsx, mobile-menu.tsx}`

- [ ] **Step 1: Create top-level Nav**

`apps/web/components/layout/nav.tsx`:

```tsx
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';

export function Nav({ session }: { session?: { user?: { name?: string | null } } | null }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-mono text-lg font-bold">dorsal<span className="text-coral">.</span>market</Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dorsales" className="text-text-secondary hover:text-text-primary">Dorsales</Link>
          <Link href="/vender" className="text-text-secondary hover:text-text-primary">Vender</Link>
          <ThemeToggle />
          {session?.user ? (
            <Link href="/perfil"><Button variant="secondary" size="sm">{session.user.name ?? 'Perfil'}</Button></Link>
          ) : (
            <Link href="/login"><Button size="sm">Entrar</Button></Link>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create marketing layout**

`apps/web/app/(marketing)/layout.tsx`:

```tsx
import { Nav } from '@/components/layout/nav';
import { auth } from '@/lib/auth';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <>
      <Nav session={session} />
      {children}
    </>
  );
}
```

Move `apps/web/app/page.tsx` to `apps/web/app/(marketing)/page.tsx`.

- [ ] **Step 3: Create app layout (protected)**

`apps/web/app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { Nav } from '@/components/layout/nav';
import { auth } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // /dorsales is browseable when un-auth (per spec section 6); only /vender, /perfil, /compra force login.
  // The route-level guard in `auth.config.ts` already redirects unauth on /vender, /perfil, /compra,
  // so this layout just renders the Nav.
  return (
    <>
      <Nav session={session} />
      {children}
    </>
  );
}
```

- [ ] **Step 4: Create placeholder pages with explicit "owned by" tags**

For every placeholder page, write a single body tagged with the owning branch:

`apps/web/app/(app)/dorsales/page.tsx`:

```tsx
export default function Page() {
  return (
    <main className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">Dorsales — placeholder</h1>
      <p className="text-text-secondary mt-2">Implementación en feat/dorsales (UC-04).</p>
    </main>
  );
}
```

Repeat for:
- `app/(app)/dorsales/[id]/page.tsx` ("UC-05")
- `app/(app)/vender/page.tsx` ("UC-02 — feat/dorsales")
- `app/(app)/perfil/page.tsx` ("UC-09 — feat/usuarios")
- `app/(app)/perfil/historial/page.tsx` ("UC-10 — feat/usuarios")
- `app/(app)/compra/[transactionId]/page.tsx` ("UC-07/08 — feat/transacciones")
- `app/(app)/compra/confirmada/page.tsx` ("UC-06 — feat/transacciones")
- `app/(auth)/login/page.tsx` ("UC-01 — feat/usuarios")
- `app/(auth)/registro/page.tsx` ("UC-01 — feat/usuarios")

- [ ] **Step 5: Create auth layout (centered, no nav)**

`apps/web/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-6">{children}</main>;
}
```

- [ ] **Step 6: Verify routes and build**

```bash
pnpm --filter @dorsal/web build
```

Expected: build succeeds, all routes listed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): scaffold route groups (marketing, app, auth) with placeholder pages"
```

---

## Task 17: Vitest setup in `apps/web` + first sanity test

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/lib/__tests__/utils.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Create sanity test for `cn()`**

`apps/web/lib/__tests__/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges classes and dedupes Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-coral', false && 'hidden', 'text-coral')).toBe('text-coral');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @dorsal/web test
```

Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(web): set up vitest with happy-dom and a sanity test"
```

---

## Task 18: Playwright e2e harness

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/smoke.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
cd apps/web
pnpm dlx playwright install --with-deps chromium
```

- [ ] **Step 2: Create config**

`apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Create smoke test**

`apps/web/e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('home renders the dorsal.market wordmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/dorsal/i)).toBeVisible();
});

test('theme toggle switches data-theme attribute', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: /cambiar a/i }).click();
  await expect(html).not.toHaveAttribute('data-theme', before ?? '');
});
```

- [ ] **Step 4: Run e2e**

```bash
pnpm --filter @dorsal/web test:e2e
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(web): add Playwright e2e harness with smoke tests"
```

---

## Task 19: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main, feat/react-native-development, "feat/**"]
  pull_request:
    branches: [main, feat/react-native-development]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }

      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Cache turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: turbo-

      - run: pnpm turbo run lint typecheck test build
        env:
          NEXTAUTH_SECRET: ci-secret-ci-secret-ci-secret-ci
          BACKEND_API_URL: http://localhost:8000
          NEXT_PUBLIC_BACKEND_API_URL: http://localhost:8000
          NEXT_PUBLIC_REAL_API_MODULES: ""

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: ci
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install --with-deps chromium
      - run: pnpm --filter @dorsal/web test:e2e
        env:
          NEXTAUTH_SECRET: ci-secret-ci-secret-ci-secret-ci
          BACKEND_API_URL: http://localhost:8000
          NEXT_PUBLIC_BACKEND_API_URL: http://localhost:8000
          NEXT_PUBLIC_REAL_API_MODULES: ""
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report
          retention-days: 7
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow with turbo cache and e2e job"
```

---

## Task 20: Final smoke check + open the foundation PR

- [ ] **Step 1: Full local verification**

```bash
pnpm install
pnpm turbo run lint typecheck test build
pnpm --filter @dorsal/web test:e2e
```

All four steps must pass.

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin feat/foundation
# Then via GitHub UI (or `gh pr create` if available) open PR
# Title: "feat(foundation): bootstrap monorepo, web scaffold and mock layer"
# Base branch: feat/react-native-development
```

PR description should reference `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md` and list ADRs covered.

- [ ] **Step 3: After review and merge, three feature branches start from feat/foundation**

```bash
git switch feat/foundation
git pull
git switch -c feat/dorsales  # see plan 2026-05-09-feat-dorsales.md
```

---

## Self-review

**Spec coverage check (against `docs/superpowers/specs/2026-05-09-frontend-architecture-design.md`):**

| ADR | Task |
|---|---|
| ADR-001 monorepo dual web+móvil | Task 2 (workspaces include `apps/*`), `apps/mobile` deferred |
| ADR-002 pnpm + Turborepo | Task 2 |
| ADR-003 TypeScript strict + Biome + Node 20 | Tasks 2, 3 |
| ADR-004 mock layer intercambiable + MSW | Tasks 7, 8, 9, 10, 15 |
| ADR-005 Auth.js v5 + providers | Task 14 |
| ADR-006 Server Components first | Tasks 16 layouts (Server Components by default) |
| ADR-007 TanStack Query + Zustand | Task 10 (provider). Zustand will be added by feature branches when needed |
| ADR-008 Tailwind + shadcn/ui + tokens | Tasks 4, 11, 12 |
| ADR-009 next-themes + CSS vars | Tasks 11, 13 |
| ADR-010 RHF + Zod + shadcn Form | Task 12 (`form` shadcn component installed; usage in feature branches) |
| ADR-011 presigned S3 uploads | Deferred to feat/dorsales (UC-02 lives there) |
| ADR-012 ramas secuenciales | Task 20 (PR open) + plan files for next 3 ramas |
| ADR-013 pirámide testing | Tasks 17 (Vitest), 18 (Playwright); deeper coverage on feature branches |
| ADR-014 CI Turborepo + Vercel | Task 19 (Vercel preview is repo settings, not file in plan) |
| ADR-015 observabilidad | Env vars present (Task 2), wiring deferred until prod-ready (`feat/transacciones` for Stripe events) |
| ADR-016 seguridad mínima | Task 11 step 3 (security headers); CSRF via Auth.js (Task 14) |

**Placeholder scan:** none. Each task has concrete code; references to "feature branch implementation" point to the per-branch plans (which are part of this brainstorming bundle).

**Type consistency:** confirmed — `Api`, `ApiModule`, `DorsalsPort`, `User`, `Transaction`, `Review`, `SessionUser`, `RegisterInput`, `LoginInput` names used identically across tasks.

**Open follow-ups (out of scope for this plan, captured in spec section 9):**
- Vercel project + preview deployments require human action (connect repo to Vercel) — not codifiable.
- Sentry / analytics DSNs are env vars only; integration code lives where it's consumed (Sentry SDK in `feat/transacciones`).
