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
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { SignOutButton } from './sign-out-button.client';

export function NavMobile({
  session,
}: {
  session: { user?: { name?: string | null } } | null | undefined;
}) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const LINKS = [
    { href: '/vender', label: t('sell') },
    { href: '/guias/comprar', label: t('how_to_buy') },
    { href: '/guias/vender', label: t('how_to_publish') },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('open_menu')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-72 flex-col gap-0">
        <SheetTitle className="font-mono text-base font-bold">
          dorsal<span className="text-coral">.</span>market
        </SheetTitle>
        <SheetDescription className="sr-only">{t('main_nav')}</SheetDescription>

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
                <Link href="/perfil/notificaciones">
                  <Button variant="ghost" className="w-full justify-start">
                    {t('notifications')}
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/perfil">
                  <Button variant="secondary" className="w-full">
                    {session.user.name ?? t('profile')}
                  </Button>
                </Link>
              </SheetClose>
              <SignOutButton />
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link href="/login">
                  <Button className="w-full">{t('enter')}</Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/registro"
                  className="py-1 text-center text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {t('create_account')}
                </Link>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
