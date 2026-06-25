import { describe, expect, it, vi } from 'vitest';
import { startMswBrowser } from '../msw-browser';

describe('startMswBrowser', () => {
  it('starts only one worker when development initialization runs twice', async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    const setupWorker = vi.fn(() => ({ start }));
    const loadSetupWorker = vi.fn().mockResolvedValue({ setupWorker });
    const mocked: Array<'reviews'> = ['reviews'];

    await Promise.all([
      startMswBrowser(mocked, loadSetupWorker),
      startMswBrowser(mocked, loadSetupWorker),
    ]);

    expect(loadSetupWorker).toHaveBeenCalledTimes(1);
    expect(setupWorker).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
