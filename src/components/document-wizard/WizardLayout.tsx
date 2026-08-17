import React from 'react';

interface WizardLayoutProps {
  children: React.ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
