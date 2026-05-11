import { CreateReviewInput, Review } from '@dorsal/schemas';
import { z } from 'zod';
import type { HttpClient } from '../http';
import type { ReviewsPort } from '../ports';

export class ReviewsHttpAdapter implements ReviewsPort {
  constructor(private http: HttpClient) {}

  async create(input: CreateReviewInput): Promise<Review> {
    return Review.parse(
      await this.http.post('api/v1/reviews', { body: CreateReviewInput.parse(input) }),
    );
  }

  async listForUser(userId: string): Promise<Review[]> {
    return z.array(Review).parse(await this.http.get(`api/v1/users/${userId}/reviews`));
  }
}
