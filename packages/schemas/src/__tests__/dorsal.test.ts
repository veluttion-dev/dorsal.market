import { describe, expect, it } from 'vitest';
import {
  Distance,
  DorsalDetail,
  DorsalListResponse,
  PaymentMethod,
  PublishDorsalInput,
  SearchDorsalsQuery,
} from '../dorsal';

describe('Distance enum', () => {
  it('accepts known distances', () => {
    expect(Distance.parse('10k')).toBe('10k');
  });
  it('rejects unknown distances', () => {
    expect(() => Distance.parse('marathon')).toThrow();
  });
});

describe('PaymentMethod enum', () => {
  it('rejects cash', () => {
    expect(() => PaymentMethod.parse('cash')).toThrow();
  });
});

describe('DorsalDetail', () => {
  it('parses a fully populated dorsal from Postman seed', () => {
    const sample = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      seller_id: '550e8400-e29b-41d4-a716-446655440001',
      photo_url: 'https://example.com/p.jpg',
      race_name: 'San Silvestre Madrid',
      race_date: '2026-12-31',
      location: 'Madrid',
      distance: '10k',
      bib_number: '1234',
      start_corral: 'B',
      included_items: { chip: true, shirt: true, bag: false, medal: true, refreshments: false },
      price_amount: 45,
      payment_methods: ['bizum', 'paypal'],
      contact_phone: '612345678',
      contact_email: 'seller@example.com',
      sale_reason: 'I broke my ankle',
      status: 'published',
      created_at: '2026-04-19T20:00:00Z',
      updated_at: '2026-04-19T20:00:00Z',
    };
    const parsed = DorsalDetail.parse(sample);
    expect(parsed.distance).toBe('10k');
  });

  it('coerces price_amount from string (backend may serialize Decimal as string)', () => {
    const parsed = DorsalDetail.parse({
      id: '550e8400-e29b-41d4-a716-446655440010',
      seller_id: '550e8400-e29b-41d4-a716-446655440001',
      photo_url: 'https://example.com/p.jpg',
      race_name: 'Test',
      race_date: null,
      location: 'Madrid',
      distance: '10k',
      bib_number: null,
      start_corral: null,
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      price_amount: '45.00',
      payment_methods: ['bizum'],
      contact_phone: null,
      contact_email: null,
      sale_reason: null,
      status: 'published',
      created_at: '2026-04-19T20:00:00Z',
      updated_at: '2026-04-19T20:00:00Z',
    });
    expect(parsed.price_amount).toBe(45);
  });
});

describe('DorsalListResponse', () => {
  it('requires items + pagination fields', () => {
    const empty = { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
    expect(DorsalListResponse.parse(empty)).toEqual(empty);
  });
});

describe('PublishDorsalInput', () => {
  it('accepts a draft (publish=false) with only photo_url', () => {
    expect(PublishDorsalInput.parse({ publish: false, photo_url: 'https://x/y.jpg' })).toMatchObject({
      publish: false,
    });
  });

  it('rejects publish=true without required fields', () => {
    expect(() => PublishDorsalInput.parse({ publish: true, photo_url: 'https://x/y.jpg' })).toThrow();
  });
});

describe('SearchDorsalsQuery', () => {
  it('coerces numeric strings (price_min/max from URL)', () => {
    const q = SearchDorsalsQuery.parse({ price_min: '20', page: '2' });
    expect(q.price_min).toBe(20);
    expect(q.page).toBe(2);
  });

  it('rejects sort_by=relevance', () => {
    expect(() => SearchDorsalsQuery.parse({ sort_by: 'relevance' })).toThrow();
  });
});
