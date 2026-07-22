import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubmitProof } from '../use-submit-proof';

const mocks = vi.hoisted(() => ({
  uploadProofMultipart: vi.fn(),
  getProofUploadUrl: vi.fn(),
  submitProofUrl: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  useApi: () => ({
    transactions: {
      uploadProofMultipart: mocks.uploadProofMultipart,
      getProofUploadUrl: mocks.getProofUploadUrl,
      submitProofUrl: mocks.submitProofUrl,
    },
  }),
}));

describe('useSubmitProof', () => {
  beforeEach(() => {
    mocks.uploadProofMultipart.mockReset();
    mocks.getProofUploadUrl.mockReset();
    mocks.submitProofUrl.mockReset();
  });

  it('uploads seller proof through the backend multipart endpoint', async () => {
    mocks.uploadProofMultipart.mockResolvedValueOnce({ processed: true });
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const file = new File(['proof-bytes'], 'proof.png', { type: 'image/png' });

    const { result } = renderHook(() => useSubmitProof('tx-1'), { wrapper });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.uploadProofMultipart).toHaveBeenCalledWith('tx-1', file);
    expect(mocks.getProofUploadUrl).not.toHaveBeenCalled();
    expect(mocks.submitProofUrl).not.toHaveBeenCalled();
  });
});
