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
import { Distance, PaymentMethod, PublishDorsalInput, ShirtSize } from '@dorsal/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CreditCard, MapPin, Phone, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormInput = z.input<typeof PublishDorsalInput>;
type FormValues = z.output<typeof PublishDorsalInput>;

const distances: Distance[] = [...Distance.options];
const payments: PaymentMethod[] = [...PaymentMethod.options];
const shirtSizes: ShirtSize[] = [...ShirtSize.options];
const itemKeys = ['chip', 'shirt', 'bag', 'medal', 'refreshments'] as const;
const itemLabels: Record<(typeof itemKeys)[number], string> = {
  chip: 'Chip',
  shirt: 'Camiseta',
  bag: 'Bolsa',
  medal: 'Medalla',
  refreshments: 'Avituallamientos',
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

export function PublishWizard() {
  const router = useRouter();
  const publish = usePublishDorsal();
  const persistedDraft = loadPublishDraft();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(PublishDorsalInput),
    defaultValues: {
      publish: true,
      photo_url: '',
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      purchase_requirements: {
        requires_estimated_time: false,
        requires_shirt_size: false,
        requires_emergency_contact: false,
        fixed_shirt_size: null,
      },
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
        toast.success(publishMode ? 'Dorsal publicado' : 'Borrador guardado');
        router.push(`/dorsales/${dorsal_id}`);
      },
      onError: (e) => toast.error(e.message ?? 'No se pudo publicar el dorsal'),
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

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submitAsPublished();
      }}
      className="space-y-5"
    >
      <FormSection icon={<Camera className="h-4 w-4" />} title="Foto del dorsal" badge="Paso 1">
        <PhotoUpload
          value={form.watch('photo_url') || null}
          onChange={(url) => form.setValue('photo_url', url ?? '', { shouldValidate: true })}
        />
        <FieldError message={form.formState.errors.photo_url?.message} />
      </FormSection>

      <FormSection icon={<Trophy className="h-4 w-4" />} title="Datos de la carrera" badge="Paso 2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="race_name">Nombre carrera</Label>
            <Input id="race_name" {...form.register('race_name')} />
            <FieldError message={form.formState.errors.race_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bib_number">Número dorsal</Label>
            <Input id="bib_number" {...form.register('bib_number')} />
            <FieldError message={form.formState.errors.bib_number?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="race_date">Fecha</Label>
            <Input id="race_date" type="date" {...form.register('race_date')} />
            <FieldError message={form.formState.errors.race_date?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" {...form.register('location')} placeholder="Madrid, Valencia…" />
            <FieldError message={form.formState.errors.location?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distance">Distancia</Label>
            <select
              id="distance"
              {...form.register('distance')}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <option value="">Selecciona</option>
              {distances.map((d) => (
                <option key={d} value={d}>
                  {distanceLabel(d)}
                </option>
              ))}
            </select>
            <FieldError message={form.formState.errors.distance?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_corral">Cajón salida (opcional)</Label>
            <Input id="start_corral" {...form.register('start_corral')} />
            <FieldError message={form.formState.errors.start_corral?.message} />
          </div>
        </div>
        <FieldError message={form.formState.errors.included_items?.message} />
      </FormSection>

      <FormSection icon={<MapPin className="h-4 w-4" />} title="¿Qué incluye?" badge="Paso 3">
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
                onCheckedChange={(c) => {
                  const checked = c === true;
                  form.setValue(`included_items.${k}`, checked);
                  if (k === 'shirt' && !checked) {
                    form.setValue('purchase_requirements.fixed_shirt_size', null);
                    form.setValue('purchase_requirements.requires_shirt_size', false);
                  }
                }}
              />
              {itemLabels[k]}
            </label>
          ))}
        </div>
        <div className="space-y-4 border-t border-border pt-5">
          <div>
            <h3 className="text-sm font-semibold">Datos que debe aportar el comprador</h3>
            <p className="mt-1 text-sm text-text-muted">
              El checkout solo solicitará los datos que actives aquí.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor="requires-estimated-time" className="flex items-center gap-2 text-sm">
              <Checkbox
                id="requires-estimated-time"
                checked={form.watch('purchase_requirements.requires_estimated_time') ?? false}
                onCheckedChange={(checked) =>
                  form.setValue('purchase_requirements.requires_estimated_time', checked === true)
                }
              />
              Solicitar tiempo estimado
            </label>
            <label htmlFor="requires-emergency-contact" className="flex items-center gap-2 text-sm">
              <Checkbox
                id="requires-emergency-contact"
                checked={form.watch('purchase_requirements.requires_emergency_contact') ?? false}
                onCheckedChange={(checked) =>
                  form.setValue(
                    'purchase_requirements.requires_emergency_contact',
                    checked === true,
                  )
                }
              />
              Solicitar contacto de emergencia
            </label>
          </div>
          {form.watch('included_items.shirt') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fixed-shirt-size">Talla incluida</Label>
                <select
                  id="fixed-shirt-size"
                  className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
                  value={form.watch('purchase_requirements.fixed_shirt_size') ?? ''}
                  onChange={(event) => {
                    const fixedSize = event.target.value ? (event.target.value as ShirtSize) : null;
                    form.setValue('purchase_requirements.fixed_shirt_size', fixedSize, {
                      shouldValidate: true,
                    });
                    if (fixedSize) {
                      form.setValue('purchase_requirements.requires_shirt_size', false);
                    }
                  }}
                >
                  <option value="">Sin talla fija</option>
                  {shirtSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <FieldError
                  message={form.formState.errors.purchase_requirements?.fixed_shirt_size?.message}
                />
              </div>
              <label
                htmlFor="requires-shirt-size"
                className="flex items-center gap-2 self-end pb-2 text-sm"
              >
                <Checkbox
                  id="requires-shirt-size"
                  disabled={Boolean(form.watch('purchase_requirements.fixed_shirt_size'))}
                  checked={form.watch('purchase_requirements.requires_shirt_size') ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue('purchase_requirements.requires_shirt_size', checked === true, {
                      shouldValidate: true,
                    })
                  }
                />
                Solicitar talla al comprador
              </label>
            </div>
          )}
        </div>
      </FormSection>

      <FormSection
        icon={<CreditCard className="h-4 w-4" />}
        title="Precio y método de pago"
        badge="Paso 4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price_amount">Precio (€)</Label>
            <Input
              id="price_amount"
              type="number"
              step="0.01"
              {...form.register('price_amount', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.price_amount?.message} />
          </div>
          <div className="space-y-1.5">
            <Label>Métodos de pago aceptados</Label>
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
                  {p === 'bizum' ? 'Bizum' : p === 'paypal' ? 'PayPal' : 'Tarjeta'}
                </label>
              ))}
            </div>
            <FieldError message={form.formState.errors.payment_methods?.message} />
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Phone className="h-4 w-4" />} title="Contacto y motivo" badge="Paso 5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Teléfono</Label>
            <Input id="contact_phone" {...form.register('contact.phone')} />
            <FieldError message={form.formState.errors.contact?.phone?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Email</Label>
            <Input id="contact_email" type="email" {...form.register('contact.email')} />
            <FieldError message={form.formState.errors.contact?.email?.message} />
          </div>
          <label htmlFor="phone_visible" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="phone_visible"
              checked={form.watch('contact.phone_visible')}
              onCheckedChange={(c) => form.setValue('contact.phone_visible', c === true)}
            />
            Mostrar teléfono
          </label>
          <label htmlFor="email_visible" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="email_visible"
              checked={form.watch('contact.email_visible')}
              onCheckedChange={(c) => form.setValue('contact.email_visible', c === true)}
            />
            Mostrar email
          </label>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="sale_reason">Motivo de venta (opcional)</Label>
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
          Guardar borrador
        </Button>
        <Button type="button" disabled={publish.isPending} onClick={submitAsPublished}>
          {publish.isPending ? 'Publicando…' : 'Publicar dorsal'}
        </Button>
      </div>
    </form>
  );
}
