import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CircleDollarSign, Info, RotateCcw, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_RECOVERY, moneyStuck } from '../lib/engine';
import { formatCompactINR, formatINR, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';
import { PageHeader, EstimatedBadge, StatusBadge } from '../components/shared';
import { Badge, Button, Card, Field, Input, buttonClass } from '../components/ui';

const COLORS = ['#0f9d58', '#f59e0b', '#c83237'];

export default function MoneyStuckPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const [slowRecoveryPct, setSlowRecoveryPct] = useState(DEFAULT_RECOVERY.slowRecoveryPct);
  const [deadRecoveryPct, setDeadRecoveryPct] = useState(DEFAULT_RECOVERY.deadRecoveryPct);
  const [returnSharePct, setReturnSharePct] = useState(DEFAULT_RECOVERY.returnSharePct);

  const breakdown = useMemo(
    () => moneyStuck(state, { slowRecoveryPct, deadRecoveryPct, returnSharePct }),
    [state, slowRecoveryPct, deadRecoveryPct, returnSharePct],
  );
  const top = [...breakdown.products].sort((a, b) => b.stockValue - a.stockValue).slice(0, 8);
  const chart = breakdown.byCategory.slice(0, 7).map((entry) => ({
    name: entry.category.length > 12 ? `${entry.category.slice(0, 11)}…` : entry.category,
    value: Math.round(entry.value),
    dead: Math.round(entry.deadValue),
  }));

  const healthCards = [
    { label: t('stuck.healthy'), value: breakdown.healthy, count: breakdown.products.filter((metric) => metric.status === 'healthy').length, tone: 'text-primary' },
    { label: t('stuck.slow'), value: breakdown.slow, count: breakdown.slowCount, tone: 'text-accent' },
    { label: t('stuck.dead'), value: breakdown.dead, count: breakdown.deadCount, tone: 'text-danger' },
  ];

  return (
    <div>
      <PageHeader
        number="06"
        title={t('stuck.title')}
        sub={t('stuck.sub')}
        actions={<Link to="/app/dead-stock" className={buttonClass('secondary')}>{t('nav.deadStock')} <ArrowUpRight className="h-4 w-4" /></Link>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="kicker">{t('stuck.total')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(breakdown.totalValue)}</p>
          <p className="mt-1 text-[11px] text-muted">{breakdown.products.length} {t('common.products')}</p>
        </Card>
        {healthCards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="kicker">{card.label}</p>
            <p className={cn('num mt-2 text-2xl font-black', card.tone)}>{formatINR(card.value)}</p>
            <p className="mt-1 text-[11px] text-muted">{card.count} {t('common.products')}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker">{t('stuck.category')}</p>
                <h2 className="mt-1 text-lg font-extrabold">{t('stuck.title')}</h2>
              </div>
              <Badge tone="neutral">{t('common.estimated')}</Badge>
            </div>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactINR(Number(value))} />
                  <Tooltip
                    formatter={(value, name) => [formatINR(Number(value)), name === 'dead' ? t('stuck.dead') : t('stuck.total')]}
                    contentStyle={{ borderRadius: 12, borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text)' }}
                  />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]}>
                    {chart.map((entry) => <Cell key={entry.name} fill={entry.dead > entry.value * 0.5 ? COLORS[2] : entry.dead > 0 ? COLORS[1] : COLORS[0]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted">{t('stuck.how')}</p>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-4">
              <div>
                <p className="kicker">{t('stuck.topProducts')}</p>
                <p className="mt-1 text-xs text-muted">{t('dead.valueNote')}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => window.print()} className="no-print">{t('common.pdf')}</Button>
            </div>
            <div className="divide-y divide-line">
              {top.map((metric) => (
                <div key={metric.product.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {metric.product.category} · {formatNumber(metric.stock, 1)} {metric.product.unit} · {t('common.margin')} {metric.marginPct.toFixed(1)}%
                    </p>
                  </div>
                  <StatusBadge status={metric.status} />
                  <span className="num w-24 text-right text-sm font-bold">{formatINR(metric.stockValue)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="kicker">{t('stuck.recovery')}</p>
              <button
                type="button"
                className="rounded-lg p-1 text-muted hover:text-ink"
                aria-label={t('common.resetDemo')}
                onClick={() => { setSlowRecoveryPct(DEFAULT_RECOVERY.slowRecoveryPct); setDeadRecoveryPct(DEFAULT_RECOVERY.deadRecoveryPct); setReturnSharePct(DEFAULT_RECOVERY.returnSharePct); }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <Field label={`${t('stuck.discountAssumption')} · ${slowRecoveryPct}%`}>
                <Input type="range" min={0} max={100} step={5} value={slowRecoveryPct} onChange={(event) => setSlowRecoveryPct(Number(event.target.value))} className="h-2 cursor-pointer p-0" />
              </Field>
              <Field label={`${t('stuck.returnAssumption')} · ${deadRecoveryPct}%`}>
                <Input type="range" min={0} max={100} step={5} value={deadRecoveryPct} onChange={(event) => setDeadRecoveryPct(Number(event.target.value))} className="h-2 cursor-pointer p-0" />
              </Field>
              <Field label={`${t('dead.return')} · ${returnSharePct}%`}>
                <Input type="range" min={0} max={100} step={5} value={returnSharePct} onChange={(event) => setReturnSharePct(Number(event.target.value))} className="h-2 cursor-pointer p-0" />
              </Field>
            </div>
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft p-3">
              <p className="kicker text-primary">{t('stuck.freed')}</p>
              <p className="num mt-1 text-xl font-black text-primary">{formatINR(breakdown.freedLow)} – {formatINR(breakdown.freedHigh)}</p>
              <div className="mt-1"><EstimatedBadge /></div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('stuck.freedNote')}</p>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t('stuck.estimateDisclaimer')}</p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker">{t('stuck.udhaar')}</p>
                <p className="num mt-1 text-xl font-black">{formatINR(breakdown.udhaar)}</p>
              </div>
              <span className="rounded-xl bg-primary-soft p-2 text-primary"><Users className="h-5 w-5" /></span>
            </div>
            <Link to="/app/udhaar" className={buttonClass('secondary', 'sm', 'mt-3 w-full')}>{t('nav.udhaar')} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><CircleDollarSign className="h-4 w-4 text-primary" /> {t('common.howCalculated')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('stuck.how')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('common.estimatedNote')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
