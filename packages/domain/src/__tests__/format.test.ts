import { describe, expect, it } from 'vitest';
import { formatPrice, formatRaceDate } from '../format';

// Intl in Node 20+ uses U+202F (NARROW NO-BREAK SPACE) between numbers and currency symbols.
// Normalize whitespace so the tests aren't tied to that quirk.
const norm = (s: string) => s.replace(/\s+/g, ' ');

describe('formatPrice', () => {
  it('formats whole euros without decimals in es-ES locale', () => {
    expect(norm(formatPrice(45))).toBe('45 €');
  });

  it('formats fractional euros with two decimals', () => {
    expect(norm(formatPrice(45.5))).toBe('45,50 €');
    expect(norm(formatPrice(1200.99))).toBe('1.200,99 €');
  });

  it('respects locale override (en-US)', () => {
    expect(norm(formatPrice(45, 'en-US'))).toBe('€45');
    expect(norm(formatPrice(45.5, 'en-US'))).toBe('€45.50');
  });
});

describe('formatRaceDate', () => {
  it('formats ISO date as "01 dic 2026" in Spanish', () => {
    expect(formatRaceDate('2026-12-01')).toBe('01 dic 2026');
  });
  it('returns dash for null', () => {
    expect(formatRaceDate(null)).toBe('—');
  });
});
