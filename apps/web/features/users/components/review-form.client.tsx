'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateReview } from '@/features/users/hooks/use-create-review';
import type { TransactionStatus } from '@dorsal/schemas';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

const REVIEWABLE_STATUSES: TransactionStatus[] = ['RELEASED_TO_SELLER'];

export function isReviewableStatus(status: TransactionStatus) {
  return REVIEWABLE_STATUSES.includes(status);
}

export function ReviewForm({
  transactionId,
  status,
}: {
  transactionId: string;
  status: TransactionStatus;
}) {
  const t = useTranslations('review');
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isReviewableStatus(status)) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createReview.mutateAsync({
      transaction_id: transactionId,
      rating,
      comment: comment.trim() || undefined,
    });
    toast.success(t('saved_toast'));
  }

  return (
    <form className="rounded-lg border border-border bg-bg-card p-5" onSubmit={submit}>
      <h2 className="font-semibold">{t('title')}</h2>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <Button
            key={value}
            type="button"
            variant={rating === value ? 'default' : 'outline'}
            className="h-10 w-10 p-0"
            onClick={() => setRating(value)}
          >
            <Star className={rating >= value ? 'fill-current' : ''} />
            <span className="sr-only">{value}</span>
          </Button>
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="review-comment">{t('comment_label')}</Label>
        <Input
          id="review-comment"
          value={comment}
          maxLength={500}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>
      <Button type="submit" className="mt-4 w-full" disabled={createReview.isPending}>
        {t('save')}
      </Button>
    </form>
  );
}
