import { ReactNode, useState } from 'react';
import { Bell, LifeBuoy, LogOut, Scale, UserCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastProvider';
import FloatingHelpdeskLauncher from '../AI/FloatingHelpdeskLauncher';
import SupportDrawer from '../Support/SupportDrawer';

interface DashboardLayoutProps {
  children: ReactNode;
  onProfileClick?: () => void;
  sidebar?: ReactNode;
}

export default function DashboardLayout({ children, onProfileClick, sidebar }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { unread, togglePanel } = useToast();
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const rawLang = window.localStorage.getItem('legalease_lang');
  const chatLanguage = rawLang === 'hi' ? 'hindi' : rawLang === 'en' ? 'english' : 'hinglish';

  const TopBar = () => (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {sidebar ? (
            <button
              className="md:hidden rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <button onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--court-midnight)] shadow-card">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
              <span className="text-base font-semibold text-slate-900">LegalEase</span>
              <span className="text-xs text-slate-500">Client command center</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            title="Help and Support"
          >
            <LifeBuoy className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={togglePanel}
            className="relative rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
                {unread}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <button onClick={onProfileClick} className="flex items-center gap-3 focus:outline-none">
              <div className="h-10 w-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {profile?.profile_photo_url ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${profile.profile_photo_url}?t=${new Date(profile.updated_at).getTime() || Date.now()}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-full w-full text-slate-400" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 leading-none">{profile?.full_name || 'Client'}</p>
                <p className="text-xs text-slate-500 leading-none capitalize">{profile?.role}</p>
              </div>
            </button>
          </div>

          <button
            onClick={async () => {
              try {
                await signOut();
              } finally {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-rose-50 hover:text-rose-700 md:inline-flex"
          >
            Logout
          </button>

          <button
            onClick={async () => {
              try {
                await signOut();
              } finally {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-rose-50 hover:text-rose-700 md:hidden"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc]">
      {sidebar && (
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200">
            <button onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="flex items-center gap-2">
              <div className="bg-[#1a237e] p-1.5 rounded-lg">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">LegalEase</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {sidebar}
          </div>
        </aside>
      )}

      {sidebar && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="bg-[#1a237e] p-1.5 rounded-lg">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">LegalEase</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-900 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6" onClick={() => setMobileMenuOpen(false)}>
              {sidebar}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      <SupportDrawer open={supportOpen} onClose={() => setSupportOpen(false)} />
      <FloatingHelpdeskLauncher defaultLanguage={chatLanguage} />
    </div>
  );
}
