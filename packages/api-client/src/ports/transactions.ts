import type { ChatMessage, Dispute, PurchaseInput, Transaction } from '@dorsal/schemas';

export interface PurchaseResult {
  transaction_id: string;
  client_secret: string;
}

export interface TransactionsPort {
  purchase(input: PurchaseInput): Promise<PurchaseResult>;
  confirmPayment(transactionId: string): Promise<Transaction>;
  getById(id: string): Promise<Transaction>;
  listMine(): Promise<Transaction[]>;
  advanceStep(
    transactionId: string,
    step: Transaction['timeline'][number]['step'],
  ): Promise<Transaction>;
  openDispute(transactionId: string, reason: string, evidenceUrls: string[]): Promise<Dispute>;
  listMessages(transactionId: string): Promise<ChatMessage[]>;
  sendMessage(transactionId: string, content: string): Promise<ChatMessage>;
}
