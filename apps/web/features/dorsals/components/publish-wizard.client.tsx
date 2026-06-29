'use client';
import { FormSection } from '@/components/form/form-section';
import { PhotoUpload } from '@/components/form/photo-upload.client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePublishDorsal } from '@/features/dorsals/hooks/use-publish-dorsal';
import { distanceLabel } from '@/features/dorsals/lib/distances';
import {
  clearPublishDraft,
  loadPublishDraft,
  savePublishDraft,
} from '@/features/dorsals/lib/publish-draft-storage';
import { Distance, PaymentMethod, PublishDorsalInput } from '@dorsal/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CreditCard, MapPin, Phone, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormInput = z.input<typeof PublishDorsalInput>;
type FormValues = z.output<typeof PublishDorsalInput>;

const distances: Distance[] = [...Distance.options];
const payments: PaymentMethod[] = [...PaymentMethod.options];
const itemKeys = ['chip', 'shirt', 'bag', 'medal', 'refreshments'] as const;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

export function PublishWizard() {
  const t = useTranslations('publish_wizard');
  const router = useRouter();
  const publish = usePublishDorsal();
  const persistedDraft = loadPublishDraft();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(PublishDorsalInput),
    defaultValues: {
      publish: true,
      photo_url: '',
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      payment_methods: [],
      contact: { phone: '', email: '', phone_visible: true, email_visible: true },
      ...persistedDraft,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      savePublishDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  function publishValues(values: FormValues, publishMode: boolean) {
    const payload = { ...values, publish: publishMode };
    publish.mutate(payload, {
      onSuccess: ({ dorsal_id }) => {
        clearPublishDraft();
        toast.success(publishMode ? t('toast_published') : t('toast_draft'));
        router.push(`/dorsales/${dorsal_id}`);
      },
      onError: (e) => toast.error(e.message ?? t('toast_error')),
    });
  }

  function submitAsDraft() {
    form.setValue('publish', false);
    void form.handleSubmit((values) => publishValues(values, false))();
  }

  function submitAsPublished() {
    form.setValue('publish', true);
    void form.handleSubmit((values) => publishValues(values, true))();
  }

  const itemLabels = {
    chip: t('item_chip'),
    shirt: t('item_shirt'),
    bag: t('item_bag'),
    medal: t('item_medal'),
    refreshments: t('item_refreshments'),
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    bizum: t('pay_bizum'),
    paypal: t('pay_paypal'),
    card: t('pay_card'),
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submitAsPublished();
      }}
      className="space-y-5"
    >
      <FormSection
        icon={<Camera className="h-4 w-4" />}
        title={t('step1_title')}
        badge={t('step1_badge')}
      >
        <PhotoUpload
          value={form.watch('photo_url') || null}
          onChange={(url) => form.setValue('photo_url', url ?? '', { shouldValidate: true })}
        />
        <FieldError message={form.formState.errors.photo_url?.message} />
      </FormSection>

      <FormSection
        icon={<Trophy className="h-4 w-4" />}
        title={t('step2_title')}
        badge={t('step2_badge')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="race_name">{t('label_race_name')}</Label>
            <Input id="race_name" {...form.register('race_name')} />
            <FieldError message={form.formState.errors.race_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bib_number">{t('label_bib_number')}</Label>
            <Input id="bib_number" {...form.register('bib_number')} />
            <FieldError message={form.formState.errors.bib_number?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="race_date">{t('label_race_date')}</Label>
            <Input id="race_date" type="date" {...form.register('race_date')} />
            <FieldError message={form.formState.errors.race_date?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">{t('label_location')}</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder={t('location_placeholder')}
            />
            <FieldError message={form.formState.errors.location?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distance">{t('label_distance')}</Label>
            <select
              id="distance"
              {...form.register('distance')}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <option value="">{t('label_distance_placeholder')}</option>
              {distances.map((d) => (
                <option key={d} value={d}>
                  {distanceLabel(d)}
                </option>
              ))}
            </select>
            <FieldError message={form.formState.errors.distance?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_corral">{t('label_start_corral')}</Label>
            <Input id="start_corral" {...form.register('start_corral')} />
            <FieldError message={form.formState.errors.start_corral?.message} />
          </div>
        </div>
        <FieldError message={form.formState.errors.included_items?.message} />
      </FormSection>

      <FormSection
        icon={<MapPin className="h-4 w-4" />}
        title={t('step3_title')}
        badge={t('step3_badge')}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {itemKeys.map((k) => (
            <label
              key={k}
              htmlFor={`item-${k}`}
              className="flex items-center gap-2 rounded-md border border-border bg-bg-elevated px-3 py-2.5 text-sm"
            >
              <Checkbox
                id={`item-${k}`}
                checked={form.watch(`included_items.${k}`)}
                onCheckedChange={(c) => form.setValue(`included_items.${k}`, c === true)}
              />
              {itemLabels[k]}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection
        icon={<CreditCard className="h-4 w-4" />}
        title={t('step4_title')}
        badge={t('step4_badge')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price_amount">{t('label_price')}</Label>
            <Input
              id="price_amount"
              type="number"
              step="0.01"
              {...form.register('price_amount', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.price_amount?.message} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('label_payment_methods')}</Label>
            <div className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <label
                  key={p}
                  htmlFor={`pay-${p}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-sm"
                >
                  <Checkbox
                    id={`pay-${p}`}
                    checked={form.watch('payment_methods')?.includes(p) ?? false}
                    onCheckedChange={(c) => {
                      const current = form.getValues('payment_methods') ?? [];
                      form.setValue(
                        'payment_methods',
                        c === true ? [...current, p] : current.filter((x) => x !== p),
                      );
                    }}
                  />
                  {paymentLabels[p]}
                </label>
              ))}
            </div>
            <FieldError message={form.formState.errors.payment_methods?.message} />
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={<Phone className="h-4 w-4" />}
        title={t('step5_title')}
        badge={t('step5_badge')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">{t('label_phone')}</Label>
            <Input id="contact_phone" {...form.register('contact.phone')} />
            <FieldError message={form.formState.errors.contact?.phone?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">{t('label_email')}</Label>
            <Input id="contact_email" type="email" {...form.register('contact.email')} />
            <FieldError message={form.formState.errors.contact?.email?.message} />
          </div>
          <label htmlFor="phone_visible" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="phone_visible"
              checked={form.watch('contact.phone_visible')}
              onCheckedChange={(c) => form.setValue('contact.phone_visible', c === true)}
            />
            {t('label_show_phone')}
          </label>
          <label htmlFor="email_visible" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="email_visible"
              checked={form.watch('contact.email_visible')}
              onCheckedChange={(c) => form.setValue('contact.email_visible', c === true)}
            />
            {t('label_show_email')}
          </label>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="sale_reason">{t('label_sale_reason')}</Label>
          <textarea
            id="sale_reason"
            {...form.register('sale_reason')}
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            rows={3}
          />
          <FieldError message={form.formState.errors.sale_reason?.message} />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={publish.isPending}
          onClick={submitAsDraft}
        >
          {t('save_draft')}
        </Button>
        <Button type="button" disabled={publish.isPending} onClick={submitAsPublished}>
          {publish.isPending ? t('publishing') : t('publish')}
        </Button>
      </div>
    </form>
  );
}
