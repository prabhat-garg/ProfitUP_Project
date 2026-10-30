import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Check,
  ClipboardList,
  Clock,
  IndianRupee,
  PackageSearch,
  ReceiptIndianRupee,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import {
  allProductMetrics,
  buildOrderPlan,
  DEFAULT_ORDER_OPTIONS,
  expenseAlerts,
  moneyStuck,
  profitAnalysis,
  udhaarAgeing,
} from '../lib/engine';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, EmptyState, Select, Tabs, buttonClass, useToast } from '../components/ui';
import type { ActionItem } from '../lib/types';

const typeMeta: Record<
  ActionItem['type'],
  { labelKey: string; icon: typeof Sparkles; to: string; tone: 'green' | 'amber' | 'red' | 'blue' | 'saffron' | 'violet' | 'neutral' }
> = {
  reorder: { labelKey: 'actions.reorder', icon: PackageSearch, to: '/app/order', tone: 'red' },
  dead_stock: { labelKey: 'actions.dead', icon: Boxes, to: '/app/dead-stock', tone: 'amber' },
  expense: { labelKey: 'actions.expense', icon: ReceiptIndianRupee, to: '/app/expenses', tone: 'violet' },
  margin: { labelKey: 'actions.margin', icon: TrendingUp, to: '/app/profit', tone: 'blue' },
  udhaar: { labelKey: 'actions.udhaarType', icon: Users, to: '/app/udhaar', tone: 'saffron' },
  stock_count: { labelKey: 'actions.stockType', icon: ClipboardList, to: '/app/stock-count', tone: 'green' },
  data: { labelKey: 'actions.data', icon: AlertTriangle, to: '/app/products', tone: 'neutral' },
};

interface Suggestion {
  id: string;
  type: ActionItem['type'];
  title: string;
  detail: string;
  amount: number;
  to: string;
}

export default function ActionsPage() {
  const { t } = useTranslation();
  const state = useRequiredState();
  const { updateAction } = useAppData();
  const { push } = useToast();
  const [tab, setTab] = useState('open');
  const [typeFilter, setTypeFilter] = useState('all');

  const metrics = useMemo(() => allProductMetrics(state), [state]);
  const plan = useMemo(() => buildOrderPlan(state, DEFAULT_ORDER_OPTIONS), [state]);
  const stuck = useMemo(() => moneyStuck(state), [state]);
  const profit = useMemo(() => profitAnalysis(state), [state]);
  const alerts = useMemo(() => expenseAlerts(state), [state]);
  const ageing = useMemo(() => udhaarAgeing(state), [state]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [];
    const urgent = metrics.filter((metric) => metric.urgency === 'today' || metric.urgency === 'three');
    if (urgent.length) {
      list.push({
        id: 'sug_reorder',
        type: 'reorder',
        title: `${urgent.length} ${t('common.products')} ${t('radar.daysLeft').toLowerCase()} < 3`,
        detail: `${t('order.sub')} ${formatINR(plan.totalCost)}`,
        amount: plan.totalCost,
        to: '/app/order',
      });
    }
    if (stuck.deadCount > 0) {
      list.push({
        id: 'sug_dead',
        type: 'dead_stock',
        title: `${formatINR(stuck.dead)} ${t('dead.tiedUp').toLowerCase()}`,
        detail: t('dead.sub'),
        amount: stuck.dead,
        to: '/app/dead-stock',
      });
    }
    alerts.slice(0, 1).forEach((alert) => {
      list.push({
        id: `sug_exp_${alert.category}`,
        type: 'expense',
        title: `${alert.category} +${alert.increasePct.toFixed(0)}%`,
        detail: `${formatINR(alert.current)} vs ${formatINR(alert.previous)} ${t('common.lastMonth')}`,
        amount: alert.current - alert.previous,
        to: '/app/expenses',
      });
    });
    profit.lowMarginHighVolume.slice(0, 1).forEach((row) => {
      list.push({
        id: `sug_margin_${row.productId}`,
        type: 'margin',
        title: `${row.name} · ${row.marginPct.toFixed(1)}% ${t('common.margin').toLowerCase()}`,
        detail: t('profit.supplierTalk'),
        amount: row.grossProfit * 0.05,
        to: '/app/profit',
      });
    });
    if (ageing.days30plus > 0 || ageing.days8to30 > 0) {
      list.push({
        id: 'sug_udhaar',
        type: 'udhaar',
        title: `${formatINR(ageing.days30plus + ageing.days8to30)} ${t('udhaar.overdue').toLowerCase()}`,
        detail: t('udhaar.sub'),
        amount: ageing.days30plus + ageing.days8to30,
        to: '/app/udhaar',
      });
    }
    if (state.stockCounts.length === 0) {
      list.push({
        id: 'sug_count',
        type: 'stock_count',
        title: t('dashboard.stale'),
        detail: t('count.sub'),
        amount: 0,
        to: '/app/stock-count',
      });
    }
    return list;
  }, [metrics, plan, stuck, profit, alerts, ageing, state.stockCounts.length, t]);

  const filtered = state.actions
    .filter((action) => tab === 'all' || action.status === tab)
    .filter((action) => typeFilter === 'all' || action.type === typeFilter)
    .sort((a, b) => b.impactAmount - a.impactAmount);

  const openImpact = state.actions
    .filter((action) => action.status === 'open')
    .reduce((total, action) => total + action.impactAmount, 0);

  const mark = (action: ActionItem, status: ActionItem['status']) => {
    updateAction(action.id, status);
    push({
      title: status === 'done' ? t('actions.markedDone') : status === 'snoozed' ? t('actions.snoozedMsg') : t('actions.dismissed'),
      body: action.title,
    });
  };

  const typeOptions = Object.entries(typeMeta).map(([value, meta]) => ({ value, label: t(meta.labelKey) }));

  return (
    <div>
      <PageHeader
        number="13"
        title={t('actions.title')}
        sub={t('actions.sub')}
        actions={
          <Link to="/app/reports" className={buttonClass('secondary')}>
            {t('actions.weekly')} <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="kicker">{t('actions.open')}</p>
          <p className="num mt-2 text-2xl font-black">{state.actions.filter((action) => action.status === 'open').length}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('actions.impact')}</p>
          <p className="num mt-2 text-2xl font-black text-primary">{formatINR(openImpact)}</p>
          <p className="mt-1 text-[11px] text-muted">{t('common.estimated')}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('actions.done')}</p>
          <p className="num mt-2 text-2xl font-black">{state.actions.filter((action) => action.status === 'done').length}</p>
        </Card>
      </div>

      {suggestions.length > 0 && (
        <Card className="mb-5 border-primary/30 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="kicker text-primary">{t('actions.weekly')}</p>
              <h2 className="mt-1 text-base font-extrabold">{t('dashboard.todayAction')}</h2>
            </div>
            <Badge tone="blue">{t('ask.ruleBased')}</Badge>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {suggestions.map((suggestion) => {
              const meta = typeMeta[suggestion.type];
              const Icon = meta.icon;
              return (
                <Link
                  key={suggestion.id}
                  to={suggestion.to}
                  className="group flex items-start gap-3 rounded-xl border border-line bg-bg/40 p-3 transition hover:border-primary/60"
                >
                  <span className="rounded-lg bg-primary-soft p-2 text-primary"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug">{suggestion.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{suggestion.detail}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {suggestion.amount > 0 && <span className="num block text-xs font-bold">{formatINR(suggestion.amount)}</span>}
                    <ArrowUpRight className="ml-auto mt-1 h-3.5 w-3.5 text-muted group-hover:text-primary" />
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          value={tab}
          onChange={setTab}
          ariaLabel={t('actions.title')}
          tabs={[
            { id: 'open', label: t('actions.open'), count: state.actions.filter((action) => action.status === 'open').length },
            { id: 'snoozed', label: t('actions.snoozed'), count: state.actions.filter((action) => action.status === 'snoozed').length },
            { id: 'done', label: t('actions.done'), count: state.actions.filter((action) => action.status === 'done').length },
            { id: 'all', label: t('actions.all') },
          ]}
        />
        <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 w-auto min-w-[150px] text-xs" aria-label={t('actions.filterType')}>
          <option value="all">{t('common.all')} · {t('actions.filterType')}</option>
          {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((action) => {
            const meta = typeMeta[action.type];
            const Icon = meta.icon;
            return (
              <Card key={action.id} className={cn('p-4 sm:p-5', action.status !== 'open' && 'opacity-70')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className={cn('mt-0.5 h-fit rounded-xl p-2.5', action.status === 'open' ? 'bg-primary-soft text-primary' : 'bg-bg text-muted')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{t(meta.labelKey)}</Badge>
                        {action.status !== 'open' && (
                          <Badge tone={action.status === 'done' ? 'green' : action.status === 'snoozed' ? 'blue' : 'neutral'}>
                            {action.status === 'done' ? t('actions.done') : action.status === 'snoozed' ? t('actions.snoozed') : t('actions.dismissed')}
                          </Badge>
                        )}
                        {action.snoozeUntil && <span className="text-[10px] text-muted">{action.snoozeUntil}</span>}
                      </div>
                      <h3 className="mt-1.5 text-sm font-extrabold leading-snug sm:text-base">{action.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{action.detail}</p>
                    </div>
                  </div>
                  {action.impactAmount > 0 && (
                    <div className="text-right">
                      <p className="kicker">{t('actions.impact')}</p>
                      <p className="num mt-0.5 text-lg font-black">{formatINR(action.impactAmount)}</p>
                      <p className="text-[10px] text-muted">{t('common.estimated')}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <Link to={meta.to} className={buttonClass('primary', 'sm')}>
                    {t('common.openInApp')} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  {action.status === 'open' || action.status === 'snoozed' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => mark(action, 'done')}><Check className="h-3.5 w-3.5" /> {t('common.markDone')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => mark(action, 'snoozed')}><Clock className="h-3.5 w-3.5" /> {t('common.remindTomorrow')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => mark(action, 'dismissed')}><X className="h-3.5 w-3.5" /> {t('common.notNow')}</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => mark(action, 'open')}><RotateCcw className="h-3.5 w-3.5" /> {t('common.open')}</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IndianRupee className="h-5 w-5" />}
          title={t('actions.empty')}
          body={t('actions.sub')}
          action={<Link to="/app/reports" className={buttonClass('secondary')}>{t('actions.weekly')}</Link>}
        />
      )}

      <div className="mt-5 rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
        <p className="font-bold text-ink">{t('common.howCalculated')}</p>
        <p className="mt-1">{t('actions.sub')} {t('common.estimatedNote')}</p>
      </div>
    </div>
  );
}
