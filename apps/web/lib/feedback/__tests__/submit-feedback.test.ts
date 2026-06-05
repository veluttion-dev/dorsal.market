import { describe, expect, it, vi } from 'vitest';
import {
  FeedbackConfigurationError,
  FeedbackQuotaExceededError,
  FeedbackValidationError,
} from '../errors';
import { submitFeedback } from '../submit-feedback';
import type { FeedbackPayload, FeedbackSink } from '../types';

function fakeSink(): FeedbackSink {
  return { send: vi.fn().mockResolvedValue({ provider: 'fake', id: 'feedback-1' }) };
}

function validPayload(overrides: Partial<FeedbackPayload> = {}): FeedbackPayload {
  return {
    message: 'En la compra no entiendo que ocurre despues del pago.',
    submittedAt: '2026-06-05T16:00:00.000Z',
    ...overrides,
  };
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

  it('normalizes blank contact emails before forwarding feedback', async () => {
    const sink = fakeSink();

    await submitFeedback(validPayload({ contactEmail: '   ' }), sink);

    expect(sink.send).toHaveBeenCalledWith({
      message: 'En la compra no entiendo que ocurre despues del pago.',
      contactEmail: undefined,
      submittedAt: '2026-06-05T16:00:00.000Z',
    });
  });

  it('rejects invalid contact emails before calling the sink', async () => {
    const sink = fakeSink();

    await expect(submitFeedback(validPayload({ contactEmail: 'runner' }), sink)).rejects.toBeInstanceOf(
      FeedbackValidationError,
    );

    expect(sink.send).not.toHaveBeenCalled();
  });

  it('rejects invalid page URLs before calling the sink', async () => {
    const sink = fakeSink();

    await expect(submitFeedback(validPayload({ pageUrl: 'dorsales/demo' }), sink)).rejects.toBeInstanceOf(
      FeedbackValidationError,
    );

    expect(sink.send).not.toHaveBeenCalled();
  });

  it('rejects invalid submittedAt values before calling the sink', async () => {
    const sink = fakeSink();

    await expect(submitFeedback(validPayload({ submittedAt: 'June 5, 2026' }), sink)).rejects.toBeInstanceOf(
      FeedbackValidationError,
    );

    expect(sink.send).not.toHaveBeenCalled();
  });

  it('accepts feedback messages at the maximum length boundary', async () => {
    const sink = fakeSink();
    const message = 'a'.repeat(4000);

    await expect(submitFeedback(validPayload({ message }), sink)).resolves.toEqual({
      provider: 'fake',
      id: 'feedback-1',
    });

    expect(sink.send).toHaveBeenCalledWith({
      message,
      submittedAt: '2026-06-05T16:00:00.000Z',
    });
  });

  it('rejects feedback messages above the maximum length boundary before calling the sink', async () => {
    const sink = fakeSink();

    await expect(submitFeedback(validPayload({ message: 'a'.repeat(4001) }), sink)).rejects.toBeInstanceOf(
      FeedbackValidationError,
    );

    expect(sink.send).not.toHaveBeenCalled();
  });
});

describe('feedback domain errors', () => {
  it('uses transport-neutral default quota and configuration messages', () => {
    expect(new FeedbackQuotaExceededError().message).toBe('Feedback quota exceeded');
    expect(new FeedbackConfigurationError().message).toBe('Feedback is not configured');
  });
});
