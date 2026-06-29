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

function List({ items, emptyLabel }: { items: TransactionListItem[]; emptyLabel: string }) {
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
          <List items={purchases.data?.items ?? []} emptyLabel={t('no_items')} />
        </TabsContent>
        <TabsContent value="sales" className="mt-5">
          <List items={sales.data?.items ?? []} emptyLabel={t('no_items')} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
