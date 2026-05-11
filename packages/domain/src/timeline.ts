import type { TimelineStep } from '@dorsal/schemas';

export type TimelineProgress = {
  currentIndex: number;
  percent: number;
  isComplete: boolean;
};

export function computeTimelineProgress(steps: readonly TimelineStep[]): TimelineProgress {
  const completed = steps.filter((s) => s.completed).length;
  const currentIndex = completed;
  const percent = Math.round((completed / steps.length) * 100);
  return { currentIndex, percent, isComplete: completed === steps.length };
}
