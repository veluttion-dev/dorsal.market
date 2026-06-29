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
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { DorsalFilters } from './dorsal-filters.client';

export function DorsalFiltersMobile() {
  const t = useTranslations('filters');
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full lg:hidden">
          <SlidersHorizontal />
          {t('title')}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto">
        <SheetTitle className="sr-only">{t('title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('mobile_description')}</SheetDescription>
        <DorsalFilters />
        <SheetClose asChild>
          <Button className="mt-6 w-full">{t('see_results')}</Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
