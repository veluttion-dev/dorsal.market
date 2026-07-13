'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyPurchases } from '@/features/transactions/hooks/use-my-purchases';
import { useMySales } from '@/features/transactions/hooks/use-my-sales';
import { formatPrice } from '@dorsal/domain';
import type { TransactionListItem } from '@dorsal/schemas';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

function TransactionRow({ item }: { item: TransactionListItem }) {
  return (
    <Link
      href={`/compra/${item.transaction_id}`}
      className="grid gap-1 rounded-lg border border-border bg-bg-card p-4 hover:bg-bg-elevated sm:grid-cols-[1fr_auto]"
    >
      <div>
        <p className="font-semibold">{item.race_name ?? 'Carrera sin nombre'}</p>
        <p className="text-sm text-text-secondary">{item.location ?? item.payment_method}</p>
      </div>
      <div className="text-left sm:text-right">
        <p className="font-semibold">{formatPrice(item.price)}</p>
        <p className="text-sm text-text-secondary">{item.ui_status_label}</p>
      </div>
    </Link>
  );
}

function List({
  query,
  emptyLabel,
  loadingLabel,
  errorLabel,
}: {
  query: {
    isLoading: boolean;
    isError: boolean;
    data: { items: TransactionListItem[] } | undefined;
  };
  emptyLabel: string;
  loadingLabel: string;
  errorLabel: string;
}) {
  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
        {loadingLabel}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-5 text-sm text-red-700"
      >
        {errorLabel}
      </div>
    );
  }
  const items = query.data?.items ?? [];
  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TransactionRow key={item.transaction_id} item={item} />
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const t = useTranslations('history');
  const purchases = useMyPurchases({ limit: 20, offset: 0 });
  const sales = useMySales({ limit: 20, offset: 0 });

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </header>
      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">{t('purchases')}</TabsTrigger>
          <TabsTrigger value="sales">{t('sales')}</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases" className="mt-5">
          <List
            query={purchases}
            emptyLabel={t('no_items')}
            loadingLabel={t('loading')}
            errorLabel={t('load_error')}
          />
        </TabsContent>
        <TabsContent value="sales" className="mt-5">
          <List
            query={sales}
            emptyLabel={t('no_items')}
            loadingLabel={t('loading')}
            errorLabel={t('load_error')}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
