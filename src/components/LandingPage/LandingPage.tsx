import { useEffect, useMemo, useState } from 'react';
import { Scale, FileCheck, Shield, Clock, Check, Calculator, Languages, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiEstimateNoticeCost, apiEstimateStampDuty, apiPublicLawyers } from '../../lib/api';
import { Profile } from '../../types';
import { INDIAN_STATES } from '../../constants/indianStates';

const PRICING = [
  {
    name: 'Legal Notice',
    price: 499,
    description: 'Draft & lawyer review',
    features: ['AI-generated draft', 'Single lawyer review', 'Email delivery'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Rent Agreement',
    price: 999,
    description: 'Full rent agreement',
    features: ['AI draft + review', 'Standard clauses', 'Download PDF'],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Affidavit',
    price: 1999,
    description: 'Sworn affidavit',
    features: ['Draft + verification', 'Lawyer attestation', 'Priority support'],
    cta: 'Get Started',
    popular: false,
  },
];

const TRUST = [
  { icon: Shield, title: 'Lawyer-verified', text: 'Every document reviewed by qualified practitioners.' },
  { icon: FileCheck, title: 'Court-ready drafts', text: 'Structured, professional formats you can rely on.' },
  { icon: Clock, title: 'Fast turnaround', text: 'Drafts in minutes, review within 24-48 hours.' },
];

const HERO_VISUALS = [
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwYjE2M2YiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxYTIzN2UiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIyMjAiIGN5PSIxNjAiIHI9IjEyMCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjI1Ii8+PGNpcmNsZSBjeD0iOTgwIiBjeT0iNDYwIiByPSIxODAiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCIvPjxwYXRoIGQ9Ik04MCA1MjAgTDUyMCAzNjAgTDcwMCA0NDAgTDExMjAgMjQwIiBzdHJva2U9IiNkNGFmMzciIHN0cm9rZS13aWR0aD0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwZjFiNGMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNjMyMzgiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48cmVjdCB4PSIxMjAiIHk9IjEyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIHJ4PSIyNCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjE4Ii8+PHJlY3QgeD0iNjIwIiB5PSIyMjAiIHdpZHRoPSI0MjAiIGhlaWdodD0iMjYwIiByeD0iMzAiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCIvPjxwYXRoIGQ9Ik0xNDAgNDYwIEw1MjAgNDIwIEw4NjAgNTAwIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMTIiIGZpbGw9Im5vbmUiIHN0cm9rZS1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=',
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMTE4MjciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxZTI5M2IiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIzMDAiIGN5PSI0MjAiIHI9IjE2MCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjIiLz48Y2lyY2xlIGN4PSI5MjAiIGN5PSIyMDAiIHI9IjEyMCIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA2Ii8+PHBhdGggZD0iTTE0MCAxNDAgTDMyMCAyMjAgTDUyMCAxMjAgTDgyMCAyMjAgTDEwNjAgMTYwIiBzdHJva2U9IiNkNGFmMzciIHN0cm9rZS13aWR0aD0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=='
];



const NOTICE_HUB = [
  { id: 'cheque_bounce', title: 'Cheque Bounce', desc: 'For cheque dishonour cases under NI Act with payment demand timeline.' },
  { id: 'divorce_family', title: 'Divorce / Family', desc: 'For legal communication before divorce or family dispute proceedings.' },
  { id: 'tenant_eviction', title: 'Tenant Eviction', desc: 'For rent default, misuse of property, and termination notice to tenant.' },
  { id: 'money_recovery', title: 'Money Recovery', desc: 'For unpaid dues, friendly loans, and pending repayment disputes.' },
  { id: 'employment_dispute', title: 'Employment Dispute', desc: 'For salary delay, unlawful termination, and service contract breaches.' },
];

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAdmin?: () => void;
}

export default function LandingPage({ onGetStarted, onOpenAdmin }: LandingPageProps) {
  const { t, i18n } = useTranslation();
  const [lawyers, setLawyers] = useState<Profile[]>([]);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [stampState, setStampState] = useState('Maharashtra');
  const [stampRent, setStampRent] = useState('25000');
  const [stampMonths, setStampMonths] = useState('11');
  const [stampResult, setStampResult] = useState<number | null>(null);
  const [noticeType, setNoticeType] = useState<'legal_notice' | 'rent_agreement' | 'affidavit'>('legal_notice');
  const [noticeCost, setNoticeCost] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [lawyerIndex, setLawyerIndex] = useState(0);

  const heroSlides = useMemo(() => {
    const slides = t('landing.heroSlides', { returnObjects: true }) as string[];
    return Array.isArray(slides) && slides.length ? slides : [];
  }, [t]);

  useEffect(() => {
    apiPublicLawyers().then((d) => setLawyers(d.lawyers || [])).catch(() => setLawyers([]));
  }, []);

  useEffect(() => {
    apiEstimateStampDuty({
      state: stampState,
      rent_amount: Number(stampRent),
      lease_months: Number(stampMonths),
      document_type: 'rent_agreement',
    }).then((d) => setStampResult(d.estimated_stamp_duty)).catch(() => setStampResult(null));
  }, [stampState, stampRent, stampMonths]);

  useEffect(() => {
    apiEstimateNoticeCost({ document_type: noticeType }).then((d) => setNoticeCost(d.total)).catch(() => setNoticeCost(null));
  }, [noticeType]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % heroSlides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const lawyerCards = useMemo(() => (
    lawyers.map((lawyer, index) => {
      const location = lawyer.license_state || lawyer.office_address || 'India';
      const experience = `${lawyer.years_experience || 0}+ Years`;
      const practiceAreas = [
        lawyer.role === 'lawyer' ? 'Litigation' : 'Advisory',
        (lawyer.license_state || 'Civil').split(' ')[0],
        lawyer.years_experience && lawyer.years_experience >= 8 ? 'Criminal' : 'Family',
        lawyer.firm_name ? 'Real Estate' : 'Consumer',
      ].filter((value, idx, arr) => arr.indexOf(value) === idx).slice(0, 4);
      const rating = lawyer.rating || (4.4 + (index % 5) * 0.1);
      return {
        ...lawyer,
        location,
        experience,
        practiceAreas,
        rating: rating.toFixed(1),
      };
    })
  ), [lawyers]);

  return (
    <div className="min-h-screen bg-[var(--court-ivory)]">
      <header className="bg-gradient-to-br from-[var(--court-midnight)] via-[var(--court-charcoal)] to-[var(--court-midnight)] text-white">
        <nav className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-lg">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight font-law">LegalEase</span>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Languages className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" />
              <select
                value={i18n.language}
                onChange={(e) => {
                  const lang = e.target.value;
                  i18n.changeLanguage(lang);
                  window.localStorage.setItem('legalease_lang', lang);
                }}
                className="pl-8 pr-3 py-2.5 rounded-lg bg-white text-slate-900"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>
            <button onClick={onGetStarted} className="px-5 py-2.5 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors">{t('nav.signIn')}</button>
            {onOpenAdmin && <button onClick={onOpenAdmin} className="px-5 py-2.5 bg-[var(--court-gold)] text-slate-900 rounded-lg font-semibold hover:brightness-95 transition-colors">{t('nav.admin')}</button>}
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-24 text-center">
          <div className="mb-10 mx-auto max-w-3xl">
            <div className="carousel-scene relative h-[220px] overflow-visible">
              <div className="carousel-track">
                {heroSlides.map((slide, idx) => {
                  const offset = (idx - heroIndex + heroSlides.length) % heroSlides.length;
                  const position = offset === 0 ? 0 : offset === 1 ? 1 : offset === heroSlides.length - 1 ? -1 : 2;
                  if (position === 2) return null;
                  const transform =
                    position === 0
                      ? 'translateX(0px) translateZ(80px) scale(1)'
                      : position === -1
                        ? 'translateX(-180px) translateZ(-40px) rotateY(8deg) scale(0.92)'
                        : 'translateX(180px) translateZ(-40px) rotateY(-8deg) scale(0.92)';
                  const opacity = position === 0 ? 1 : 0.5;
                  const zIndex = position === 0 ? 2 : 1;
                  return (
                    <div
                      key={slide}
                      className="carousel-card"
                      style={{ transform, opacity, zIndex }}
                    >
                      <div className="relative h-[180px] rounded-2xl overflow-hidden border border-white/30 shadow-lg flex items-center justify-center">
                        <img
                          src={HERO_VISUALS[idx % HERO_VISUALS.length]}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-900/35" />
                        <p className="relative z-10 text-xl md:text-2xl font-semibold font-law text-center text-white px-6">
                          {slide}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              {heroSlides.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full transition-all ${heroIndex === idx ? 'w-8 bg-[var(--court-gold)]' : 'w-3 bg-white/40'}`} />
              ))}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-law">{t('landing.headline')}</h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">{t('landing.subhead')}</p>
          <button onClick={onGetStarted} className="px-8 py-4 bg-[var(--court-gold)] text-slate-900 rounded-xl font-semibold text-lg hover:brightness-95 transition-colors shadow-lg">{t('nav.getStarted')}</button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-slate-700" />
              <h3 className="text-xl font-semibold text-slate-900 font-law">{t('landing.stampTitle')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input value={stampState} onChange={(e) => setStampState(e.target.value)} list="indian-states" className="px-3 py-2 border rounded-lg" placeholder={t('landing.stampState')} />
              <datalist id="indian-states">
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state} />
                ))}
              </datalist>
              <input value={stampRent} onChange={(e) => setStampRent(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder={t('landing.stampRent')} />
              <input value={stampMonths} onChange={(e) => setStampMonths(e.target.value)} className="px-3 py-2 border rounded-lg" placeholder={t('landing.stampMonths')} />
            </div>
            <p className="mt-3 text-sm text-slate-700">{t('landing.stampResult')}: <strong>INR {stampResult ?? '-'}</strong></p>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-slate-700" />
              <h3 className="text-xl font-semibold text-slate-900 font-law">{t('landing.noticeCostTitle')}</h3>
            </div>
            <select value={noticeType} onChange={(e) => setNoticeType(e.target.value as 'legal_notice' | 'rent_agreement' | 'affidavit')} className="px-3 py-2 border rounded-lg w-full">
              <option value="legal_notice">Legal Notice</option>
              <option value="rent_agreement">Rent Agreement</option>
              <option value="affidavit">Affidavit</option>
            </select>
            <p className="mt-3 text-sm text-slate-700">{t('landing.estimatedTotal')}: <strong>INR {noticeCost ?? '-'}</strong></p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-3xl font-bold text-slate-900 font-law">{t('landing.noticeHubTitle')}</h2>
            <input value={noticeSearch} onChange={(e) => setNoticeSearch(e.target.value)} placeholder={t('landing.noticeHubSearch')} className="px-4 py-2 border rounded-lg min-w-[260px]" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {NOTICE_HUB.filter((n) => `${n.title} ${n.desc}`.toLowerCase().includes(noticeSearch.toLowerCase())).map((n) => (
              <div key={n.id} className="rounded-xl border p-4 bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-900">{n.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{n.desc}</p>
                <button
                  onClick={() => {
                    window.localStorage.setItem('preferred_notice_type', n.id);
                    onGetStarted();
                  }}
                  className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg"
                >
                  {t('landing.startNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-4 font-law">{t('landing.pricingTitle')}</h2>
        <p className="text-slate-600 text-center mb-12 max-w-xl mx-auto">{t('landing.pricingSubtitle')}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border-2 p-6 ${plan.popular ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-200 bg-white'}`}>
              {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-sm font-medium rounded-full">Most popular</span>}
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-6"><span className="text-3xl font-bold text-slate-900">INR {plan.price}</span><span className="text-slate-500">/ document</span></div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-700"><Check className="w-4 h-4 text-green-600 shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={onGetStarted} className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {lawyers.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10 font-law">{t('landing.trustedTitle')}</h2>
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(212,175,55,0.08),rgba(255,255,255,0.96),rgba(30,58,138,0.08))] px-4 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Legal Advisory Board</p>
                <p className="text-lg font-semibold text-slate-900">Verified advocates across major jurisdictions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLawyerIndex((prev) => Math.max(0, prev - 1))}
                  disabled={lawyerIndex === 0}
                  className="rounded-full bg-[var(--court-midnight)] p-3 text-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setLawyerIndex((prev) => Math.min(Math.max(0, lawyerCards.length - 3), prev + 1))}
                  disabled={lawyerIndex >= Math.max(0, lawyerCards.length - 3)}
                  className="rounded-full bg-[var(--court-gold)] p-3 text-slate-900 disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500"
                style={{ transform: `translateX(calc(-${lawyerIndex} * (33.333% + 1rem)))` }}
              >
                {lawyerCards.map((lawyer) => (
                  <article key={lawyer.id} className="min-w-full md:min-w-[calc(33.333%-1rem)] flex-1 rounded-[2rem] border border-[#d7e0ff] bg-white/90 p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <img
                        src={lawyer.profile_photo_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${lawyer.profile_photo_url}` : 'https://placehold.co/72x72?text=Adv'}
                        className="h-[88px] w-[72px] rounded-md object-cover shadow-sm"
                        alt={lawyer.full_name}
                      />
                      <div>
                        <h3 className="text-2xl font-bold leading-tight text-[#1b3b82]">{lawyer.full_name}</h3>
                        <p className="mt-1 text-lg text-slate-600">{lawyer.location}</p>
                        <p className="mt-3 inline-flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className="h-4 w-4 fill-current" />
                          ))}
                          <span className="text-base text-amber-500">({lawyer.rating})</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 text-slate-700">
                      <p><strong className="text-slate-900">Experience:</strong> {lawyer.experience}</p>
                      <p><strong className="text-slate-900">Registered Court:</strong> {lawyer.firm_name || lawyer.bar_council_id || 'District / Civil Court'}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {lawyer.practiceAreas.map((area) => (
                        <span key={area} className="rounded-full border border-[#d7e0ff] bg-[#f3f7ff] px-4 py-2 text-base text-[#2856ff]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 font-law">{t('landing.readyTitle')}</h2>
          <p className="text-slate-300 mb-8">{t('landing.readySubtitle')}</p>
          <button onClick={onGetStarted} className="px-8 py-4 bg-[var(--court-gold)] text-slate-900 rounded-xl font-semibold hover:brightness-95 transition-colors">{t('nav.signIn')}</button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">{t('landing.footer')}</footer>
    </div>
  );
}



