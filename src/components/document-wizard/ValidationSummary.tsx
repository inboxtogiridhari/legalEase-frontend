import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationSummaryProps {
  missingFields: string[];
}

export function ValidationSummary({ missingFields }: ValidationSummaryProps) {
  if (!missingFields || missingFields.length === 0) return null;

  return (
    <div className="rounded-lg bg-rose-50 p-4 border border-rose-200 mb-6" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-rose-800">
            Please complete the following required fields to proceed:
          </h3>
          <div className="mt-2 text-sm text-rose-700">
            <ul role="list" className="list-disc space-y-1 pl-5">
              {missingFields.map((field, idx) => (
                <li key={idx} className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
