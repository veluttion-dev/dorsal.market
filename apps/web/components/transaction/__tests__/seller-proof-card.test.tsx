import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SellerProofCard } from '../seller-proof-card';

describe('SellerProofCard', () => {
  it('links buyer to the seller transfer proof when proof exists', () => {
    render(<SellerProofCard proofUrl="https://storage.example/proofs/proof.pdf" />);

    expect(screen.getByRole('heading', { name: /prueba del vendedor/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /ver prueba/i })).toHaveAttribute(
      'href',
      'https://storage.example/proofs/proof.pdf',
    );
  });

  it('does not render when no proof exists yet', () => {
    const { container } = render(<SellerProofCard proofUrl={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
