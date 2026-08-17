import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiLawyerProfile, apiProfileMe, apiProfileUpdate } from '../../lib/api';
import { Profile } from '../../types';
import { useToast } from '../Toast/ToastProvider';
import { validatePhone } from '../../utils/validators';

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
      !form.full_name && 'full_name',
      !form.phone_number && 'phone_number',
      !form.address && 'address',
      !form.government_id_type && 'government_id_type',
      !form.government_id_number && 'government_id_number',
      !form.profile_photo_url && !profilePhoto && 'profile_photo',
      !form.identity_proof_url && !identityProof && 'identity_proof',
    ].filter(Boolean) as string[];
  }

  function validateLawyerExtra() {
    return [
      !form.bar_council_id && 'bar_council_id',
      !form.license_state && 'license_state',
      !form.years_experience && 'years_experience',
      !form.firm_name && 'firm_name',
      !form.office_address && 'office_address',
      !form.signature_url && !signature && 'signature',
      !form.bar_certificate_url && !barCertificate && 'bar_certificate',
    ].filter(Boolean) as string[];
  }

  async function saveProfile() {
    const missing = [...validateClientCommon(), ...(isLawyer ? validateLawyerExtra() : [])];
    if (form.phone_number && !validatePhone(form.phone_number)) {
      if (!missing.includes('phone_number')) missing.push('phone_number');
      showToast('Phone number must be digits only (10-15 digits)', 'error');
      setMissingFields(missing);
      return;
    }
    if (missing.length) {
      setMissingFields(missing);
      showToast(t('profile.missingFields'), 'error');
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
        government_id_number: form.government_id_number || '',
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

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h2>
        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-slate-200">{t('profile.back')}</button>
      </div>

      {isLawyer && (
        <div className="p-3 rounded border bg-amber-50 text-amber-800 text-sm">
          {t('profile.lawyerStatus')}: <strong>{form.verification_status || 'unsubmitted'}</strong>
          <p className="mt-1 text-xs">{t('profile.lawyerNote')}</p>
        </div>
      )}
      <div className="p-3 rounded border bg-slate-50 text-slate-700 text-sm">
        {t('profile.govtStatus')}: <strong>{form.government_id_status || 'unsubmitted'}</strong>
      </div>

      <div className="flex items-center gap-4">
        <img
          src={form.profile_photo_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.profile_photo_url}` : 'https://placehold.co/80x80?text=Photo'}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <label className="text-sm block mb-1">{t('profile.profilePhoto')}</label>
          <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} className={missingFields.includes('profile_photo') ? 'ring-2 ring-red-400 rounded' : ''} />
        </div>
      </div>

      <input className={`w-full px-3 py-2 border rounded ${invalid('full_name')}`} placeholder={t('profile.fullName')} value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <input className={`w-full px-3 py-2 border rounded ${invalid('phone_number')}`} placeholder={t('profile.phoneNumber')} value={form.phone_number || ''} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
      <textarea className={`w-full px-3 py-2 border rounded ${invalid('address')}`} placeholder={t('profile.address')} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select className={`w-full px-3 py-2 border rounded ${invalid('government_id_type')}`} value={form.government_id_type || ''} onChange={(e) => setForm({ ...form, government_id_type: e.target.value as GovIdType })}>
          <option value="">{t('profile.govtIdType')}</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="pan">PAN</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
        </select>
        <input className={`w-full px-3 py-2 border rounded ${invalid('government_id_number')}`} placeholder={t('profile.govtIdNumber')} value={form.government_id_number || ''} onChange={(e) => setForm({ ...form, government_id_number: e.target.value })} />
      </div>

      <div>
        <label className="text-sm block mb-1">{t('profile.identityProof')}</label>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setIdentityProof(e.target.files?.[0] || null)} className={missingFields.includes('identity_proof') ? 'ring-2 ring-red-400 rounded' : ''} />
        {form.identity_proof_url && (
          <a
            className="text-sm text-blue-700 block mt-1"
            target="_blank"
            rel="noreferrer"
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.identity_proof_url}`}
          >
            View existing identity proof
          </a>
        )}
      </div>

      {isLawyer && (
        <>
          <input className={`w-full px-3 py-2 border rounded ${invalid('bar_council_id')}`} placeholder={t('profile.barCouncilId')} value={form.bar_council_id || ''} onChange={(e) => setForm({ ...form, bar_council_id: e.target.value })} />
          <input className={`w-full px-3 py-2 border rounded ${invalid('license_state')}`} placeholder={t('profile.licenseState')} value={form.license_state || ''} onChange={(e) => setForm({ ...form, license_state: e.target.value })} />
          <input className={`w-full px-3 py-2 border rounded ${invalid('years_experience')}`} placeholder={t('profile.yearsExperience')} type="number" value={form.years_experience || ''} onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) || null })} />
          <input className={`w-full px-3 py-2 border rounded ${invalid('firm_name')}`} placeholder={t('profile.firmName')} value={form.firm_name || ''} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} />
          <textarea className={`w-full px-3 py-2 border rounded ${invalid('office_address')}`} placeholder={t('profile.officeAddress')} value={form.office_address || ''} onChange={(e) => setForm({ ...form, office_address: e.target.value })} />
          <div>
            <label className="text-sm block mb-1">{t('profile.uploadSignature')}</label>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setSignature(e.target.files?.[0] || null)} className={missingFields.includes('signature') ? 'ring-2 ring-red-400 rounded' : ''} />
            {form.signature_url && (
              <div className="mt-2">
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.signature_url}`}
                  alt="Signature"
                  className="h-16 object-contain border rounded bg-white"
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm block mb-1">{t('profile.uploadBarCertificate')}</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setBarCertificate(e.target.files?.[0] || null)} className={missingFields.includes('bar_certificate') ? 'ring-2 ring-red-400 rounded' : ''} />
            {form.bar_certificate_url && (
              <a
                className="text-sm text-blue-700 block mt-1"
                target="_blank"
                rel="noreferrer"
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${form.bar_certificate_url}`}
              >
                View existing bar certificate
              </a>
            )}
          </div>
        </>
      )}

      <button onClick={saveProfile} disabled={saving} className="px-6 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-60">
        {saving ? t('profile.saving') : t('profile.saveProfile')}
      </button>
    </div>
  );
}
