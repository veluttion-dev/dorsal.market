import { describe, expect, it } from 'vitest';
import { createApi, deriveMockedModules, parseRealModules } from '../factory';

describe('parseRealModules', () => {
  it('returns empty for undefined', () => {
    expect(parseRealModules(undefined)).toEqual([]);
  });
  it('parses csv ignoring whitespace', () => {
    expect(parseRealModules('dorsals, users')).toEqual(['dorsals', 'users']);
  });
  it('drops unknown modules', () => {
    expect(parseRealModules('dorsals,foo,reviews')).toEqual(['dorsals', 'reviews']);
  });
});

describe('deriveMockedModules', () => {
  it('returns the complement of real modules', () => {
    expect(deriveMockedModules(['dorsals'])).toEqual(['users', 'transactions', 'reviews']);
    expect(deriveMockedModules([])).toEqual(['dorsals', 'users', 'transactions', 'reviews']);
  });
});

describe('createApi', () => {
  it('produces an api object with all ports', () => {
    const api = createApi({ baseUrl: 'http://test', getUserId: () => null });
    expect(api).toMatchObject({
      dorsals: expect.objectContaining({ search: expect.any(Function) }),
      users: expect.any(Object),
      transactions: expect.any(Object),
      reviews: expect.any(Object),
      uploads: expect.any(Object),
    });
  });
});
