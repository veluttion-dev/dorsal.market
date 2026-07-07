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
  onboardSeller(sellerId: string): Promise<SellerOnboardingResponse>;

  reserveListing(input: {
    dorsalId: string;
    buyerId: string;
    runnerData?: RunnerDataInput;
  }): Promise<ReserveListingResponse>;
  updateCheckoutRunnerData(
    id: string,
    runnerData: RunnerDataInput,
  ): Promise<{ processed: boolean }>;
  expireReservation(id: string): Promise<{ processed: boolean }>;

  getBuyerTransaction(id: string): Promise<BuyerTransactionDetail>;
  getSellerTransaction(id: string): Promise<SellerTransactionDetail>;

  getProofUploadUrl(
    id: string,
    input: { sellerId: string; contentType: string },
  ): Promise<ProofUploadUrlResponse>;
  uploadProofMultipart(id: string, file: File): Promise<{ proof_file_url: string }>;
  submitProofUrl(
    id: string,
    input: { proofFileUrl: string; sellerId: string },
  ): Promise<SellerTransactionDetail>;

  markTransferInProgress(id: string, sellerId: string): Promise<SellerTransactionDetail>;

  confirmTransfer(id: string, buyerId: string): Promise<BuyerTransactionDetail>;
  openDispute(id: string, input: { buyerId: string; reason: string }): Promise<Dispute>;

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
