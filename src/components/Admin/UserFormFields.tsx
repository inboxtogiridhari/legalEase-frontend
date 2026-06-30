import { UserFormData, UserFormFiles } from './adminTypes';

interface Props {
  form: UserFormData;
  files: UserFormFiles;
  setForm: (next: UserFormData) => void;
  setFiles: (next: UserFormFiles) => void;
  mode: 'create' | 'edit';
}

export default function UserFormFields({ form, files, setForm, setFiles, mode }: Props) {
  const isLawyer = form.role === 'lawyer';

  function update<K extends keyof UserFormData>(key: K, value: UserFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  function updateFile<K extends keyof UserFormFiles>(key: K, file: File | null) {
    setFiles({ ...files, [key]: file });
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <select value={form.role} onChange={(e) => update('role', e.target.value as UserFormData['role'])} className="px-3 py-2 border rounded-lg">
          <option value="client">Client</option>
          <option value="lawyer">Lawyer</option>
        </select>
        <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Full name*" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={form.email} onChange={(e) => update('email', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Email" />
        <input value={form.password} onChange={(e) => update('password', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder={mode === 'create' ? 'Password (optional)' : 'New password (optional)'} type="password" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Phone number" />
        <label className="flex items-center gap-2 text-sm text-slate-700 border rounded-lg px-3 py-2">
          <input type="checkbox" checked={form.phone_verified} onChange={(e) => update('phone_verified', e.target.checked)} /> Phone verified
        </label>
      </div>

      <textarea value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Address" />

      <div className="grid md:grid-cols-3 gap-3">
        <select value={form.government_id_type} onChange={(e) => update('government_id_type', e.target.value as UserFormData['government_id_type'])} className="px-3 py-2 border rounded-lg">
          <option value="">Gov ID Type</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="pan">PAN</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
        </select>
        <input value={form.government_id_number} onChange={(e) => update('government_id_number', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Gov ID Number" />
        <select value={form.government_id_status} onChange={(e) => update('government_id_status', e.target.value as UserFormData['government_id_status'])} className="px-3 py-2 border rounded-lg">
          <option value="unsubmitted">ID: Unsubmitted</option>
          <option value="pending">ID: Pending</option>
          <option value="verified">ID: Verified</option>
          <option value="rejected">ID: Rejected</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600">Profile photo file</label>
          <input type="file" accept=".jpg,.jpeg,.png" className="w-full px-3 py-2 border rounded-lg" onChange={(e) => updateFile('profile_photo', e.target.files?.[0] || null)} />
          {form.profile_photo_url && <p className="text-xs text-slate-500 mt-1">Current: {form.profile_photo_url}</p>}
        </div>
        <div>
          <label className="text-xs text-slate-600">Identity proof file</label>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="w-full px-3 py-2 border rounded-lg" onChange={(e) => updateFile('identity_proof', e.target.files?.[0] || null)} />
          {form.identity_proof_url && <p className="text-xs text-slate-500 mt-1">Current: {form.identity_proof_url}</p>}
        </div>
      </div>

      {isLawyer && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.bar_council_id} onChange={(e) => update('bar_council_id', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Bar Council ID" />
            <input value={form.license_state} onChange={(e) => update('license_state', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="License State" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.years_experience} onChange={(e) => update('years_experience', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Years Experience" type="number" />
            <input value={form.firm_name} onChange={(e) => update('firm_name', e.target.value)} className="px-3 py-2 border rounded-lg" placeholder="Firm Name" />
          </div>
          <textarea value={form.office_address} onChange={(e) => update('office_address', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Office Address" />
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600">Signature file (image)</label>
              <input type="file" accept=".jpg,.jpeg,.png" className="w-full px-3 py-2 border rounded-lg" onChange={(e) => updateFile('signature', e.target.files?.[0] || null)} />
              {form.signature_url && <p className="text-xs text-slate-500 mt-1">Current: {form.signature_url}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-600">Bar certificate file</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="w-full px-3 py-2 border rounded-lg" onChange={(e) => updateFile('bar_certificate', e.target.files?.[0] || null)} />
              {form.bar_certificate_url && <p className="text-xs text-slate-500 mt-1">Current: {form.bar_certificate_url}</p>}
            </div>
          </div>
          <select value={form.verification_status} onChange={(e) => update('verification_status', e.target.value as UserFormData['verification_status'])} className="px-3 py-2 border rounded-lg w-full">
            <option value="unsubmitted">Lawyer: Unsubmitted</option>
            <option value="pending">Lawyer: Pending</option>
            <option value="verified">Lawyer: Verified</option>
            <option value="rejected">Lawyer: Rejected</option>
          </select>
        </>
      )}
    </div>
  );
}
