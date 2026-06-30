import UserFormFields from './UserFormFields';
import { UserFormData, UserFormFiles } from './adminTypes';

interface Props {
  open: boolean;
  title: string;
  form: UserFormData;
  files: UserFormFiles;
  onClose: () => void;
  onSubmit: () => void;
  setForm: (next: UserFormData) => void;
  setFiles: (next: UserFormFiles) => void;
  mode: 'create' | 'edit';
}

export default function UserFormModal({ open, title, form, files, onClose, onSubmit, setForm, setFiles, mode }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-200">Close</button>
        </div>
        <UserFormFields form={form} files={files} setForm={setForm} setFiles={setFiles} mode={mode} />
        <div className="flex justify-end mt-4">
          <button onClick={onSubmit} className="px-5 py-2 rounded bg-slate-900 text-white">Save</button>
        </div>
      </div>
    </div>
  );
}
