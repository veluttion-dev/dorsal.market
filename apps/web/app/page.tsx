import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function Home() {
  return (
    <main className="container mx-auto px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono text-5xl">
            dorsal<span className="text-coral">.</span>market
          </h1>
          <p className="mt-4 text-text-secondary">
            Foundation scaffold listo. Las features llegan en feat/dorsales.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </main>
  );
}
