'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Distance, type PaymentMethod, PublishDorsalInput } from '@dorsal/schemas';
import { Camera, CreditCard, MapPin, Phone, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSection } from '@/components/form/form-section';
import { PhotoUpload } from '@/components/form/photo-upload.client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePublishDorsal } from '@/features/dorsals/hooks/use-publish-dorsal';
import { distanceLabel } from '@/features/dorsals/lib/distances';

type FormValues = PublishDorsalInput;

const distances: Distance[] = ['5k', '10k', '21k', '42k', 'trail', 'ultra'];
const payments: PaymentMethod[] = ['bizum', 'paypal', 'card'];
const itemKeys = ['chip', 'shirt', 'bag', 'medal', 'refreshments'] as const;
const itemLabels: Record<(typeof itemKeys)[number], string> = {
  chip: 'Chip',
  shirt: 'Camiseta',
  bag: 'Bolsa',
  medal: 'Medalla',
  refreshments: 'Avituallamientos',
};

export function PublishWizard() {
  const router = useRouter();
  const publish = usePublishDorsal();
  const form = useForm<FormValues>({
    resolver: zodResolver(PublishDorsalInput),
    defaultValues: {
      publish: true,
      photo_url: '',
      included_items: { chip: false, shirt: false, bag: false, medal: false, refreshments: false },
      payment_methods: [],
      contact: { phone: '', email: '', phone_visible: true, email_visible: true },
    },
  });

  function onSubmit(values: FormValues) {
    publish.mutate(values, {
      onSuccess: ({ dorsal_id }) => {
        toast.success(values.publish ? '¡Dorsal publicado!' : 'Borrador guardado');
        router.push(`/dorsales/${dorsal_id}`);
      },
      onError: (e) => toast.error(e.message ?? 'No se pudo publicar el dorsal'),
    });
  }

  function submitAsDraft() {
    form.setValue('publish', false);
    void form.handleSubmit(onSubmit)();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <FormSection icon={<Camera className="h-4 w-4" />} title="Foto del dorsal" badge="Paso 1">
        <PhotoUpload
          value={form.watch('photo_url') || null}
          onChange={(url) => form.setValue('photo_url', url ?? '', { shouldValidate: true })}
        />
        {form.formState.errors.photo_url && (
          <p className="text-sm text-red-500">{form.formState.errors.photo_url.message}</p>
        )}
      </FormSection>

      <FormSection icon={<Trophy className="h-4 w-4" />} title="Datos de la carrera" badge="Paso 2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="race_name">Nombre carrera</Label>
            <Input id="race_name" {...form.register('race_name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bib_number">Número dorsal</Label>
            <Input id="bib_number" {...form.register('bib_number')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="race_date">Fecha</Label>
            <Input id="race_date" type="date" {...form.register('race_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" {...form.register('location')} placeholder="Madrid, Valencia…" />
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_corral">Cajón salida (opcional)</Label>
            <Input id="start_corral" {...form.register('start_corral')} />
          </div>
        </div>
      </FormSection>

      <FormSection icon={<MapPin className="h-4 w-4" />} title="¿Qué incluye?" badge="Paso 3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {itemKeys.map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 rounded-md border border-border bg-bg-elevated px-3 py-2.5 text-sm"
            >
              <Checkbox
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
          </div>
          <div className="space-y-1.5">
            <Label>Métodos de pago aceptados</Label>
            <div className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-sm"
                >
                  <Checkbox
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
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Phone className="h-4 w-4" />} title="Contacto y motivo" badge="Paso 5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Teléfono</Label>
            <Input id="contact_phone" {...form.register('contact.phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Email</Label>
            <Input id="contact_email" type="email" {...form.register('contact.email')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch('contact.phone_visible')}
              onCheckedChange={(c) => form.setValue('contact.phone_visible', c === true)}
            />
            Mostrar teléfono
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
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
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" disabled={publish.isPending} onClick={submitAsDraft}>
          Guardar borrador
        </Button>
        <Button type="submit" disabled={publish.isPending}>
          {publish.isPending ? 'Publicando…' : 'Publicar dorsal'}
        </Button>
      </div>
    </form>
  );
}
