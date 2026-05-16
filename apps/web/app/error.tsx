'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Algo salió mal</h1>
        <p className="text-text-secondary">{error.message}</p>
        <button type="button" onClick={reset} className="rounded-md bg-coral px-4 py-2 text-white">
          Reintentar
        </button>
      </div>
    </div>
  );
}
