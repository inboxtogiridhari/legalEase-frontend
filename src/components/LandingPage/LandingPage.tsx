import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileCheck,
  Menu,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiEstimateNoticeCost, apiEstimateStampDuty, apiPublicLawyers } from '../../lib/api';
import { Profile } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const PRICING = [
  {
    name: 'Legal Notice',
    price: 499,
    description: 'Draft & lawyer review',
    features: ['AI-assisted draft', 'Lawyer verification', 'Email delivery'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Rent Agreement',
    price: 999,
    description: 'Full rent agreement',
    features: ['Custom rental terms', 'Stamp duty estimate', 'Download PDF'],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Affidavit',
    price: 1999,
    description: 'Sworn affidavit',
    features: ['Verified affidavit text', 'Lawyer attestation', 'Priority support'],
    cta: 'Get Started',
    popular: false,
  },
];

const TRUST_CARDS = [
  {
    icon: Shield,
    title: 'Secure workflow',
    text: 'Document details are collected with secure guided forms and clear verification checkpoints.',
  },
  {
    icon: BadgeCheck,
    title: 'Lawyer review',
    text: 'Qualified advocates review every draft before final delivery.',
  },
  {
    icon: CircleDollarSign,
    title: 'Transparent pricing',
    text: 'One-time, per-document fees with clear expectations and no subscriptions.',
  },
];

const DOCUMENTS = [
  {
    title: 'Legal Notice',
    description: 'A formal communication to resolve disputes, drafted with the right legal demand structure.',
    icon: FileCheck,
    type: 'legal_notice',
    cta: 'Create Legal Notice',
  },
  {
    title: 'Rent Agreement',
    description: 'A complete tenancy agreement with standard terms, stamp duty support, and download-ready format.',
    icon: ClipboardList,
    type: 'rent_agreement',
    cta: 'Create Rent Agreement',
  },
  {
    title: 'Affidavit',
    description: 'A sworn statement with verification language, prepared for legal filing and review.',
    icon: BookOpen,
    type: 'affidavit',
    cta: 'Create Affidavit',
  },
];

const WORKFLOW_STEPS = [
  {
    icon: ClipboardList,
    title: 'Share your details',
    text: 'Answer guided prompts so your case information is captured accurately.',
  },
  {
    icon: Sparkles,
    title: 'AI-assisted draft',
    text: 'LegalEase generates a structured draft from your input and suggests standard clauses.',
  },
  {
    icon: ShieldCheck,
    title: 'Lawyer verification',
    text: 'An advocate reviews the draft, ensures accuracy, and approves the final document.',
  },
  {
    icon: Truck,
    title: 'Delivery tracking',
    text: 'Track soft copy delivery and courier status from your dashboard.',
  },
  {
    icon: Check,
    title: 'Final document',
    text: 'Download the completed PDF and review delivery status anytime.',
  },
];

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Guided forms',
    text: 'Step-by-step inputs help you finish documents without guessing legal language.',
  },
  {
    icon: CheckCircle2,
    title: 'Autosave',
    text: 'Progress is saved automatically so you can return to your draft any time.',
  },
  {
    icon: Sparkles,
    title: 'AI assistance',
    text: 'AI helps structure your information into professional legal content.',
  },
  {
    icon: Shield,
    title: 'Lawyer workflow',
    text: 'Clear handoff to lawyer review ensures documented legal accuracy.',
  },
  {
    icon: Truck,
    title: 'Document tracking',
    text: 'Monitor every stage from drafting to dispatch and delivery.',
  },
  {
    icon: Calculator,
    title: 'Email & delivery support',
    text: 'Soft copy delivery and status updates make the process complete.',
  },
];

const FAQ = [
  {
    question: 'How is my document handled?',
    answer: 'You submit guided details, receive an AI-assisted draft, and a lawyer reviews the final version before delivery.',
  },
  {
    question: 'Can I see the price before I start?',
    answer: 'Yes. Pricing is shown per document and is clear before you confirm any payment.',
  },
  {
    question: 'What does lawyer verification mean?',
    answer: 'A qualified advocate reviews the draft to confirm structure and legal accuracy before finalization.',
  },
  {
    question: 'How do I track my document?',
    answer: 'Your dashboard shows status updates for review stages, soft copy delivery, and courier dispatch.',
  },
];

const HERO_VISUALS = [
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwYjE2M2YiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxYTIzN2UiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIyMjAiIGN5PSIxNjAiIHI9IjEyMCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjI1Ii8+PGNpcmNsZSBjeD0iOTgwIiBjeT0iNDYwIiByPSIxODAiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCIvPjxwYXRoIGQ9Ik04MCA1MjAgTDUyMCAzNjAgTDcwMCA0NDAgTDExMjAgMjQwIiBzdHJva2U9IiNkNGFmMzciIHN0cm9rZS13aWR0aD0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==',
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMwZjFiNGMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNjMyMzgiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48cmVjdCB4PSIxMjAiIHk9IjEyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSIyNDAiIHJ4PSIyNCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjE4Ii8+PHJlY3QgeD0iNjIwIiB5PSIyMjAiIHdpZHRoPSI0MjAiIGhlaWdodD0iMjYwIiByeD0iMzAiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCIvPjxwYXRoIGQ9Ik0xNDAgNDYwIEw1MjAgNDIwIEw4NjAgNTAwIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMTIiIGZpbGw9Im5vbmUiIHN0cm9rZS1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=',
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMTE4MjciLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxZTI5M2IiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIzMDAiIGN5PSI0MjAiIHI9IjE2MCIgZmlsbD0iI2Q0YWYzNyIgZmlsbC1vcGFjaXR5PSIwLjIiLz48Y2lyY2xlIGN4PSI5MjAiIGN5PSIyMDAiIHI9IjEyMCIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA2Ii8+PHBhdGggZD0iTTE0MCAxNDAgTDMyMCAyMjAgTDUyMCAxMjAgTDgyMCAyMjAgTDEwNjAgMTYwIiBzdHJva2U9IiNkNGFmMzciIHN0cm9rZS13aWR0aD0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=='
];

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAdmin?: () => void;
}

export default function LandingPage({ onGetStarted, onOpenAdmin }: LandingPageProps) {
  const { t } = useTranslation();
  const [lawyers, setLawyers] = useState<Profile[]>([]);
  const [stampState, setStampState] = useState('Maharashtra');
  const [stampRent, setStampRent] = useState('25000');
  const [stampMonths, setStampMonths] = useState('11');
  const [stampResult, setStampResult] = useState<number | null>(null);
  const [noticeType, setNoticeType] = useState<'legal_notice' | 'rent_agreement' | 'affidavit'>('legal_notice');
  const [noticeCost, setNoticeCost] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [lawyerIndex, setLawyerIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    if (!heroSlides.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % heroSlides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const handleCreate = (type: 'legal_notice' | 'rent_agreement' | 'affidavit') => {
    window.localStorage.setItem('preferred_notice_type', type);
    onGetStarted();
  };

  const lawyerCards = useMemo(
    () =>
      lawyers.map((lawyer, index) => {
        const location = lawyer.license_state || lawyer.office_address || 'India';
        const experience = `${lawyer.years_experience || 0}+ Years`;
        const practiceAreas = [
          lawyer.role === 'lawyer' ? 'Litigation' : 'Advisory',
          (lawyer.license_state || 'Civil').split(' ')[0],
          lawyer.years_experience && lawyer.years_experience >= 8 ? 'Criminal' : 'Family',
          lawyer.firm_name ? 'Real Estate' : 'Consumer',
        ]
          .filter((value, idx, arr) => arr.indexOf(value) === idx)
          .slice(0, 4);
        const rating = lawyer.rating || (4.4 + (index % 5) * 0.1);
        return {
          ...lawyer,
          location,
          experience,
          practiceAreas,
          rating: rating.toFixed(1),
        };
      }),
    [lawyers]
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">LegalEase</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {([['#how-it-works', 'How it works'], ['#documents', 'Documents'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']] as const).map(([h, l]) => (
              <a key={h} href={h} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onGetStarted} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">{t('nav.signIn')}</button>
            <Button size="md" onClick={onGetStarted}>{t('nav.getStarted')}</Button>
            {onOpenAdmin && <button onClick={onOpenAdmin} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2">Admin</button>}
          </div>
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </nav>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
              <span className="font-semibold text-slate-900">LegalEase</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 flex flex-col gap-1">
              {([['#how-it-works', 'How it works'], ['#documents', 'Documents'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']] as const).map(([h, l]) => (
                <a key={h} href={h} onClick={() => setMobileOpen(false)} className="px-4 py-3 text-slate-700 font-medium rounded-xl hover:bg-slate-50">{l}</a>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <Button variant="secondary" onClick={() => { setMobileOpen(false); onGetStarted(); }}>{t('nav.signIn')}</Button>
                <Button onClick={() => { setMobileOpen(false); onGetStarted(); }}>{t('nav.getStarted')}</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />Lawyer-reviewed legal documents
              </div>
              <h1 className="font-law text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-slate-900 leading-tight">Legal documents,<br />made simple.</h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-lg">Create legal notices, rent agreements, and affidavits with guided inputs, AI-assisted drafts, and verified lawyer review — all in one workflow.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => handleCreate('legal_notice')}>Create a document</Button>
                <a href="#how-it-works" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  See how it works <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
                {['No subscription', 'Pay per document', 'Lawyer verified'].map(lbl => (
                  <span key={lbl} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-600" />{lbl}</span>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 bg-brand-50 rounded-3xl -z-10" />
              <div className="rounded-2xl border border-slate-200 bg-white shadow-soft-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center gap-3">
                  <div className="flex gap-1.5">{[0, 1, 2].map(i => <div key={i} className="h-2.5 w-2.5 rounded-full bg-slate-300" />)}</div>
                  <span className="mx-auto text-xs text-slate-400">legalease.in/create</span>
                  <div className="w-14" />
                </div>
                <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center"><Scale className="h-3 w-3 text-white" /></div>
                    <span className="text-sm font-semibold">LegalEase</span>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">A</div>
                </div>
                <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-1">
                  {(['Details', 'Review', 'Generate'] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${i === 0 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>{i + 1} {s}</div>
                      {i < 2 && <div className="w-4 h-px bg-slate-200" />}
                    </div>
                  ))}
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Document Type</div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-brand-600" />Legal Notice</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Sender', 'Rahul Sharma'], ['Recipient', 'M/s ABC Ltd.']].map(([lbl, val]) => (
                      <div key={lbl}><div className="text-xs text-slate-500 mb-1">{lbl}</div><div className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{val}</div></div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-brand-400 ring-2 ring-brand-100 px-3 py-2.5 text-sm">Non-payment of dues</div>
                  <div className="flex gap-2 rounded-xl bg-brand-50 border border-brand-100 px-3 py-2.5">
                    <Sparkles className="h-4 w-4 text-brand-600 shrink-0" /><span className="text-xs text-brand-700">AI will structure your draft using standard legal clauses.</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Step 1 of 3</span>
                  <button className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors">Continue →</button>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-6 rounded-xl bg-white border border-slate-200 shadow-soft px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-500" />Lawyer verified
              </div>
              <div className="absolute -top-4 -right-6 rounded-xl bg-white border border-slate-200 shadow-soft px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-brand-600" />Secure workflow
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section id="trust" className="bg-brand-50 border-y border-brand-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <div className="grid sm:grid-cols-3 gap-8">
            {TRUST_CARDS.map(c => (
              <div key={c.title} className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><c.icon className="h-5 w-5" /></div>
                <div><h3 className="font-semibold text-slate-900">{c.title}</h3><p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTS ── */}
      <section id="documents" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Documents</p>
            <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">Trusted drafts for common legal needs</h2>
            <p className="mt-3 text-slate-600 max-w-xl">Choose the document you need and begin with a guided draft, then send it for lawyer review.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {DOCUMENTS.map((doc, i) => (
              <div key={doc.title} className={`lp-card rounded-2xl border bg-white p-6 flex flex-col ${i === 1 ? 'border-brand-300 ring-1 ring-brand-100' : 'border-slate-200'}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${i === 1 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  <doc.icon className="h-5 w-5" />
                </div>
                {i === 1 && <span className="text-xs font-semibold text-brand-600 mb-1">Most requested</span>}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{doc.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{doc.description}</p>
                <Button className="mt-6" variant={i === 1 ? 'primary' : 'secondary'} size="md" onClick={() => handleCreate(doc.type)}>{doc.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-brand-50 border-y border-brand-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">How it works</p>
            <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">From intake to delivery in five steps</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">A clear workflow that keeps your document moving forward with full transparency.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-5 left-[calc(10%+24px)] right-[calc(10%+24px)] h-px bg-slate-200 z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-white ${i === 0 ? 'border-brand-600 text-brand-600' : 'border-slate-300 text-slate-400'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <step.icon className={`h-5 w-5 mt-5 mb-3 ${i === 0 ? 'text-brand-600' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY LEGALEASE ── */}
      <section id="why" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Why LegalEase</p>
            <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">Built for clarity and control</h2>
            <p className="mt-3 text-slate-600 max-w-xl">Guided forms, autosave, lawyer verification, and tracking keep everything on one secure platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_ITEMS.map((item, i) => {
              const wide = (i === 0 || i === 3 || i === 4) ? 'lg:col-span-2' : 'lg:col-span-1';
              return (
                <div key={item.title} className={`lp-card rounded-2xl border border-slate-200 bg-white p-6 ${wide}`}>
                  <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4"><item.icon className="h-5 w-5" /></div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-brand-50 border-y border-brand-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Pricing</p>
            <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">Simple per-document pricing</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">Pay once for the document you need. No subscriptions.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PRICING.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border p-7 bg-white flex flex-col ${plan.popular ? 'border-brand-500 ring-2 ring-brand-100 shadow-soft-lg' : 'border-slate-200 shadow-card'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                  <span className="text-sm text-slate-500 mb-0.5">/ document</span>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />{f}</li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={plan.popular ? 'primary' : 'secondary'} size="lg" onClick={onGetStarted}>{plan.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 lg:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">FAQ</p>
            <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {FAQ.map((item, i) => (
              <div key={item.question}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${openFaq === i ? 'bg-brand-50' : 'bg-white hover:bg-slate-50'}`}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-slate-900">{item.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed bg-brand-50">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAWYERS ── */}
      {lawyers.length > 0 && (
        <section className="bg-brand-50 border-y border-brand-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">Verified lawyers</p>
              <h2 className="font-law text-3xl lg:text-4xl font-bold text-slate-900">Trusted advocates for your documents</h2>
              <p className="mt-3 text-slate-600 max-w-xl mx-auto">Experienced lawyers support review and final verification for your document workflow.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex gap-5 transition-transform duration-500" style={{ transform: `translateX(calc(-${lawyerIndex}*(33.333% + 1.25rem)))` }}>
                {lawyerCards.map(lawyer => (
                  <article key={lawyer.id} className="min-w-full md:min-w-[calc(33.333%-1rem)] flex-1 p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={lawyer.profile_photo_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${lawyer.profile_photo_url}` : 'https://placehold.co/72x72?text=Adv'}
                        className="h-16 w-14 rounded-xl object-cover border border-slate-200"
                        alt={lawyer.full_name}
                      />
                      <div>
                        <h3 className="text-lg font-bold text-brand-900">{lawyer.full_name}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{lawyer.location}</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-1.5 text-sm text-slate-600">
                      <p><span className="font-medium text-slate-800">Experience:</span> {lawyer.experience}</p>
                      <p><span className="font-medium text-slate-800">Court:</span> {lawyer.firm_name || lawyer.bar_council_id || 'District / Civil Court'}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lawyer.practiceAreas.map(area => (
                        <span key={area} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-700">{area}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="border-t border-slate-100 flex justify-center gap-3 px-4 py-4">
                <button onClick={() => setLawyerIndex(p => Math.max(0, p - 1))} disabled={lawyerIndex === 0} className="rounded-full border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setLawyerIndex(p => Math.min(Math.max(0, lawyerCards.length - 3), p + 1))} disabled={lawyerIndex >= Math.max(0, lawyerCards.length - 3)} className="rounded-full border border-brand-200 bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-brand-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <h2 className="font-law text-3xl lg:text-4xl font-bold text-white">Ready to simplify your legal documents?</h2>
          <p className="mt-4 text-lg text-brand-200 max-w-xl mx-auto">Create your first document in minutes. Guided, verified, and delivered.</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors" onClick={() => handleCreate('legal_notice')}>Get started free</Button>
            <a href="#how-it-works" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center"><Scale className="h-3 w-3 text-white" /></div>
              <span className="text-sm font-semibold text-white">LegalEase</span>
            </div>
            <p className="text-sm">Legal documents made simple.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <span>© {new Date().getFullYear()} LegalEase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

