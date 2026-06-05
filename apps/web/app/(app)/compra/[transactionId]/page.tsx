'use client';
import { ConfirmAction } from '@/components/transaction/confirm-action.client';
import { SellerProblemReport } from '@/components/transaction/seller-problem-report.client';
import { TrackingTimeline } from '@/components/transaction/tracking-timeline.client';
import { TransferActions } from '@/components/transaction/transfer-actions.client';
import { useBuyerTransaction } from '@/features/transactions/hooks/use-buyer-transaction';
import { useSellerTransaction } from '@/features/transactions/hooks/use-seller-transaction';
import { STATUS_LABEL } from '@/features/transactions/lib/labels';
import { ReviewForm } from '@/features/users/components/review-form.client';
import { formatPrice } from '@dorsal/domain';
import type {
  BuyerTransactionDetail,
  SellerTransactionDetail,
  TransactionStatus,
} from '@dorsal/schemas';
import { useSession } from 'next-auth/react';
import { use } from 'react';

const SELLER_PROBLEM_STATUSES: TransactionStatus[] = [
  'released_to_seller',
  'refunded_to_buyer',
  'RELEASED_TO_SELLER',
  'REFUNDED_TO_BUYER',
];

function isSellerTransaction(
  tx: BuyerTransactionDetail | SellerTransactionDetail,
): tx is SellerTransactionDetail {
  return 'buyer_contact' in tx;
}

function Header({
  tx,
  role,
}: {
  tx: BuyerTransactionDetail | SellerTransactionDetail;
  role: 'buyer' | 'seller';
}) {
  return (
    <header className="mb-8">
      <p className="text-sm font-medium uppercase text-coral">
        {role === 'buyer' ? 'Compra' : 'Venta'}
      </p>
      <h1 className="mt-1 text-3xl font-bold">Seguimiento</h1>
      <p className="mt-2 text-text-secondary">
        {STATUS_LABEL[tx.status]} - {formatPrice(tx.order_summary.amount_eur)}
      </p>
    </header>
  );
}

export default function TransactionTrackingPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const { data } = useSession();
  const buyer = useBuyerTransaction(transactionId);
  const seller = useSellerTransaction(transactionId);
  const userId = data?.user?.id;
  const buyerTx = buyer.data ?? null;
  const sellerTx =
    seller.data && (!userId || seller.data.buyer_contact.buyer_id !== userId) ? seller.data : null;
  const tx = sellerTx ?? buyerTx ?? seller.data;
  const role = sellerTx ? 'seller' : 'buyer';
  const actorId = userId ?? '';

  if (!tx) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-border bg-bg-card p-6 text-text-secondary">
          Cargando seguimiento...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <Header tx={tx} role={role} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <TrackingTimeline events={tx.timeline} />
        </section>
        <aside className="space-y-5">
          {role === 'buyer' && (
            <>
              <ConfirmAction
                transactionId={tx.transaction_id}
                buyerId={actorId}
                status={tx.status}
              />
              <ReviewForm transactionId={tx.transaction_id} status={tx.status} />
            </>
          )}
          {role === 'seller' && isSellerTransaction(tx) && (
            <>
              <TransferActions
                transactionId={tx.transaction_id}
                sellerId={actorId}
                status={tx.status}
              />
              <ReviewForm transactionId={tx.transaction_id} status={tx.status} />
              {SELLER_PROBLEM_STATUSES.includes(tx.status) && (
                <SellerProblemReport transactionId={tx.transaction_id} />
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
