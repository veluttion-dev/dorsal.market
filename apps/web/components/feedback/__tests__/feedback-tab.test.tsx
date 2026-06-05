import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FeedbackTab } from '../feedback-tab.client';

describe('FeedbackTab', () => {
  it('renders a side tab with an accessible name', () => {
    render(<FeedbackTab />);

    const tab = screen.getByRole('button', { name: /enviar feedback/i });

    expect(tab).toHaveTextContent('Feedback');
    expect(tab).toHaveClass('h-11');
  });

  it('opens the feedback dialog', async () => {
    const user = userEvent.setup();
    render(<FeedbackTab />);
    const tab = screen.getByRole('button', { name: /enviar feedback/i });

    await user.click(tab);

    expect(tab).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /enviar feedback/i })).toBeInTheDocument();
  });

  it('returns focus to the tab when the dialog closes', async () => {
    const user = userEvent.setup();
    render(<FeedbackTab />);

    await user.click(screen.getByRole('button', { name: /enviar feedback/i }));
    await user.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(screen.getByRole('button', { name: /enviar feedback/i })).toHaveFocus();
  });
});
