import { PublishWizard } from '@/features/dorsals/components/publish-wizard.client';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Vender dorsal' };

export default function VenderPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Vender <em className="not-italic text-coral">dorsal</em>
        </h1>
        <p className="mt-1 text-text-secondary">Rellena los datos. La publicacion es gratis.</p>
        <Link
          href="/vender/onboarding"
          className="mt-4 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
        >
          Configurar cobros
        </Link>
      </header>
      <PublishWizard />
    </main>
  );
}
