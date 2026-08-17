import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import ClientDashboard from './components/ClientDashboard/ClientDashboard';
import LawyerDashboard from './components/LawyerDashboard/LawyerDashboard';
import LandingPage from './components/LandingPage/LandingPage';
import AdversaryPortal from './components/AdversaryPortal/AdversaryPortal';
import { ToastProvider } from './components/Toast/ToastProvider';
import AdminPanel from './components/Admin/AdminPanel';

type ClientServiceRoute = 'legal_notice' | 'rent_agreement' | 'affidavit' | null;

export function spaNavigate(to: string) {
  if (window.location.pathname !== to) {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath.startsWith('/notice/verify/') || currentPath.startsWith('/verify/')) {
    const secureToken = currentPath.startsWith('/verify/')
      ? currentPath.replace('/verify/', '').split('/')[0]
      : currentPath.replace('/notice/verify/', '').split('/')[0];
    return <AdversaryPortal secureToken={secureToken} />;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="text-center" style={{ textAlign: 'center' }}>
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-white mb-4"
            style={{ width: 48, height: 48, border: '4px solid #334155', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}
          />
          <p className="text-white" style={{ color: '#fff', marginTop: 16 }}>Loading LegalEase...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    if (showAdmin) return <AdminPanel onBack={() => setShowAdmin(false)} />;
    if (showAuth || currentPath === '/login' || currentPath === '/signup') {
      return <AuthPage onBackToLanding={() => setShowAuth(false)} onOpenAdmin={() => setShowAdmin(true)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} onOpenAdmin={() => setShowAdmin(true)} />;
  }

  if (profile.role === 'lawyer') {
    return <LawyerDashboard />;
  }

  const clientRouteMap: Record<string, ClientServiceRoute> = {
    '/dashboard/legal-notice': 'legal_notice',
    '/dashboard/legal-notices': 'legal_notice',
    '/notice-form': 'legal_notice',
    '/dashboard/rent-agreement': 'rent_agreement',
    '/dashboard/rent-agreements': 'rent_agreement',
    '/rent-form': 'rent_agreement',
    '/dashboard/affidavit': 'affidavit',
    '/dashboard/affidavits': 'affidavit',
    '/affidavit-form': 'affidavit',
  };

  return <ClientDashboard serviceRoute={clientRouteMap[currentPath] || null} />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
