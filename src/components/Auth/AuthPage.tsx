import { useMemo, useState } from 'react';
import { Scale, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiForgotPassword, apiRequestOtp, apiResetPassword, apiVerifyOtp, setAuthToken } from '../../lib/api';
import { useToast } from '../Toast/ToastProvider';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validatePassword(value: string, isSignup: boolean) {
  if (!value) return 'Please enter your password.';
  if (isSignup && value.length < 6) return 'Password must be at least 6 characters long.';
  return '';
}

interface AuthPageProps {
  onBackToLanding?: () => void;
  onOpenAdmin?: () => void;
}

export default function AuthPage({ onBackToLanding, onOpenAdmin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Serves as identifier for OTP
  const [role, setRole] = useState<'client' | 'lawyer'>('client');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; fullName?: string; phoneNumber?: string }>({});
  const { signIn, signUp, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const otpStatusMessage = useMemo(() => {
    if (role === 'lawyer') {
      return 'OTP verification is not configured for this environment. Use email/password login for lawyer access.';
    }
    return 'OTP-based login is available when the backend provider is configured.';
  }, [role]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof fieldErrors = {};

    if (!isValidEmail(email)) nextErrors.email = 'Please enter a valid email address.';
    const passwordError = validatePassword(password, mode === 'signup');
    if (passwordError) nextErrors.password = passwordError;
    if (mode === 'signup') {
      if (!fullName.trim()) nextErrors.fullName = 'Please enter your full name.';
      if (phoneNumber.trim() && !/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
        nextErrors.phoneNumber = 'Phone number must contain 10-15 digits only.';
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        showToast('Signed in successfully.', 'success');
      } else {
        await signUp(email.trim(), password, fullName.trim(), role, phoneNumber.trim() || undefined);
        showToast('Your account was created successfully.', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpRequest() {
    if (!phoneNumber.trim()) {
      showToast('Please enter an email or phone number', 'error');
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
        showToast(result.note || 'OTP Sent successfully', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      showToast('Please enter an email or phone number', 'error');
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
      await refreshProfile();
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
        showToast(data.note || t('errors.resetSent'), 'success');
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents matching landing page */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-100/50 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-100/50 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {onBackToLanding && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('nav.backHome')}
            </button>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-amber-600 hover:text-amber-700 transition-colors text-sm font-medium"
              >
                {t('nav.openAdmin')}
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
          <div className="flex justify-center mb-8">
            <div className="bg-brand-600 p-3 rounded-xl shadow-md shadow-brand-600/20">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-law font-bold text-center text-slate-900 mb-2">
            {t('auth.title')}
          </h1>
          <p className="text-center text-slate-500 mb-8 text-sm">
            {t('auth.subtitle')}
          </p>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 border border-slate-200">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMode('login')}
            >
              {t('auth.login')}
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMode('signup')}
            >
              {t('auth.signup')}
            </button>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {otpStatusMessage}
              </div>
              {mode === 'signup' && (
                <>
                  <Input
                    label={t('auth.fullName')}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    error={fieldErrors.fullName}
                  />
                  <Input
                    label={t('auth.phoneOptional')}
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit number"
                    error={fieldErrors.phoneNumber}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">Account Type</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'client' | 'lawyer')}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20 focus-visible:border-brand-600"
                    >
                      <option value="client">{t('auth.client')}</option>
                      <option value="lawyer">{t('auth.lawyer')}</option>
                    </select>
                  </div>
                </>
              )}
              
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                error={fieldErrors.email}
              />
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  error={fieldErrors.password}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.processing')}
                  </span>
                ) : mode === 'login' ? (
                  t('auth.signIn')
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <Input
                label="Email or Phone Number"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Email or 10-digit number"
                required
                disabled={otpSent}
              />
              
              {!otpSent ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={handleOtpRequest}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.sendOtp')}
                </Button>
              ) : (
                <>
                  <Input
                    label={t('auth.enterOtp')}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    required
                  />
                  <Input
                    label={t('auth.fullNameFirst')}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma (if new user)"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">Account Type (if new user)</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'client' | 'lawyer')}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20 focus-visible:border-brand-600"
                    >
                      <option value="client">{t('auth.client')}</option>
                      <option value="lawyer">{t('auth.lawyer')}</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.verifyOtp')}
                  </Button>
                </>
              )}
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-5">
              {!resetToken ? (
                <>
                  <Input
                    label={t('auth.registeredEmail')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.requestReset')}
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label={t('auth.resetToken')}
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                  />
                  <Input
                    label={t('auth.newPassword')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.resetPassword')}
                  </Button>
                </>
              )}
            </div>
          )}

          {mode !== 'otp' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'otp' : 'login')}
                className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
              >
                {mode === 'login' ? 'Login with OTP instead' : 'Back to Login'}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-8 text-center px-4">
            {t('auth.socialNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
