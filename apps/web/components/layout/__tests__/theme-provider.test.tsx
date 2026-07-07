import { ThemeProvider, useTheme } from '@/components/layout/theme-provider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';

function ThemeProbe() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme}
    </button>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  test('applies the default theme without rendering script tags', () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(container.querySelector('script')).toBeNull();
  });

  test('toggles and persists the selected theme', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'dark' }));

    expect(screen.getByRole('button', { name: 'light' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
