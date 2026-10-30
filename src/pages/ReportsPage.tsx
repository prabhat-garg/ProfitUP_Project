import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Landmark,
  PackageSearch,
  Share2,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import {
  allProductMetrics,
  buildOrderPlan,
  dataHealth,
  DEFAULT_ORDER_OPTIONS,
  expenseAlerts,
  inventorySummary,
  moneyStuck,
  profitAnalysis,
  udhaarAgeing,
} from '../lib/engine';
import { formatDate, formatINR, formatNumber, pct } from '../lib/format';
import { copyText, todayISO } from '../lib/utils';
import { downloadCSV, reportPDF, type ReportSection } from '../lib/exports';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, Tabs, buttonClass, useToast } from '../components/ui';

type Period = 'weekly' | 'monthly';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { push } = useToast();
  const [period, setPeriod] = useState<Period>('monthly');
  const [busy, setBusy] = useState(false);

  const days = period === 'weekly' ? 7 : 30;
  const metrics = useMemo(() => allProductMetrics(state), [state]);
  const summary = useMemo(() => inventorySummary(state, metrics), [state, metrics]);
  const profit = useMemo(() => profitAnalysis(state, days), [state, days]);
  const stuck = useMemo(() => moneyStuck(state), [state]);
  const plan = useMemo(() => buildOrderPlan(state, { ...DEFAULT_ORDER_OPTIONS, coverDays: period === 'weekly' ? 7 : 15 }), [state, period]);
  const alerts = useMemo(() => expenseAlerts(state), [state]);
  const ageing = useMemo(() => udhaarAgeing(state), [state]);
  const health = useMemo(() => dataHealth(state), [state]);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);
  const recordedSales = state.sales.filter((sale) => sale.date >= sinceKey);
  const recordedRevenue = recordedSales.reduce((total, sale) => total + sale.qty * sale.sellingPrice, 0);
  const topExpense = Object.entries(
    state.expenses
      .filter((expense) => expense.date >= sinceKey)
      .reduce<Record<string, number>>((totals, expense) => {
        totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
        return totals;
      }, {}),
  ).sort((a, b) => b[1] - a[1])[0];

  const sections: ReportSection[] = [
    {
      heading: `${t('reports.sales')} (${period === 'weekly' ? t('reports.weekly') : t('reports.monthly')})`,
      rows: [
        [t('reports.sales'), formatINR(profit.totalRevenue)],
        [t('common.actual'), formatINR(recordedRevenue)],
        [t('reports.profit'), formatINR(profit.totalGrossProfit)],
        [t('common.margin'), pct(profit.grossMarginPct)],
        [t('reports.expenses'), formatINR(profit.expensesThisMonth)],
        [t('profit.net'), formatINR(profit.netEstimate)],
      ],
      body: t('reports.disclaimer'),
    },
    {
      heading: t('reports.inventory'),
      rows: [
        [t('common.total'), formatINR(summary.totalValue)],
        [t('status.healthy'), formatINR(summary.byStatus.healthy.value)],
        [t('status.slow'), formatINR(summary.byStatus.slow.value)],
        [t('status.dead'), formatINR(summary.byStatus.dead.value)],
        [t('dead.tiedUp'), formatINR(stuck.dead + stuck.slow)],
        [t('common.productCount', { count: summary.totalProducts }), formatNumber(summary.totalProducts)],
      ],
    },
    {
      heading: t('reports.reorder'),
      rows: [
        [t('order.currentPlan'), t('common.itemCount', { count: plan.items.length })],
        [t('common.total'), formatINR(plan.totalCost)],
        [`${t('urgency.today')} / ${t('urgency.three')}`, String(metrics.filter((metric) => metric.urgency === 'today' || metric.urgency === 'three').length)],
        [t('order.supplierTotals'), String(plan.supplierTotals.length)],
      ],
    },
    {
      heading: t('reports.expenses'),
      rows: [
        [t('expenses.monthly'), formatINR(profit.expensesThisMonth)],
        [t('expenses.category'), topExpense ? `${t(`expenses.${topExpense[0]}`)} — ${formatINR(topExpense[1])}` : t('common.noData')],
        [t('expenses.spike'), String(alerts.length)],
      ],
    },
    {
      heading: t('udhaar.title'),
      rows: [
        [t('udhaar.total'), formatINR(ageing.total)],
        [t('udhaar.overdue'), formatINR(ageing.days30plus + ageing.days8to30)],
        [t('udhaar.bucket30'), formatINR(ageing.days30plus)],
        [t('udhaar.title'), formatNumber(state.customers.length)],
      ],
    },
    {
      heading: t('reports.loan'),
      rows: [
        [t('common.stock'), formatINR(summary.totalValue)],
        [t('reports.profit'), formatINR(profit.totalGrossProfit)],
        [t('udhaar.title'), formatINR(ageing.total)],
        [t('common.margin'), pct(profit.grossMarginPct)],
        [t('dashboard.dataHealth'), `${health.score}/100`],
      ],
      body: t('reports.loanNote'),
    },
  ];

  const downloadPDF = () => {
    setBusy(true);
    try {
      reportPDF(state, `${period === 'weekly' ? 'Weekly' : 'Monthly'} summary`, sections, lang);
      push({ title: t('common.saved'), body: t('reports.downloadPdf') });
    } finally {
      setBusy(false);
    }
  };

  const downloadCSVReport = () => {
    const rows: Array<Array<unknown>> = [[t('reports.title'), period === 'weekly' ? t('reports.weekly') : t('reports.monthly')]];
    sections.forEach((section) => {
      rows.push([], [section.heading], ...section.rows);
      if (section.body) rows.push([section.body]);
    });
    downloadCSV(`profitup-report-${period}-${todayISO()}.csv`, rows);
  };

  const copySummary = async () => {
    const lines = [
      `*${t('reports.title')} — ${state.business.name}*`,
      `${period === 'weekly' ? t('reports.weekly') : t('reports.monthly')} · ${formatDate(new Date(), lang)}`,
      '',
      `${t('reports.sales')}: ${formatINR(profit.totalRevenue)} (${t('common.estimated')})`,
      `${t('reports.profit')}: ${formatINR(profit.totalGrossProfit)} (${t('common.estimated')})`,
      `${t('reports.expenses')}: ${formatINR(profit.expensesThisMonth)}`,
      `${t('reports.inventory')}: ${formatINR(summary.totalValue)}`,
      `${t('dead.title')}: ${formatINR(stuck.dead)}`,
      `${t('reports.reorder')}: ${plan.items.length} · ${formatINR(plan.totalCost)}`,
      `${t('udhaar.title')}: ${formatINR(ageing.total)}`,
      '',
      t('reports.disclaimer'),
    ];
    await copyText(lines.join('\n'));
    push({ title: t('common.copied') });
  };

  const packCards = [
    {
      key: 'sales',
      icon: TrendingUp,
      title: t('reports.sales'),
      value: formatINR(profit.totalRevenue),
      meta: `${t('common.estimated')} · ${t('common.actual')}: ${formatINR(recordedRevenue)}`,
      tone: 'green' as const,
    },
    {
      key: 'profit',
      icon: WalletCards,
      title: t('reports.profit'),
      value: formatINR(profit.totalGrossProfit),
      meta: `${t('common.margin')} ${pct(profit.grossMarginPct)}`,
      tone: 'blue' as const,
    },
    {
      key: 'inventory',
      icon: ClipboardCheck,
      title: t('reports.inventory'),
      value: formatINR(summary.totalValue),
      meta: `${summary.deadCount} ${t('status.dead').toLowerCase()} · ${summary.slowCount} ${t('status.slow').toLowerCase()}`,
      tone: 'amber' as const,
    },
    {
      key: 'reorder',
      icon: PackageSearch,
      title: t('reports.reorder'),
      value: formatINR(plan.totalCost),
      meta: `${plan.items.length} ${t('common.items')}`,
      tone: 'violet' as const,
    },
  ];

  return (
    <div>
      <PageHeader
        number="15"
        title={t('reports.title')}
        sub={t('reports.sub')}
        actions={
          <>
            <Button variant="secondary" onClick={copySummary}>
              <Share2 className="h-4 w-4" /> {t('reports.whatsapp')}
            </Button>
            <Button variant="secondary" onClick={downloadCSVReport}>
              <FileSpreadsheet className="h-4 w-4" /> {t('common.csv')}
            </Button>
            <Button onClick={downloadPDF} disabled={busy}>
              <Download className="h-4 w-4" /> {t('reports.downloadPdf')}
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={period}
          onChange={(value) => setPeriod(value as Period)}
          ariaLabel={t('reports.title')}
          tabs={[
            { id: 'weekly', label: t('reports.weekly') },
            { id: 'monthly', label: t('reports.monthly') },
          ]}
        />
        <p className="text-[11px] font-semibold text-muted">
          {formatDate(sinceKey, lang)} — {formatDate(new Date(), lang)} · {days} {t('common.days')}
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {packCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="kicker">{card.title}</p>
                <span className="rounded-xl bg-primary-soft p-2 text-primary"><Icon className="h-4 w-4" /></span>
              </div>
              <p className="num mt-4 text-2xl font-black tracking-tight">{card.value}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={card.tone}>{t('common.estimated')}</Badge>
                <span className="text-[11px] text-muted">{card.meta}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line p-4 sm:p-5">
            <p className="kicker">{t('reports.generate')}</p>
            <h2 className="mt-2 text-lg font-extrabold">{period === 'weekly' ? t('reports.weekly') : t('reports.monthly')} {t('reports.title').toLowerCase()}</h2>
            <p className="mt-1 text-xs text-muted">{t('reports.disclaimer')}</p>
          </div>
          <div className="divide-y divide-line">
            {sections.map((section, index) => (
              <div key={section.heading} className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="num text-[10px] font-black text-muted">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="text-sm font-extrabold">{section.heading}</h3>
                </div>
                <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="num text-xs font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
                {section.body && <p className="mt-3 rounded-lg bg-bg p-2.5 text-[11px] leading-relaxed text-muted">{section.body}</p>}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">{t('reports.loan')}</p>
                <h2 className="mt-2 text-lg font-extrabold">{t('reports.loan')}</h2>
              </div>
              <span className="rounded-xl bg-[var(--info-soft)] p-2 text-info"><Landmark className="h-4 w-4" /></span>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3 rounded-lg bg-bg p-2.5">
                <span className="text-muted">{t('common.stock')}</span>
                <span className="num font-bold">{formatINR(summary.totalValue)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-bg p-2.5">
                <span className="text-muted">{t('reports.profit')}</span>
                <span className="num font-bold">{formatINR(profit.totalGrossProfit)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-bg p-2.5">
                <span className="text-muted">{t('udhaar.title')}</span>
                <span className="num font-bold">{formatINR(ageing.total)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-bg p-2.5">
                <span className="text-muted">{t('dashboard.dataHealth')}</span>
                <span className="num font-bold">{health.score}/100</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('reports.loanNote')}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => reportPDF(state, 'Loan readiness', sections.slice(0, 1).concat(sections[5]), lang)}>
              <Download className="h-4 w-4" /> {t('reports.downloadPdf')}
            </Button>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('common.dataLevel')}</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={state.business.dataLevel === 'full_sales' ? 'green' : state.business.dataLevel === 'orders_upi' ? 'blue' : 'amber'}>
                {state.business.dataLevel === 'full_sales' ? t('common.best') : state.business.dataLevel === 'orders_upi' ? t('common.good') : t('common.basic')}
              </Badge>
              <Badge tone="neutral">{t('dashboard.stockAge')}: {health.daysSinceCount ?? '-'} {t('common.days')}</Badge>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('reports.disclaimer')}</p>
            <div className="mt-4 rounded-xl border border-line bg-bg p-3">
              <p className="flex items-center gap-2 text-xs font-bold"><Users className="h-3.5 w-3.5 text-accent" /> {t('udhaar.title')}</p>
              <p className="num mt-1 text-lg font-black">{formatINR(ageing.total)}</p>
              <p className="text-[10px] text-muted">{t('udhaar.bucket30')}: {formatINR(ageing.days30plus)}</p>
            </div>
            <LinkRow />
          </Card>
        </div>
      </div>

      <Card className="mt-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-extrabold">{t('settings.audit')}</h2>
          </div>
          <span className="text-[11px] text-muted">{state.auditLog.length} {t('common.items')}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {state.auditLog.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-line bg-bg/60 p-3 text-xs">
              <p className="font-bold">{entry.action}</p>
              <p className="mt-0.5 truncate text-muted">{entry.detail}</p>
              <p className="mt-1 text-[10px] text-muted">{entry.actor} · {formatDate(entry.at.slice(0, 10), lang)}</p>
            </div>
          ))}
        </div>
        {!state.auditLog.length && <p className="mt-3 text-xs text-muted">{t('common.noData')}</p>}
      </Card>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t('reports.disclaimer')}
      </p>
    </div>
  );
}

function LinkRow() {
  const { t } = useTranslation();
  return (
    <a href="/app/settings#notifications" className={buttonClass('ghost', 'sm', 'mt-3 w-full justify-between')}>
      {t('notifications.settings')} <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}
