import type { Metadata } from 'next';
import { PublishWizard } from '@/features/dorsals/components/publish-wizard.client';

export const metadata: Metadata = { title: 'Vender dorsal' };

export default function VenderPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Vender <em className="not-italic text-coral">dorsal</em>
        </h1>
        <p className="mt-1 text-text-secondary">Rellena los datos. La publicación es gratis.</p>
      </header>
      <PublishWizard />
    </main>
  );
}
