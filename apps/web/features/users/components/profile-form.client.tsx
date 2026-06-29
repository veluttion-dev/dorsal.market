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
  const t = useTranslations('profile');
  const initial = valuesFromUser(user);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const GENDER_OPTIONS = [
    { value: 'male', label: t('gender_male') },
    { value: 'female', label: t('gender_female') },
    { value: 'other', label: t('gender_other') },
    { value: 'prefer_not_to_say', label: t('gender_prefer_not') },
  ] as const;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(buildPatch(initial, values));
    setSaving(false);
  }

  return (
    <form className="space-y-8" onSubmit={submit}>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_identity')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('first_name', t('label_first_name'), values, setValues)}
          {field('last_name', t('label_last_name'), values, setValues)}
          {field('dni', t('label_dni'), values, setValues)}
          <div className="space-y-1.5">
            <Label htmlFor="gender">{t('label_gender')}</Label>
            <select
              id="gender"
              className="flex h-9 w-full rounded-md border border-border bg-bg-elevated px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-coral"
              value={values.gender}
              onChange={(event) => setValues({ ...values, gender: event.target.value })}
            >
              <option value="">{t('label_gender_select')}</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {field('age', t('label_age'), values, setValues, 'number')}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('label_email')}</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_contact')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('phone_number', t('label_phone'), values, setValues)}
          {field('postal_code', t('label_postal_code'), values, setValues)}
          {field('address', t('label_address'), values, setValues)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('section_runner')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field('estimated_time', t('label_estimated_time'), values, setValues)}
          {field('t_shirt_size', t('label_t_shirt_size'), values, setValues)}
          {field('club', t('label_club'), values, setValues)}
          {field('federation_license', t('label_federation_license'), values, setValues)}
          {field('medical_info', t('label_medical_info'), values, setValues)}
          {field('emergency_contact', t('label_emergency_contact'), values, setValues)}
          {field('additional_info', t('label_additional_info'), values, setValues)}
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        <Save />
        {t('save')}
      </Button>
    </form>
  );
}
