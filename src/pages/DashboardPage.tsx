import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  PackageSearch,
  ReceiptIndianRupee,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import {
  allProductMetrics,
  dataHealth,
  expenseAlerts,
  inventorySummary,
  moneyStuck,
  profitAnalysis,
  urgencyRank,
} from '../lib/engine';
import { formatCompactINR, formatINR, formatNumber, pct } from '../lib/format';
import { nextWeekday } from '../lib/utils';
import { PageHeader, StatCard, SystemPanel, Countdown, UrgencyChip, HealthCallout, DataQualityNote, MoneyLine } from '../components/shared';
import { Badge, Button, Card, Progress, buttonClass } from '../components/ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0f9d58', '#f59e0b', '#c83237'];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { updateAction } = useAppData();
  const state = useRequiredState();
  const metrics = allProductMetrics(state);
  const summary = inventorySummary(state, metrics);
  const stuck = moneyStuck(state);
  const profit = profitAnalysis(state);
  const alerts = expenseAlerts(state);
  const health = dataHealth(state);
  const urgent = metrics
    .filter((metric) => metric.urgency !== 'later')
    .sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency))
    .slice(0, 6);
  const openActions = state.actions.filter((action) => action.status === 'open').slice(0, 5);
  const nextCount = nextWeekday(new Date(), state.business.stockCheckDay, 10);
  const donut = [
    { name: t('status.healthy'), value: summary.byStatus.healthy.value },
    { name: t('status.slow'), value: summary.byStatus.slow.value },
    { name: t('status.dead'), value: summary.byStatus.dead.value },
  ];

  return (
    <div>
      <PageHeader
        number="01"
        title={t('nav.dashboard')}
        sub={t('dashboard.sub')}
        side={<SystemPanel state={state} compact />}
        actions={
          <Link to="/app/order" className={buttonClass('primary')}>
            <ShoppingCart className="h-4 w-4" /> {t('dashboard.orderCta')}
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t('dashboard.greeting', { name: state.business.ownerName.split(' ')[0] || 'Owner' })}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {state.business.name}
          </p>
        </div>
        <DataQualityNote confidence={state.business.dataLevel === 'full_sales' ? 'best' : state.business.dataLevel === 'orders_upi' ? 'good' : 'basic'}>
          <span>{t('dashboard.dataHealth')}: <strong className="num">{health.score}/100</strong></span>
        </DataQualityNote>
      </div>

      {health.staleCounts && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-[var(--warning-soft)] px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <ClipboardList className="h-4 w-4 shrink-0" />
            {t('dashboard.stale')}
          </p>
          <Link to="/app/stock-count" className={buttonClass('secondary', 'sm')}>{t('count.start')} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.stockValue')}
          value={formatINR(summary.totalValue)}
          meta={<span>{summary.totalProducts} {t('common.products')}</span>}
          icon={<BarChart3 className="h-4 w-4" />}
          to="/app/money-stuck"
        />
        <StatCard
          label={t('dashboard.moneyStuck')}
          value={formatINR(stuck.slow + stuck.dead)}
          meta={<span>{stuck.slowCount + stuck.deadCount} {t('common.products')}</span>}
          icon={<CircleDollarSign className="h-4 w-4" />}
          tone="danger"
          to="/app/money-stuck"
        />
        <StatCard
          label={t('dashboard.reorderNeeded')}
          value={String(summary.reorderCount)}
          meta={<span>{t('common.estimated')} {formatCompactINR(summary.reorderValue)}</span>}
          icon={<PackageSearch className="h-4 w-4" />}
          tone="accent"
          to="/app/reorder"
        />
        <StatCard
          label={t('dashboard.monthlyProfit')}
          value={formatINR(profit.totalGrossProfit)}
          meta={<span>{t('profit.margin')} {pct(profit.grossMarginPct)}</span>}
          icon={<TrendingUp className="h-4 w-4" />}
          estimated
          to="/app/profit"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
            <div>
              <p className="kicker">{t('dashboard.reorderPreview')}</p>
              <h3 className="mt-1 text-lg font-extrabold">{t('radar.title')}</h3>
            </div>
            <Link to="/app/reorder" className={buttonClass('secondary', 'sm')}>{t('common.viewAll')} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {urgent.length ? (
            <div className="divide-y divide-line">
              {urgent.map((metric) => (
                <div key={metric.product.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatNumber(metric.stock, 0)} {t('common.units')} · {metric.dailyDemand.toFixed(2)}{t('common.perDay')} · {metric.daysLeft === null ? t('common.noData') : `${metric.daysLeft.toFixed(0)} ${t('common.days')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <UrgencyChip urgency={metric.urgency} />
                    <span className="num w-16 text-right text-xs font-bold">{formatINR(metric.stockValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-sm text-muted">{t('radar.noItems')}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-bg/50 px-4 py-3 text-xs text-muted sm:px-5">
            <span>{t('order.pendingOrders')}</span>
            <Link to="/app/order" className="inline-flex items-center gap-1 font-bold text-primary">{t('dashboard.viewOrder')} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker">{t('dashboard.donut')}</p>
                <p className="num mt-1 text-xl font-black">{formatCompactINR(summary.totalValue)}</p>
              </div>
              <Link to="/app/money-stuck" className="text-[11px] font-bold text-primary">{t('common.viewDetails')}</Link>
            </div>
            <div className="mt-3 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                    {donut.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ borderRadius: 12, borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {donut.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[index] }} />{item.name}</span>
                  <span className="num font-bold">{formatINR(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <Countdown target={nextCount} />
            <p className="mt-2 text-[11px] text-muted">
              {state.business.stockCheckDay === 0 ? 'Sunday' : 'Configured day'} · {t('settings.stockReminder')}
            </p>
            <div className="mt-3">
              <HealthCallout score={health.score} />
            </div>
            <Link to="/app/stock-count" className={buttonClass('secondary', 'sm', 'mt-3 w-full')}>{t('count.start')}</Link>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker">{t('dashboard.actionsTitle')}</p>
              <p className="mt-1 text-xs text-muted">{t('dashboard.actionsSub')}</p>
            </div>
            <Link to="/app/actions" className="text-[11px] font-bold text-primary">{t('common.viewAll')}</Link>
          </div>
          <div className="mt-4 space-y-2">
            {openActions.length ? openActions.map((action) => (
              <div key={action.id} className="rounded-xl border border-line bg-bg/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug">{action.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{action.detail}</p>
                  </div>
                  {action.impactAmount > 0 && <Badge tone="red"><MoneyLine value={action.impactAmount} /></Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => updateAction(action.id, 'done')}>{t('common.markDone')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateAction(action.id, 'snoozed')}>{t('common.remindTomorrow')}</Button>
                  {action.type === 'reorder' && <Link to="/app/order" className={buttonClass('secondary', 'sm')}>{t('dashboard.viewOrder')}</Link>}
                  {action.type === 'dead_stock' && <Link to="/app/dead-stock" className={buttonClass('secondary', 'sm')}>{t('nav.deadStock')}</Link>}
                  {action.type === 'expense' && <Link to="/app/expenses" className={buttonClass('secondary', 'sm')}>{t('nav.expenses')}</Link>}
                  {action.type === 'udhaar' && <Link to="/app/udhaar" className={buttonClass('secondary', 'sm')}>{t('nav.udhaar')}</Link>}
                  {action.type === 'margin' && <Link to="/app/profit" className={buttonClass('secondary', 'sm')}>{t('nav.profit')}</Link>}
                  {action.type === 'stock_count' && <Link to="/app/stock-count" className={buttonClass('secondary', 'sm')}>{t('nav.stockCount')}</Link>}
                </div>
              </div>
            )) : <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">{t('dashboard.noActions')}</p>}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="kicker">{t('dashboard.expenseTitle')}</p>
              <Link to="/app/expenses" className="text-[11px] font-bold text-primary">{t('common.viewAll')}</Link>
            </div>
            <div className="mt-3 space-y-2">
              {alerts.length ? alerts.slice(0, 3).map((alert) => (
                <div key={alert.category} className="flex items-start gap-2 rounded-lg bg-[var(--warning-soft)] p-2.5 text-xs">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-bold capitalize">{alert.category} · {formatINR(alert.current)}</p>
                    <p className="mt-0.5 text-muted">+{alert.increasePct.toFixed(0)}% · {formatINR(alert.previous)} {t('common.lastMonth')}</p>
                  </div>
                </div>
              )) : <p className="text-xs text-muted">{t('expenses.noSpike')}</p>}
            </div>
          </Card>

          <Card className="border-primary/30 p-4 sm:p-5">
            <p className="kicker text-primary">{t('dashboard.askTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('dashboard.askPlaceholder')}</p>
            <div className="mt-3 grid gap-1.5">
              {[
                ['dashboard.quickAsk1', '/app/ask?q=order'],
                ['dashboard.quickAsk2', '/app/ask?q=dead'],
                ['dashboard.quickAsk3', '/app/ask?q=profit'],
                ['dashboard.quickAsk4', '/app/ask?q=festival'],
              ].map(([key, to]) => (
                <Link key={key} to={to} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:border-primary">
                  {t(key)} <ArrowRight className="h-3.5 w-3.5 text-muted" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">{t('dashboard.dataHealth')}</p>
            <p className="mt-1 text-sm text-muted">{health.issues.length ? health.issues[0].detail : t('common.saved')}</p>
          </div>
          <HealthCallout score={health.score} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {health.issues.length ? health.issues.slice(0, 4).map((issue) => (
            <div key={issue.id} className="flex items-start gap-2 rounded-xl border border-line p-3 text-xs">
              <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${issue.severity === 'warn' ? 'bg-accent' : 'bg-info'}`} />
              <div><p className="font-bold">{issue.title}</p><p className="mt-0.5 text-muted">{issue.detail}</p></div>
            </div>
          )) : <p className="text-xs text-primary">{t('common.saved')}</p>}
        </div>
        {health.issues.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/app/products" className={buttonClass('secondary', 'sm')}>{t('dashboard.dataFix')} <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link to="/app/stock-count" className={buttonClass('secondary', 'sm')}>{t('nav.stockCount')}</Link>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/app/reorder', labelKey: 'nav.reorder', Icon: PackageSearch },
          { to: '/app/dead-stock', labelKey: 'nav.deadStock', Icon: AlertTriangle },
          { to: '/app/profit', labelKey: 'nav.profit', Icon: BarChart3 },
          { to: '/app/expenses', labelKey: 'nav.expenses', Icon: ReceiptIndianRupee },
        ].map(({ to, labelKey, Icon }) => (
          <Link key={to} to={to} className="surface flex items-center gap-3 p-4 text-sm font-bold transition hover:border-primary">
            <span className="rounded-xl bg-primary-soft p-2 text-primary"><Icon className="h-4 w-4" /></span>
            {t(labelKey)}
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-card border border-dashed border-line p-4 text-xs text-muted">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span>{t('common.estimatedNote')} {t('common.offlineChanges')}</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={health.score} className="max-w-xs" label={t('dashboard.dataHealth')} />
        <span className="text-[11px] text-muted">{t('dashboard.dataHealth')}</span>
      </div>
    </div>
  );
}
