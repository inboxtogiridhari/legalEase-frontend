import { useTranslation } from 'react-i18next';
import { AffidavitData } from '../../types';

interface AffidavitFormProps {
  data: AffidavitData;
  onChange: (data: AffidavitData) => void;
  currentStep: number;
}

export default function AffidavitForm({ data, onChange, currentStep }: AffidavitFormProps) {
  const { t } = useTranslation();

  function updateField(field: keyof AffidavitData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Deponent Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.deponentName')}</label>
            <input
              type="text"
              value={data.deponentName}
              onChange={(e) => updateField('deponentName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.deponentAge')}</label>
              <input
                type="number"
                value={data.deponentAge}
                onChange={(e) => updateField('deponentAge', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.deponentOccupation')}</label>
              <input
                type="text"
                value={data.deponentOccupation}
                onChange={(e) => updateField('deponentOccupation', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.deponentAddress')}</label>
            <textarea
              value={data.deponentAddress}
              onChange={(e) => updateField('deponentAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Affidavit Facts</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.purpose')}</label>
            <input
              type="text"
              value={data.purpose}
              onChange={(e) => updateField('purpose', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.facts')}</label>
            <textarea
              value={data.facts}
              onChange={(e) => updateField('facts', e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Verification Statement</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('affidavit.verification')}</label>
            <textarea
              value={data.verification}
              onChange={(e) => updateField('verification', e.target.value)}
              rows={4}
              placeholder="I hereby verify that the above statements are true..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}
    </div>
  );
}
