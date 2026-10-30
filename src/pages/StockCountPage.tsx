import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { allProductMetrics, getCurrentStock } from '../lib/engine';
import { formatDate, formatINR, formatNumber } from '../lib/format';
import { todayISO } from '../lib/utils';
import { PageHeader, StatusBadge } from '../components/shared';
import { Badge, Button, Card, EmptyState, Input, Progress, buttonClass, useToast } from '../components/ui';
import { cn } from '../lib/utils';

type Step = 'count' | 'review' | 'done';

export default function StockCountPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { addStockCount, logActivity } = useAppData();
  const { push } = useToast();
  const [step, setStep] = useState<Step>('count');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const metrics = useMemo(
    () => allProductMetrics(state).sort((a, b) => b.stockValue - a.stockValue),
    [state],
  );
  const filtered = useMemo(() => {
    if (!search.trim()) return metrics;
    const needle = search.toLowerCase();
    return metrics.filter((metric) =>
      `${metric.product.name} ${metric.product.nameHi} ${metric.product.category}`.toLowerCase().includes(needle),
    );
  }, [metrics, search]);

  const counted = Object.entries(counts).filter(([, value]) => value.trim() !== '');
  const progress = metrics.length ? (counted.length / metrics.length) * 100 : 0;
  const latest = [...state.stockCounts].sort((a, b) => b.date.localeCompare(a.date))[0];

  const reviewRows = counted.map(([productId, value]) => {
    const product = state.products.find((entry) => entry.id === productId);
    const expected = product ? getCurrentStock(state, product) : 0;
    const actual = Math.max(0, Number(value) || 0);
    return { productId, name: product?.name ?? productId, nameHi: product?.nameHi ?? '', unit: product?.unit ?? '', expected, actual, variance: actual - expected };
  });
  const largeVariance = reviewRows.filter((row) => Math.abs(row.variance) > Math.max(2, row.expected * 0.25));

  const setCount = (id: string, value: string) => {
    setCounts((current) => ({ ...current, [id]: value }));
  };

  const fillExpected = () => {
    const next: Record<string, string> = { ...counts };
    metrics.forEach((metric) => {
      if (next[metric.product.id] === undefined) next[metric.product.id] = String(Math.round(metric.stock));
    });
    setCounts(next);
  };

  const finish = () => {
    if (!counted.length) {
      push({ title: t('count.noProducts'), tone: 'error' });
      return;
    }
    setSaving(true);
    addStockCount({
      date: todayISO(),
      countedBy: state.business.ownerName || 'Owner',
      items: counted.map(([productId, value]) => ({ productId, qty: Math.max(0, Number(value) || 0) })),
    });
    logActivity('Stock count completed', `${counted.length} products counted`);
    push({ title: t('count.saved'), body: t('count.varianceNote') });
    setSaving(false);
    setStep('done');
  };

  const restart = () => {
    setCounts({});
    setSearch('');
    setStep('count');
  };

  const stepIndex = step === 'count' ? 0 : step === 'review' ? 1 : 2;
  const steps = [t('count.stepProducts'), t('count.stepReview'), t('count.stepDone')];

  return (
    <div>
      <PageHeader
        number="04"
        title={t('count.title')}
        sub={t('count.sub')}
        actions={
          step === 'count' ? (
            <>
              <Button variant="secondary" onClick={fillExpected}><Sparkles className="h-4 w-4" /> {t('count.expected')}</Button>
              <Button onClick={() => setStep('review')} disabled={!counted.length}>
                {t('count.confirm')} ({counted.length})
              </Button>
            </>
          ) : step === 'review' ? (
            <>
              <Button variant="secondary" onClick={() => setStep('count')}>{t('common.back')}</Button>
              <Button onClick={finish} disabled={saving}><CheckCircle2 className="h-4 w-4" /> {t('count.confirm')}</Button>
            </>
          ) : (
            <Button onClick={restart}><RotateCcw className="h-4 w-4" /> {t('count.start')}</Button>
          )
        }
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((label, index) => (
              <span
                key={label}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide',
                  index === stepIndex
                    ? 'border-primary/40 bg-primary-soft text-primary'
                    : index < stepIndex
                      ? 'border-primary/20 bg-primary-soft/50 text-primary'
                      : 'border-line bg-bg text-muted',
                )}
              >
                <span className="num">{String(index + 1).padStart(2, '0')}</span>
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{t('count.counted', { count: counted.length })}</span>
            <span>·</span>
            <span>{t('count.remaining', { count: Math.max(0, metrics.length - counted.length) })}</span>
          </div>
        </div>
        <div className="mt-3"><Progress value={progress} label={t('count.progress')} /></div>
        {latest && (
          <p className="mt-2 text-[11px] text-muted">
            {t('dashboard.stockAge')}: {formatDate(latest.date)} · {latest.items.length} {t('common.products')}
          </p>
        )}
      </Card>

      {step === 'count' && (
        <>
          {metrics.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title={t('count.noProducts')}
              body={t('products.none')}
              action={<a href="/app/products" className={buttonClass('primary')}>{t('products.add')}</a>}
            />
          ) : (
            <>
              <Card className="mb-4 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('count.search')} className="pl-9" />
                </div>
                <p className="mt-2 text-[11px] text-muted">{t('count.valueOrder')} · {t('count.varianceNote')}</p>
              </Card>
              <div className="space-y-2">
                {filtered.map((metric) => {
                  const value = counts[metric.product.id] ?? '';
                  const hasValue = value.trim() !== '';
                  return (
                    <Card key={metric.product.id} className={cn('p-3 transition sm:p-4', hasValue && 'border-primary/40 bg-primary-soft/20')}>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</p>
                            <StatusBadge status={metric.status} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {metric.product.category} · {t('common.expected')} {formatNumber(metric.stock, 1)} {metric.product.unit} · {formatINR(metric.stockValue)}
                          </p>
                        </div>
                        <div className="w-28">
                          <label className="label" htmlFor={`count-${metric.product.id}`}>{t('count.countedQty')}</label>
                          <Input
                            id={`count-${metric.product.id}`}
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={value}
                            placeholder={String(Math.round(metric.stock))}
                            onChange={(event) => setCount(metric.product.id, event.target.value)}
                            className="h-9 text-right"
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {step === 'review' && (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-line p-4">
              <p className="kicker">{t('count.finishTitle')}</p>
              <p className="mt-1 text-xs text-muted">{t('count.finishBody')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line bg-bg/60">
                  <tr className="table-head">
                    <th className="px-3 py-3">{t('common.product')}</th>
                    <th className="px-3 py-3 text-right">{t('count.expected')}</th>
                    <th className="px-3 py-3 text-right">{t('count.countedQty')}</th>
                    <th className="px-3 py-3 text-right">{t('count.variance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reviewRows.map((row) => (
                    <tr key={row.productId}>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold">{lang === 'hi' ? row.nameHi || row.name : row.name}</span>
                      </td>
                      <td className="num px-3 py-2.5 text-right">{formatNumber(row.expected, 1)}</td>
                      <td className="num px-3 py-2.5 text-right font-bold">{formatNumber(row.actual, 1)}</td>
                      <td className={cn('num px-3 py-2.5 text-right font-bold', row.variance === 0 ? 'text-primary' : Math.abs(row.variance) > 2 ? 'text-danger' : 'text-accent')}>
                        {row.variance > 0 ? '+' : ''}{formatNumber(row.variance, 1)} {row.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <p className="kicker">{t('count.progress')}</p>
              <p className="num mt-2 text-3xl font-black">{counted.length}<span className="text-base text-muted">/{metrics.length}</span></p>
              <div className="mt-3"><Progress value={progress} /></div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('count.varianceNote')}</p>
            </Card>
            {largeVariance.length > 0 && (
              <Card className="border-accent/40 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-accent"><AlertTriangle className="h-4 w-4" /> {t('count.variance')}</p>
                <div className="mt-2 space-y-1.5">
                  {largeVariance.slice(0, 6).map((row) => (
                    <p key={row.productId} className="text-xs text-muted">
                      {row.name}: {formatNumber(row.expected, 0)} → {formatNumber(row.actual, 0)}
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {step === 'done' && (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold">{t('count.saved')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{t('count.finishBody')}</p>
          <div className="mx-auto mt-5 grid max-w-lg gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-line p-3">
              <p className="kicker">{t('count.countedQty')}</p>
              <p className="num mt-1 text-lg font-black">{counted.length}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="kicker">{t('count.variance')}</p>
              <p className="num mt-1 text-lg font-black">{largeVariance.length}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="kicker">{t('common.date')}</p>
              <p className="mt-1 text-sm font-bold">{formatDate(todayISO())}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={restart}><RotateCcw className="h-4 w-4" /> {t('count.start')}</Button>
            <a href="/app/reorder" className={buttonClass('primary')}>{t('nav.reorder')}</a>
          </div>
        </Card>
      )}

      {step === 'count' && metrics.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3 text-[11px] text-muted">
          <span className="flex items-center gap-2"><Badge tone="blue">{t('common.estimated')}</Badge> {t('common.estimatedNote')}</span>
          <span>{counted.length} / {metrics.length} {t('common.products')}</span>
        </div>
      )}
    </div>
  );
}
