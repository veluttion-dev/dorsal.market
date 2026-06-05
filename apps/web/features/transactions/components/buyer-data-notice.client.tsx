'use client';
import { Button } from '@/components/ui/button';
import {
  canBuyWithProfile,
  getMissingProfileFields,
} from '@/features/users/lib/profile-completion';
import type { UserProfile } from '@dorsal/schemas';
import { IdCard } from 'lucide-react';
import Link from 'next/link';

export function BuyerDataNotice({
  isAuthenticated,
  isLoading = false,
  profile,
}: {
  isAuthenticated: boolean;
  isLoading?: boolean;
  profile?: UserProfile | null | undefined;
}) {
  const isComplete = canBuyWithProfile(profile);
  const missingFields = getMissingProfileFields(profile);

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
              Inicia sesion para validar tu perfil antes del pago.
            </p>
          )}
          {isAuthenticated && isLoading && (
            <p className="mt-2 text-sm text-text-muted">Comprobando tu perfil...</p>
          )}
          {isAuthenticated && !isLoading && !isComplete && (
            <p className="mt-2 text-sm text-text-muted">
              Completa los datos pendientes antes de reservar
              {missingFields.length ? `: ${missingFields.join(', ')}` : '.'}
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href={isComplete ? '/perfil' : '/perfil/completar'}>Revisar perfil</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
