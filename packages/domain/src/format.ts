export function formatPrice(amount: number, locale = 'es-ES', currency = 'EUR'): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
    useGrouping: 'always',
  } as unknown as Intl.NumberFormatOptions);
  return fmt.format(amount);
}

export function formatRaceDate(isoDate: string | null, locale = 'es-ES'): string {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
