'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PatchUserProfileInput, UserProfile } from '@dorsal/schemas';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

const DNI_PATTERN = /^\d{8}[A-Za-z]$/;
const DNI_FORMAT_ERROR = 'El DNI debe tener 8 numeros y una letra';
const REQUIRED_ERROR: Partial<Record<keyof ProfileFormValues, string>> = {
  first_name: 'El nombre es obligatorio',
  last_name: 'Los apellidos son obligatorios',
  dni: 'El DNI es obligatorio',
  gender: 'Selecciona un genero',
  age: 'La edad es obligatoria',
};

const MAX_LENGTHS: Partial<Record<keyof ProfileFormValues, { max: number; message: string }>> = {
  first_name: { max: 100, message: 'El nombre no puede superar 100 caracteres' },
  last_name: { max: 100, message: 'Los apellidos no pueden superar 100 caracteres' },
  phone_number: { max: 32, message: 'El telefono no puede superar 32 caracteres' },
  postal_code: { max: 20, message: 'El codigo postal no puede superar 20 caracteres' },
  address: { max: 255, message: 'La direccion no puede superar 255 caracteres' },
  club: { max: 120, message: 'El club no puede superar 120 caracteres' },
  federation_license: {
    max: 120,
    message: 'La licencia federativa no puede superar 120 caracteres',
  },
  medical_info: { max: 500, message: 'La informacion medica no puede superar 500 caracteres' },
  emergency_contact: {
    max: 120,
    message: 'El contacto de emergencia no puede superar 120 caracteres',
  },
  additional_info: {
    max: 500,
    message: 'La informacion adicional no puede superar 500 caracteres',
  },
};

const REQUIRED_FIELDS: (keyof ProfileFormValues)[] = [
  'first_name',
  'last_name',
  'dni',
  'gender',
  'age',
];

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

function validate(values: ProfileFormValues): Partial<Record<keyof ProfileFormValues, string>> {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
  for (const fieldName of REQUIRED_FIELDS) {
    if (!values[fieldName].trim()) {
      errors[fieldName] = REQUIRED_ERROR[fieldName] ?? 'Campo obligatorio';
    }
  }

  const dni = values.dni.trim();
  if (!errors.dni && dni && !DNI_PATTERN.test(dni)) {
    errors.dni = DNI_FORMAT_ERROR;
  }

  const age = values.age.trim() ? Number(values.age) : null;
  if (!errors.age && (age === null || !Number.isInteger(age) || age < 14 || age > 120)) {
    errors.age = 'La edad debe estar entre 14 y 120';
  }

  for (const [fieldName, limit] of Object.entries(MAX_LENGTHS) as [
    keyof ProfileFormValues,
    { max: number; message: string },
  ][]) {
    if (!errors[fieldName] && values[fieldName].trim().length > limit.max) {
      errors[fieldName] = limit.message;
    }
  }

  return errors;
}

function field(
  id: keyof ProfileFormValues,
  label: string,
  values: ProfileFormValues,
  setValues: (values: ProfileFormValues) => void,
  errors: Partial<Record<keyof ProfileFormValues, string>>,
  type = 'text',
  requirement: 'required' | 'optional' | undefined = undefined,
) {
  const error = errors[id];
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
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
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
  const t = useTranslations('profile');
  const initial = valuesFromUser(user);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>(
    {},
  );

  const genderOptions = [
    { value: 'male', label: t('gender_male') },
    { value: 'female', label: t('gender_female') },
    { value: 'other', label: t('gender_other') },
    { value: 'prefer_not_to_say', label: t('gender_prefer_not') },
  ] as const;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(buildPatch(initial, values));
    } catch {
      setSubmitError('No se pudo guardar el perfil. Intentalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={submit}>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_identity')}</h2>
        <p className="text-sm text-text-muted">* Campos obligatorios</p>
        <div className="grid gap-4 md:grid-cols-2">
          {field(
            'first_name',
            t('label_first_name'),
            values,
            setValues,
            fieldErrors,
            'text',
            'required',
          )}
          {field(
            'last_name',
            t('label_last_name'),
            values,
            setValues,
            fieldErrors,
            'text',
            'required',
          )}
          {field('dni', t('label_dni'), values, setValues, fieldErrors, 'text', 'required')}
          <div className="space-y-1.5">
            <Label htmlFor="gender">
              {t('label_gender')}
              <span aria-hidden="true"> *</span>
            </Label>
            <select
              id="gender"
              aria-label={t('label_gender')}
              className="flex h-9 w-full rounded-md border border-border bg-bg-elevated px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-coral"
              value={values.gender}
              onChange={(event) => setValues({ ...values, gender: event.target.value })}
              aria-invalid={fieldErrors.gender ? 'true' : undefined}
              aria-describedby={fieldErrors.gender ? 'gender-error' : undefined}
            >
              <option value="">{t('label_gender_select')}</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.gender && (
              <p id="gender-error" role="alert" className="text-sm text-red-500">
                {fieldErrors.gender}
              </p>
            )}
          </div>
          {field('age', t('label_age'), values, setValues, fieldErrors, 'number', 'required')}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('label_email')}</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_contact')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('phone_number', t('label_phone'), values, setValues, fieldErrors, 'text', 'optional')}
          {field(
            'postal_code',
            t('label_postal_code'),
            values,
            setValues,
            fieldErrors,
            'text',
            'optional',
          )}
          {field('address', t('label_address'), values, setValues, fieldErrors, 'text', 'optional')}
          {field(
            'emergency_contact',
            t('label_emergency_contact'),
            values,
            setValues,
            fieldErrors,
            'text',
            'optional',
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_additional')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('club', t('label_club'), values, setValues, fieldErrors, 'text', 'optional')}
          {field(
            'federation_license',
            t('label_federation_license'),
            values,
            setValues,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'medical_info',
            t('label_medical_info'),
            values,
            setValues,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'additional_info',
            t('label_additional_info'),
            values,
            setValues,
            fieldErrors,
            'text',
            'optional',
          )}
        </div>
      </section>

      {submitError && (
        <p role="alert" className="text-sm text-red-500">
          {submitError}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        <Save />
        {t('save')}
      </Button>
    </form>
  );
}
