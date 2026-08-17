import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WizardHeaderProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function WizardHeader({ title, onClose, children }: WizardHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="px-8 py-6 border-b border-slate-100 bg-white">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('nav.backHome')}
      </button>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}
