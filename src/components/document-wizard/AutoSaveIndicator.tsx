import React from 'react';
import { Cloud, CloudFog, CheckCircle2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'saved' | 'saving' | 'error';
  lastSavedAt?: string;
}

export function AutoSaveIndicator({ status, lastSavedAt }: AutoSaveIndicatorProps) {
  
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      {status === 'saving' && (
        <>
          <CloudFog className="w-4 h-4 animate-pulse text-amber-500" />
          <span>Saving draft...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Saved {lastSavedAt ? `at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'to draft'}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <Cloud className="w-4 h-4 text-rose-500" />
          <span className="text-rose-500">Offline - Changes not saved</span>
        </>
      )}
    </div>
  );
}
