import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest does not run with `globals: true`, so Testing Library's automatic
// afterEach cleanup is not registered — do it explicitly here.
afterEach(cleanup);
