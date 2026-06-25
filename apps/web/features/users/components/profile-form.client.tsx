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
  postal_code: string;
  address: string;
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
  'postal_code',
  'address',
  'club',
  'federation_license',
  'medical_info',
  'emergency_contact',
  'additional_info',
] as const;

type TextField = (typeof TEXT_FIELDS)[number];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no indicarlo' },
] as const;

function valuesFromUser(user: UserProfile): ProfileFormValues {
  return {
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    dni: user.dni ?? '',
    gender: user.gender ?? '',
    age: user.age?.toString() ?? '',
    phone_number: user.phone_number ?? '',
    postal_code: user.postal_code ?? '',
    address: user.address ?? '',
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
  requirement: 'required' | 'optional' | undefined = undefined,
) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {requirement === 'required' && <span aria-hidden="true"> *</span>}
        {requirement === 'optional' && ' (opcional)'}
      </Label>
      <Input
        id={id}
        aria-label={label}
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(buildPatch(initial, values));
    } catch {
      setSubmitError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={submit}>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identidad</h2>
        <p className="text-sm text-text-muted">* Campos obligatorios</p>
        <div className="grid gap-4 md:grid-cols-2">
          {field('first_name', 'Nombre', values, setValues, 'text', 'required')}
          {field('last_name', 'Apellidos', values, setValues, 'text', 'required')}
          {field('dni', 'DNI', values, setValues, 'text', 'required')}
          <div className="space-y-1.5">
            <Label htmlFor="gender">
              Genero<span aria-hidden="true"> *</span>
            </Label>
            <select
              id="gender"
              aria-label="Genero"
              className="flex h-9 w-full rounded-md border border-border bg-bg-elevated px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-coral"
              value={values.gender}
              onChange={(event) => setValues({ ...values, gender: event.target.value })}
            >
              <option value="">Selecciona una opcion</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {field('age', 'Edad', values, setValues, 'number', 'required')}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contacto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('phone_number', 'Telefono', values, setValues, 'text', 'optional')}
          {field('postal_code', 'Codigo postal', values, setValues, 'text', 'optional')}
          {field('address', 'Direccion', values, setValues, 'text', 'optional')}
          {field(
            'emergency_contact',
            'Contacto de emergencia',
            values,
            setValues,
            'text',
            'optional',
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Información adicional</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('club', 'Club', values, setValues, 'text', 'optional')}
          {field(
            'federation_license',
            'Licencia federativa',
            values,
            setValues,
            'text',
            'optional',
          )}
          {field('medical_info', 'Informacion medica', values, setValues, 'text', 'optional')}
          {field('additional_info', 'Informacion adicional', values, setValues, 'text', 'optional')}
        </div>
      </section>

      {submitError && (
        <p role="alert" className="text-sm text-red-500">
          {submitError}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        <Save />
        Guardar perfil
      </Button>
    </form>
  );
}
