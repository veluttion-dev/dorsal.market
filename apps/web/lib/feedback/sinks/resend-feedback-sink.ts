import { getFeedbackConfig } from '../config';
import { FeedbackDeliveryError, FeedbackQuotaExceededError } from '../errors';
import type { FeedbackPayload, FeedbackSendResult, FeedbackSink } from '../types';

type ResendSuccess = { id: string };

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderFeedbackHtml(payload: FeedbackPayload) {
  const rows: Array<[string, string]> = [
    ['Mensaje', payload.message],
    ['Email de contacto', payload.contactEmail ?? 'No indicado'],
    ['URL', payload.pageUrl ?? 'No indicada'],
    ['User-agent', payload.userAgent ?? 'No indicado'],
    ['Fecha', payload.submittedAt],
    [
      'Usuario',
      [payload.userName, payload.userEmail, payload.userId].filter(Boolean).join(' | ') ||
        'No autenticado',
    ],
  ];

  return `<h1>Nuevo feedback de usuario</h1>${rows
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`)
    .join('')}`;
}

export class ResendFeedbackSink implements FeedbackSink {
  async send(payload: FeedbackPayload): Promise<FeedbackSendResult> {
    const config = getFeedbackConfig();

    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
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
    } catch {
      throw new FeedbackDeliveryError();
    }

    if (response.status === 429) {
      throw new FeedbackQuotaExceededError();
    }

    if (!response.ok) {
      throw new FeedbackDeliveryError();
    }

    let data: ResendSuccess;
    try {
      data = (await response.json()) as ResendSuccess;
    } catch {
      throw new FeedbackDeliveryError();
    }

    if (typeof data.id !== 'string') {
      throw new FeedbackDeliveryError();
    }

    const id = data.id.trim();
    if (!id) {
      throw new FeedbackDeliveryError();
    }

    return { provider: 'resend', id };
  }
}
