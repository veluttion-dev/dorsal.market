'use client';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from './sign-out-button.client';

const LINKS = [
  { href: '/', label: 'Dorsales' },
  { href: '/vender', label: 'Vender' },
] as const;

export function NavMobile({
  session,
}: {
  session: { user?: { name?: string | null } } | null | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-72 flex-col gap-0">
        <SheetTitle className="font-mono text-base font-bold">
          dorsal<span className="text-coral">.</span>market
        </SheetTitle>
        <SheetDescription className="sr-only">Menú de navegación principal</SheetDescription>

        <nav className="mt-8 flex flex-col">
          {LINKS.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="-mx-2 rounded-md px-2 py-3 text-lg font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
          {session?.user ? (
            <>
              <SheetClose asChild>
                <Link href="/perfil">
                  <Button variant="secondary" className="w-full">
                    {session.user.name ?? 'Perfil'}
                  </Button>
                </Link>
              </SheetClose>
              <SignOutButton />
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link href="/login">
                  <Button className="w-full">Entrar</Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/registro"
                  className="py-1 text-center text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Crear cuenta
                </Link>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
