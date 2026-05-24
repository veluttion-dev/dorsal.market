import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuyerDataNotice } from '../buyer-data-notice.client';

describe('BuyerDataNotice', () => {
  it('explains that profile data will be used by the transfer flow', () => {
    render(<BuyerDataNotice isAuthenticated />);

    expect(screen.getByText(/datos de tu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revisar perfil/i })).toHaveAttribute(
      'href',
      '/perfil',
    );
  });

  it('asks anonymous users to sign in once feat usuarios owns auth', () => {
    render(<BuyerDataNotice isAuthenticated={false} />);

    expect(screen.getByText(/cuando el login este listo/i)).toBeInTheDocument();
  });
});
