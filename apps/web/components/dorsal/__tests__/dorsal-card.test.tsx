import type { DorsalSummary } from '@dorsal/schemas';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DorsalCard } from '../dorsal-card';

const sample: DorsalSummary = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  race_name: 'San Silvestre Madrid',
  race_date: '2026-12-31',
  location: 'Madrid',
  distance: '10k',
  price_amount: 45,
  payment_methods: ['bizum', 'paypal'],
  photo_url: 'https://example.com/p.jpg',
  status: 'published',
};

describe('DorsalCard', () => {
  it('renders race info, distance badge, formatted price and payment methods', () => {
    render(<DorsalCard dorsal={sample} />);
    expect(screen.getByText('San Silvestre Madrid')).toBeInTheDocument();
    // Date + location line (race_name also contains "Madrid", so match the full line).
    expect(screen.getByText(/31 dic 2026 · Madrid/)).toBeInTheDocument();
    expect(screen.getByText('10K')).toBeInTheDocument();
    // formatPrice uses a narrow no-break space before the symbol — match loosely.
    expect(screen.getByText(/45\s*€/)).toBeInTheDocument();
    expect(screen.getByText('Bizum')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('links to detail page', () => {
    render(<DorsalCard dorsal={sample} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dorsales/${sample.id}`);
  });
});
