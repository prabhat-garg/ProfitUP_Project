import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  PackagePlus,
  Phone,
  ShoppingBasket,
  Sparkles,
  Upload,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { pricing, siteConfig, businessTypes, weekDays } from '../config/site';
import { Badge, Button, Card, Checkbox, Field, Input, Progress, Select, buttonClass } from '../components/ui';
import { LanguageSwitcher, Logo, ThemeToggle } from '../components/shared';
import type { DataLevel } from '../lib/types';

export function AuthLayout({ children, title, sub, numbered = '01' }: { children: ReactNode; title: string; sub: string; numbered?: string }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-bg/90">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            <Link to="/" className={cn(buttonClass('ghost', 'sm'), 'hidden sm:inline-flex')}>
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>
          </div>
        </div>
      </header>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-70px)] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-16">
          <div className="hidden lg:block">
            <p className="kicker mb-3">{numbered} · {title}</p>
            <h1 className="display max-w-lg text-5xl text-ink xl:text-6xl">Dukaan ka paisa kahan phasa hai?</h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">{sub}</p>
            <div className="mt-8 space-y-3">
              {[
                ['Order list that explains itself', '7 or 15 days, safety %, pack size'],
                ['Works without daily sales entry', 'Bills + stock counts are enough'],
                ['Every estimate is labelled', 'Basic, Good or Best confidence'],
              ].map(([head, body]) => (
                <div key={head} className="flex items-start gap-3 rounded-xl border border-line bg-card p-3">
                  <span className="mt-0.5 rounded-lg bg-primary-soft p-1.5 text-primary"><Check className="h-3.5 w-3.5" /></span>
                  <div><p className="text-sm font-bold">{head}</p><p className="text-xs text-muted">{body}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              <Badge tone="blue">हिंदी</Badge><Badge tone="blue">English</Badge><Badge tone="blue">Hinglish</Badge>
            </div>
          </div>
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, loginDemo, session } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/app';

  if (session) return <Navigate to={from} replace />;

  const sendOtp = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError(t('common.phoneInvalid'));
      return;
    }
    setError('');
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setStage('otp');
    }, 450);
  };

  const verify = () => {
    if (otp !== siteConfig.demoOtp) {
      setError(t('auth.demoNote'));
      return;
    }
    setError('');
    signIn(phone.replace(/\D/g, ''));
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} sub={t('auth.loginSub')} numbered="01">
      <Card className="p-5 sm:p-7">
        <p className="kicker mb-2">LOGIN · 01</p>
        <h2 className="text-2xl font-extrabold tracking-tight">{stage === 'phone' ? t('auth.loginTitle') : t('auth.otpTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{stage === 'phone' ? t('auth.loginSub') : t('auth.otpHint')}</p>

        {stage === 'phone' ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendOtp();
            }}
          >
            <Field label={t('auth.phoneLabel')} error={error} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">+91</span>
                <Input
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  className="pl-12"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
                  autoFocus
                />
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              {t('auth.sendOtp')}
            </Button>
          </form>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              verify();
            }}
          >
            <Field label={t('auth.otpTitle')} error={error}>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="1234"
                maxLength={4}
                className="text-center text-xl font-bold tracking-[0.5em]"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                autoFocus
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={otp.length < 4}>
              <LockKeyhole className="h-4 w-4" /> {t('auth.verify')}
            </Button>
            <button type="button" className="w-full text-center text-xs font-semibold text-muted hover:text-primary" onClick={() => { setStage('phone'); setOtp(''); setError(''); }}>
              {t('auth.changeNumber')}
            </button>
          </form>
        )}

        {siteConfig.demoOtpEnabled && (
          <div className="mt-5 rounded-xl border border-info/20 bg-[var(--info-soft)] p-3 text-xs leading-relaxed text-info">
            <strong>Demo OTP: {siteConfig.demoOtp}.</strong> {t('auth.demoNote')}
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={() => {
            loginDemo();
            navigate('/app');
          }}
          className={cn(buttonClass('secondary', 'lg'), 'w-full')}
        >
          <ShoppingBasket className="h-4 w-4" /> {t('landing.tryDemo')}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          {t('auth.signupTitle')}? <Link to="/signup" className="font-bold text-primary underline underline-offset-2">{t('nav.getStarted')}</Link>
        </p>
      </Card>
      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">{t('common.noBackend')}</p>
    </AuthLayout>
  );
}

export function SignupPage() {
  const { t } = useTranslation();
  const { signUp, loginDemo, session } = useAppData();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    email: '',
    businessName: '',
    businessType: businessTypes[0],
    gstin: '',
    years: '1',
    outletName: 'Main Branch',
    outletCount: '1',
    address: '',
    city: 'Bhopal',
    pin: '',
    language: lang,
    stockDay: '0',
    whatsapp: true,
    consent: false,
  });

  useEffect(() => {
    setForm((current) => ({ ...current, language: lang }));
  }, [lang]);

  if (session) return <Navigate to="/app" replace />;

  const steps = [t('auth.stepOwner'), t('auth.stepBusiness'), t('auth.stepOutlet'), t('auth.stepPrefs')];
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.ownerName.trim() || form.phone.replace(/\D/g, '').length !== 10 || !verified) {
        setError(!verified ? t('auth.verifyPhone') : t('common.phoneInvalid'));
        return false;
      }
    }
    if (step === 1 && !form.businessName.trim()) {
      setError(t('common.requiredField'));
      return false;
    }
    if (step === 2 && (!form.address.trim() || !form.city.trim() || form.pin.replace(/\D/g, '').length !== 6)) {
      setError(t('common.requiredField'));
      return false;
    }
    if (step === 3 && !form.consent) {
      setError(t('auth.consent'));
      return false;
    }
    setError('');
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === 3) {
      signUp({
        phone: form.phone.replace(/\D/g, ''),
        ownerName: form.ownerName.trim(),
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        city: form.city.trim(),
        pin: form.pin,
        language: form.language,
      });
      navigate('/onboarding');
      return;
    }
    setStep((current) => current + 1);
  };

  return (
    <AuthLayout title={t('auth.signupTitle')} sub={t('auth.signupSub')} numbered="02">
      <Card className="p-5 sm:p-7">
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <p className="kicker">SIGNUP · {String(step + 1).padStart(2, '0')} / 04</p>
            <span className="text-xs font-bold">{Math.round(((step + 1) / 4) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / 4) * 100} className="mt-2" label={t('onboarding.progress')} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {steps.map((label, index) => (
              <span key={label} className={cn('rounded-full border px-2 py-1 text-[10px] font-bold', index === step ? 'border-primary bg-primary-soft text-primary' : index < step ? 'border-primary/30 text-primary' : 'border-line text-muted')}>
                {index < step ? '✓ ' : ''}{label}
              </span>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <Field label={t('auth.ownerName')} required>
              <Input value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} placeholder="Prabhat Sharma" autoFocus />
            </Field>
            <Field label={t('auth.phoneLabel')} error={error} required>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">+91</span>
                  <Input
                    inputMode="numeric"
                    className="pl-12"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(event) => {
                      update('phone', event.target.value.replace(/[^\d\s]/g, '').slice(0, 12));
                      setVerified(false);
                      setOtpSent(false);
                    }}
                  />
                </div>
                <Button variant="secondary" size="md" onClick={() => {
                  if (form.phone.replace(/\D/g, '').length !== 10) { setError(t('common.phoneInvalid')); return; }
                  setError('');
                  setOtpSent(true);
                }}>{otpSent ? t('auth.resend') : t('auth.sendOtp')}</Button>
              </div>
            </Field>
            {otpSent && !verified && (
              <div className="rounded-xl border border-line bg-bg p-3">
                <Field label={t('auth.otpTitle')} hint={t('auth.otpHint')}>
                  <div className="flex gap-2">
                    <Input inputMode="numeric" maxLength={4} placeholder="1234" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))} className="max-w-32 text-center font-bold tracking-[0.4em]" />
                    <Button onClick={() => { if (otp === siteConfig.demoOtp) { setVerified(true); setOtpSent(false); setError(''); } else { setError(t('auth.otpTitle')); } }} size="md">{t('auth.verify')}</Button>
                  </div>
                </Field>
              </div>
            )}
            {verified && <p className="flex items-center gap-2 text-sm font-semibold text-primary"><BadgeCheck className="h-4 w-4" /> {t('auth.verifyPhone')} ✓</p>}
            <Field label={`${t('auth.email')} (${t('common.optional')})`}>
              <Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="owner@example.com" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label={t('auth.businessName')} error={error} required>
              <Input value={form.businessName} onChange={(event) => update('businessName', event.target.value)} placeholder="Sharma General Store" autoFocus />
            </Field>
            <Field label={t('auth.businessType')} required>
              <Select value={form.businessType} onChange={(event) => update('businessType', event.target.value)}>
                {businessTypes.map((type) => <option key={type}>{type}</option>)}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`GSTIN (${t('common.optional')})`}>
                <Input value={form.gstin} onChange={(event) => update('gstin', event.target.value.toUpperCase())} placeholder="23ABCDE1234F1Z5" />
              </Field>
              <Field label={t('auth.years')}>
                <Input inputMode="numeric" value={form.years} onChange={(event) => update('years', event.target.value.replace(/\D/g, ''))} />
              </Field>
            </div>
            <div className="rounded-xl border border-line bg-bg p-3 text-xs text-muted">
              <strong className="text-ink">Why we ask:</strong> business type changes default categories, thresholds and festival boosts. Nothing is shared outside your shop in production.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('auth.outletName')}>
                <Input value={form.outletName} onChange={(event) => update('outletName', event.target.value)} />
              </Field>
              <Field label={t('auth.outlets')}>
                <Select value={form.outletCount} onChange={(event) => update('outletCount', event.target.value)}>
                  {['1', '2', '3', '4+'].map((value) => <option key={value}>{value}</option>)}
                </Select>
              </Field>
            </div>
            <Field label={t('common.address')} error={error} required>
              <Input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Shop 12, New Market" autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('common.city')} required>
                <Input value={form.city} onChange={(event) => update('city', event.target.value)} />
              </Field>
              <Field label={t('common.pin')} required>
                <Input inputMode="numeric" maxLength={6} value={form.pin} onChange={(event) => update('pin', event.target.value.replace(/\D/g, '').slice(0, 6))} />
              </Field>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-bg p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted">One outlet is included in Free. You can add outlets later in Settings; each outlet keeps its own stock and order lists.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('common.language')}>
                <Select value={form.language} onChange={(event) => update('language', event.target.value)}>
                  <option value="hi">हिंदी</option>
                  <option value="en">English</option>
                  <option value="hinglish">Hinglish</option>
                </Select>
              </Field>
              <Field label={t('auth.stockDay')}>
                <Select value={form.stockDay} onChange={(event) => update('stockDay', event.target.value)}>
                  {weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </Select>
              </Field>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-sm">
              <span className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" /> {t('auth.whatsapp')}</span>
              <input type="checkbox" checked={form.whatsapp} onChange={(event) => update('whatsapp', event.target.checked)} className="h-4 w-4 accent-[var(--primary-strong)]" />
            </label>
            <div className="rounded-xl border border-line p-3">
              <Checkbox
                checked={form.consent}
                onChange={(checked) => update('consent', checked)}
                label={<span className="text-xs leading-relaxed">{t('auth.consent')} <Link to="/privacy" className="font-bold text-primary underline underline-offset-2">{t('auth.consentLink')}</Link></span>}
              />
            </div>
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <div className="flex flex-wrap gap-2">
              {pricing.plans.map((plan) => (
                <Badge key={plan.id} tone={plan.id === 'free' ? 'green' : 'neutral'}>{t(plan.nameKey)} · {plan.price}</Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted">{t('landing.indicative')}</p>
          </div>
        )}

        {error && step !== 3 && <p className="mt-4 text-xs font-semibold text-danger">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> {t('common.back')}
          </Button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loginDemo();
                navigate('/app');
              }}
              className="hidden text-xs font-semibold text-muted underline underline-offset-2 hover:text-primary sm:block"
            >
              {t('auth.continueDemo')}
            </button>
            <Button onClick={next}>
              {step === 3 ? t('auth.createAccount') : t('common.next')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">{t('common.noBackend')}</p>
    </AuthLayout>
  );
}

export function OnboardingPage() {
  const { t } = useTranslation();
  const { state, session, updateBusiness, loadSampleData } = useAppData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dataLevel, setDataLevel] = useState<DataLevel>(state?.business.dataLevel ?? 'orders_only');
  const [salesRange, setSalesRange] = useState('100000-300000');
  const [profitPct, setProfitPct] = useState('18');
  const [choice, setChoice] = useState<'sample' | 'later' | 'import' | null>(null);

  useEffect(() => {
    if (!state) return;
    const stored = localStorage.getItem(`pu_onboarding_${session?.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { step?: number; dataLevel?: DataLevel; salesRange?: string; profitPct?: string };
        if (parsed.step) setStep(parsed.step);
        if (parsed.dataLevel) setDataLevel(parsed.dataLevel);
        if (parsed.salesRange) setSalesRange(parsed.salesRange);
        if (parsed.profitPct) setProfitPct(parsed.profitPct);
      } catch {
        // ignore malformed resume state
      }
    }
  }, [state, session?.id]);

  const saveProgress = (nextStep: number) => {
    if (!session) return;
    localStorage.setItem(`pu_onboarding_${session.id}`, JSON.stringify({ step: nextStep, dataLevel, salesRange, profitPct }));
  };

  const finish = () => {
    updateBusiness({
      dataLevel,
      monthlySalesRange: salesRange,
      expectedProfitPct: Number(profitPct) || 0,
    });
    if (choice === 'sample') loadSampleData();
    if (session) localStorage.removeItem(`pu_onboarding_${session.id}`);
    if (choice === 'import') navigate('/app/products');
    else navigate('/app');
  };

  if (!state) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-bg/90">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><ThemeToggle compact /></div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kicker mb-2">ONBOARDING · {String(step + 1).padStart(2, '0')} / 03</p>
            <h1 className="text-3xl font-black tracking-tight">{t('onboarding.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">{t('onboarding.sub')}</p>
          </div>
          <button type="button" onClick={() => { updateBusiness({ dataLevel, monthlySalesRange: salesRange, expectedProfitPct: Number(profitPct) || 0 }); navigate('/app'); }} className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-primary">
            {t('common.skip')}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {[t('auth.stepOwner'), t('auth.stepBusiness'), t('auth.stepProducts')].map((label, index) => (
            <button key={label} type="button" onClick={() => { setStep(index); saveProgress(index); }} className={cn('rounded-xl border p-3 text-left text-xs font-bold transition', index === step ? 'border-primary bg-primary-soft text-primary' : index < step ? 'border-primary/30 text-primary' : 'border-line text-muted')}>
              <span className="num block text-[10px]">0{index + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <Card className="p-5 sm:p-7">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-extrabold">{t('onboarding.dataQ')}</h2>
              <p className="mt-1 text-sm text-muted">This sets confidence. You can change it later.</p>
              <div className="mt-5 space-y-2">
                {[
                  ['orders_only', 'Basic', t('onboarding.data1'), '2 stock counts + purchase bills'],
                  ['orders_upi', 'Good', t('onboarding.data2'), 'Adds cash-flow context'],
                  ['full_sales', 'Best', t('onboarding.data3'), 'Item-wise sales from billing software'],
                ].map(([value, level, label, detail]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDataLevel(value as DataLevel)}
                    className={cn('flex w-full items-start gap-3 rounded-xl border p-4 text-left transition', dataLevel === value ? 'border-primary bg-primary-soft/60' : 'border-line hover:border-primary/50')}
                  >
                    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', dataLevel === value ? 'border-primary bg-primary text-white' : 'border-line')}>
                      {dataLevel === value && <Check className="h-3 w-3" />}
                    </span>
                    <span>
                      <span className="flex flex-wrap items-center gap-2 text-sm font-bold">{label} <Badge tone={level === 'Best' ? 'green' : level === 'Good' ? 'blue' : 'neutral'}>{level}</Badge></span>
                      <span className="mt-0.5 block text-xs text-muted">{detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-extrabold">{t('onboarding.salesQ')}</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ['0-100000', t('onboarding.sales1')],
                  ['100000-300000', t('onboarding.sales2')],
                  ['300000-500000', t('onboarding.sales3')],
                  ['500000-99999999', t('onboarding.sales4')],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setSalesRange(value)} className={cn('rounded-xl border p-3 text-left text-sm font-semibold', salesRange === value ? 'border-primary bg-primary-soft' : 'border-line')}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-5 max-w-xs">
                <Field label={t('onboarding.profitQ')} hint="Used to sanity-check profit estimates, never as a guarantee.">
                  <Input inputMode="decimal" value={profitPct} onChange={(event) => setProfitPct(event.target.value.replace(/[^\d.]/g, ''))} />
                </Field>
              </div>
              <div className="mt-4 rounded-xl border border-info/20 bg-[var(--info-soft)] p-3 text-xs leading-relaxed text-info">
                We compare estimated monthly revenue with your stated range and flag “Some items may be missing” if the gap is large. It is a sanity check, not a validation of truth.
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-extrabold">{t('onboarding.productsQ')}</h2>
              <p className="mt-1 text-sm text-muted">{t('onboarding.productsBody')}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'sample' as const, icon: <Sparkles className="h-5 w-5" />, title: t('onboarding.useSample'), body: 'Sharma General Store · 60 products · full demo data' },
                  { id: 'import' as const, icon: <Upload className="h-5 w-5" />, title: 'Import CSV/XLSX', body: 'Map columns, preview, then import valid rows' },
                  { id: 'later' as const, icon: <PackagePlus className="h-5 w-5" />, title: 'Add products later', body: 'Open the dashboard and start with an empty catalogue' },
                ].map((option) => (
                  <button key={option.id} type="button" onClick={() => setChoice(option.id)} className={cn('h-full rounded-xl border p-4 text-left transition', choice === option.id ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/50')}>
                    <span className="inline-flex rounded-lg bg-card p-2 text-primary">{option.icon}</span>
                    <span className="mt-3 block text-sm font-bold">{option.title}</span>
                    <span className="mt-1 block text-xs text-muted">{option.body}</span>
                  </button>
                ))}
              </div>
              {choice === 'sample' && (
                <p className="mt-3 rounded-xl border border-amber-500/30 bg-[var(--warning-soft)] p-3 text-xs text-accent">
                  Sample data is labelled Demo in the app. It is isolated from real owner accounts. Reset it any time in Settings.
                </p>
              )}
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => { setStep((current) => Math.max(0, current - 1)); saveProgress(Math.max(0, step - 1)); }} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Button>
            {step < 2 ? (
              <Button onClick={() => { saveProgress(step + 1); setStep((current) => current + 1); }}>
                {t('common.next')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!choice}>
                <Check className="h-4 w-4" /> {t('onboarding.finish')}
              </Button>
            )}
          </div>
        </Card>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Add 1st stock count', 'Sharpen the demand estimate', '/app/stock-count'],
            ['Add last order', 'Compare your quantities', '/app/order'],
            ['Add expenses', 'See margin leaks', '/app/expenses'],
          ].map(([title, body, href]) => (
            <Link key={title} to={href} className="surface flex items-center justify-between p-3 text-xs">
              <span><strong className="block font-bold">{title}</strong><span className="text-muted">{body}</span></span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DemoEntry() {
  const { loginDemo } = useAppData();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/app';
  const target = next.startsWith('/app') ? next : '/app';
  useEffect(() => {
    loginDemo();
    const timer = window.setTimeout(() => navigate(target, { replace: true }), 120);
    return () => window.clearTimeout(timer);
  }, [loginDemo, navigate, target]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Loader2 className="h-6 w-6 animate-spin" /></div>
        <p className="text-sm font-bold">Opening Sharma General Store…</p>
        <p className="mt-1 text-xs text-muted">Demo mode · no login needed</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, state } = useAppData();
  const location = useLocation();
  if (!session || !state) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
