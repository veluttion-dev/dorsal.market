import type { CreateReviewInput, Review } from '@dorsal/schemas';

export interface ReviewsPort {
  create(input: CreateReviewInput): Promise<Review>;
  listForUser(userId: string): Promise<Review[]>;
}
