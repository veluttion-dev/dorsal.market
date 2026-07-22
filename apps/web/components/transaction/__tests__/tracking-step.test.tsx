import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrackingStep } from '../tracking-step';

describe('TrackingStep', () => {
  it('marks backend timeline steps without completion date as pending', () => {
    render(
      <TrackingStep
        event={{
          key: 'payment_held',
          label: 'Pago retenido',
          completed_at: null,
        }}
      />,
    );

    expect(screen.getByText('Pago retenido')).toBeVisible();
    expect(screen.getByText('Paso pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Paso completado')).not.toBeInTheDocument();
  });

  it('marks backend timeline steps with completion date as completed', () => {
    render(
      <TrackingStep
        event={{
          key: 'payment_held',
          label: 'Pago retenido',
          completed_at: '2026-07-19T19:17:16Z',
        }}
      />,
    );

    expect(screen.getByText('Paso completado')).toBeInTheDocument();
    expect(screen.queryByText('Paso pendiente')).not.toBeInTheDocument();
  });
});
