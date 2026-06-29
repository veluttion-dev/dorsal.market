'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MIN_MESSAGE_LENGTH = 20;

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const t = useTranslations('feedback');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback() {
    const trimmedMessage = message.trim();
    const trimmedEmail = contactEmail.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError(t('min_length_error'));
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          contactEmail: trimmedEmail || undefined,
          pageUrl: window.location.href,
        }),
      });

      if (response.status === 429) {
        toast.error(t('rate_limited'));
        return;
      }

      if (!response.ok) {
        toast.error(t('error'));
        return;
      }

      toast.success(t('success'));
      setMessage('');
      setContactEmail('');
      onOpenChange(false);
    } catch {
      toast.error(t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="feedback-message">{t('message_label')}</Label>
          <textarea
            id="feedback-message"
            className="min-h-32 rounded-md border border-border bg-bg-elevated p-3 text-sm shadow-sm outline-none placeholder:text-text-muted focus:ring-1 focus:ring-coral disabled:cursor-not-allowed disabled:opacity-50"
            value={message}
            placeholder={t('message_placeholder')}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'feedback-message-error' : undefined}
            disabled={submitting}
            onChange={(event) => {
              setMessage(event.currentTarget.value);
              if (error) setError('');
            }}
          />
          {error ? (
            <p id="feedback-message-error" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="feedback-contact-email">{t('email_label')}</Label>
          <Input
            id="feedback-contact-email"
            type="email"
            value={contactEmail}
            aria-describedby="feedback-contact-email-helper"
            disabled={submitting}
            onChange={(event) => setContactEmail(event.currentTarget.value)}
          />
          <p id="feedback-contact-email-helper" className="text-sm text-text-secondary">
            {t('email_helper')}
          </p>
        </div>

        <Button type="button" disabled={submitting} onClick={submitFeedback}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
