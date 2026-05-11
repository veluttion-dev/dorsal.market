import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '@dorsal/schemas';
import { computeTimelineProgress } from '../timeline';

describe('computeTimelineProgress', () => {
  const baseSteps: TimelineStep[] = [
    { step: 'payment_held', completed: true, completed_at: '2026-05-01T10:00:00Z' },
    { step: 'data_sent', completed: true, completed_at: '2026-05-01T10:05:00Z' },
    { step: 'change_in_progress', completed: false, completed_at: null },
    { step: 'change_confirmed', completed: false, completed_at: null },
    { step: 'released', completed: false, completed_at: null },
  ];

  it('returns the index of the next pending step', () => {
    expect(computeTimelineProgress(baseSteps)).toEqual({
      currentIndex: 2,
      percent: 40,
      isComplete: false,
    });
  });

  it('marks complete when all steps done', () => {
    const done = baseSteps.map((s) => ({ ...s, completed: true }));
    expect(computeTimelineProgress(done)).toEqual({
      currentIndex: 5,
      percent: 100,
      isComplete: true,
    });
  });
});
