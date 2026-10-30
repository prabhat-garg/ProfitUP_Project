import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Coins,
  ReceiptIndianRupee,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRequiredState } from '../context/AppDataContext';
import { profitAnalysis, revenueSanity } from '../lib/engine';
import { formatCompactINR, formatINR, formatNumber, pct } from '../lib/format';
import { cn } from '../lib/utils';
import { PageHeader, EstimatedBadge, InsightLine } from '../components/shared';
import { Badge, Card, Select, Tabs, buttonClass } from '../components/ui';

const QUADRANTS = [
  { id: 'star', label: 'profit.stars', tone: 'green' as const },
  { id: 'supplier', label: 'profit.supplierTalk', tone: 'amber' as const },
  { id: 'promote', label: 'profit.promote', tone: 'blue' as const },
  { id: 'drop', label: 'profit.drop', tone: 'red' as const },
] as const;

export default function ProfitPage() {
  const { t } = useTranslation();
  const state = useRequiredState();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<'overview' | 'matrix'>('overview');
  const analysis = useMemo(() => profitAnalysis(state, days), [state, days]);
  const sanity = useMemo(() => revenueSanity(state, analysis), [state, analysis]);
  const chart = analysis.byCategory.slice(0, 8).map((entry) => ({
    name: entry.category.length > 11 ? `${entry.category.slice(0, 10)}…` : entry.category,
    gross: Math.round(entry.gross),
    revenue: Math.round(entry.revenue),
  }));

  return (
    <div>
      <PageHeader
        number="07"
        title={t('profit.title')}
        sub={t('profit.sub')}
        actions={
          <Select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-auto" aria-label={t('common.last30')}>
            <option value={7}>{t('common.last7')}</option>
            <option value={30}>{t('common.last30')}</option>
            <option value={90}>90 {t('common.days')}</option>
          </Select>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Tabs
          tabs={[{ id: 'overview', label: t('profit.title') }, { id: 'matrix', label: t('profit.matrix') }]}
          value={tab}
          onChange={(value) => setTab(value as 'overview' | 'matrix')}
          ariaLabel={t('profit.title')}
        />
        <span className="flex items-center gap-2 text-[11px] text-muted"><EstimatedBadge /> {t('profit.noSalesNote')}</span>
      </div>

      {tab === 'overview' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="kicker">{t('profit.gross')}</p>
              <p className="num mt-2 text-2xl font-black text-primary">{formatINR(analysis.totalGrossProfit)}</p>
              <p className="mt-1 text-[11px] text-muted">{t('profit.margin')} {pct(analysis.grossMarginPct)}</p>
            </Card>
            <Card className="p-4">
              <p className="kicker">{t('profit.net')}</p>
              <p className={cn('num mt-2 text-2xl font-black', analysis.netEstimate >= 0 ? 'text-ink' : 'text-danger')}>{formatINR(analysis.netEstimate)}</p>
              <p className="mt-1 text-[11px] text-muted">{t('profit.expenses')} {formatINR(analysis.expensesThisMonth)}</p>
            </Card>
            <Card className="p-4">
              <p className="kicker">{t('profit.revenue')}</p>
              <p className="num mt-2 text-2xl font-black">{formatINR(analysis.totalRevenue)}</p>
              <p className="mt-1 text-[11px] text-muted">{days} {t('common.days')}</p>
            </Card>
            <Card className="p-4">
              <p className="kicker">{t('profit.expenses')}</p>
              <p className="num mt-2 text-2xl font-black text-accent">{formatINR(analysis.expensesThisMonth)}</p>
              <Link to="/app/expenses" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary">{t('nav.expenses')} <ArrowUpRight className="h-3 w-3" /></Link>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="kicker">{t('profit.category')}</p>
                  <p className="mt-1 text-xs text-muted">{t('profit.grossVsNet')}</p>
                </div>
                <Badge tone="neutral">{t('common.estimated')}</Badge>
              </div>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactINR(Number(value))} />
                    <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ borderRadius: 12, borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text)' }} />
                    <Bar dataKey="gross" fill="var(--primary-strong)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="p-4">
                <p className="kicker">{t('profit.topEarners')}</p>
                <div className="mt-3 space-y-2">
                  {analysis.topEarners.map((row, index) => (
                    <div key={row.productId} className="flex items-start gap-3">
                      <span className="num mt-0.5 text-[10px] font-black text-muted">{String(index + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{row.name}</p>
                        <p className="text-[10px] text-muted">{formatNumber(row.units, 0)} {t('common.units')} · {pct(row.marginPct)}</p>
                      </div>
                      <span className="num text-xs font-black text-primary">{formatINR(row.grossProfit)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={cn('p-4', sanity.verdict === 'missing' && 'border-accent/40')}>
                <p className="kicker">{t('profit.revenue')}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {sanity.low !== null && sanity.high !== null
                    ? `${formatCompactINR(sanity.low)} – ${formatCompactINR(sanity.high)} · ${sanity.gapPct > 0 ? '+' : ''}${sanity.gapPct.toFixed(0)}%`
                    : t('common.noData')}
                </p>
                <div className="mt-2">
                  <Badge tone={sanity.verdict === 'close' ? 'green' : sanity.verdict === 'missing' ? 'amber' : 'neutral'}>
                    {sanity.verdict === 'close' ? t('common.good') : sanity.verdict === 'missing' ? t('expenses.spike') : t('common.noData')}
                  </Badge>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line p-4">
                <p className="kicker">{t('profit.lowMargin')}</p>
                <Badge tone="amber">{analysis.lowMarginHighVolume.length}</Badge>
              </div>
              {analysis.lowMarginHighVolume.length ? (
                <div className="divide-y divide-line">
                  {analysis.lowMarginHighVolume.slice(0, 6).map((row) => (
                    <div key={row.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{row.name}</p>
                        <p className="text-[10px] text-muted">{formatNumber(row.units, 0)} {t('common.units')} · {t('common.margin')} {pct(row.marginPct)}</p>
                      </div>
                      <span className="num text-xs font-bold">{formatINR(row.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="p-4 text-xs text-muted">{t('profit.noPriceLeak')}</p>}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line p-4">
                <p className="kicker">{t('profit.priceLeak')}</p>
                <Badge tone={analysis.priceLeaks.length ? 'red' : 'green'}>{analysis.priceLeaks.length}</Badge>
              </div>
              {analysis.priceLeaks.length ? (
                <div className="divide-y divide-line">
                  {analysis.priceLeaks.slice(0, 6).map((leak) => (
                    <div key={leak.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{leak.name}</p>
                        <p className="text-[10px] text-muted">{formatINR(leak.oldCost)} → {formatINR(leak.newCost)} · +{leak.increasePct.toFixed(0)}%</p>
                      </div>
                      <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
                    </div>
                  ))}
                </div>
              ) : <p className="p-4 text-xs text-muted">{t('profit.noPriceLeak')}</p>}
            </Card>
          </div>

          {analysis.topEarners[0] && (
            <div className="mt-5">
              <InsightLine icon={<TrendingUp className="h-4 w-4" />}>
                {analysis.topEarners[0].name} {t('profit.topEarners').toLowerCase()} · {formatINR(analysis.topEarners[0].grossProfit)} · {pct(analysis.topEarners[0].marginPct)}
              </InsightLine>
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {QUADRANTS.map((quadrant) => {
            const rows = analysis.quadrants[quadrant.id];
            return (
              <Card key={quadrant.id} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-line p-4">
                  <div className="flex items-center gap-2">
                    <Badge tone={quadrant.tone}>{t(quadrant.label)}</Badge>
                    <span className="text-[11px] text-muted">{t('profit.matrix')}</span>
                  </div>
                  <span className="num text-xs font-bold">{rows.length}</span>
                </div>
                <div className="max-h-[280px] divide-y divide-line overflow-y-auto">
                  {rows.length ? rows.map((row) => (
                    <div key={row.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{row.name}</p>
                        <p className="text-[10px] text-muted">{formatNumber(row.units, 0)} {t('profit.units')} · {formatINR(row.grossProfit)}</p>
                      </div>
                      <span className={cn('num text-xs font-bold', row.marginPct < state.business.marginAlertPct ? 'text-danger' : 'text-primary')}>{pct(row.marginPct)}</span>
                    </div>
                  )) : <p className="p-4 text-xs text-muted">{t('common.noData')}</p>}
                </div>
              </Card>
            );
          })}
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3 text-[11px] text-muted">
            <span className="flex items-center gap-2"><Coins className="h-3.5 w-3.5" /> {t('profit.grossVsNet')}</span>
            <span className="flex items-center gap-2"><ReceiptIndianRupee className="h-3.5 w-3.5" /> {t('common.estimatedNote')}</span>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { to: '/app/expenses', labelKey: 'nav.expenses', Icon: ReceiptIndianRupee },
          { to: '/app/money-stuck', labelKey: 'nav.moneyStuck', Icon: TrendingDown },
          { to: '/app/ask', labelKey: 'nav.ask', Icon: BarChart3 },
        ].map(({ to, labelKey, Icon }) => (
          <Link key={to} to={to} className="surface flex items-center gap-3 p-4 text-sm font-bold transition hover:border-primary">
            <span className="rounded-xl bg-primary-soft p-2 text-primary"><Icon className="h-4 w-4" /></span>
            {t(labelKey)}
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/reports" className={buttonClass('secondary', 'sm')}>{t('nav.reports')}</Link>
        <Link to="/app/products" className={buttonClass('ghost', 'sm')}>{t('nav.products')}</Link>
      </div>
    </div>
  );
}
