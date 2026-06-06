'use client';
import { ConfirmAction } from '@/components/transaction/confirm-action.client';
import { SellerProblemReport } from '@/components/transaction/seller-problem-report.client';
import { TrackingTimeline } from '@/components/transaction/tracking-timeline.client';
import { TransferActions } from '@/components/transaction/transfer-actions.client';
import { useBuyerTransaction } from '@/features/transactions/hooks/use-buyer-transaction';
import { useSellerTransaction } from '@/features/transactions/hooks/use-seller-transaction';
import { STATUS_LABEL } from '@/features/transactions/lib/labels';
import { formatPrice } from '@dorsal/domain';
import type { BuyerTransactionDetail, SellerTransactionDetail } from '@dorsal/schemas';
import { useSession } from 'next-auth/react';
import { use } from 'react';

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
        {STATUS_LABEL[tx.status]} · {formatPrice(tx.amount)}
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
  const buyerTx = buyer.data && buyer.data.buyer_id === userId ? buyer.data : null;
  const sellerTx = seller.data && seller.data.seller_id === userId ? seller.data : null;
  const tx = buyerTx ?? sellerTx ?? buyer.data ?? seller.data;
  const role = sellerTx ? 'seller' : 'buyer';

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
            <ConfirmAction transactionId={tx.id} buyerId={tx.buyer_id} status={tx.status} />
          )}
          {role === 'seller' && (
            <>
              <TransferActions transactionId={tx.id} sellerId={tx.seller_id} status={tx.status} />
              {['released_to_seller', 'refunded_to_buyer'].includes(tx.status) && (
                <SellerProblemReport transactionId={tx.id} />
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
