import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  BadgePercent,
  Boxes,
  ClipboardCopy,
  PackageX,
  Search,
  Undo2,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { allProductMetrics } from '../lib/engine';
import { formatINR, formatNumber, pct } from '../lib/format';
import { copyText, cn } from '../lib/utils';
import { PageHeader, EstimatedBadge } from '../components/shared';
import { Badge, Button, Card, EmptyState, Input, Tabs, useToast } from '../components/ui';

export default function DeadStockPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { archiveProduct, logActivity } = useAppData();
  const { push } = useToast();
  const [tab, setTab] = useState<'slow' | 'dead'>('dead');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const metrics = useMemo(() => allProductMetrics(state), [state]);
  const slow = metrics.filter((metric) => metric.status === 'slow');
  const dead = metrics.filter((metric) => metric.status === 'dead');
  const source = tab === 'dead' ? dead : slow;
  const categories = Array.from(new Set(source.map((metric) => metric.product.category))).sort();
  const rows = source
    .filter((metric) => category === 'all' || metric.product.category === category)
    .filter((metric) => {
      if (!search.trim()) return true;
      return `${metric.product.name} ${metric.product.nameHi} ${metric.product.category}`.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.stockValue - a.stockValue);
  const tiedUp = source.reduce((total, metric) => total + metric.stockValue, 0);

  const recommendation = (days: number | null) => {
    if (days === null) return { label: t('dead.stop'), tone: 'neutral' as const };
    if (days >= state.business.deadDays * 2) return { label: t('dead.return'), tone: 'red' as const };
    if (days >= state.business.deadDays) return { label: t('dead.discount'), tone: 'amber' as const };
    return { label: t('dead.bundle'), tone: 'blue' as const };
  };

  const copyOffer = async (name: string) => {
    await copyText(t('dead.sampleOffer', { name }));
    push({ title: t('common.copied'), body: t('dead.whatsappOffer') });
  };

  const markAction = (action: 'discount' | 'return' | 'stop', name: string) => {
    logActivity(
      action === 'discount' ? 'Dead stock discounted' : action === 'return' ? 'Dead stock returned' : 'Reordering stopped',
      name,
    );
    if (action === 'stop') {
      const product = state.products.find((entry) => entry.name === name);
      if (product) archiveProduct(product.id);
    }
    push({ title: t('dead.actionSaved') });
  };

  return (
    <div>
      <PageHeader number="05" title={t('dead.title')} sub={t('dead.sub')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="kicker">{t('dead.tiedUp')}</p>
          <p className="num mt-2 text-2xl font-black text-danger">{formatINR(tiedUp)}</p>
          <p className="mt-1 text-[11px] text-muted">{t('dead.valueNote')}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('dead.slowTab')}</p>
          <p className="num mt-2 text-2xl font-black">{slow.length} <span className="text-sm text-muted">{t('common.products')}</span></p>
          <p className="mt-1 text-[11px] text-muted">{formatINR(slow.reduce((total, metric) => total + metric.stockValue, 0))}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('dead.deadTab')}</p>
          <p className="num mt-2 text-2xl font-black">{dead.length} <span className="text-sm text-muted">{t('common.products')}</span></p>
          <p className="mt-1 text-[11px] text-muted">{formatINR(dead.reduce((total, metric) => total + metric.stockValue, 0))}</p>
        </Card>
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            tabs={[
              { id: 'dead', label: t('dead.deadTab'), count: dead.length },
              { id: 'slow', label: t('dead.slowTab'), count: slow.length },
            ]}
            value={tab}
            onChange={(value) => { setTab(value as 'slow' | 'dead'); setCategory('all'); }}
            ariaLabel={t('dead.title')}
          />
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('products.searchPlaceholder')} className="pl-9" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="input h-10 w-auto min-w-[140px] text-xs" aria-label={t('common.category')}>
            <option value="all">{t('common.allCategories')}</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </div>
      </Card>

      {rows.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((metric) => {
            const action = recommendation(metric.daysWithoutMovement);
            return (
              <Card key={metric.product.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{metric.product.category} · {metric.product.unit}</p>
                  </div>
                  <Badge tone={action.tone}>{action.label}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-line p-2.5">
                    <p className="kicker">{t('dead.daysNoMove')}</p>
                    <p className={cn('num mt-1 text-lg font-black', (metric.daysWithoutMovement ?? 0) >= state.business.deadDays ? 'text-danger' : 'text-accent')}>
                      {metric.daysWithoutMovement ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line p-2.5">
                    <p className="kicker">{t('dead.tiedUp')}</p>
                    <p className="num mt-1 text-lg font-black">{formatINR(metric.stockValue)}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-1 text-[11px] text-muted">
                  <div className="flex justify-between"><dt>{t('common.stock')}</dt><dd className="num font-bold text-ink">{formatNumber(metric.stock, 1)} {metric.product.unit}</dd></div>
                  <div className="flex justify-between"><dt>{t('common.margin')}</dt><dd className={cn('num font-bold', metric.marginPct < state.business.marginAlertPct ? 'text-danger' : 'text-primary')}>{pct(metric.marginPct)}</dd></div>
                  <div className="flex justify-between"><dt>{t('count.variance')}</dt><dd className="font-bold text-ink">{t(`dead.${action.label === t('dead.return') ? 'return' : action.label === t('dead.discount') ? 'discount' : action.label === t('dead.bundle') ? 'bundle' : 'stop'}`)}</dd></div>
                </dl>
                {metric.demandSource === 'estimated' && <div className="mt-2"><EstimatedBadge /></div>}
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  <Button size="sm" variant="secondary" onClick={() => copyOffer(metric.product.name)}><ClipboardCopy className="h-3.5 w-3.5" /> {t('dead.whatsappOffer')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => markAction('discount', metric.product.name)}><BadgePercent className="h-3.5 w-3.5" /> {t('dead.markDiscounted')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => markAction('return', metric.product.name)}><Undo2 className="h-3.5 w-3.5" /> {t('dead.markReturned')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => markAction('stop', metric.product.name)}><Archive className="h-3.5 w-3.5" /> {t('dead.stop')}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<PackageX className="h-5 w-5" />}
          title={t('dead.empty')}
          body={t('dead.sub')}
          action={<Button variant="secondary" onClick={() => { setSearch(''); setCategory('all'); }}>{t('common.clear')}</Button>}
        />
      )}

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
        <Boxes className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('dead.valueNote')} {t('stuck.how')}</p>
      </div>
    </div>
  );
}
