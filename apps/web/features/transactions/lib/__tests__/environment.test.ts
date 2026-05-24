import { describe, expect, it } from 'vitest';
import { isTransactionsMocked } from '../environment';

describe('transaction environment helpers', () => {
  it('detects mocked transactions when transactions is absent from real modules', () => {
    expect(isTransactionsMocked('dorsals,users')).toBe(true);
  });

  it('detects real transactions when present in the csv', () => {
    expect(isTransactionsMocked('dorsals,transactions')).toBe(false);
  });
});
