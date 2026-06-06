import type { Distance } from '@dorsal/schemas';
import { describe, expect, it } from 'vitest';
import { distanceLabel } from '../lib/distances';

describe('distanceLabel', () => {
  it.each<[Distance, string]>([
    ['5k', '5K'],
    ['10k', '10K'],
    ['21k', '21K'],
    ['42k', '42K'],
    ['trail', 'Trail'],
    ['ultra', 'Ultra'],
  ])('formats %s as %s', (input, expected) => {
    expect(distanceLabel(input)).toBe(expected);
  });
});
