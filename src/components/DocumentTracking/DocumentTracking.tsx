import React from 'react';
import { CheckCircle2, Clock, User, ShieldCheck, FileText, ArrowRight, Info } from 'lucide-react';
import { Document } from '../../types';
import { LIFECYCLE_STAGES, getContextualGuidance, mapDocumentStatus } from '../../utils/documentLifecycle';

interface DocumentTrackingProps {
  document: Document;
}

export function DocumentTracking({ document }: DocumentTrackingProps) {
  const statusMeta = mapDocumentStatus(document);
  const guidance = getContextualGuidance(document);
  const timelineEvents = document.timeline_events || [];

  // Determine current stage index in LIFECYCLE_STAGES
  const currentStageIndex = LIFECYCLE_STAGES.findIndex(
    (stage) => stage.id === document.status
  );
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 1;

  return (
    <div className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Contextual Guidance Banner */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--court-midnight)] text-white shadow-sm">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {guidance.whereAmI}
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Status: {statusMeta.label}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900 mb-1">What Happened?</p>
                <p className="text-slate-600">{guidance.whatHappened}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900 mb-1">What Happens Next?</p>
                <p className="text-slate-600">{guidance.whatHappensNext}</p>
              </div>
            </div>
            {guidance.whatToDo && (
              <div className="rounded-2xl border border-[#1a237e]/20 bg-[#1a237e]/5 p-4 text-sm font-medium text-[#1a237e]">
                <strong>Action Required:</strong> {guidance.whatToDo}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-6">Document Progress Lifecycle</h4>
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex || document.status === 'completed' || document.status === 'delivered';
            const isCurrent = idx === activeIndex && document.status !== 'completed' && document.status !== 'delivered';

            return (
              <div key={stage.id} className="relative flex items-start gap-4">
                {/* Dot / Icon */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrent
                      ? 'border-[#1a237e] bg-white text-[#1a237e] ring-4 ring-[#1a237e]/10'
                      : 'border-slate-300 bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-bold ${isCurrent ? 'text-[#1a237e]' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-[#1a237e]/10 px-3 py-0.5 text-xs font-semibold text-[#1a237e]">
                        Current Stage
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit History Timeline */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">Detailed Event Log</h4>
        {timelineEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Tracking history will appear here as your document progresses.
          </div>
        ) : (
          <div className="space-y-3">
            {timelineEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 border border-slate-200 text-slate-700">
                    {evt.actor === 'lawyer' ? <ShieldCheck className="h-4 w-4 text-indigo-600" /> : <User className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">{evt.stage.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">Actor: {evt.actor || 'System'}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  {new Date(evt.at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
