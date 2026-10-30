import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Filter, Info, PackageSearch, Search, ShoppingCart } from 'lucide-react';
import { useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { allProductMetrics, urgencyRank, type ReorderCandidate } from '../lib/engine';
import { formatINR, formatNumber, pct } from '../lib/format';
import { cn, sortedUnique } from '../lib/utils';
import { PageHeader, ConfidenceBadge, EstimatedBadge, UrgencyChip, StatusBadge } from '../components/shared';
import { Button, Card, Drawer, EmptyState, Input, Select, buttonClass, useToast } from '../components/ui';

export default function RadarPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const navigate = useNavigate();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [urgency, setUrgency] = useState('all');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [supplier, setSupplier] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<ReorderCandidate | null>(null);

  const all = useMemo(() => allProductMetrics(state), [state]);
  const candidates = useMemo<ReorderCandidate[]>(() => {
    return all
      .map((metric) => ({
        ...metric,
        urgencyRank: urgencyRank(metric.urgency),
        supplierName: state.suppliers.find((entry) => entry.id === metric.product.supplierId)?.name ?? t('common.noSupplier'),
      }))
      .filter((metric) => {
        if (urgency !== 'all' && metric.urgency !== urgency) return false;
        if (status !== 'all' && metric.status !== status) return false;
        if (category !== 'all' && metric.product.category !== category) return false;
        if (supplier !== 'all' && metric.product.supplierId !== supplier) return false;
        if (search.trim()) {
          const haystack = `${metric.product.name} ${metric.product.nameHi} ${metric.product.category} ${metric.supplierName}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => a.urgencyRank - b.urgencyRank || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  }, [all, state.suppliers, urgency, status, category, supplier, search, t]);

  const reorderCount = candidates.filter((metric) => metric.urgency !== 'later').length;
  const categories = sortedUnique(state.products.map((product) => product.category));

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToOrder = () => {
    const ids = selected.size ? Array.from(selected) : candidates.filter((metric) => metric.urgency !== 'later').map((metric) => metric.product.id);
    if (!ids.length) {
      push({ title: t('radar.noItems'), tone: 'info' });
      return;
    }
    sessionStorage.setItem('pu_order_preselect', JSON.stringify(ids));
    navigate('/app/order');
  };

  return (
    <div>
      <PageHeader
        number="02"
        title={t('radar.title')}
        sub={t('radar.sub')}
        actions={
          <Button onClick={addToOrder}>
            <ShoppingCart className="h-4 w-4" />
            {selected.size ? t('radar.addCount', { count: selected.size }) : t('radar.addToOrder')}
          </Button>
        }
      />

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('products.searchPlaceholder')} className="pl-9" />
          </div>
          <Select value={urgency} onChange={(event) => setUrgency(event.target.value)} aria-label={t('radar.urgency')} className="w-auto min-w-[130px]">
            <option value="all">{t('common.all')} · {t('radar.urgency')}</option>
            <option value="today">{t('urgency.today')}</option>
            <option value="three">{t('urgency.three')}</option>
            <option value="five">{t('urgency.five')}</option>
            <option value="later">{t('urgency.later')}</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t('common.status')} className="w-auto min-w-[130px]">
            <option value="all">{t('common.all')} · {t('common.status')}</option>
            <option value="healthy">{t('status.healthy')}</option>
            <option value="slow">{t('status.slow')}</option>
            <option value="dead">{t('status.dead')}</option>
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t('common.category')} className="w-auto min-w-[130px]">
            <option value="all">{t('common.allCategories')}</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </Select>
          <Select value={supplier} onChange={(event) => setSupplier(event.target.value)} aria-label={t('common.supplier')} className="w-auto min-w-[150px]">
            <option value="all">{t('common.allSuppliers')}</option>
            {state.suppliers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          <span className="flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> {candidates.length} {t('common.products')} · {reorderCount} {t('dashboard.reorderNeeded')}</span>
          <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> {t('radar.explanation')}</span>
        </div>
      </Card>

      {candidates.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line bg-bg/60">
                <tr className="table-head">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={t('common.all')}
                      checked={candidates.length > 0 && candidates.every((metric) => selected.has(metric.product.id))}
                      onChange={(event) => setSelected(event.target.checked ? new Set(candidates.map((metric) => metric.product.id)) : new Set())}
                      className="h-4 w-4 accent-[var(--primary-strong)]"
                    />
                  </th>
                  <th className="px-3 py-3">{t('radar.product')}</th>
                  <th className="px-3 py-3 text-right">{t('radar.stock')}</th>
                  <th className="px-3 py-3 text-right">{t('radar.demand')}</th>
                  <th className="px-3 py-3 text-right">{t('radar.daysLeft')}</th>
                  <th className="px-3 py-3 text-right">{t('radar.cost')}</th>
                  <th className="px-3 py-3">{t('radar.urgency')}</th>
                  <th className="px-3 py-3">{t('radar.confidence')}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {candidates.map((metric) => (
                  <tr key={metric.product.id} className={cn('hover:bg-bg/40', selected.has(metric.product.id) && 'bg-primary-soft/40')}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={metric.product.name}
                        checked={selected.has(metric.product.id)}
                        onChange={() => toggle(metric.product.id)}
                        className="h-4 w-4 accent-[var(--primary-strong)]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" className="text-left" onClick={() => setActive(metric)}>
                        <span className="block font-bold hover:text-primary">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                          {metric.product.category} · {metric.supplierName}
                          <StatusBadge status={metric.status} />
                        </span>
                      </button>
                    </td>
                    <td className="num px-3 py-3 text-right">{formatNumber(metric.stock, 0)}</td>
                    <td className="num px-3 py-3 text-right">{metric.dailyDemand.toFixed(2)}<span className="text-[10px] text-muted">{t('common.perDay')}</span></td>
                    <td className="num px-3 py-3 text-right font-bold">{metric.daysLeft === null ? '—' : metric.daysLeft.toFixed(1)}</td>
                    <td className="num px-3 py-3 text-right">{formatINR(metric.stockValue)}</td>
                    <td className="px-3 py-3"><UrgencyChip urgency={metric.urgency} /></td>
                    <td className="px-3 py-3"><ConfidenceBadge level={metric.confidence} /></td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" className="text-muted hover:text-primary" onClick={() => setActive(metric)} aria-label={t('common.viewDetails')}><ArrowRight className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState icon={<PackageSearch className="h-5 w-5" />} title={t('radar.noItems')} body={t('radar.noSales')} action={<Button variant="secondary" onClick={() => { setSearch(''); setUrgency('all'); setStatus('all'); setCategory('all'); setSupplier('all'); }}>{t('common.clear')}</Button>} />
      )}

      <div className="mt-4 rounded-xl border border-info/20 bg-[var(--info-soft)] p-3 text-xs leading-relaxed text-info">
        <strong>{t('radar.noSales')}</strong> {t('common.estimatedNote')}
      </div>

      <Drawer
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? (lang === 'hi' ? active.product.nameHi : active.product.name) : ''}
        description={active ? `${active.product.category} · ${active.supplierName}` : undefined}
        footer={active ? (
          <>
            <Button variant="secondary" onClick={() => { toggle(active.product.id); setActive(null); }}>{t('radar.addToOrder')}</Button>
            <Button onClick={() => { sessionStorage.setItem('pu_order_preselect', JSON.stringify([active.product.id])); navigate('/app/order'); }}>{t('dashboard.viewOrder')}</Button>
          </>
        ) : undefined}
      >
        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <UrgencyChip urgency={active.urgency} hint />
              <StatusBadge status={active.status} />
              <ConfidenceBadge level={active.confidence} />
              {active.demandSource === 'estimated' && <EstimatedBadge />}
            </div>
            <dl className="divide-y divide-line rounded-xl border border-line">
              {[
                [t('radar.stock'), `${formatNumber(active.stock, 2)} ${active.product.unit}`],
                [t('radar.demand'), `${active.dailyDemand.toFixed(2)} ${t('common.perDay')}`],
                [t('radar.daysLeft'), active.daysLeft === null ? '—' : `${active.daysLeft.toFixed(1)} ${t('common.days')}`],
                [t('radar.qty'), `${Math.max(0, Math.ceil(active.dailyDemand * 7 * 1.1 - active.stock))} ${active.product.unit}`],
                [t('radar.cost'), formatINR(active.stockValue)],
                [t('common.margin'), pct(active.marginPct)],
                [t('common.supplier'), active.supplierName],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-3 py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="num text-sm font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl border border-line bg-bg/50 p-3 text-xs leading-relaxed text-muted">
              <p className="mb-1 font-bold text-ink">{t('common.howCalculated')}</p>
              <p>{t('radar.explanation')}</p>
              <p className="mt-2">Demand: {active.unitsSold.toFixed(0)} {t('common.units')} / {active.demandSource === 'estimated' ? `${active.demandSource} ${t('common.estimated').toLowerCase()}` : active.demandSource}. {t('common.estimatedNote')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/app/ask?q=product&id=${active.product.id}`} className={buttonClass('secondary', 'sm')}>{t('nav.ask')}</Link>
              <Link to="/app/products" className={buttonClass('ghost', 'sm')}>{t('nav.products')}</Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
