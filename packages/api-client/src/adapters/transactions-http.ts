import {
  BuyerTransactionDetail,
  Dispute,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  SellerOnboardingResponse,
  type SellerProblemCategory,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
} from '@dorsal/schemas';
import { z } from 'zod';
import type { HttpClient } from '../http';
import type { TransactionsPort } from '../ports';

const ProofUploadMultipartResponse = z.object({ proof_file_url: z.string().url() });

export class TransactionsHttpAdapter implements TransactionsPort {
  constructor(private http: HttpClient) {}

  async onboardSeller(sellerId: string) {
    return SellerOnboardingResponse.parse(
      await this.http.post('api/v1/sellers/onboard', { body: { user_id: sellerId } }),
    );
  }

  async reserveListing(input: { dorsalId: string; buyerId: string }) {
    return ReserveListingResponse.parse(
      await this.http.post('api/v1/transactions', {
        body: { dorsal_id: input.dorsalId, buyer_id: input.buyerId },
      }),
    );
  }

  async getBuyerTransaction(id: string) {
    return BuyerTransactionDetail.parse(await this.http.get(`api/v1/transactions/buyer/${id}`));
  }

  async getSellerTransaction(id: string) {
    return SellerTransactionDetail.parse(await this.http.get(`api/v1/transactions/seller/${id}`));
  }

  async getProofUploadUrl(id: string, input: { sellerId: string; contentType: string }) {
    return ProofUploadUrlResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/proof-upload-url`, {
        body: { seller_id: input.sellerId, content_type: input.contentType },
      }),
    );
  }

  async uploadProofMultipart(id: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return ProofUploadMultipartResponse.parse(
      await this.http.post(`api/v1/transactions/${id}/upload-proof`, { body: fd }),
    );
  }

  async submitProofUrl(id: string, input: { proofFileUrl: string; sellerId: string }) {
    return SellerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/proof`, {
        body: { proof_file_url: input.proofFileUrl, seller_id: input.sellerId },
      }),
    );
  }

  async markTransferInProgress(id: string, sellerId: string) {
    return SellerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/transfer-in-progress`, {
        body: { seller_id: sellerId },
      }),
    );
  }

  async confirmTransfer(id: string, buyerId: string) {
    return BuyerTransactionDetail.parse(
      await this.http.post(`api/v1/transactions/${id}/confirm`, { body: { buyer_id: buyerId } }),
    );
  }

  async openDispute(id: string, input: { buyerId: string; reason: string }) {
    return Dispute.parse(
      await this.http.post(`api/v1/transactions/${id}/dispute`, {
        body: { buyer_id: input.buyerId, reason: input.reason },
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
