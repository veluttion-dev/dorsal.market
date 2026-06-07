'use client';
import { useApi } from '@/lib/api-client';
import type { CreateReviewInput } from '@dorsal/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateReview() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => api.reviews.create(input),
    onSuccess: (review) => {
      void qc.invalidateQueries({ queryKey: ['reviews', 'user', review.reviewee_id] });
    },
  });
}
