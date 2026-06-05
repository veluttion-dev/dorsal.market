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
