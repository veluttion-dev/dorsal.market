'use client';
import { Button } from '@/components/ui/button';
import { IdCard } from 'lucide-react';
import Link from 'next/link';

export function BuyerDataNotice({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <div className="flex items-start gap-3">
        <IdCard className="mt-0.5 h-5 w-5 text-coral" />
        <div className="min-w-0">
          <h2 className="font-semibold">Datos para la transferencia</h2>
          <p className="mt-1 text-sm text-text-secondary">
            La compra usara los datos de tu perfil para que el vendedor pueda tramitar el cambio de
            titularidad del dorsal.
          </p>
          {!isAuthenticated && (
            <p className="mt-2 text-sm text-text-muted">
              Cuando el login este listo, este paso validara el perfil antes del pago.
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href="/perfil">Revisar perfil</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
