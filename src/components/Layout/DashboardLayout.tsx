import { ReactNode, useState } from 'react';
import { LifeBuoy, LogOut, Scale, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import FloatingHelpdeskLauncher from '../AI/FloatingHelpdeskLauncher';
import SupportDrawer from '../Support/SupportDrawer';

interface DashboardLayoutProps {
  children: ReactNode;
  onProfileClick?: () => void;
}

export default function DashboardLayout({ children, onProfileClick }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);
  const rawLang = window.localStorage.getItem('legalease_lang');
  const chatLanguage = rawLang === 'hi' ? 'hindi' : rawLang === 'en' ? 'english' : 'hinglish';

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-3 text-left"
              title="Go to home"
            >
              <div className="bg-white p-2 rounded-lg">
                <Scale className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold">LegalEase</h1>
                <p className="text-xs text-slate-300">
                  {profile?.role === 'lawyer' ? 'Lawyer Portal' : 'Client Portal'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-slate-300 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={() => setSupportOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Help and Support"
              >
                <LifeBuoy className="w-5 h-5" />
              </button>
              {onProfileClick && (
                <button
                  onClick={onProfileClick}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Profile"
                >
                  {profile?.profile_photo_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${profile.profile_photo_url}?t=${new Date(profile.updated_at).getTime() || Date.now()}`}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-slate-600"
                    />
                  ) : (
                    <UserCircle className="w-7 h-7" />
                  )}
                </button>
              )}
              <button
                onClick={signOut}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <SupportDrawer open={supportOpen} onClose={() => setSupportOpen(false)} />
      <FloatingHelpdeskLauncher defaultLanguage={chatLanguage} />
    </div>
  );
}
