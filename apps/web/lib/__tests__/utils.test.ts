import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges classes and dedupes Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-coral', false && 'hidden', 'text-coral')).toBe('text-coral');
  });
});
