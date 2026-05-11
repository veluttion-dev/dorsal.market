import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-text-secondary">No encontramos esta página.</p>
        <Link href="/" className="text-coral hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
