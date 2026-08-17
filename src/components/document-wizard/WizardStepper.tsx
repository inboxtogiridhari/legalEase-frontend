import React from 'react';
import { Check } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardStepper({ currentStep, totalSteps }: WizardStepperProps) {
  return (
    <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            
            return (
              <li key={stepNum} className={`relative ${stepNum !== totalSteps ? 'pr-8 sm:pr-20' : ''}`}>
                {stepNum !== totalSteps && (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${isCompleted ? 'bg-[#1a237e]' : 'bg-slate-200'}`} />
                  </div>
                )}
                
                <div className="relative flex h-8 items-center justify-center">
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ring-4 ring-white
                      ${isCompleted ? 'bg-[#1a237e] text-white' : isCurrent ? 'bg-white border-2 border-[#1a237e] text-[#1a237e]' : 'bg-white border-2 border-slate-200 text-slate-400'}`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
