'use client';
import { FormSection } from '@/components/form/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PatchUserProfileInput, UserProfile } from '@dorsal/schemas';
import { FileText, IdCard, Phone, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const PLACEHOLDERS: Partial<Record<keyof ProfileFormValues, string>> = {
  first_name: 'Ej: Maria',
  last_name: 'Ej: Garcia Lopez',
  dni: 'Ej: 12345678A',
  phone_number: 'Ej: 612 345 678',
  postal_code: 'Ej: 28001',
  address: 'Ej: Calle Mayor 12, 3ºB',
  club: 'Ej: Club Atletismo Madrid',
  federation_license: 'Ej: RFEA-123456',
  emergency_contact: 'Ej: Juan Perez - 612 345 678',
  medical_info: 'Ej: alergias, medicacion habitual...',
  additional_info: 'Cualquier informacion que quieras compartir...',
};

const MIN_AGE = 14;
const MAX_AGE = 120;
const AGE_OPTIONS = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) =>
  (MIN_AGE + i).toString(),
);

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
  setFieldValue: (id: keyof ProfileFormValues, value: string) => void,
  validateField: (id: keyof ProfileFormValues) => void,
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
        onChange={(event) => setFieldValue(id, event.target.value)}
        onBlur={() => validateField(id)}
        placeholder={PLACEHOLDERS[id]}
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

function selectField(
  id: keyof ProfileFormValues,
  label: string,
  values: ProfileFormValues,
  setFieldValue: (id: keyof ProfileFormValues, value: string) => void,
  errors: Partial<Record<keyof ProfileFormValues, string>>,
  placeholder: string,
  options: readonly { value: string; label: string }[],
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
      <Select value={values[id]} onValueChange={(value) => setFieldValue(id, value)}>
        <SelectTrigger
          id={id}
          aria-label={label}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

  function withFieldError(
    previousErrors: Partial<Record<keyof ProfileFormValues, string>>,
    id: keyof ProfileFormValues,
    error: string | undefined,
  ): Partial<Record<keyof ProfileFormValues, string>> {
    const nextErrors = { ...previousErrors };
    if (error) {
      nextErrors[id] = error;
    } else {
      delete nextErrors[id];
    }
    return nextErrors;
  }

  function setFieldValue(id: keyof ProfileFormValues, value: string) {
    const nextValues = { ...values, [id]: value };
    setValues(nextValues);
    const nextFieldErrors = validate(nextValues);
    setFieldErrors((currentErrors) => withFieldError(currentErrors, id, nextFieldErrors[id]));
  }

  function validateField(id: keyof ProfileFormValues) {
    const nextFieldErrors = validate(values);
    setFieldErrors((currentErrors) => withFieldError(currentErrors, id, nextFieldErrors[id]));
  }

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
    <form className="space-y-6" onSubmit={submit}>
      <FormSection icon={<IdCard className="h-4 w-4" />} title={t('section_identity')}>
        <p className="text-sm text-text-muted">* Campos obligatorios</p>
        <div className="grid gap-5 md:grid-cols-2">
          {field(
            'first_name',
            t('label_first_name'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'required',
          )}
          {field(
            'last_name',
            t('label_last_name'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'required',
          )}
          {field(
            'dni',
            t('label_dni'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'required',
          )}
          {selectField(
            'gender',
            t('label_gender'),
            values,
            setFieldValue,
            fieldErrors,
            t('label_gender_select'),
            genderOptions,
            'required',
          )}
          {selectField(
            'age',
            t('label_age'),
            values,
            setFieldValue,
            fieldErrors,
            t('label_gender_select'),
            AGE_OPTIONS.map((age) => ({ value: age, label: age })),
            'required',
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('label_email')}</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Phone className="h-4 w-4" />} title={t('section_contact')}>
        <div className="grid gap-5 md:grid-cols-2">
          {field(
            'phone_number',
            t('label_phone'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'postal_code',
            t('label_postal_code'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'address',
            t('label_address'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'emergency_contact',
            t('label_emergency_contact'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
        </div>
      </FormSection>

      <FormSection icon={<FileText className="h-4 w-4" />} title={t('section_additional')}>
        <div className="grid gap-5 md:grid-cols-2">
          {field(
            'club',
            t('label_club'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'federation_license',
            t('label_federation_license'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'medical_info',
            t('label_medical_info'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
          {field(
            'additional_info',
            t('label_additional_info'),
            values,
            setFieldValue,
            validateField,
            fieldErrors,
            'text',
            'optional',
          )}
        </div>
      </FormSection>

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
