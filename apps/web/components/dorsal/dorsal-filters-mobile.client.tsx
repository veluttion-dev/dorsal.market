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
import { SlidersHorizontal } from 'lucide-react';
import { DorsalFilters } from './dorsal-filters.client';

/**
 * Mobile entry point for the filters: a full-width "Filtros" button that opens
 * the same <DorsalFilters /> inside a side sheet. On lg+ the sidebar is shown
 * directly and this trigger is hidden, so filters never push the grid down on
 * small screens.
 */
export function DorsalFiltersMobile() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full lg:hidden">
          <SlidersHorizontal />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto">
        <SheetTitle className="sr-only">Filtros</SheetTitle>
        <SheetDescription className="sr-only">
          Filtra los dorsales por carrera, distancia, precio, ubicación y método de pago.
        </SheetDescription>
        <DorsalFilters />
        <SheetClose asChild>
          <Button className="mt-6 w-full">Ver resultados</Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
