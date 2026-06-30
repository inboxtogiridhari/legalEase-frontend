import { Profile } from '../../types';
import { AdminDoc, VerifyMode } from './adminTypes';

interface Props {
  user: Profile;
  documents: AdminDoc[];
  mode: VerifyMode;
  onBack: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function UserDetailView({ user, documents, mode, onBack, onEdit, onApprove, onReject }: Props) {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const idPreview = user.identity_proof_url ? `${apiBase}${user.identity_proof_url}` : '';

  return (
    <div className="bg-white rounded-2xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Verification Workspace</p>
          <h3 className="text-2xl font-semibold">{mode === 'verify' ? 'Dual-Pane ID Review' : 'User Details'}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-200">Back</button>
          <button onClick={onEdit} className="px-4 py-2 rounded-xl bg-[#2980B9] text-white">Edit</button>
        </div>
      </div>

      {mode === 'verify' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Email:</strong> {user.email || '-'}</p>
              <p><strong>Phone:</strong> {user.phone_number || '-'}</p>
              <p><strong>Address:</strong> {user.address || '-'}</p>
              <p><strong>Gov ID:</strong> {user.government_id_type || '-'} / {user.government_id_number || '-'}</p>
              <p><strong>Gov Status:</strong> {user.government_id_status || '-'}</p>
              <p><strong>Lawyer Status:</strong> {user.verification_status || '-'}</p>
              <p><strong>Bar ID:</strong> {user.bar_council_id || '-'}</p>
              <p><strong>License State:</strong> {user.license_state || '-'}</p>
              <p><strong>Experience:</strong> {user.years_experience ?? '-'}</p>
              <p><strong>Firm:</strong> {user.firm_name || '-'}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onApprove} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Approve</button>
              <button onClick={onReject} className="px-4 py-2 rounded-xl bg-rose-600 text-white">Reject</button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Government ID Preview</p>
            <div className="border rounded-2xl overflow-hidden bg-slate-50 min-h-[320px] flex items-center justify-center">
              {idPreview ? (
                <img src={idPreview} alt="Government ID" className="w-full h-full object-contain" />
              ) : (
                <p className="text-slate-500">No ID uploaded</p>
              )}
            </div>
            {idPreview && (
              <a className="text-sm text-blue-700" target="_blank" rel="noreferrer" href={idPreview}>Open Full Resolution</a>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <p><strong>Name:</strong> {user.full_name}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Email:</strong> {user.email || '-'}</p>
          <p><strong>Phone:</strong> {user.phone_number || '-'}</p>
          <p><strong>Address:</strong> {user.address || '-'}</p>
          <p><strong>Gov ID:</strong> {user.government_id_type || '-'} / {user.government_id_number || '-'}</p>
          <p><strong>Gov Status:</strong> {user.government_id_status || '-'}</p>
          <p><strong>Lawyer Status:</strong> {user.verification_status || '-'}</p>
          <p><strong>Bar ID:</strong> {user.bar_council_id || '-'}</p>
          <p><strong>License State:</strong> {user.license_state || '-'}</p>
          <p><strong>Experience:</strong> {user.years_experience ?? '-'}</p>
          <p><strong>Firm:</strong> {user.firm_name || '-'}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold mb-2">Profile Docs</p>
          <div className="space-y-1 text-sm">
            {user.profile_photo_url && <a className="text-blue-700 block" target="_blank" rel="noreferrer" href={`${apiBase}${user.profile_photo_url}`}>Profile Photo</a>}
            {user.identity_proof_url && <a className="text-blue-700 block" target="_blank" rel="noreferrer" href={`${apiBase}${user.identity_proof_url}`}>Identity Proof</a>}
            {user.signature_url && <a className="text-blue-700 block" target="_blank" rel="noreferrer" href={`${apiBase}${user.signature_url}`}>Signature</a>}
            {user.bar_certificate_url && <a className="text-blue-700 block" target="_blank" rel="noreferrer" href={`${apiBase}${user.bar_certificate_url}`}>Bar Certificate</a>}
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Related Documents</p>
          <div className="max-h-44 overflow-auto space-y-2 text-sm">
            {documents.map((d) => (
              <div key={d.id} className="border rounded p-2">
                <p className="font-medium">{d.document_type} ({d.status})</p>
                <p className="text-xs text-slate-500">{new Date(d.created_at).toLocaleString()}</p>
                {(d.attachments || []).map((a, i) => (
                  <a key={i} className="text-blue-700 block truncate" target="_blank" rel="noreferrer" href={`${apiBase}${a.url}`}>{a.name}</a>
                ))}
              </div>
            ))}
            {documents.length === 0 && <p className="text-slate-500">No related documents.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

