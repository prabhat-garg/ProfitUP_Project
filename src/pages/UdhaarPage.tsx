import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IndianRupee,
  MessageCircle,
  Plus,
  Search,
  Users,
  WalletCards,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { udhaarAgeing } from '../lib/engine';
import { formatDate, formatINR } from '../lib/format';
import { daysBetween, todayISO } from '../lib/utils';
import { openWhatsApp } from '../lib/exports';
import { PageHeader, StatCard } from '../components/shared';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Input,
  Textarea,
  buttonClass,
  useToast,
} from '../components/ui';
import type { Customer } from '../lib/types';

interface CustomerForm {
  name: string;
  phone: string;
  amountDue: string;
  dueDate: string;
  note: string;
}

const emptyForm = (): CustomerForm => ({
  name: '',
  phone: '',
  amountDue: '',
  dueDate: todayISO(),
  note: '',
});

export default function UdhaarPage() {
  const { t } = useTranslation();
  const state = useRequiredState();
  const { addCustomer, updateCustomer, recordPayment } = useAppData();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState('all');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const ageing = useMemo(() => udhaarAgeing(state), [state]);
  const ageingMap = useMemo(
    () => new Map(ageing.customers.map((entry) => [entry.id, entry])),
    [ageing],
  );
  const paymentCustomer = state.customers.find((customer) => customer.id === paymentId);

  const rows = state.customers
    .map((customer) => {
      const info = ageingMap.get(customer.id);
      const daysOverdue = info?.daysOverdue ?? 0;
      const bucketKey = daysOverdue > 30 ? '30plus' : daysOverdue >= 8 ? '8to30' : daysOverdue >= 1 ? '0to7' : 'current';
      return { customer, daysOverdue, bucketKey };
    })
    .filter((entry) => bucket === 'all' || entry.bucketKey === bucket)
    .filter((entry) =>
      !search.trim()
        ? true
        : `${entry.customer.name} ${entry.customer.phone} ${entry.customer.note ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.customer.amountDue - a.customer.amountDue);

  const overdue = state.customers.filter((customer) => daysBetween(customer.dueDate) > 7);
  const overdueAmount = overdue.reduce((total, customer) => total + customer.amountDue, 0);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setCustomerOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      amountDue: String(customer.amountDue),
      dueDate: customer.dueDate,
      note: customer.note ?? '',
    });
    setCustomerOpen(true);
  };

  const saveCustomer = () => {
    if (!form.name.trim()) {
      push({ title: t('common.requiredField'), body: t('common.name'), tone: 'error' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      amountDue: Math.max(0, Number(form.amountDue) || 0),
      dueDate: form.dueDate || todayISO(),
      note: form.note.trim() || undefined,
    };
    if (editing) updateCustomer(editing.id, payload);
    else addCustomer(payload);
    push({ title: editing ? t('common.saved') : t('udhaar.added'), body: payload.name });
    setCustomerOpen(false);
  };

  const openPayment = (customer: Customer) => {
    setPaymentId(customer.id);
    setPaymentAmount(String(customer.amountDue));
  };

  const savePayment = () => {
    if (!paymentCustomer) return;
    const amount = Math.max(0, Number(paymentAmount) || 0);
    if (amount <= 0) {
      push({ title: t('common.requiredField'), body: t('common.amount'), tone: 'error' });
      return;
    }
    recordPayment(paymentCustomer.id, amount);
    push({ title: t('udhaar.paymentSaved'), body: formatINR(Math.min(amount, paymentCustomer.amountDue)) });
    setPaymentId(null);
  };

  const sendReminder = (customer: Customer) => {
    if (!customer.phone) {
      push({ title: t('udhaar.noPhone'), tone: 'error' });
      return;
    }
    const text = t('udhaar.reminderText', {
      name: customer.name,
      shop: state.business.name,
      amount: new Intl.NumberFormat('en-IN').format(customer.amountDue),
    });
    openWhatsApp(customer.phone, text);
  };

  const bucketTone = (key: string): 'red' | 'amber' | 'saffron' | 'green' =>
    key === '30plus' ? 'red' : key === '8to30' ? 'amber' : key === '0to7' ? 'saffron' : 'green';

  return (
    <div>
      <PageHeader
        number="12"
        title={t('udhaar.title')}
        sub={t('udhaar.sub')}
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('udhaar.addCustomer')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('udhaar.total')}
          value={formatINR(ageing.total)}
          meta={<span>{state.customers.length} {t('common.products')}</span>}
          icon={<WalletCards className="h-4 w-4" />}
          tone="info"
          onClick={() => setBucket('all')}
        />
        <StatCard
          label={t('udhaar.overdue')}
          value={formatINR(overdueAmount)}
          meta={<span>{overdue.length} {t('common.products')}</span>}
          icon={<IndianRupee className="h-4 w-4" />}
          tone="danger"
          onClick={() => setBucket('8to30')}
        />
        <StatCard
          label={t('udhaar.bucket30')}
          value={formatINR(ageing.days30plus)}
          meta={<span>{t('udhaar.ageing')}</span>}
          icon={<Users className="h-4 w-4" />}
          tone="accent"
          onClick={() => setBucket('30plus')}
        />
        <StatCard
          label={t('udhaar.current')}
          value={formatINR(ageing.current)}
          meta={<span>{t('udhaar.due')}</span>}
          icon={<IndianRupee className="h-4 w-4" />}
          onClick={() => setBucket('current')}
        />
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {[
          ['current', 'udhaar.current', ageing.current, 'green'],
          ['0to7', 'udhaar.bucket0', ageing.days0to7, 'saffron'],
          ['8to30', 'udhaar.bucket8', ageing.days8to30, 'amber'],
          ['30plus', 'udhaar.bucket30', ageing.days30plus, 'red'],
        ].map(([key, label, value, tone]) => (
          <button
            key={String(key)}
            type="button"
            onClick={() => setBucket(String(key))}
            className={`rounded-card border p-3 text-left transition ${bucket === key ? 'border-primary bg-primary-soft' : 'border-line bg-card hover:border-primary/50'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="kicker">{t(String(label))}</p>
              <Badge tone={tone as 'green' | 'amber' | 'red' | 'saffron'}>{String(key === 'current' ? '0' : key)}</Badge>
            </div>
            <p className="num mt-1 text-lg font-black">{formatINR(Number(value))}</p>
          </button>
        ))}
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`${t('common.search')} · ${t('udhaar.title')}`}
              className="pl-9"
            />
          </div>
          <Button variant={bucket === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setBucket('all')}>
            {t('common.all')}
          </Button>
        </div>
      </Card>

      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ customer, daysOverdue }) => (
            <Card key={customer.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold">{customer.name}</h2>
                    <Badge tone={bucketTone(daysOverdue > 30 ? '30plus' : daysOverdue >= 8 ? '8to30' : daysOverdue >= 1 ? '0to7' : 'current')} dot>
                      {daysOverdue > 30 ? t('udhaar.bucket30') : daysOverdue >= 8 ? t('udhaar.bucket8') : daysOverdue >= 1 ? t('udhaar.bucket0') : t('udhaar.current')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {customer.phone || t('common.noPhone')} · {t('udhaar.due')} {formatDate(customer.dueDate)}
                    {daysOverdue > 0 ? ` · ${daysOverdue} ${t('common.days')} ${t('udhaar.overdue').toLowerCase()}` : ''}
                  </p>
                  {customer.note && <p className="mt-1 text-[11px] text-muted">{customer.note}</p>}
                </div>
                <p className="num text-xl font-black">{formatINR(customer.amountDue)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                <Button size="sm" onClick={() => openPayment(customer)}>
                  <IndianRupee className="h-3.5 w-3.5" /> {t('udhaar.addPayment')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => sendReminder(customer)}>
                  <MessageCircle className="h-3.5 w-3.5" /> {t('udhaar.reminder')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(customer)}>{t('common.edit')}</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={t('udhaar.empty')}
          body={t('udhaar.sub')}
          action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('udhaar.addCustomer')}</Button>}
        />
      )}

      {state.udhaarPayments.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-4">
            <p className="kicker">{t('udhaar.paymentSaved')}</p>
            <span className="text-[11px] text-muted">{t('common.itemCount', { count: state.udhaarPayments.length })}</span>
          </div>
          <div className="divide-y divide-line">
            {state.udhaarPayments.slice(0, 10).map((payment) => {
              const customer = state.customers.find((entry) => entry.id === payment.customerId);
              return (
                <div key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                  <div>
                    <p className="font-bold">{customer?.name ?? payment.customerId}</p>
                    <p className="text-muted">{formatDate(payment.date)}</p>
                  </div>
                  <span className="num font-bold text-primary">{formatINR(payment.amount)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="mt-5 rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
        <p className="font-bold text-ink">{t('common.howCalculated')}</p>
        <p className="mt-1">{t('udhaar.sub')} {t('common.estimatedNote')}</p>
      </div>

      <Dialog
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title={editing ? t('common.edit') : t('udhaar.addCustomer')}
        description={t('udhaar.sub')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCustomerOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveCustomer}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.name')} required>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label={t('common.phone')}>
            <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="9876543210" />
          </Field>
          <Field label={t('common.amount')}>
            <Input type="number" min={0} value={form.amountDue} onChange={(event) => setForm({ ...form, amountDue: event.target.value })} />
          </Field>
          <Field label={t('udhaar.due')}>
            <Input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('common.note')} hint={t('common.optional')}>
              <Textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={2} />
            </Field>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(paymentCustomer)}
        onClose={() => setPaymentId(null)}
        title={t('udhaar.addPayment')}
        description={paymentCustomer ? `${paymentCustomer.name} · ${formatINR(paymentCustomer.amountDue)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentId(null)}>{t('common.cancel')}</Button>
            <Button onClick={savePayment}>{t('common.save')}</Button>
          </>
        }
      >
        {paymentCustomer && (
          <div className="space-y-3">
            <Field label={t('common.amount')} required hint={`${t('udhaar.outstanding')}: ${formatINR(paymentCustomer.amountDue)}`}>
              <Input
                type="number"
                min={0}
                max={paymentCustomer.amountDue}
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                autoFocus
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {[0.25, 0.5, 1].map((share) => (
                <button
                  key={share}
                  type="button"
                  className={buttonClass('secondary', 'sm')}
                  onClick={() => setPaymentAmount(String(Math.round(paymentCustomer.amountDue * share)))}
                >
                  {share === 1 ? t('common.all') : `${share * 100}%`}
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted">{t('udhaar.sub')}</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
