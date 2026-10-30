import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Download,
  Plus,
  ReceiptIndianRupee,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { expenseAlerts } from '../lib/engine';
import { formatCompactINR, formatDate, formatINR } from '../lib/format';
import { todayISO } from '../lib/utils';
import { expensesCSV } from '../lib/exports';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, Checkbox, EmptyState, Field, Input, Select, Textarea, buttonClass, useToast } from '../components/ui';

const CATEGORIES = ['rent', 'electricity', 'wages', 'transport', 'packaging', 'repairs', 'marketing', 'other'] as const;

export default function ExpensesPage() {
  const { t } = useTranslation();
  const state = useRequiredState();
  const { addExpense, deleteExpense } = useAppData();
  const { push } = useToast();
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('electricity');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);

  const alerts = useMemo(() => expenseAlerts(state), [state]);
  const monthKey = todayISO().slice(0, 7);
  const monthTotal = state.expenses.filter((expense) => expense.date.startsWith(monthKey)).reduce((total, expense) => total + expense.amount, 0);

  const trend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, index) => {
      const value = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
      const total = state.expenses.filter((expense) => expense.date.startsWith(key)).reduce((sum, expense) => sum + expense.amount, 0);
      return {
        key,
        name: value.toLocaleDateString('en-IN', { month: 'short' }),
        total: Math.round(total),
      };
    });
  }, [state.expenses]);

  const recent = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      push({ title: t('common.requiredField'), tone: 'error' });
      return;
    }
    addExpense({ date, category, amount: value, note: note.trim(), recurring });
    push({ title: t('expenses.saved'), body: formatINR(value) });
    setAmount('');
    setNote('');
    setRecurring(false);
  };

  const onDelete = (id: string) => {
    deleteExpense(id);
    push({ title: t('common.saved') });
  };

  return (
    <div>
      <PageHeader
        number="08"
        title={t('expenses.title')}
        sub={t('expenses.sub')}
        actions={<Button variant="secondary" onClick={() => expensesCSV(state)}><Download className="h-4 w-4" /> {t('common.csv')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="kicker">{t('expenses.monthly')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(monthTotal)}</p>
          <p className="mt-1 text-[11px] text-muted">{t('common.thisMonth')}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('expenses.recent')}</p>
          <p className="num mt-2 text-2xl font-black">{state.expenses.length}</p>
          <p className="mt-1 text-[11px] text-muted">{t('common.itemCount', { count: state.expenses.length })}</p>
        </Card>
        <Card className={alerts.length ? 'border-accent/40 p-4' : 'p-4'}>
          <p className="kicker">{t('expenses.spike')}</p>
          <p className="num mt-2 text-2xl font-black text-accent">{alerts.length}</p>
          <p className="mt-1 text-[11px] text-muted">{t('expenses.alertRule')}</p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="kicker">{t('expenses.trend')}</p>
                <p className="mt-1 text-xs text-muted">{t('expenses.alertRule')}</p>
              </div>
              <Badge tone="neutral">{t('common.actual')}</Badge>
            </div>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactINR(Number(value))} />
                  <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ borderRadius: 12, borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text)' }} />
                  <Bar dataKey="total" fill="var(--primary-strong)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {alerts.length > 0 && (
            <Card className="border-accent/40 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-accent"><TrendingUp className="h-4 w-4" /> {t('expenses.spike')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {alerts.map((alert) => (
                  <div key={alert.category} className="rounded-xl bg-[var(--warning-soft)] p-3 text-xs">
                    <p className="font-bold capitalize">{t(`expenses.${alert.category}`)} · {formatINR(alert.current)}</p>
                    <p className="mt-1 text-muted">+{alert.increasePct.toFixed(0)}% · {formatINR(alert.previous)} {t('common.lastMonth')}</p>
                    <p className="mt-1 text-[10px] text-muted">{t(`expenses.${alert.reason === 'month_over_month' ? 'spike' : 'alertRule'}`)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-4">
              <p className="kicker">{t('expenses.recent')}</p>
              <span className="text-[11px] text-muted">{recent.length} {t('common.items')}</span>
            </div>
            {recent.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-line bg-bg/60">
                    <tr className="table-head">
                      <th className="px-3 py-2.5">{t('common.date')}</th>
                      <th className="px-3 py-2.5">{t('common.category')}</th>
                      <th className="px-3 py-2.5">{t('common.note')}</th>
                      <th className="px-3 py-2.5 text-right">{t('common.amount')}</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recent.map((expense) => (
                      <tr key={expense.id} className="hover:bg-bg/40">
                        <td className="num px-3 py-2.5 text-xs">{formatDate(expense.date)}</td>
                        <td className="px-3 py-2.5 text-xs font-bold">{t(`expenses.${expense.category}`)}</td>
                        <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-muted">{expense.note || '—'}{expense.recurring ? ` · ${t('expenses.recurring')}` : ''}</td>
                        <td className="num px-3 py-2.5 text-right text-xs font-bold">{formatINR(expense.amount)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button type="button" onClick={() => onDelete(expense.id)} className="rounded-lg p-1.5 text-muted hover:text-danger" aria-label={t('common.delete')}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState icon={<ReceiptIndianRupee className="h-5 w-5" />} title={t('expenses.empty')} body={t('expenses.sub')} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <p className="kicker">{t('expenses.add')}</p>
            <div className="mt-4 space-y-3">
              <Field label={t('common.amount')} required>
                <Input type="number" min={0} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('common.category')}>
                  <Select value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}>
                    {CATEGORIES.map((entry) => <option key={entry} value={entry}>{t(`expenses.${entry}`)}</option>)}
                  </Select>
                </Field>
                <Field label={t('common.date')}>
                  <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </Field>
              </div>
              <Field label={t('common.note')} hint={t('common.optional')}>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
              </Field>
              <Checkbox checked={recurring} onChange={setRecurring} label={t('expenses.recurring')} />
              <Button onClick={submit} className="w-full"><Plus className="h-4 w-4" /> {t('common.add')}</Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('expenses.sub')}</p>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-accent" /> {t('expenses.spike')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('expenses.alertRule')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('common.estimatedNote')}</p>
            <a href="/app/imports?kind=expenses" className={buttonClass('secondary', 'sm', 'mt-3 w-full')}>{t('expenses.importCsv')}</a>
          </Card>
        </div>
      </div>
    </div>
  );
}
