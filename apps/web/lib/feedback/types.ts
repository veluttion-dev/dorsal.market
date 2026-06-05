import type { z } from 'zod';
import type { FeedbackInputSchema } from './validation';

export type FeedbackPayload = z.infer<typeof FeedbackInputSchema>;

export type FeedbackSendResult = {
  provider: string;
  id?: string;
};

export interface FeedbackSink {
  send(payload: FeedbackPayload): Promise<FeedbackSendResult>;
}
