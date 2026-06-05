import { auth } from '@/lib/auth';
import {
  FeedbackConfigurationError,
  FeedbackQuotaExceededError,
  FeedbackValidationError,
} from '@/lib/feedback/errors';
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

  const candidate: Record<string, unknown> = { submittedAt };

  if (typeof raw === 'object' && raw !== null) {
    const payload = raw as Record<string, unknown>;
    candidate.message = payload.message;
    candidate.contactEmail = payload.contactEmail;
    candidate.pageUrl = payload.pageUrl;
  }

  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    candidate.userAgent = userAgent;
  }

  if (session?.user?.id) {
    candidate.userId = session.user.id;
  }

  if (session?.user?.email) {
    candidate.userEmail = session.user.email;
  }

  if (session?.user?.name) {
    candidate.userName = session.user.name;
  }

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
