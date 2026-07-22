import type {
  BuyerTransactionDetail,
  Dispute,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  RunnerDataInput,
  SellerOnboardingResponse,
  SellerProblemCategory,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
} from '@dorsal/schemas';

export interface TransactionsPort {
  onboardSeller(): Promise<SellerOnboardingResponse>;

  reserveListing(input: {
    dorsalId: string;
    runnerData?: RunnerDataInput;
  }): Promise<ReserveListingResponse>;
  updateCheckoutRunnerData(
    id: string,
    runnerData: RunnerDataInput,
  ): Promise<{ processed: boolean }>;
  expireReservation(id: string): Promise<{ processed: boolean }>;

  getBuyerTransaction(id: string): Promise<BuyerTransactionDetail>;
  getSellerTransaction(id: string): Promise<SellerTransactionDetail>;

  getProofUploadUrl(id: string, input: { contentType: string }): Promise<ProofUploadUrlResponse>;
  uploadProofMultipart(id: string, file: File): Promise<{ processed: boolean }>;
  submitProofUrl(id: string, input: { proofFileUrl: string }): Promise<{ processed: boolean }>;

  markTransferInProgress(id: string): Promise<{ processed: boolean }>;

  confirmTransfer(id: string): Promise<{ processed: boolean }>;
  openDispute(id: string, input: { reason: string }): Promise<Dispute>;

  createSellerProblemReport(input: {
    transactionId: string;
    category: SellerProblemCategory;
    message: string;
    files?: File[];
  }): Promise<SellerProblemReport>;

  listMyPurchases(query?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionListResponse>;
  listMySales(query?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionListResponse>;
}
