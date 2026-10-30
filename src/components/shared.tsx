import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Database,
  Globe2,
  Moon,
  Monitor,
  Sun,
  TrendingUp,
  WifiOff,
} from 'lucide-react';
import type { AppState, Confidence, DataLevel, StockStatus, Urgency } from '../lib/types';
import { cn } from '../lib/utils';
import { formatINR } from '../lib/format';
import { daysSinceLastCount } from '../lib/engine';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Progress, buttonClass } from './ui';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" role="img" aria-label="ProfitUp">
        <rect width="32" height="32" rx="9" fill="var(--primary-strong)" />
        <path d="M8 21.5 13.2 15l4.2 4.5L24 9.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.4 9.5H24v5.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 25.5h16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="text-lg font-black tracking-[-0.04em]">
          Profit<span className="text-primary">Up</span>
        </span>
      )}
    </span>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, resolved, setTheme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const Icon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-xl border border-line bg-card text-ink transition hover:border-primary',
          compact ? 'h-9 w-9' : 'h-10 gap-2 px-3',
        )}
        aria-label={`${t('common.theme')}: ${t(`common.${theme}`)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon className="h-4 w-4" />
        {!compact && <span className="text-xs font-semibold">{t(`common.${theme}`)}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-40 rounded-xl border border-line bg-card p-1 shadow-lift" role="menu">
          {(['light', 'dark', 'system'] as const).map((option) => {
            const OptionIcon = option === 'light' ? Sun : option === 'dark' ? Moon : Monitor;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={theme === option}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-bg',
                  theme === option && 'text-primary',
                )}
                onClick={() => {
                  setTheme(option);
                  setOpen(false);
                }}
              >
                <OptionIcon className="h-3.5 w-3.5" />
                {t(`common.${option}`)}
                {theme === option && <Check className="ml-auto h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const labels = { hi: 'हिंदी', en: 'English', hinglish: 'Hinglish' };
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-xl border border-line bg-card text-ink transition hover:border-primary',
          compact ? 'h-9 w-9' : 'h-10 gap-1.5 px-3',
        )}
        aria-label={`${t('common.language')}: ${labels[lang]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe2 className="h-4 w-4" />
        {!compact && <span className="text-xs font-semibold">{labels[lang]}</span>}
        {!compact && <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-36 rounded-xl border border-line bg-card p-1 shadow-lift" role="menu">
          {(['hi', 'en', 'hinglish'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={lang === option}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-bg',
                lang === option && 'text-primary',
              )}
              onClick={() => {
                setLanguage(option);
                setOpen(false);
              }}
            >
              {labels[option]}
              {lang === option && <Check className="ml-auto h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfidenceBadge({ level, showLabel = true }: { level: Confidence; showLabel?: boolean }) {
  const { t } = useTranslation();
  const tone = level === 'best' ? 'green' : level === 'good' ? 'blue' : 'neutral';
  return (
    <Badge tone={tone}>
      {showLabel ? `${t('common.confidence')}: ${t(`common.${level}`)}` : t(`common.${level}`)}
    </Badge>
  );
}

export function EstimatedBadge({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone="blue" dot>
      {label || t('status.estimated')}
    </Badge>
  );
}

export function DataLevelBadge({ level }: { level: DataLevel }) {
  const { t } = useTranslation();
  const map: Record<DataLevel, { label: string; tone: 'green' | 'blue' | 'amber' }> = {
    orders_only: { label: 'Basic', tone: 'amber' },
    orders_upi: { label: 'Good', tone: 'blue' },
    full_sales: { label: 'Best', tone: 'green' },
  };
  return (
    <Badge tone={map[level].tone}>
      <Database className="h-3 w-3" />
      {t(`common.${map[level].label.toLowerCase()}`)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: StockStatus }) {
  const { t } = useTranslation();
  const tone = status === 'healthy' ? 'green' : status === 'slow' ? 'amber' : 'red';
  return (
    <Badge tone={tone} dot>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function UrgencyChip({ urgency, hint = false }: { urgency: Urgency; hint?: boolean }) {
  const { t } = useTranslation();
  const map = {
    today: { tone: 'red' as const, dot: '🔴' },
    three: { tone: 'saffron' as const, dot: '🟠' },
    five: { tone: 'amber' as const, dot: '🟡' },
    later: { tone: 'neutral' as const, dot: '⚪' },
  };
  return (
    <Badge tone={map[urgency].tone}>
      <span aria-hidden="true">{map[urgency].dot}</span>
      {hint ? t(`urgency.${urgency}Hint`) : t(`urgency.${urgency}`)}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  meta,
  icon,
  to,
  onClick,
  estimated,
  tone = 'default',
}: {
  label: string;
  value: string;
  meta?: ReactNode;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
  estimated?: boolean;
  tone?: 'default' | 'danger' | 'accent' | 'info';
}) {
  const { t } = useTranslation();
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="kicker">{label}</span>
        <span
          className={cn(
            'rounded-xl p-2',
            tone === 'danger' && 'bg-[var(--danger-soft)] text-danger',
            tone === 'accent' && 'bg-[var(--warning-soft)] text-accent',
            tone === 'info' && 'bg-[var(--info-soft)] text-info',
            tone === 'default' && 'bg-primary-soft text-primary',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="num mt-4 text-2xl font-extrabold tracking-[-0.03em] sm:text-[28px]">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {meta}
        {estimated && <EstimatedBadge />}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted">
        {t('common.viewDetails')} <ArrowUpRight className="h-3 w-3" />
      </span>
    </>
  );
  const classes = 'surface group block w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lift sm:p-5';
  if (to) return <Link to={to} className={classes}>{content}</Link>;
  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
}

export function Countdown({ target }: { target: Date }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <div>
      <p className="kicker mb-2">{t('dashboard.nextCount')}</p>
      <div className="num flex items-baseline gap-2 text-2xl font-black tracking-tight sm:text-3xl">
        <span>{days}d</span>
        <span className="text-muted">:</span>
        <span>{hours}h</span>
        <span className="text-muted">:</span>
        <span>{minutes}m</span>
      </div>
    </div>
  );
}

export function SystemPanel({ state, compact = false }: { state: AppState; compact?: boolean }) {
  const { t } = useTranslation();
  const days = daysSinceLastCount(state);
  const stale = days === null || days > 7;
  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-card', compact && 'text-xs')}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-bg/70 px-4 py-3">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {t('landing.systemPanel')}
        </span>
        <span className="font-mono text-[10px] text-muted">LIVE</span>
      </div>
      <dl className="divide-y divide-line">
        {[
          [t('common.shop'), state.business.name],
          [t('common.outlet'), state.outlets[0]?.name ?? 'Main Branch'],
          [t('common.dataLevel'), state.business.dataLevel === 'full_sales' ? 'Best' : state.business.dataLevel === 'orders_upi' ? 'Good' : 'Basic'],
          [t('dashboard.stockAge'), days === null ? '—' : `${days} ${t('common.days')}`],
          [t('common.status'), stale ? t('status.stale') : t('status.live')],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
            <dd className={cn('text-right text-xs font-bold', value === t('status.live') && 'text-primary')}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Ticker({ items }: { items: string[] }) {
  const { t } = useTranslation();
  const repeated = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-card">
      <div className="flex items-center gap-3 overflow-hidden py-3">
        <span className="z-10 shrink-0 bg-card pl-4 pr-3 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
          {t('common.sampleData')}
        </span>
        <div className="ticker-track flex min-w-max animate-marquee gap-8 whitespace-nowrap" aria-hidden="true">
          {repeated.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item}
            </span>
          ))}
        </div>
        <span className="sr-only">{items.join('. ')}</span>
      </div>
    </div>
  );
}

export function NumberedSection({
  id,
  number,
  label,
  title,
  intro,
  children,
  className,
  dark,
}: {
  id?: string;
  number: string;
  label: string;
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-nav border-t border-line py-16 sm:py-24', className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-10 grid gap-5 lg:grid-cols-[0.34fr_0.66fr] lg:items-end">
          <div className="flex items-start gap-4">
            <span className={cn('num text-xs font-black', dark ? 'text-white/50' : 'text-muted')}>{number}</span>
            <span className={cn('kicker pt-0.5', dark && 'text-white/70')}>{label}</span>
          </div>
          <div>
            {title && (
              <h2
                className={cn(
                  'display text-3xl sm:text-5xl lg:text-6xl',
                  dark ? 'text-white' : 'text-ink',
                )}
              >
                {title}
              </h2>
            )}
            {intro && (
              <p className={cn('mt-4 max-w-2xl text-sm leading-relaxed sm:text-base', dark ? 'text-white/70' : 'text-muted')}>
                {intro}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export function FlipCard({
  icon,
  title,
  body,
  index,
  href,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  index: number;
  href: string;
}) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="flip-shell h-[250px] outline-none"
      data-flipped={flipped}
      onClick={() => setFlipped((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setFlipped((value) => !value);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title}. ${t('landing.flipHint')}`}
    >
      <div className="flip-inner relative h-full w-full">
        <div className="flip-face surface absolute inset-0 flex flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <span className="rounded-2xl bg-primary-soft p-3 text-primary">{icon}</span>
            <span className="num text-xs font-bold text-muted">{String(index).padStart(2, '0')}</span>
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{t('landing.flipHint')}</p>
          </div>
        </div>
        <div className="flip-face flip-back surface absolute inset-0 flex flex-col justify-between bg-primary-dark p-5 text-white">
          <p className="text-sm leading-relaxed text-white/90">{body}</p>
          <Link
            to={href}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-white underline decoration-white/40 underline-offset-4"
          >
            {t('landing.tryIt')} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  number,
  title,
  sub,
  actions,
  side,
}: {
  number: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
  side?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-line pb-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="num text-[10px] font-black text-muted">{number}</span>
            <span className="kicker">{title}</span>
          </div>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="mt-2 max-w-3xl text-sm text-muted">{sub}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {side}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function DataQualityNote({ confidence, children }: { confidence: Confidence; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <ConfidenceBadge level={confidence} />
      {children}
    </div>
  );
}

export function OfflineBanner({ offline, demo = false }: { offline: boolean; demo?: boolean }) {
  const { t } = useTranslation();
  if (!offline && !demo) return null;
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 text-center text-[11px] font-semibold', offline ? 'bg-[var(--warning-soft)] text-accent' : 'bg-[var(--info-soft)] text-info')}>
      {offline ? <WifiOff className="h-3.5 w-3.5 shrink-0" /> : <Database className="h-3.5 w-3.5 shrink-0" />}
      <span>{offline ? t('common.offline') : t('common.noBackend')}</span>
    </div>
  );
}

export function InsightLine({ children, icon = <TrendingUp className="h-4 w-4" /> }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm">
      <span className="mt-0.5 text-primary">{icon}</span>
      <p className="font-medium text-ink">{children}</p>
    </div>
  );
}

export function MiniSpark({ values, tone = 'green' }: { values: number[]; tone?: 'green' | 'red' | 'accent' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className={cn(
            'w-1.5 rounded-t-sm',
            tone === 'green' && 'bg-primary/70',
            tone === 'red' && 'bg-danger/60',
            tone === 'accent' && 'bg-accent/60',
          )}
          style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function ActionButton({
  children,
  to,
  onClick,
  variant = 'primary',
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  if (to) return <Link to={to} className={buttonClass(variant)}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} className={buttonClass(variant)}>
      {children}
    </button>
  );
}

export function MetricPill({
  icon,
  label,
  value,
  warning,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/60 px-3 py-2.5">
      {icon && <span className={cn('text-muted', warning && 'text-danger')}>{icon}</span>}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className={cn('num text-sm font-bold', warning && 'text-danger')}>{value}</p>
      </div>
    </div>
  );
}

export function HealthCallout({ score }: { score: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Progress value={score} className="w-24" label={t('dashboard.dataHealth')} />
      <span className="num text-xs font-bold">{score}/100</span>
    </div>
  );
}

export function MoneyLine({ value }: { value: number }) {
  return <span className="num">{formatINR(value)}</span>;
}

export function MetricIcon({ type }: { type: 'clock' | 'money' | 'alert' }) {
  if (type === 'clock') return <Clock className="h-4 w-4" />;
  if (type === 'money') return <CircleDollarSign className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
}
