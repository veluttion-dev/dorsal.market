import { ChatMessage, Dispute, PurchaseInput, Transaction, type TimelineStep } from '@dorsal/schemas';
import { z } from 'zod';
import type { HttpClient } from '../http';
import type { PurchaseResult, TransactionsPort } from '../ports';

const PurchaseResponseSchema = z.object({
  transaction_id: z.string().uuid(),
  client_secret: z.string(),
});

export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient) {}

  async purchase(input: PurchaseInput): Promise<PurchaseResult> {
    return PurchaseResponseSchema.parse(
      await this.http.post('api/v1/transactions', { body: PurchaseInput.parse(input) }),
    );
  }

  async confirmPayment(id: string): Promise<Transaction> {
    return Transaction.parse(await this.http.post(`api/v1/transactions/${id}/confirm`));
  }

  async getById(id: string): Promise<Transaction> {
    return Transaction.parse(await this.http.get(`api/v1/transactions/${id}`));
  }

  async listMine(): Promise<Transaction[]> {
    return z.array(Transaction).parse(await this.http.get('api/v1/transactions/mine'));
  }

  async advanceStep(id: string, step: TimelineStep['step']): Promise<Transaction> {
    return Transaction.parse(
      await this.http.post(`api/v1/transactions/${id}/advance`, { body: { step } }),
    );
  }

  async openDispute(
    id: string,
    reason: string,
    evidenceUrls: string[],
  ): Promise<Dispute> {
    return Dispute.parse(
      await this.http.post(`api/v1/transactions/${id}/dispute`, {
        body: { reason, evidence_urls: evidenceUrls },
      }),
    );
  }

  async listMessages(id: string): Promise<ChatMessage[]> {
    return z
      .array(ChatMessage)
      .parse(await this.http.get(`api/v1/transactions/${id}/messages`));
  }

  async sendMessage(id: string, content: string): Promise<ChatMessage> {
    return ChatMessage.parse(
      await this.http.post(`api/v1/transactions/${id}/messages`, { body: { content } }),
    );
  }
}
