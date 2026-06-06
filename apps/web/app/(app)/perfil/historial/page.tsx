'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyPurchases } from '@/features/transactions/hooks/use-my-purchases';
import { useMySales } from '@/features/transactions/hooks/use-my-sales';
import { STATUS_LABEL } from '@/features/transactions/lib/labels';
import { formatPrice } from '@dorsal/domain';
import type { TransactionListItem } from '@dorsal/schemas';
import Link from 'next/link';

function TransactionRow({ item }: { item: TransactionListItem }) {
  return (
    <Link
      href={`/compra/${item.id}`}
      className="grid gap-1 rounded-lg border border-border bg-bg-card p-4 hover:bg-bg-elevated sm:grid-cols-[1fr_auto]"
    >
      <div>
        <p className="font-semibold">{item.race_name}</p>
        <p className="text-sm text-text-secondary">{item.counterparty_name}</p>
      </div>
      <div className="text-left sm:text-right">
        <p className="font-semibold">{formatPrice(item.amount)}</p>
        <p className="text-sm text-text-secondary">{STATUS_LABEL[item.status]}</p>
      </div>
    </Link>
  );
}

function List({ items }: { items: TransactionListItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5 text-sm text-text-secondary">
        Sin movimientos.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TransactionRow key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const purchases = useMyPurchases({ limit: 20, offset: 0 });
  const sales = useMySales({ limit: 20, offset: 0 });

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Historial</h1>
      </header>
      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases" className="mt-5">
          <List items={purchases.data?.items ?? []} />
        </TabsContent>
        <TabsContent value="sales" className="mt-5">
          <List items={sales.data?.items ?? []} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
