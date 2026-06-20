import type { Distance } from '@dorsal/schemas';

const LABELS: Record<Distance, string> = {
  '5k': '5K',
  '10k': '10K',
  '21k': '21K',
  '42k': '42K',
  ultra: 'Ultra',
  trail: 'Trail',
  caminata: 'Caminata',
  triatlon: 'Triatlón',
  ironman: 'Iron Man',
  ciclismo: 'Ciclismo',
  other: 'Otra',
};

export function distanceLabel(d: Distance): string {
  return LABELS[d];
}
