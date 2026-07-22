import { describe, expect, it } from 'vitest';
import { UploadsHttpAdapter, UploadsMockAdapter } from '../adapters';
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
      notifications: expect.any(Object),
      reviews: expect.any(Object),
      uploads: expect.any(Object),
    });
  });

  it('uses real uploads when catalog dorsals are real', () => {
    const api = createApi({
      baseUrl: 'http://test',
      getUserId: () => null,
      realModules: 'dorsals,users',
    });

    expect(api.uploads).toBeInstanceOf(UploadsHttpAdapter);
  });

  it('keeps uploads mocked when catalog dorsals are mocked', () => {
    const api = createApi({ baseUrl: 'http://test', getUserId: () => null });

    expect(api.uploads).toBeInstanceOf(UploadsMockAdapter);
  });
});
