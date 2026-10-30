import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronDown, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatINR } from '../lib/format';

export function buttonClass(
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  className?: string,
) {
  return cn(
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    variant === 'ghost' && 'btn-ghost',
    variant === 'danger' && 'btn-danger',
    variant === 'outline' && 'btn-base border border-primary text-primary hover:bg-primary-soft',
    size === 'sm' && 'min-h-8 px-3 py-1.5 text-xs',
    size === 'lg' && 'min-h-12 px-6 py-3 text-base',
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  as: Tag = 'div',
  ...props
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Tag className={cn('surface', className)} {...props}>
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'saffron' | 'violet';
  className?: string;
  dot?: boolean;
}) {
  const tones = {
    neutral: 'border-line bg-bg text-muted',
    green: 'border-primary/30 bg-primary-soft text-primary-dark dark:text-primary',
    amber: 'border-amber-500/30 bg-[var(--warning-soft)] text-amber-700 dark:text-amber-300',
    red: 'border-danger/30 bg-[var(--danger-soft)] text-danger',
    blue: 'border-info/30 bg-[var(--info-soft)] text-info',
    saffron: 'border-accent/30 bg-[var(--warning-soft)] text-accent dark:text-accent',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  };
  return (
    <span className={cn('pill', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input h-auto min-h-24 py-2', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('input cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  id?: string;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-line accent-[var(--primary-strong)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="fixed inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 my-0 w-full rounded-t-card border border-line bg-card text-ink shadow-lift sm:my-4 sm:rounded-card',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div>
            <h2 id="dialog-title" className="text-lg font-extrabold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-bg hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4 sm:p-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-line bg-card text-ink shadow-lift"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-bg" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4 sm:p-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  value: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-bg p-1', className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition',
            value === tab.id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="rounded-full bg-line/70 px-1.5 py-0.5 text-[10px]">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-line', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-primary-dark transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-bg/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 rounded-2xl bg-primary-soft p-3 text-primary">{icon}</div>}
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function SectionTitle({
  kicker,
  title,
  sub,
  action,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" className="rounded-full p-1 text-muted hover:text-ink" aria-label={text}>
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-xl border border-line bg-card p-3 text-xs font-normal normal-case tracking-normal text-ink opacity-0 shadow-lift transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function Money({ value, className, compact = false }: { value: number; className?: string; compact?: boolean }) {
  return (
    <span className={cn('num', className)} title={formatINR(value)}>
      {compact
        ? new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
        : formatINR(value)}
    </span>
  );
}

export function Accordion({
  items,
  defaultOpen,
}: {
  items: Array<{ id: string; question: string; answer: string }>;
  defaultOpen?: string;
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-card">
      {items.map((item, index) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-bg/60"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : item.id)}
            >
              <span className="flex gap-4">
                <span className="mt-0.5 text-xs font-bold text-muted">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-sm font-bold sm:text-base">{item.question}</span>
              </span>
              <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted transition', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

type Toast = { id: string; title: string; body?: string; tone?: 'success' | 'error' | 'info' };
const ToastContext = createContext<{ push: (toast: Omit<Toast, 'id'>) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((current) => [...current, { ...toast, id }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
    timers.current.push(timer);
  }, []);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 sm:bottom-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-card p-3.5 shadow-lift"
              role="status"
            >
              <div
                className={cn(
                  'mt-0.5 rounded-full p-1.5',
                  toast.tone === 'error' ? 'bg-[var(--danger-soft)] text-danger' : 'bg-primary-soft text-primary',
                )}
              >
                {toast.tone === 'error' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.body && <p className="mt-0.5 text-xs text-muted">{toast.body}</p>}
              </div>
              <button
                type="button"
                className="text-muted hover:text-ink"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -20px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
