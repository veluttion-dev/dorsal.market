import {
  BuyerTransactionDetail,
  Dispute,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  type RunnerDataInput,
  SellerOnboardingResponse,
  type SellerProblemCategory,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
} from '@dorsal/schemas';
import { z } from 'zod';
import type { HttpClient } from '../http';
import type { TransactionsPort } from '../ports';

const ExpireReservationResponse = z.object({ processed: z.boolean() });
const UpdateCheckoutRunnerDataResponse = z.object({ processed: z.boolean() });
const TransactionActionResponse = z.object({ processed: z.boolean() });

function normalizeUtcDateTime(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
}

export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient) {}

  async onboardSeller() {
    return SellerOnboardingResponse.parse(await this.http.post('api/v1/sellers/onboard'));
  }

  async reserveListing(input: { dorsalId: string; runnerData?: RunnerDataInput }) {
    const response = ReserveListingResponse.parse(
      await this.http.post('api/v1/transactions', {
        body: {
          dorsal_id: input.dorsalId,
          ...(input.runnerData ? { runner_data: input.runnerData } : {}),
        },
      }),
    );
    return {
      ...response,
      reservation_expires_at: normalizeUtcDateTime(response.reservation_expires_at),
    };
  }

  async expireReservation(id: string) {
    return ExpireReservationResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/expire-reservation`),
    );
  }

  async updateCheckoutRunnerData(id: string, runnerData: RunnerDataInput) {
    return UpdateCheckoutRunnerDataResponse.parse(
      await this.http.patch(`api/v1/transactions/${id}/runner-data`, {
        body: runnerData,
      }),
    );
  }

  async getBuyerTransaction(id: string) {
    return BuyerTransactionDetail.parse(await this.http.get(`api/v1/transactions/buyer/${id}`));
  }

  async getSellerTransaction(id: string) {
    return SellerTransactionDetail.parse(await this.http.get(`api/v1/transactions/seller/${id}`));
  }

  async getProofUploadUrl(id: string, input: { contentType: string }) {
    return ProofUploadUrlResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/proof-upload-url`, {
        body: { content_type: input.contentType },
      }),
    );
  }

  async uploadProofMultipart(id: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return TransactionActionResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/upload-proof`, {
        body: fd,
        headers: { 'Idempotency-Key': `upload-proof-${id}-${file.name}-${file.size}` },
      }),
    );
  }

  async submitProofUrl(id: string, input: { proofFileUrl: string }) {
    return TransactionActionResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/proof`, {
        body: { proof_file_url: input.proofFileUrl },
      }),
    );
  }

  async markTransferInProgress(id: string) {
    return TransactionActionResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/transfer-in-progress`),
    );
  }

  async confirmTransfer(id: string) {
    return TransactionActionResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/confirm`, {
        headers: { 'Idempotency-Key': `confirm-transfer-${id}` },
      }),
    );
  }

  async openDispute(id: string, input: { reason: string }) {
    return Dispute.parse(
      await this.http.post(`api/v1/transactions/${id}/dispute`, {
        body: { reason: input.reason },
      }),
    );
  }

  async createSellerProblemReport(input: {
    transactionId: string;
    category: SellerProblemCategory;
    message: string;
    files?: File[];
  }) {
    const fd = new FormData();
    fd.append('category', input.category);
    fd.append('message', input.message);
    for (const file of input.files ?? []) fd.append('files', file);
    return SellerProblemReport.parse(
      await this.http.post(`api/v1/transactions/${input.transactionId}/seller-problem-reports`, {
        body: fd,
      }),
    );
  }

  async listMyPurchases(query?: { status?: string; limit?: number; offset?: number }) {
    return TransactionListResponse.parse(
      await this.http.get('api/v1/me/purchases', { query: query ?? {} }),
    );
  }

  async listMySales(query?: { status?: string; limit?: number; offset?: number }) {
    return TransactionListResponse.parse(
      await this.http.get('api/v1/me/sales', { query: query ?? {} }),
    );
  }
}
