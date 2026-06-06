import type { SearchDorsalsQuery } from '@dorsal/schemas';
import { describe, expect, it } from 'vitest';
import { parseFiltersFromSearchParams, serializeFiltersToSearchParams } from '../lib/filters-url';

describe('parseFiltersFromSearchParams', () => {
  it('parses single distance', () => {
    const sp = new URLSearchParams('distance=10k');
    expect(parseFiltersFromSearchParams(sp)).toMatchObject({ distance: ['10k'] });
  });

  it('parses multiple distances', () => {
    const sp = new URLSearchParams('distance=10k&distance=42k');
    expect(parseFiltersFromSearchParams(sp).distance).toEqual(['10k', '42k']);
  });

  it('coerces price_min/price_max to numbers', () => {
    const sp = new URLSearchParams('price_min=20&price_max=50');
    const out = parseFiltersFromSearchParams(sp);
    expect(out.price_min).toBe(20);
    expect(out.price_max).toBe(50);
  });

  it('drops invalid values while keeping valid filters', () => {
    const sp = new URLSearchParams('distance=10k&distance=marathon&sort_by=relevance');
    expect(parseFiltersFromSearchParams(sp)).toEqual({ distance: ['10k'] });
  });

  it('parses page and page_size with defaults absent', () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams('page=2&page_size=12'))).toMatchObject({
      page: 2,
      page_size: 12,
    });
  });

  it('parses date and sort filters used by shared URLs', () => {
    expect(
      parseFiltersFromSearchParams(
        new URLSearchParams('date_from=2027-01-01&date_to=2027-12-31&sort_by=price&sort_order=asc'),
      ),
    ).toMatchObject({
      date_from: '2027-01-01',
      date_to: '2027-12-31',
      sort_by: 'price',
      sort_order: 'asc',
    });
  });
});

describe('serializeFiltersToSearchParams', () => {
  it('omits undefined fields', () => {
    expect(serializeFiltersToSearchParams({ race_name: 'madrid' }).toString()).toBe(
      'race_name=madrid',
    );
  });

  it('repeats distance for multi-select', () => {
    const sp = serializeFiltersToSearchParams({ distance: ['10k', '42k'] });
    expect(sp.getAll('distance')).toEqual(['10k', '42k']);
  });

  it('round-trips', () => {
    const filters: SearchDorsalsQuery = {
      race_name: 'valencia',
      distance: ['10k', '21k'],
      price_max: 80,
      sort_by: 'price',
      sort_order: 'asc',
    };
    const back = parseFiltersFromSearchParams(serializeFiltersToSearchParams(filters));
    expect(back).toMatchObject(filters);
  });
});
