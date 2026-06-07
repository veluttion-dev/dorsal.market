'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PatchUserProfileInput, UserProfile } from '@dorsal/schemas';
import { Save } from 'lucide-react';
import { useState } from 'react';

interface ProfileFormValues {
  first_name: string;
  last_name: string;
  dni: string;
  gender: string;
  age: string;
  phone_number: string;
  whatsapp_number: string;
  postal_code: string;
  address: string;
  estimated_time: string;
  t_shirt_size: string;
  club: string;
  federation_license: string;
  medical_info: string;
  emergency_contact: string;
  additional_info: string;
}

const TEXT_FIELDS = [
  'first_name',
  'last_name',
  'dni',
  'phone_number',
  'whatsapp_number',
  'postal_code',
  'address',
  'estimated_time',
  'club',
  'federation_license',
  'medical_info',
  'emergency_contact',
  'additional_info',
] as const;

type TextField = (typeof TEXT_FIELDS)[number];

function valuesFromUser(user: UserProfile): ProfileFormValues {
  return {
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    dni: user.dni ?? '',
    gender: user.gender ?? '',
    age: user.age?.toString() ?? '',
    phone_number: user.phone_number ?? '',
    whatsapp_number: user.whatsapp_number ?? '',
    postal_code: user.postal_code ?? '',
    address: user.address ?? '',
    estimated_time: user.estimated_time ?? '',
    t_shirt_size: user.t_shirt_size ?? '',
    club: user.club ?? '',
    federation_license: user.federation_license ?? '',
    medical_info: user.medical_info ?? '',
    emergency_contact: user.emergency_contact ?? '',
    additional_info: user.additional_info ?? '',
  };
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildPatch(initial: ProfileFormValues, current: ProfileFormValues): PatchUserProfileInput {
  const patch: PatchUserProfileInput = {};
  const textPatch = patch as Partial<Record<TextField, string | null>>;

  for (const field of TEXT_FIELDS) {
    if (current[field] !== initial[field]) {
      textPatch[field] = nullable(current[field]);
    }
  }

  if (current.gender !== initial.gender) {
    patch.gender = nullable(current.gender) as PatchUserProfileInput['gender'];
  }

  if (current.t_shirt_size !== initial.t_shirt_size) {
    patch.t_shirt_size = nullable(current.t_shirt_size) as PatchUserProfileInput['t_shirt_size'];
  }

  if (current.age !== initial.age) {
    patch.age = current.age.trim() ? Number(current.age) : null;
  }

  return patch;
}

function field(
  id: keyof ProfileFormValues,
  label: string,
  values: ProfileFormValues,
  setValues: (values: ProfileFormValues) => void,
  type = 'text',
) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={values[id]}
        onChange={(event) => setValues({ ...values, [id]: event.target.value })}
      />
    </div>
  );
}

export function ProfileForm({
  user,
  onSubmit,
}: {
  user: UserProfile;
  onSubmit: (input: PatchUserProfileInput) => Promise<void> | void;
}) {
  const initial = valuesFromUser(user);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(buildPatch(initial, values));
    setSaving(false);
  }

  return (
    <form className="space-y-8" onSubmit={submit}>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identidad</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('first_name', 'Nombre', values, setValues)}
          {field('last_name', 'Apellidos', values, setValues)}
          {field('dni', 'DNI', values, setValues)}
          {field('gender', 'Genero', values, setValues)}
          {field('age', 'Edad', values, setValues, 'number')}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contacto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('phone_number', 'Telefono', values, setValues)}
          {field('whatsapp_number', 'WhatsApp', values, setValues)}
          {field('postal_code', 'Codigo postal', values, setValues)}
          {field('address', 'Direccion', values, setValues)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Datos de corredor</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('estimated_time', 'Tiempo estimado', values, setValues)}
          {field('t_shirt_size', 'Talla camiseta', values, setValues)}
          {field('club', 'Club', values, setValues)}
          {field('federation_license', 'Licencia federativa', values, setValues)}
          {field('medical_info', 'Informacion medica', values, setValues)}
          {field('emergency_contact', 'Contacto de emergencia', values, setValues)}
          {field('additional_info', 'Informacion adicional', values, setValues)}
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        <Save />
        Guardar perfil
      </Button>
    </form>
  );
}
