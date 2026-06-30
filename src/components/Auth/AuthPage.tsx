import { useState } from 'react';
import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiForgotPassword, apiRequestOtp, apiResetPassword, apiVerifyOtp, setAuthToken } from '../../lib/api';
import { useToast } from '../Toast/ToastProvider';

interface AuthPageProps {
  onBackToLanding?: () => void;
  onOpenAdmin?: () => void;
}

export default function AuthPage({ onBackToLanding, onOpenAdmin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'client' | 'lawyer'>('client');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, role, phoneNumber);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpRequest() {
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      showToast(t('errors.enterPhone'), 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequestOtp({ phone_number: phoneNumber });
      setOtpSent(true);
      if (result.sms_warning) {
        showToast(result.sms_warning, 'info');
      }
      if (result.dev_otp) {
        showToast(`Dev OTP: ${result.dev_otp}`, 'info');
      } else {
        showToast(t('errors.otpSent'), 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      showToast(t('errors.enterPhone'), 'error');
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      showToast(t('errors.enterOtp'), 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await apiVerifyOtp({
        phone_number: phoneNumber,
        otp,
        full_name: fullName || undefined,
        role: role || undefined,
      });
      setAuthToken(data.token);
      showToast(t('errors.otpVerified'), 'success');
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.otpFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setLoading(true);
    try {
      const data = await apiForgotPassword({ email });
      if (data.dev_reset_token) {
        setResetToken(data.dev_reset_token);
        showToast(`Dev reset token: ${data.dev_reset_token}`, 'info');
      } else {
        showToast(t('errors.resetSent'), 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setLoading(true);
    try {
      await apiResetPassword({ reset_token: resetToken, new_password: newPassword });
      showToast(t('errors.resetSuccess'), 'success');
      setMode('login');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.resetFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {onBackToLanding && (
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBackToLanding} className="text-slate-400 hover:text-white text-sm">
              {t('nav.backHome')}
            </button>
            {onOpenAdmin && (
              <button onClick={onOpenAdmin} className="text-amber-300 hover:text-amber-200 text-sm">
                {t('nav.openAdmin')}
              </button>
            )}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-900 p-3 rounded-xl">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">{t('auth.title')}</h1>
          <p className="text-center text-slate-600 mb-6">{t('auth.subtitle')}</p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <button className={`py-2 rounded ${mode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setMode('login')}>{t('auth.login')}</button>
            <button className={`py-2 rounded ${mode === 'signup' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setMode('signup')}>{t('auth.signup')}</button>
            <button className={`py-2 rounded ${mode === 'otp' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setMode('otp')}>{t('auth.otp')}</button>
            <button className={`py-2 rounded ${mode === 'forgot' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setMode('forgot')}>{t('auth.forgot')}</button>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.fullName')} className="w-full px-4 py-2 border rounded-lg" required />
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={t('auth.phoneOptional')} className="w-full px-4 py-2 border rounded-lg" />
                  <select value={role} onChange={(e) => setRole(e.target.value as 'client' | 'lawyer')} className="w-full px-4 py-2 border rounded-lg">
                    <option value="client">{t('auth.client')}</option>
                    <option value="lawyer">{t('auth.lawyer')}</option>
                  </select>
                </>
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.email')} className="w-full px-4 py-2 border rounded-lg" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.password')} className="w-full px-4 py-2 border rounded-lg" required minLength={6} />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? t('common.processing') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={t('auth.phone')} className="w-full px-4 py-2 border rounded-lg" required />
              {!otpSent && (
                <button type="button" onClick={handleOtpRequest} className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold" disabled={loading}>
                  {t('auth.sendOtp')}
                </button>
              )}
              {otpSent && (
                <>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={t('auth.enterOtp')} className="w-full px-4 py-2 border rounded-lg" required />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.fullNameFirst')} className="w-full px-4 py-2 border rounded-lg" />
                  <select value={role} onChange={(e) => setRole(e.target.value as 'client' | 'lawyer')} className="w-full px-4 py-2 border rounded-lg">
                    <option value="client">{t('auth.client')}</option>
                    <option value="lawyer">{t('auth.lawyer')}</option>
                  </select>
                  <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                    {t('auth.verifyOtp')}
                  </button>
                </>
              )}
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.registeredEmail')} className="w-full px-4 py-2 border rounded-lg" />
              <button type="button" onClick={handleForgotPassword} className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold" disabled={loading}>
                {t('auth.requestReset')}
              </button>
              <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder={t('auth.resetToken')} className="w-full px-4 py-2 border rounded-lg" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('auth.newPassword')} className="w-full px-4 py-2 border rounded-lg" />
              <button type="button" onClick={handleResetPassword} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold" disabled={loading}>
                {t('auth.resetPassword')}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6 text-center">
            {t('auth.socialNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
