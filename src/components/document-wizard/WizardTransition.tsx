import React, { useEffect, useRef } from 'react';
import { useWizard } from './WizardContext';

interface WizardTransitionProps {
  children: React.ReactNode;
}

export function WizardTransition({ children }: WizardTransitionProps) {
  const { currentStep } = useWizard();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // start hidden, then animate in
    el.classList.add('opacity-0', 'translate-y-2');
    requestAnimationFrame(() => {
      el.classList.remove('opacity-0', 'translate-y-2');
      el.classList.add('transition-transform', 'duration-300', 'ease-out', 'opacity-100', 'translate-y-0');
    });

    // focus the first form control for accessibility
    const focusTimer = window.setTimeout(() => {
      const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (input) input.focus();
    }, 120);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [currentStep]);

  return (
    <div key={currentStep} ref={containerRef} className="p-6">
      {children}
    </div>
  );
}

export default WizardTransition;
