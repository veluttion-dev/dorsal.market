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
import { useState } from 'react';
import { toast } from 'sonner';

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MIN_MESSAGE_LENGTH = 20;

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback() {
    const trimmedMessage = message.trim();
    const trimmedEmail = contactEmail.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError('Escribe al menos 20 caracteres para que el feedback sea util.');
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
        toast.error('Ahora mismo no podemos recibir mas feedback. Intentalo mas tarde.');
        return;
      }

      if (!response.ok) {
        toast.error('No se pudo enviar el feedback. Intentalo de nuevo.');
        return;
      }

      toast.success('Gracias, hemos recibido tu feedback');
      setMessage('');
      setContactEmail('');
      onOpenChange(false);
    } catch {
      toast.error('No se pudo enviar el feedback. Intentalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Ayudanos a mejorar dorsal.market con feedback concreto: errores que encuentres,
            partes del proceso que no se entienden, pasos que te resulten confusos al comprar o
            vender, o ideas que faciliten completar una tarea.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="feedback-message">Mensaje</Label>
          <textarea
            id="feedback-message"
            className="min-h-32 rounded-md border border-border bg-bg-elevated p-3 text-sm shadow-sm outline-none placeholder:text-text-muted focus:ring-1 focus:ring-coral disabled:cursor-not-allowed disabled:opacity-50"
            value={message}
            placeholder='Ejemplo: "Al publicar un dorsal no entiendo que datos vera el comprador..."'
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
          <Label htmlFor="feedback-contact-email">Email de contacto opcional</Label>
          <Input
            id="feedback-contact-email"
            type="email"
            value={contactEmail}
            aria-describedby="feedback-contact-email-helper"
            disabled={submitting}
            onChange={(event) => setContactEmail(event.currentTarget.value)}
          />
          <p id="feedback-contact-email-helper" className="text-sm text-text-secondary">
            Solo lo usaremos si necesitamos entender mejor tu feedback o responderte.
          </p>
        </div>

        <Button type="button" disabled={submitting} onClick={submitFeedback}>
          {submitting ? 'Enviando...' : 'Enviar feedback'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
