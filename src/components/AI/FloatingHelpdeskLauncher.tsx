import { lazy, Suspense, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const HelpdeskChatbot = lazy(() => import('./HelpdeskChatbot'));

interface FloatingHelpdeskLauncherProps {
  defaultLanguage?: 'english' | 'hindi' | 'hinglish';
}

export default function FloatingHelpdeskLauncher({ defaultLanguage = 'hinglish' }: FloatingHelpdeskLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col items-end gap-3">
        {open && (
          <div className="helpdesk-slide-up relative w-[min(26rem,calc(100vw-1.5rem))]">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow hover:bg-white">
              <X className="h-4 w-4" />
            </button>
            <Suspense fallback={<div className="p-5 text-sm text-slate-500">Loading AI help desk...</div>}>
              <HelpdeskChatbot defaultLanguage={defaultLanguage} />
            </Suspense>
          </div>
        )}

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="group flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] px-5 py-4 text-sm font-semibold text-white shadow-2xl transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="h-5 w-5" />
          Chat
        </button>
      </div>
    </>
  );
}
