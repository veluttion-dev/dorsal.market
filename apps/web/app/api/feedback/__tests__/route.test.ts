import { FeedbackConfigurationError, FeedbackQuotaExceededError } from '@/lib/feedback/errors';
import { ResendFeedbackSink } from '@/lib/feedback/sinks/resend-feedback-sink';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      expect.any(ResendFeedbackSink),
    );
  });

  it('ignores spoofed identity fields from anonymous request bodies', async () => {
    mocks.auth.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No entiendo que datos vera el comprador al publicar.',
          userId: 'spoof-user',
          userEmail: 'spoof@example.com',
          userName: 'Spoofed User',
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.submitFeedback).toHaveBeenCalledWith(
      expect.not.objectContaining({
        userId: 'spoof-user',
        userEmail: 'spoof@example.com',
        userName: 'Spoofed User',
      }),
      expect.any(ResendFeedbackSink),
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

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_json' });
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

  it('returns 500 when feedback delivery is not configured', async () => {
    mocks.submitFeedback.mockRejectedValueOnce(new FeedbackConfigurationError());

    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No entiendo que ocurre despues de confirmar el cambio.',
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'feedback_not_configured' });
  });

  it('returns 500 when feedback delivery fails unexpectedly', async () => {
    mocks.submitFeedback.mockRejectedValueOnce(new Error('resend unavailable'));

    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No entiendo que ocurre despues de confirmar el cambio.',
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'feedback_delivery_failed' });
  });

  it('submits anonymous feedback when auth fails', async () => {
    mocks.auth.mockRejectedValueOnce(new Error('auth unavailable'));

    const response = await POST(
      new Request('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'vitest-agent',
        },
        body: JSON.stringify({
          message: 'No entiendo que ocurre despues de confirmar el cambio.',
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.submitFeedback).toHaveBeenCalledWith(
      expect.not.objectContaining({
        userId: expect.any(String),
        userEmail: expect.any(String),
        userName: expect.any(String),
      }),
      expect.any(ResendFeedbackSink),
    );
  });
});
