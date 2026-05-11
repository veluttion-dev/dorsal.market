import { CreateReviewInput, type Review } from '@dorsal/schemas';
import { http, HttpResponse } from 'msw';
import { mockStore } from './store';

const BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? 'http://localhost:8000';

export const reviewsHandlers = [
  http.post(`${BASE}/api/v1/reviews`, async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) return HttpResponse.json({ detail: 'unauthenticated' }, { status: 401 });
    const body = CreateReviewInput.parse(await request.json());
    const review: Review = {
      id: crypto.randomUUID(),
      transaction_id: body.transaction_id,
      reviewer_id: userId,
      reviewee_id: '550e8400-e29b-41d4-a716-446655440002',
      rating: body.rating,
      comment: body.comment ?? null,
      created_at: new Date().toISOString(),
    };
    mockStore.reviews.set(review.id, review);
    return HttpResponse.json(review, { status: 201 });
  }),

  http.get(`${BASE}/api/v1/users/:id/reviews`, ({ params }) => {
    const list = [...mockStore.reviews.values()].filter((r) => r.reviewee_id === params.id);
    return HttpResponse.json(list);
  }),
];
