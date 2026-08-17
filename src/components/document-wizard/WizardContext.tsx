import React, { createContext, useContext, useState, useMemo } from 'react';

interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (n: number) => void;
  next: () => void;
  previous: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);


interface WizardProviderProps {
  children: React.ReactNode;
  initialStep?: number;
  totalSteps: number;
  controlledStep?: number;
  onStepChange?: (n: number) => void;
}

export function WizardProvider({ children, initialStep = 1, totalSteps, controlledStep, onStepChange }: WizardProviderProps) {
  const [internalStep, setInternalStep] = useState<number>(initialStep);
  const currentStep = controlledStep !== undefined ? controlledStep : internalStep;

  const setCurrentStep = (n: number) => {
    if (onStepChange) onStepChange(n);
    if (controlledStep === undefined) setInternalStep(n);
  };

  const value = useMemo(() => ({
    currentStep,
    totalSteps,
    setCurrentStep: (n: number) => setCurrentStep(n),
    next: () => setCurrentStep(Math.min(totalSteps, currentStep + 1)),
    previous: () => setCurrentStep(Math.max(1, currentStep - 1)),
  }), [currentStep, totalSteps, setCurrentStep]);

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
