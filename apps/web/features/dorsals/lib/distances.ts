import type { Distance } from '@dorsal/schemas';

const LABELS: Record<Distance, string> = {
  '5k': '5K',
  '10k': '10K',
  '21k': '21K',
  '42k': '42K',
  trail: 'Trail',
  ultra: 'Ultra',
};

export function distanceLabel(d: Distance): string {
  return LABELS[d];
}
