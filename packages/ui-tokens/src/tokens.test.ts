import { describe, expect, it } from 'vitest';
import { colors, fonts, radius, shadows, transitions } from './index';

describe('design tokens', () => {
  it('exposes coral palette with required shades', () => {
    expect(colors.coral).toMatchObject({
      DEFAULT: expect.any(String),
      hover: expect.any(String),
      glow: expect.any(String),
      subtle: expect.any(String),
    });
  });

  it('exposes olive palette with required shades', () => {
    expect(colors.olive).toMatchObject({
      DEFAULT: expect.any(String),
      dark: expect.any(String),
      subtle: expect.any(String),
    });
  });

  it('exposes background, text and border tokens as CSS-var references', () => {
    expect(colors.bg.primary).toMatch(/^var\(--/);
    expect(colors.text.primary).toMatch(/^var\(--/);
    expect(colors.border.DEFAULT).toMatch(/^var\(--/);
  });

  it('exposes radius scale (sm,md,lg,xl)', () => {
    expect(radius).toMatchObject({
      sm: expect.any(String),
      md: expect.any(String),
      lg: expect.any(String),
      xl: expect.any(String),
    });
  });

  it('exposes font family CSS variables', () => {
    expect(fonts.sans).toBe('var(--font-outfit)');
    expect(fonts.mono).toBe('var(--font-space-mono)');
  });

  it('exposes shadows and transitions', () => {
    expect(shadows.card).toMatch(/var\(--/);
    expect(transitions.DEFAULT).toMatch(/cubic-bezier|ease/);
  });
});
