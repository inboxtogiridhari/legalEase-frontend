import { useTranslation } from 'react-i18next';
import { RentAgreementData } from '../../types';

interface RentAgreementFormProps {
  data: RentAgreementData;
  onChange: (data: RentAgreementData) => void;
  currentStep: number;
}

export default function RentAgreementForm({ data, onChange, currentStep }: RentAgreementFormProps) {
  const { t } = useTranslation();

  function updateField(field: keyof RentAgreementData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Landlord Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.landlordName')}</label>
            <input
              type="text"
              value={data.landlordName}
              onChange={(e) => updateField('landlordName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.landlordAddress')}</label>
            <textarea
              value={data.landlordAddress}
              onChange={(e) => updateField('landlordAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Tenant Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.tenantName')}</label>
            <input
              type="text"
              value={data.tenantName}
              onChange={(e) => updateField('tenantName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.tenantAddress')}</label>
            <textarea
              value={data.tenantAddress}
              onChange={(e) => updateField('tenantAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Property Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.propertyAddress')}</label>
            <textarea
              value={data.propertyAddress}
              onChange={(e) => updateField('propertyAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.rentAmount')}</label>
              <input
                type="text"
                value={data.rentAmount}
                onChange={(e) => updateField('rentAmount', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.securityDeposit')}</label>
              <input
                type="text"
                value={data.securityDeposit}
                onChange={(e) => updateField('securityDeposit', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <h3 className="text-xl font-semibold text-slate-900">Agreement Terms</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.leasePeriod')}</label>
            <input
              type="text"
              value={data.leasePeriod}
              onChange={(e) => updateField('leasePeriod', e.target.value)}
              placeholder="e.g., 11 months"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.startDate')}</label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('rent.specialTerms')}</label>
            <textarea
              value={data.specialTerms}
              onChange={(e) => updateField('specialTerms', e.target.value)}
              rows={4}
              placeholder="Add any special terms or clauses..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
        </>
      )}
    </div>
  );
}
