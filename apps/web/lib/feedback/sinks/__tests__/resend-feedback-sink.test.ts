import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FeedbackConfigurationError,
  FeedbackDeliveryError,
  FeedbackQuotaExceededError,
} from '../../errors';
import { ResendFeedbackSink } from '../resend-feedback-sink';

const originalEnv = { ...process.env };

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

  it('includes escaped feedback HTML and reply_to in the Resend request body', async () => {
    setFeedbackEnv();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }));

    await new ResendFeedbackSink().send({
      message: `No entiendo <script>alert("pago")</script> & 'comillas'.`,
      contactEmail: 'runner@example.com',
      pageUrl: 'http://localhost:3000/compra/checkout/demo?step=pay&mode=test',
      userAgent: 'vitest <agent>',
      userName: 'Ana <Runner>',
      userEmail: 'ana@example.com',
      userId: 'user_123',
      submittedAt: '2026-06-05T16:00:00.000Z',
    });

    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {
      throw new Error('Expected Resend fetch call');
    }
    const [, request] = firstCall;
    const body = JSON.parse(String(request?.body));

    expect(body).toMatchObject({
      from: 'Dorsal Feedback <feedback@dorsal.market>',
      to: ['feedback@dorsal.market'],
      subject: '[dorsal.market] Nuevo feedback de usuario',
      reply_to: ['runner@example.com'],
    });
    expect(body.html).toContain('&lt;script&gt;alert(&quot;pago&quot;)&lt;/script&gt;');
    expect(body.html).toContain('&amp; &#039;comillas&#039;');
    expect(body.html).toContain(
      'http://localhost:3000/compra/checkout/demo?step=pay&amp;mode=test',
    );
    expect(body.html).toContain('vitest &lt;agent&gt;');
    expect(body.html).toContain('Ana &lt;Runner&gt; | ana@example.com | user_123');
  });

  it('omits reply_to from the Resend request body when contact email is absent', async () => {
    setFeedbackEnv();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }));

    await new ResendFeedbackSink().send({
      message: 'No entiendo que datos vera el vendedor despues de comprar.',
      submittedAt: '2026-06-05T16:00:00.000Z',
    });

    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {
      throw new Error('Expected Resend fetch call');
    }
    const [, request] = firstCall;
    const body = JSON.parse(String(request?.body));

    expect(body).not.toHaveProperty('reply_to');
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

  it('maps non-quota Resend failures to delivery errors', async () => {
    setFeedbackEnv();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ name: 'validation_error' }), { status: 500 }),
    );

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que datos vera el vendedor despues de comprar.',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(FeedbackDeliveryError);
  });

  it('maps Resend transport failures to delivery errors', async () => {
    setFeedbackEnv();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que datos vera el vendedor despues de comprar.',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(FeedbackDeliveryError);
  });

  it('rejects successful Resend responses without a valid email id', async () => {
    setFeedbackEnv();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not-json', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: '' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: '   ' }), { status: 200 }));

    const payload = {
      message: 'No entiendo que datos vera el vendedor despues de comprar.',
      submittedAt: '2026-06-05T16:00:00.000Z',
    };

    await expect(new ResendFeedbackSink().send(payload)).rejects.toBeInstanceOf(
      FeedbackDeliveryError,
    );
    await expect(new ResendFeedbackSink().send(payload)).rejects.toBeInstanceOf(
      FeedbackDeliveryError,
    );
    await expect(new ResendFeedbackSink().send(payload)).rejects.toBeInstanceOf(
      FeedbackDeliveryError,
    );
    await expect(new ResendFeedbackSink().send(payload)).rejects.toBeInstanceOf(
      FeedbackDeliveryError,
    );
  });

  it('fails clearly when feedback email env vars are missing', async () => {
    // Reflect.deleteProperty unsets the var; `process.env.X = undefined` would
    // coerce to the string "undefined" and not simulate a missing var.
    Reflect.deleteProperty(process.env, 'RESEND_API_KEY');
    Reflect.deleteProperty(process.env, 'FEEDBACK_TO_EMAIL');
    Reflect.deleteProperty(process.env, 'FEEDBACK_FROM_EMAIL');

    await expect(
      new ResendFeedbackSink().send({
        message: 'No entiendo que datos vera el vendedor despues de comprar.',
        submittedAt: '2026-06-05T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(FeedbackConfigurationError);
  });
});
