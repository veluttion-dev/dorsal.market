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
    expect(Distance.parse('ultra')).toBe('ultra');
    expect(Distance.parse('trail')).toBe('trail');
    expect(Distance.parse('ciclismo')).toBe('ciclismo');
    expect(Distance.parse('other')).toBe('other');
  });
  it('rejects unknown distances', () => {
    expect(() => Distance.parse('marathon')).toThrow();
    expect(() => Distance.parse('20k')).toThrow();
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
      purchase_requirements: {
        requires_estimated_time: true,
        requires_shirt_size: false,
        requires_emergency_contact: true,
        fixed_shirt_size: 'M',
      },
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
    expect(parsed.purchase_requirements.fixed_shirt_size).toBe('M');
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

  it('accepts backend datetime values without timezone offsets', () => {
    const parsed = DorsalDetail.parse({
      id: '550e8400-e29b-41d4-a716-446655440010',
      seller_id: '550e8400-e29b-41d4-a716-446655440001',
      photo_url: 'https://example.com/p.jpg',
      race_name: 'San Silvestre Madrid',
      race_date: '2027-12-31',
      location: 'Madrid',
      distance: '10k',
      bib_number: '1274',
      start_corral: null,
      included_items: { chip: true, shirt: true, bag: true, medal: false, refreshments: true },
      price_amount: '35.00',
      payment_methods: ['bizum', 'card'],
      contact_phone: null,
      contact_email: 'seller@example.com',
      sale_reason: 'No puedo viajar ese fin de semana.',
      status: 'published',
      created_at: '2026-05-21T13:25:02.328044',
      updated_at: '2026-05-21T13:25:02.328044',
    });

    expect(parsed.created_at).toBe('2026-05-21T13:25:02.328044');
  });
});

describe('DorsalListResponse', () => {
  it('requires items + pagination fields', () => {
    const empty = { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
    expect(DorsalListResponse.parse(empty)).toEqual(empty);
  });

  it('defaults public list items without status to published', () => {
    const parsed = DorsalListResponse.parse({
      items: [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          photo_url: 'https://example.com/p.jpg',
          race_name: 'San Silvestre Madrid',
          race_date: '2026-12-31',
          location: 'Madrid',
          distance: '10k',
          price_amount: '45.00',
          payment_methods: ['bizum', 'paypal'],
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });

    expect(parsed.items[0]?.status).toBe('published');
  });
});

describe('PublishDorsalInput', () => {
  it('accepts a draft (publish=false) with only photo_url', () => {
    expect(
      PublishDorsalInput.parse({ publish: false, photo_url: 'https://x/y.jpg' }),
    ).toMatchObject({
      publish: false,
    });
  });

  it('normalizes empty form fields before validating optional draft data', () => {
    const parsed = PublishDorsalInput.parse({
      publish: false,
      photo_url: 'https://x/y.jpg',
      race_name: '',
      bib_number: '',
      race_date: '',
      location: '',
      distance: '',
      start_corral: '',
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      price_amount: Number.NaN,
      payment_methods: [],
      contact: { phone: '', email: '', phone_visible: true, email_visible: true },
      sale_reason: '',
    });

    expect(parsed).toMatchObject({
      publish: false,
      contact: { phone: null, email: null, phone_visible: true, email_visible: true },
      start_corral: null,
      sale_reason: null,
    });
    expect(parsed.race_name).toBeUndefined();
    expect(parsed.price_amount).toBeUndefined();
  });

  it('accepts publishing with phone contact and an empty email input', () => {
    const parsed = PublishDorsalInput.parse({
      publish: true,
      photo_url: 'https://example.com/race.jpg',
      race_name: 'Madrid Corre',
      bib_number: '777',
      race_date: '2027-04-15',
      location: 'Madrid',
      distance: '10k',
      included_items: { chip: true, shirt: false, bag: false, medal: true, refreshments: false },
      price_amount: 35,
      payment_methods: ['bizum'],
      contact: { phone: '611111111', email: '', phone_visible: true, email_visible: false },
      sale_reason: 'Schedule conflict',
    });

    expect(parsed.contact?.email).toBeNull();
  });

  it('rejects publish=true without required fields', () => {
    expect(() =>
      PublishDorsalInput.parse({ publish: true, photo_url: 'https://x/y.jpg' }),
    ).toThrow();
  });

  it('reports missing publish fields on their own paths', () => {
    const result = PublishDorsalInput.safeParse({ publish: true, photo_url: 'https://x/y.jpg' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('race_name');
      expect(paths).toContain('race_date');
      expect(paths).toContain('payment_methods');
    }
  });

  it('rejects publishing with fixed and requested shirt size together', () => {
    expect(() =>
      PublishDorsalInput.parse({
        publish: true,
        photo_url: 'https://example.com/race.jpg',
        race_name: 'Madrid Corre',
        race_date: '2027-04-15',
        location: 'Madrid',
        distance: '10k',
        included_items: { chip: true, shirt: true, bag: false, medal: false, refreshments: false },
        purchase_requirements: {
          requires_estimated_time: false,
          requires_shirt_size: true,
          requires_emergency_contact: false,
          fixed_shirt_size: 'M',
        },
        price_amount: 35,
        payment_methods: ['card'],
        contact: { phone: '611111111', email: '', phone_visible: true, email_visible: false },
      }),
    ).toThrow(/talla fija/i);
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
