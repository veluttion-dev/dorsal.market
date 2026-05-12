import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

export function Nav({
  session,
}: {
  session?: { user?: { name?: string | null } } | null;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-mono text-lg font-bold">
          dorsal<span className="text-coral">.</span>market
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dorsales" className="text-text-secondary hover:text-text-primary">
            Dorsales
          </Link>
          <Link href="/vender" className="text-text-secondary hover:text-text-primary">
            Vender
          </Link>
          <ThemeToggle />
          {session?.user ? (
            <Link href="/perfil">
              <Button variant="secondary" size="sm">
                {session.user.name ?? 'Perfil'}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
