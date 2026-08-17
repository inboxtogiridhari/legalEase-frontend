import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Profile } from '../types';
import { apiMe, apiSignIn, apiSignUp, getAuthToken, setAuthToken } from '../lib/api';

interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'client' | 'lawyer', phoneNumber?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Timeout guard: if the backend doesn't respond within 8s, clear the
    // stale token and continue as unauthenticated instead of hanging forever.
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timed out – clearing stale token');
      setAuthToken(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }, 8000);

    apiMe()
      .then((data) => {
        clearTimeout(timeoutId);
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setAuthToken(null);
        setUser(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function refreshProfile() {
    const data = await apiMe();
    setUser(data.user);
    setProfile(data.profile);
  }

  async function signUp(email: string, password: string, fullName: string, role: 'client' | 'lawyer', phoneNumber?: string) {
    const data = await apiSignUp({
      email,
      password,
      full_name: fullName,
      role,
      phone_number: phoneNumber,
    });
    setAuthToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
  }

  async function signIn(email: string, password: string) {
    const data = await apiSignIn({
      email,
      password,
    });
    setAuthToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
  }

  async function signOut() {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
