# User Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global user feedback channel to `dorsal.market` that sends actionable feedback to an internal email through Resend.

**Architecture:** Implement this as a small Backend-for-Frontend feature inside `apps/web`, not in `MVP-Dorsales`. The UI posts to a Next.js route handler, the route validates and normalizes context, and a `FeedbackSink` adapter sends through Resend so the destination can later move to SES, Zendesk, Freshdesk, Linear, or the backend API without rewriting the form.

**Tech Stack:** Next.js App Router route handlers, React client components, Radix Dialog via existing UI primitives, Zod, Sonner, Vitest, Testing Library, native `fetch` to the Resend REST API.

---

## Branching

This feature is transversal. Do not implement it in `feat/usuarios`, `feat/dorsales`, or `feat/transacciones`.

- [ ] **Step 1: Start from foundation**

```bash
git switch feat/foundation
git pull --ff-only
git switch -c feat/feedback
```

Expected:

```text
Switched to a new branch 'feat/feedback'
```

- [ ] **Step 2: Confirm branch**

```bash
git branch --show-current
```

Expected:

```text
feat/feedback
```

- [ ] **Step 3: Confirm spec is present**

```bash
Test-Path docs/superpowers/specs/2026-06-05-user-feedback-design.md
```

Expected:

```text
True
```

---

## File Structure

Create focused files under `apps/web`:

```text
apps/web/
  app/api/feedback/
    route.ts
    __tests__/route.test.ts
  components/feedback/
    feedback-dialog.client.tsx
    feedback-tab.client.tsx
    __tests__/feedback-dialog.test.tsx
    __tests__/feedback-tab.test.tsx
  lib/feedback/
    config.ts
    errors.ts
    submit-feedback.ts
    types.ts
    validation.ts
    __tests__/submit-feedback.test.ts
    sinks/
      resend-feedback-sink.ts
      __tests__/resend-feedback-sink.test.ts
```

Modify these existing files:

```text
apps/web/components/providers.tsx
apps/web/lib/env.ts
```

Responsibilities:

- `feedback-tab.client.tsx`: visible global lateral tab and dialog ownership.
- `feedback-dialog.client.tsx`: form state, client validation, POST to `/api/feedback`, toast states.
- `route.ts`: server boundary; validates request, adds headers/session context, calls the use case.
- `submit-feedback.ts`: provider-agnostic use case.
- `types.ts`: public internal contract for payload, sink, and result.
- `validation.ts`: shared Zod schemas for client and server.
- `config.ts`: reads and validates feedback-specific environment variables at send time.
- `resend-feedback-sink.ts`: the only file that knows Resend.
- `errors.ts`: stable domain errors that route/UI can map without importing Resend details.

---

## Task 1: Feedback Types, Validation, And Use Case

**Files:**
- Create: `apps/web/lib/feedback/types.ts`
- Create: `apps/web/lib/feedback/errors.ts`
- Create: `apps/web/lib/feedback/validation.ts`
- Create: `apps/web/lib/feedback/submit-feedback.ts`
- Create: `apps/web/lib/feedback/__tests__/submit-feedback.test.ts`

- [ ] **Step 1: Write the failing use-case tests**

Create `apps/web/lib/feedback/__tests__/submit-feedback.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { FeedbackValidationError } from '../errors';
import { submitFeedback } from '../submit-feedback';
import type { FeedbackSink } from '../types';

function fakeSink(): FeedbackSink {
  return { send: vi.fn().mockResolvedValue({ provider: 'fake', id: 'feedback-1' }) };
}

describe('submitFeedback', () => {
  it('trims and forwards valid feedback to the configured sink', async () => {
    const sink = fakeSink();

    await expect(
      submitFeedback(
        {
          message: '  En la compra no entiendo que ocurre despues del pago.  ',
          contactEmail: 'runner@example.com',
          pageUrl: 'http://localhost:3000/dorsales/demo',
          userAgent: 'vitest',
          submittedAt: '2026-06-05T16:00:00.000Z',
        },
        sink,
      ),
    ).resolves.toEqual({ provider: 'fake', id: 'feedback-1' });

    expect(sink.send).toHaveBeenCalledWith({
      message: 'En la compra no entiendo que ocurre despues del pago.',
      contactEmail: 'runner@example.com',
      pageUrl: 'http://localhost:3000/dorsales/demo',
      userAgent: 'vitest',
      submittedAt: '2026-06-05T16:00:00.000Z',
    });
  });

  it('rejects short messages before calling the sink', async () => {
    const sink = fakeSink();

    await expect(
      submitFeedback(
        {
          message: 'Muy corto',
          submittedAt: '2026-06-05T16:00:00.000Z',
        },
        sink,
      ),
    ).rejects.toBeInstanceOf(FeedbackValidationError);

    expect(sink.send).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter @dorsal/web test -- submit-feedback.test.ts
```

Expected: FAIL because `../submit-feedback` and related files do not exist.

- [ ] **Step 3: Implement errors**

Create `apps/web/lib/feedback/errors.ts`:

```ts
export class FeedbackValidationError extends Error {
  readonly code = 'feedback_validation_error';

  constructor(message = 'Feedback payload is invalid') {
    super(message);
    this.name = 'FeedbackValidationError';
  }
}

export class FeedbackQuotaExceededError extends Error {
  readonly code = 'feedback_quota_exceeded';

  constructor(message = 'Feedback email quota exceeded') {
    super(message);
    this.name = 'FeedbackQuotaExceededError';
  }
}

export class FeedbackConfigurationError extends Error {
  readonly code = 'feedback_configuration_error';

  constructor(message = 'Feedback email is not configured') {
    super(message);
    this.name = 'FeedbackConfigurationError';
  }
}

export class FeedbackDeliveryError extends Error {
  readonly code = 'feedback_delivery_error';

  constructor(message = 'Feedback could not be delivered') {
    super(message);
    this.name = 'FeedbackDeliveryError';
  }
}
```

- [ ] **Step 4: Implement types**

Create `apps/web/lib/feedback/types.ts`:

```ts
export type FeedbackPayload = {
  message: string;
  contactEmail?: string;
  pageUrl?: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  submittedAt: string;
};

export type FeedbackSendResult = {
  provider: string;
  id?: string;
};

export interface FeedbackSink {
  send(payload: FeedbackPayload): Promise<FeedbackSendResult>;
}
```

- [ ] **Step 5: Implement validation**

Create `apps/web/lib/feedback/validation.ts`:

```ts
import { z } from 'zod';

export const FeedbackInputSchema = z.object({
  message: z.string().trim().min(20).max(4000),
  contactEmail: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().optional(),
  ),
  pageUrl: z.string().url().optional(),
  userAgent: z.string().max(1000).optional(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().max(200).optional(),
  submittedAt: z.string().datetime(),
});
```

- [ ] **Step 6: Implement use case**

Create `apps/web/lib/feedback/submit-feedback.ts`:

```ts
import { FeedbackValidationError } from './errors';
import type { FeedbackPayload, FeedbackSink } from './types';
import { FeedbackInputSchema } from './validation';

export async function submitFeedback(input: FeedbackPayload, sink: FeedbackSink) {
  const parsed = FeedbackInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new FeedbackValidationError();
  }

  return sink.send(parsed.data);
}
```

- [ ] **Step 7: Run tests and verify GREEN**

```bash
pnpm --filter @dorsal/web test -- submit-feedback.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/feedback
git commit -m "feat(feedback): add provider agnostic feedback use case"
```

---

## Task 2: Resend Sink And Feedback Environment

**Files:**
- Modify: `apps/web/lib/env.ts`
- Create: `apps/web/lib/feedback/config.ts`
- Create: `apps/web/lib/feedback/sinks/resend-feedback-sink.ts`
- Create: `apps/web/lib/feedback/sinks/__tests__/resend-feedback-sink.test.ts`

- [ ] **Step 1: Write failing Resend sink tests**

Create `apps/web/lib/feedback/sinks/__tests__/resend-feedback-sink.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackConfigurationError, FeedbackQuotaExceededError } from '../../errors';
import { ResendFeedbackSink } from '../resend-feedback-sink';

const originalEnv = process.env;

function setFeedbackEnv() {
  process.env.RESEND_API_KEY = 're_test';
  process.env.FEEDBACK_TO_EMAIL = 'feedback@dorsal.market';
  process.env.FEEDBACK_FROM_EMAIL = 'Dorsal Feedback <feedback@dorsal.market>';
}

describe('ResendFeedbackSink', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('sends feedback through the Resend email endpoint', async () => {
    setFeedbackEnv();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'email_123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que pasa despues de simular el pago.',
        contactEmail: 'runner@example.com',
        pageUrl: 'http://localhost:3000/compra/checkout/demo',
        userAgent: 'vitest',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).resolves.toEqual({ provider: 'resend', id: 'email_123' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('maps Resend 429 responses to quota errors', async () => {
    setFeedbackEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ name: 'rate_limit_exceeded' }), { status: 429 }),
    );

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que datos vera el vendedor despues de comprar.',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(FeedbackQuotaExceededError);
  });

  it('fails clearly when feedback email env vars are missing', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.FEEDBACK_TO_EMAIL;
    delete process.env.FEEDBACK_FROM_EMAIL;

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que datos vera el vendedor despues de comprar.',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(FeedbackConfigurationError);
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter @dorsal/web test -- resend-feedback-sink.test.ts
```

Expected: FAIL because `../resend-feedback-sink` does not exist.

- [ ] **Step 3: Add optional feedback env vars**

Modify `apps/web/lib/env.ts` server schema:

```ts
  RESEND_API_KEY: z.string().optional(),
  FEEDBACK_TO_EMAIL: z.string().email().optional(),
  FEEDBACK_FROM_EMAIL: z.string().optional(),
```

Keep these optional in `env.ts` so local tests and non-feedback previews can boot without a Resend key. The route will require them when a user submits feedback.

- [ ] **Step 4: Implement config helper**

Create `apps/web/lib/feedback/config.ts`:

```ts
import { z } from 'zod';
import { FeedbackConfigurationError } from './errors';

const FeedbackConfigSchema = z.object({
  apiKey: z.string().min(1),
  toEmail: z.string().email(),
  fromEmail: z.string().min(1),
});

export function getFeedbackConfig() {
  const parsed = FeedbackConfigSchema.safeParse({
    apiKey: process.env.RESEND_API_KEY,
    toEmail: process.env.FEEDBACK_TO_EMAIL,
    fromEmail: process.env.FEEDBACK_FROM_EMAIL,
  });

  if (!parsed.success) {
    throw new FeedbackConfigurationError();
  }

  return parsed.data;
}
```

- [ ] **Step 5: Implement Resend sink**

Create `apps/web/lib/feedback/sinks/resend-feedback-sink.ts`:

```ts
import { getFeedbackConfig } from '../config';
import { FeedbackDeliveryError, FeedbackQuotaExceededError } from '../errors';
import type { FeedbackPayload, FeedbackSink } from '../types';

type ResendSuccess = { id?: string };

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderFeedbackHtml(payload: FeedbackPayload) {
  const rows = [
    ['Mensaje', payload.message],
    ['Email de contacto', payload.contactEmail ?? 'No indicado'],
    ['URL', payload.pageUrl ?? 'No indicada'],
    ['User-agent', payload.userAgent ?? 'No indicado'],
    ['Fecha', payload.submittedAt],
    ['Usuario', [payload.userName, payload.userEmail, payload.userId].filter(Boolean).join(' | ') || 'No autenticado'],
  ];

  return `<h1>Nuevo feedback de usuario</h1>${rows
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`)
    .join('')}`;
}

export class ResendFeedbackSink implements FeedbackSink {
  async send(payload: FeedbackPayload) {
    const config = getFeedbackConfig();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [config.toEmail],
        subject: '[dorsal.market] Nuevo feedback de usuario',
        html: renderFeedbackHtml(payload),
        reply_to: payload.contactEmail ? [payload.contactEmail] : undefined,
      }),
    });

    if (response.status === 429) {
      throw new FeedbackQuotaExceededError();
    }

    if (!response.ok) {
      throw new FeedbackDeliveryError();
    }

    const data = (await response.json().catch(() => ({}))) as ResendSuccess;
    return { provider: 'resend', id: data.id };
  }
}
```

This uses the Resend REST endpoint documented as `POST https://api.resend.com/emails`; no npm dependency is required.

- [ ] **Step 6: Run tests and verify GREEN**

```bash
pnpm --filter @dorsal/web test -- resend-feedback-sink.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/env.ts apps/web/lib/feedback/config.ts apps/web/lib/feedback/sinks
git commit -m "feat(feedback): add resend email sink"
```

---

## Task 3: Feedback API Route

**Files:**
- Create: `apps/web/app/api/feedback/route.ts`
- Create: `apps/web/app/api/feedback/__tests__/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `apps/web/app/api/feedback/__tests__/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackQuotaExceededError } from '@/lib/feedback/errors';
import { POST } from '../route';

const mocks = vi.hoisted(() => ({
  submitFeedback: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('@/lib/feedback/submit-feedback', () => ({
  submitFeedback: mocks.submitFeedback,
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

describe('POST /api/feedback', () => {
  beforeEach(() => {
    mocks.submitFeedback.mockReset();
    mocks.auth.mockReset();
    mocks.submitFeedback.mockResolvedValue({ provider: 'fake', id: 'email_1' });
    mocks.auth.mockResolvedValue({
      user: { id: 'user-1', email: 'runner@example.com', name: 'Runner Demo' },
    });
  });

  it('normalizes payload and adds request context', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'vitest-agent',
        },
        body: JSON.stringify({
          message: '  No entiendo que datos vera el comprador al publicar.  ',
          contactEmail: '',
          pageUrl: 'http://localhost:3000/vender',
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No entiendo que datos vera el comprador al publicar.',
        pageUrl: 'http://localhost:3000/vender',
        userAgent: 'vitest-agent',
        userId: 'user-1',
        userEmail: 'runner@example.com',
        userName: 'Runner Demo',
      }),
      expect.anything(),
    );
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Corto' }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_feedback' });
    expect(mocks.submitFeedback).not.toHaveBeenCalled();
  });

  it('returns 429 when the sink quota is exhausted', async () => {
    mocks.submitFeedback.mockRejectedValueOnce(new FeedbackQuotaExceededError());

    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No entiendo que ocurre despues de confirmar el cambio.',
        }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: 'quota_exceeded' });
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter @dorsal/web test -- route.test.ts
```

Expected: FAIL because `../route` does not exist.

- [ ] **Step 3: Implement route**

Create `apps/web/app/api/feedback/route.ts`:

```ts
import { auth } from '@/lib/auth';
import { FeedbackConfigurationError, FeedbackQuotaExceededError, FeedbackValidationError } from '@/lib/feedback/errors';
import { ResendFeedbackSink } from '@/lib/feedback/sinks/resend-feedback-sink';
import { submitFeedback } from '@/lib/feedback/submit-feedback';
import { FeedbackInputSchema } from '@/lib/feedback/validation';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const submittedAt = new Date().toISOString();
  const candidate =
    typeof raw === 'object' && raw !== null
      ? {
          ...raw,
          userAgent: request.headers.get('user-agent') ?? undefined,
          userId: session?.user?.id,
          userEmail: session?.user?.email ?? undefined,
          userName: session?.user?.name ?? undefined,
          submittedAt,
        }
      : { submittedAt };

  const parsed = FeedbackInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_feedback' }, { status: 400 });
  }

  try {
    await submitFeedback(parsed.data, new ResendFeedbackSink());
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof FeedbackValidationError) {
      return NextResponse.json({ error: 'invalid_feedback' }, { status: 400 });
    }

    if (error instanceof FeedbackQuotaExceededError) {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 });
    }

    if (error instanceof FeedbackConfigurationError) {
      return NextResponse.json({ error: 'feedback_not_configured' }, { status: 500 });
    }

    return NextResponse.json({ error: 'feedback_delivery_failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests and verify GREEN**

```bash
pnpm --filter @dorsal/web test -- route.test.ts submit-feedback.test.ts resend-feedback-sink.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/feedback
git commit -m "feat(feedback): add feedback api route"
```

---

## Task 4: Feedback Dialog Component

**Files:**
- Create: `apps/web/components/feedback/feedback-dialog.client.tsx`
- Create: `apps/web/components/feedback/__tests__/feedback-dialog.test.tsx`

- [ ] **Step 1: Write failing dialog tests**

Create `apps/web/components/feedback/__tests__/feedback-dialog.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackDialog } from '../feedback-dialog.client';

const mocks = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

describe('FeedbackDialog', () => {
  beforeEach(() => {
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    vi.restoreAllMocks();
  });

  it('guides users toward concrete actionable feedback', () => {
    render(<FeedbackDialog open onOpenChange={() => {}} />);

    expect(screen.getByText(/feedback concreto/i)).toBeInTheDocument();
    expect(screen.getByText(/partes del proceso que no se entienden/i)).toBeInTheDocument();
  });

  it('requires a useful message before sending', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/mensaje/i), 'Corto');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    expect(await screen.findByText(/escribe al menos 20 caracteres/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts valid feedback and closes on success', async () => {
    const onOpenChange = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const user = userEvent.setup();

    render(<FeedbackDialog open onOpenChange={onOpenChange} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      'No entiendo que ocurre despues de simular el pago de un dorsal.',
    );
    await user.type(screen.getByLabelText(/email de contacto/i), 'runner@example.com');
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith('Gracias, hemos recibido tu feedback'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows quota message when the api returns 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'quota_exceeded' }), { status: 429 }),
    );
    const user = userEvent.setup();

    render(<FeedbackDialog open onOpenChange={() => {}} />);

    await user.type(
      screen.getByLabelText(/mensaje/i),
      'No entiendo que ocurre despues de confirmar el cambio de titularidad.',
    );
    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Ahora mismo no podemos recibir mas feedback. Intentalo mas tarde.',
      ),
    );
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter @dorsal/web test -- feedback-dialog.test.tsx
```

Expected: FAIL because `../feedback-dialog.client` does not exist.

- [ ] **Step 3: Implement dialog**

Create `apps/web/components/feedback/feedback-dialog.client.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

const MIN_MESSAGE_LENGTH = 20;

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmedMessage = message.trim();
    const trimmedEmail = contactEmail.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError('Escribe al menos 20 caracteres para que el feedback sea util.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          contactEmail: trimmedEmail || undefined,
          pageUrl: window.location.href,
        }),
      });

      if (response.status === 429) {
        toast.error('Ahora mismo no podemos recibir mas feedback. Intentalo mas tarde.');
        return;
      }

      if (!response.ok) {
        toast.error('No se pudo enviar el feedback. Intentalo de nuevo.');
        return;
      }

      toast.success('Gracias, hemos recibido tu feedback');
      setMessage('');
      setContactEmail('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Ayudanos a mejorar dorsal.market con feedback concreto: errores que encuentres, partes
            del proceso que no se entienden, pasos que te resulten confusos al comprar o vender, o
            ideas que faciliten completar una tarea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">Mensaje</Label>
            <textarea
              id="feedback-message"
              className="min-h-32 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm shadow-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral"
              placeholder='Ejemplo: "Al publicar un dorsal no entiendo que datos vera el comprador..."'
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-email">Email de contacto opcional</Label>
            <Input
              id="feedback-email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
            <p className="text-xs text-text-muted">
              Solo lo usaremos si necesitamos entender mejor tu feedback o responderte.
            </p>
          </div>

          <Button type="button" className="w-full" disabled={submitting} onClick={submit}>
            {submitting ? 'Enviando...' : 'Enviar feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run tests and verify GREEN**

```bash
pnpm --filter @dorsal/web test -- feedback-dialog.test.tsx
pnpm --filter @dorsal/web typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/feedback/feedback-dialog.client.tsx apps/web/components/feedback/__tests__/feedback-dialog.test.tsx
git commit -m "feat(feedback): add feedback dialog"
```

---

## Task 5: Global Side Tab

**Files:**
- Create: `apps/web/components/feedback/feedback-tab.client.tsx`
- Create: `apps/web/components/feedback/__tests__/feedback-tab.test.tsx`

- [ ] **Step 1: Write failing tab tests**

Create `apps/web/components/feedback/__tests__/feedback-tab.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FeedbackTab } from '../feedback-tab.client';

describe('FeedbackTab', () => {
  it('renders a side tab with an accessible name', () => {
    render(<FeedbackTab />);

    expect(screen.getByRole('button', { name: /enviar feedback/i })).toHaveTextContent('Feedback');
  });

  it('opens the feedback dialog', async () => {
    const user = userEvent.setup();
    render(<FeedbackTab />);

    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /enviar feedback/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter @dorsal/web test -- feedback-tab.test.tsx
```

Expected: FAIL because `../feedback-tab.client` does not exist.

- [ ] **Step 3: Implement tab**

Create `apps/web/components/feedback/feedback-tab.client.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { FeedbackDialog } from './feedback-dialog.client';

export function FeedbackTab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Enviar feedback"
          className="fixed right-[-34px] top-1/2 z-40 h-10 w-28 -translate-y-1/2 -rotate-90 rounded-t-md bg-coral text-sm font-medium text-white shadow-elevated transition-colors hover:bg-coral-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          onClick={() => setOpen(true)}
        >
          Feedback
        </button>
      )}
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```

The tab is visually slim and flush with the right edge. Its visible height is 40 px, but the rotated width gives a touch target larger than 44 px along the reachable axis.

- [ ] **Step 4: Run tests and verify GREEN**

```bash
pnpm --filter @dorsal/web test -- feedback-tab.test.tsx feedback-dialog.test.tsx
pnpm --filter @dorsal/web typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/feedback/feedback-tab.client.tsx apps/web/components/feedback/__tests__/feedback-tab.test.tsx
git commit -m "feat(feedback): add global feedback side tab"
```

---

## Task 6: Mount Feedback Globally

**Files:**
- Modify: `apps/web/components/providers.tsx`

- [ ] **Step 1: Add the tab to providers**

Modify `apps/web/components/providers.tsx`:

```tsx
'use client';
import { FeedbackTab } from '@/components/feedback/feedback-tab.client';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@dorsal/api-client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

const MswBootstrap = dynamic(
  () => import('@/components/msw-bootstrap').then((m) => m.MswBootstrap),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionProvider>
        <NuqsAdapter>
          <QueryProvider>
            {process.env.NODE_ENV === 'development' && <MswBootstrap />}
            {children}
            <FeedbackTab />
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </NuqsAdapter>
      </SessionProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Run targeted tests**

```bash
pnpm --filter @dorsal/web test -- feedback-tab.test.tsx feedback-dialog.test.tsx route.test.ts submit-feedback.test.ts resend-feedback-sink.test.ts
pnpm --filter @dorsal/web typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/providers.tsx
git commit -m "feat(feedback): mount feedback globally"
```

---

## Task 7: Manual UI Verification

**Files:**
- Read: `apps/web/components/feedback/feedback-tab.client.tsx`
- Read: `apps/web/components/feedback/feedback-dialog.client.tsx`

- [ ] **Step 1: Start the app**

```bash
pnpm --filter @dorsal/web dev
```

Expected: Next.js serves the app on `http://localhost:3000`.

- [ ] **Step 2: Verify desktop tab**

Open:

```text
http://localhost:3000/dorsales
```

Expected:

```text
The Feedback tab is flush with the right edge, centered vertically, coral, readable, and does not cover the nav.
```

- [ ] **Step 3: Verify mobile tab**

Use browser responsive mode at 390 x 844.

Expected:

```text
The Feedback tab remains lateral, flush with the right edge, centered vertically, readable, and clickable.
```

- [ ] **Step 4: Verify dialog**

Click `Feedback`.

Expected:

```text
The modal opens, the side tab is hidden, focus moves into the dialog, and the text guides the user toward concrete feedback.
```

- [ ] **Step 5: Verify validation**

Submit:

```text
Corto
```

Expected:

```text
Inline validation appears: Escribe al menos 20 caracteres para que el feedback sea util.
```

- [ ] **Step 6: Stop the dev server**

Stop the foreground process with `Ctrl+C`.

- [ ] **Step 7: Commit only if UI adjustments were required**

If no file changed, skip this step. If visual adjustments were made:

```bash
git add apps/web/components/feedback/feedback-tab.client.tsx apps/web/components/feedback/feedback-dialog.client.tsx
git commit -m "fix(feedback): polish side tab layout"
```

---

## Task 8: Final Verification And PR

- [ ] **Step 1: Run all feedback tests**

```bash
pnpm --filter @dorsal/web test -- feedback
```

Expected: all feedback-related tests pass.

- [ ] **Step 2: Run web typecheck**

```bash
pnpm --filter @dorsal/web typecheck
```

Expected: pass.

- [ ] **Step 3: Run web build**

```bash
pnpm --filter @dorsal/web build
```

Expected: pass with configured required base environment variables. Resend variables are optional at build time and required only when `/api/feedback` sends.

- [ ] **Step 4: Inspect git diff**

```bash
git status --short
git log --oneline --decorate -8
```

Expected:

```text
Only intentional feedback commits are present on feat/feedback.
Working tree is clean.
```

- [ ] **Step 5: Push**

```bash
git push -u origin feat/feedback
```

- [ ] **Step 6: Open PR**

PR target:

```text
base: feat/foundation
head: feat/feedback
```

PR title:

```text
feat(feedback): add global user feedback channel
```

PR body:

```text
## Summary
- Adds a global lateral Feedback tab across the web app.
- Adds a guided feedback modal with message and optional contact email.
- Adds a Next.js route handler that sends feedback through a provider-agnostic FeedbackSink.
- Adds the initial Resend sink without exposing the API key to the browser.

## Verification
- pnpm --filter @dorsal/web test -- feedback
- pnpm --filter @dorsal/web typecheck
- pnpm --filter @dorsal/web build
```

---

## Self-Review

Spec coverage:

| Spec requirement | Plan task |
|---|---|
| No `MVP-Dorsales` changes | Branching and all file paths stay under `dorsal.market/apps/web` |
| New branch `feat/feedback` from `feat/foundation` | Branching Task |
| Global side tab, lateral on desktop and mobile | Tasks 5, 6, 7 |
| Message required and contact email optional | Tasks 1, 3, 4 |
| Microcopy guides actionable feedback | Task 4 |
| API key hidden server-side | Tasks 2, 3 |
| Resend initial provider | Task 2 |
| Provider-agnostic `FeedbackSink` | Task 1 |
| Route maps validation, quota, and delivery errors | Task 3 |
| Tests for form, validation, route, sink | Tasks 1, 2, 3, 4, 5, 8 |

Type consistency:

- `FeedbackPayload.contactEmail` is used consistently by validation, route, dialog, sink, and tests.
- `FeedbackSink.send(payload)` returns `FeedbackSendResult` in all tests and implementations.
- Quota errors use `FeedbackQuotaExceededError` internally and `quota_exceeded` over HTTP.

Implementation boundary:

- The only Resend-specific file is `apps/web/lib/feedback/sinks/resend-feedback-sink.ts`.
- `apps/web/components/feedback/*` never imports Resend or environment variables.
- `apps/web/app/api/feedback/route.ts` owns request context and session enrichment.
