'use client';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes can't know the theme during SSR. Until mounted, render a
  // theme-agnostic label so the server HTML and the first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const next = resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? `Cambiar a ${next}` : 'Cambiar tema'}
      onClick={() => setTheme(next)}
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  );
}
