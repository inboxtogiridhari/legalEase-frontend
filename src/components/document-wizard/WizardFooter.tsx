import React from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export function WizardFooter({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isLoading,
  nextLabel = 'Next',
  submitLabel = 'Submit'
}: WizardFooterProps) {
  return (
    <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1 || isLoading}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Previous
      </button>

      {currentStep < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1a237e] border border-transparent rounded-lg shadow-sm hover:bg-[#1a237e]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a237e] transition-colors"
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isLoading ? 'Processing...' : submitLabel}
        </button>
      )}
    </div>
  );
}
