import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiLawyerProfile, apiProfileMe, apiProfileUpdate } from '../../lib/api';
import { Profile } from '../../types';
import { useToast } from '../Toast/ToastProvider';
import { validatePhone } from '../../utils/validators';
import { getVerificationStatusMeta } from '../../utils/barCouncilVerification';

interface ProfilePageProps {
  onBack: () => void;
}

type GovIdType = 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id';

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [barCertificate, setBarCertificate] = useState<File | null>(null);
  const [identityProof, setIdentityProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const isLawyer = profile?.role === 'lawyer';

  const profileCompletion = useMemo(() => {
    const required = isLawyer
      ? [
          'full_name',
          'email',
          'phone_number',
          'address',
          'government_id_type',
          'government_id_number',
          'profile_photo_url',
          'identity_proof_url',
          'bar_council_id',
          'license_state',
          'years_experience',
          'firm_name',
          'office_address',
          'bar_certificate_url',
          'signature_url',
        ]
      : [
          'full_name',
          'email',
          'phone_number',
          'address',
          'profile_photo_url',
          'government_id_type',
          'government_id_number',
        ];

    const total = required.length;
    const filled = required.filter((key) => {
      const value = form[key as keyof Profile];
      return value !== undefined && value !== null && value !== '' && !(typeof value === 'number' && Number.isNaN(value));
    }).length;

    return Math.round((filled / total) * 100);
  }, [form, isLawyer]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = isLawyer ? await apiLawyerProfile() : await apiProfileMe();
        setForm(data.profile);
      } catch (e) {
        showToast(e instanceof Error ? e.message : t('profile.loadFailed'), 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast, t, isLawyer]);

  function validateClientCommon() {
    return [
      !form.full_name?.trim() && 'full_name',
      !form.phone_number?.trim() && 'phone_number',
      !form.address?.trim() && 'address',
      !form.government_id_type && 'government_id_type',
      !form.government_id_number?.trim() && 'government_id_number',
      !form.profile_photo_url && !profilePhoto && 'profile_photo',
      !form.identity_proof_url && !identityProof && 'identity_proof',
    ].filter(Boolean) as string[];
  }

  function validateLawyerExtra() {
    const experience = Number(form.years_experience);
    return [
      !form.bar_council_id?.trim() && 'bar_council_id',
      !form.license_state?.trim() && 'license_state',
      (!Number.isInteger(experience) || experience < 1 || experience > 70) && 'years_experience',
      !form.firm_name?.trim() && 'firm_name',
      !form.office_address?.trim() && 'office_address',
      !form.signature_url && !signature && 'signature',
      !form.bar_certificate_url && !barCertificate && 'bar_certificate',
    ].filter(Boolean) as string[];
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMissingFields((current) => current.filter((field) => field !== key));
  }

  const fieldLabels: Record<string, string> = {
    full_name: 'Full name',
    phone_number: 'Phone number',
    address: 'Residential address',
    government_id_type: 'Government ID type',
    government_id_number: 'Government ID number',
    profile_photo: 'Professional photograph',
    identity_proof: 'Identity proof',
    bar_council_id: 'State Bar Council registration number',
    license_state: 'Bar Council state',
    years_experience: 'Years of experience',
    firm_name: 'Firm / Chamber name',
    office_address: 'Office address',
    signature: 'Signature',
    bar_certificate: 'Bar certificate / Sanad',
  };

  async function saveProfile() {
    const missing = [...validateClientCommon(), ...(isLawyer ? validateLawyerExtra() : [])];
    if (form.phone_number && !validatePhone(form.phone_number)) {
      if (!missing.includes('phone_number')) missing.push('phone_number');
      showToast('Phone number must be digits only (10-15 digits)', 'error');
      setMissingFields(missing);
      return;
    }
    const governmentId = (form.government_id_number || '').trim().toUpperCase();
    if (form.government_id_type && governmentId) {
      const idPatterns: Record<GovIdType, RegExp> = {
        aadhaar: /^\d{12}$/,
        pan: /^[A-Z]{5}\d{4}[A-Z]$/,
        passport: /^[A-Z]\d{7}$/,
        driving_license: /^[A-Z]{2}\d{2}[A-Z0-9]{7,13}$/,
        voter_id: /^[A-Z]{3}\d{7}$/,
      };
      if (!idPatterns[form.government_id_type as GovIdType]?.test(governmentId)) {
        setMissingFields([...missing.filter((field) => field !== 'government_id_number'), 'government_id_number']);
        showToast(`Enter a valid ${form.government_id_type.replace('_', ' ')} number.`, 'error');
        return;
      }
    }
    if (missing.length) {
      setMissingFields(missing);
      const labels = [...new Set(missing)].map((field) => fieldLabels[field] || field.replaceAll('_', ' '));
      showToast(`Complete the required fields: ${labels.join(', ')}.`, 'error');
      return;
    }
    setMissingFields([]);

    setSaving(true);
    try {
      const { profile: updated } = await apiProfileUpdate({
        full_name: form.full_name || '',
        phone_number: form.phone_number || '',
        address: form.address || '',
        government_id_type: (form.government_id_type as GovIdType) || '',
        government_id_number: governmentId,
        profile_photo: profilePhoto,
        bar_council_id: form.bar_council_id || '',
        license_state: form.license_state || '',
        years_experience: form.years_experience || '',
        firm_name: form.firm_name || '',
        office_address: form.office_address || '',
        signature,
        bar_certificate: barCertificate,
        identity_proof: identityProof,
      });
      setForm(updated);
      setProfilePhoto(null);
      setSignature(null);
      setBarCertificate(null);
      setIdentityProof(null);
      await refreshProfile();
      showToast(t('profile.saved'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('profile.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-10">{t('common.loading')}</div>;
  const invalid = (name: string) => missingFields.includes(name) ? 'border-red-500 bg-red-50' : 'border-slate-300';
  const fieldError = (name: string) => missingFields.includes(name)
    ? <p className="mt-1 text-xs text-red-700">{fieldLabels[name] || name.replaceAll('_', ' ')} is required or invalid.</p>
    : null;
  const verificationMeta = getVerificationStatusMeta(form.verification_status);

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Professional Profile</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{t('profile.title')}</h2>
        </div>
        <button onClick={onBack} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          {t('profile.back')}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Profile completion</p>
            <p className="text-2xl font-bold text-slate-900">{profileCompletion}%</p>
          </div>
          <div className="flex-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#1a237e]" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>
      </div>

      {isLawyer && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Professional Verification Status</p>
              <p className="mt-1 text-amber-900">{verificationMeta.label}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verificationMeta.tone}`}>
              {verificationMeta.label}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Format validation is not the same as official verification. Admin review remains required for a verified advocate status.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
          <div className="flex items-center gap-4">
            <img
              src={form.profile_photo_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.profile_photo_url}` : 'https://placehold.co/80x80?text=Photo'}
              alt="Profile"
              className="h-20 w-20 rounded-full border border-slate-200 object-cover bg-white"
            />
            <div className="flex-1">
              <label htmlFor="profile-photo" className="mb-1 block text-sm font-medium text-slate-700">Professional photograph *</label>
              <input id="profile-photo" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => { setProfilePhoto(e.target.files?.[0] || null); setMissingFields((current) => current.filter((field) => field !== 'profile_photo')); }} className={missingFields.includes('profile_photo') ? 'ring-2 ring-red-400 rounded' : ''} />
              {fieldError('profile_photo')}
            </div>
          </div>

          <div>
            <label htmlFor="full-name" className="mb-1 block text-sm font-medium text-slate-700">Full name *</label>
            <input id="full-name" className={`w-full rounded-xl border px-3 py-2 ${invalid('full_name')}`} value={form.full_name || ''} onChange={(e) => updateField('full_name', e.target.value)} />
            {fieldError('full_name')}
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
            <input id="profile-email" type="email" readOnly className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600" value={form.email || ''} />
          </div>
          <div>
            <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium text-slate-700">Phone number *</label>
            <input id="profile-phone" type="tel" inputMode="numeric" pattern="[0-9+ -]{10,17}" maxLength={17} className={`w-full rounded-xl border px-3 py-2 ${invalid('phone_number')}`} value={form.phone_number || ''} onChange={(e) => updateField('phone_number', e.target.value.replace(/[^0-9+ -]/g, ''))} />
            {fieldError('phone_number')}
          </div>
          <div>
            <label htmlFor="residential-address" className="mb-1 block text-sm font-medium text-slate-700">Residential address *</label>
            <textarea id="residential-address" className={`w-full rounded-xl border px-3 py-2 ${invalid('address')}`} value={form.address || ''} onChange={(e) => updateField('address', e.target.value)} rows={2} />
            {fieldError('address')}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="government-id-type" className="mb-1 block text-sm font-medium text-slate-700">Government ID type *</label>
              <select id="government-id-type" className={`w-full rounded-xl border bg-white px-3 py-2 ${invalid('government_id_type')}`} value={form.government_id_type || ''} onChange={(e) => updateField('government_id_type', (e.target.value || null) as Profile['government_id_type'])}>
                <option value="">Select ID type</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving licence</option>
                <option value="voter_id">Voter ID</option>
              </select>
              {fieldError('government_id_type')}
            </div>
            <div>
              <label htmlFor="government-id-number" className="mb-1 block text-sm font-medium text-slate-700">Government ID number *</label>
              <input id="government-id-number" autoCapitalize="characters" className={`w-full rounded-xl border px-3 py-2 ${invalid('government_id_number')}`} value={form.government_id_number || ''} onChange={(e) => updateField('government_id_number', e.target.value.toUpperCase())} />
              {fieldError('government_id_number')}
            </div>
          </div>
        </section>

        {isLawyer && (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Professional Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bar-council-id" className="mb-1 block text-sm font-medium text-slate-700">State Bar Council registration number *</label>
                <input id="bar-council-id" className={`w-full rounded-xl border px-3 py-2 ${invalid('bar_council_id')}`} value={form.bar_council_id || ''} onChange={(e) => updateField('bar_council_id', e.target.value)} />
                {fieldError('bar_council_id')}
              </div>
              <div>
                <label htmlFor="license-state" className="mb-1 block text-sm font-medium text-slate-700">Bar Council state *</label>
                <input id="license-state" className={`w-full rounded-xl border px-3 py-2 ${invalid('license_state')}`} value={form.license_state || ''} onChange={(e) => updateField('license_state', e.target.value)} />
                {fieldError('license_state')}
              </div>
              <div>
                <label htmlFor="years-experience" className="mb-1 block text-sm font-medium text-slate-700">Years of experience *</label>
                <input id="years-experience" type="number" inputMode="numeric" min="1" max="70" step="1" className={`w-full rounded-xl border px-3 py-2 ${invalid('years_experience')}`} value={form.years_experience ?? ''} onChange={(e) => updateField('years_experience', e.target.value === '' ? null : Number(e.target.value))} />
                {fieldError('years_experience')}
              </div>
              <div>
                <label htmlFor="firm-name" className="mb-1 block text-sm font-medium text-slate-700">Firm / Chamber name *</label>
                <input id="firm-name" className={`w-full rounded-xl border px-3 py-2 ${invalid('firm_name')}`} value={form.firm_name || ''} onChange={(e) => updateField('firm_name', e.target.value)} />
                {fieldError('firm_name')}
              </div>
            </div>
            <div>
              <label htmlFor="office-address" className="mb-1 block text-sm font-medium text-slate-700">Office address *</label>
              <textarea id="office-address" className={`w-full rounded-xl border px-3 py-2 ${invalid('office_address')}`} value={form.office_address || ''} onChange={(e) => updateField('office_address', e.target.value)} rows={2} />
              {fieldError('office_address')}
            </div>
          </section>
        )}
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-slate-900">Identity / Verification Documents</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="bar-certificate" className="mb-1 block text-sm font-medium text-slate-700">Bar certificate / Sanad *</label>
            <input id="bar-certificate" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => { setBarCertificate(e.target.files?.[0] || null); setMissingFields((current) => current.filter((field) => field !== 'bar_certificate')); }} className={missingFields.includes('bar_certificate') ? 'ring-2 ring-red-400 rounded' : ''} />
            {fieldError('bar_certificate')}
            {form.bar_certificate_url && <a className="mt-2 inline-block text-sm text-indigo-700" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.bar_certificate_url}`} target="_blank" rel="noreferrer">View existing document</a>}
          </div>
          <div>
            <label htmlFor="identity-proof" className="mb-1 block text-sm font-medium text-slate-700">Government identity proof *</label>
            <input id="identity-proof" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => { setIdentityProof(e.target.files?.[0] || null); setMissingFields((current) => current.filter((field) => field !== 'identity_proof')); }} className={missingFields.includes('identity_proof') ? 'ring-2 ring-red-400 rounded' : ''} />
            {fieldError('identity_proof')}
            {form.identity_proof_url && <a className="mt-2 inline-block text-sm text-indigo-700" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.identity_proof_url}`} target="_blank" rel="noreferrer">View existing identity proof</a>}
          </div>
          <div>
            <label htmlFor="profile-photo-document" className="mb-1 block text-sm font-medium text-slate-700">Professional photograph *</label>
            <input id="profile-photo-document" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => { setProfilePhoto(e.target.files?.[0] || null); setMissingFields((current) => current.filter((field) => field !== 'profile_photo')); }} className={missingFields.includes('profile_photo') ? 'ring-2 ring-red-400 rounded' : ''} />
          </div>
          <div>
            <label htmlFor="lawyer-signature" className="mb-1 block text-sm font-medium text-slate-700">Signature *</label>
            <input id="lawyer-signature" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => { setSignature(e.target.files?.[0] || null); setMissingFields((current) => current.filter((field) => field !== 'signature')); }} className={missingFields.includes('signature') ? 'ring-2 ring-red-400 rounded' : ''} />
            {fieldError('signature')}
            {form.signature_url && <a className="mt-2 inline-block text-sm text-indigo-700" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.signature_url}`} target="_blank" rel="noreferrer">View signature</a>}
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-[#1a237e] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
          {saving ? t('profile.saving') : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
