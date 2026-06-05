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
