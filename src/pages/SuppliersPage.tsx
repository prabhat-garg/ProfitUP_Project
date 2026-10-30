import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  Truck,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatINR } from '../lib/format';
import { openWhatsApp } from '../lib/exports';
import { PageHeader } from '../components/shared';
import {
  Badge,
  Button,
  Card,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  buttonClass,
  useToast,
} from '../components/ui';
import type { Supplier } from '../lib/types';

interface SupplierForm {
  name: string;
  contact: string;
  phone: string;
  leadTimeDays: string;
  minOrder: string;
  category: string;
}

const emptyForm: SupplierForm = {
  name: '',
  contact: '',
  phone: '',
  leadTimeDays: '2',
  minOrder: '1000',
  category: 'Grocery',
};

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { addSupplier, updateSupplier } = useAppData();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [detailId, setDetailId] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      state.suppliers.map((supplier) => {
        const products = state.products.filter((product) => product.supplierId === supplier.id);
        const bills = state.purchases.filter((purchase) => purchase.supplierId === supplier.id);
        const latest = [...bills].sort((a, b) => b.date.localeCompare(a.date))[0];
        const spend = bills.reduce(
          (total, purchase) =>
            total + purchase.items.reduce((sum, item) => sum + item.qty * item.costPrice, 0),
          0,
        );
        return { supplier, products, bills, latest, spend };
      }),
    [state.suppliers, state.products, state.purchases],
  );

  const filtered = summary.filter(({ supplier }) => {
    if (!search.trim()) return true;
    return `${supplier.name} ${supplier.contact} ${supplier.category} ${supplier.phone}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const detail = summary.find((entry) => entry.supplier.id === detailId);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      leadTimeDays: String(supplier.leadTimeDays),
      minOrder: String(supplier.minOrder),
      category: supplier.category,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      push({ title: t('common.requiredField'), body: t('common.name'), tone: 'error' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      leadTimeDays: Math.max(0, Number(form.leadTimeDays) || 0),
      minOrder: Math.max(0, Number(form.minOrder) || 0),
      category: form.category.trim() || 'Other',
    };
    if (editing) updateSupplier(editing.id, payload);
    else addSupplier(payload);
    push({ title: t('suppliers.saved'), body: payload.name });
    setOpen(false);
  };

  const reminder = (supplier: Supplier) =>
    `Namaste ${supplier.contact || supplier.name}, this is ${state.business.name}. ` +
    `Please share your latest rate list and availability. Lead time noted: ${supplier.leadTimeDays} days.`;

  return (
    <div>
      <PageHeader
        number="11"
        title={t('suppliers.title')}
        sub={t('suppliers.sub')}
        actions={
          <>
            <Link to="/app/purchases" className={buttonClass('secondary')}>
              <Truck className="h-4 w-4" /> {t('nav.purchases')}
            </Link>
            <Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('suppliers.add')}</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="kicker">{t('nav.suppliers')}</p>
          <p className="num mt-2 text-2xl font-black">{state.suppliers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('purchases.history')}</p>
          <p className="num mt-2 text-2xl font-black">{state.purchases.length}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('common.total')}</p>
          <p className="num mt-2 text-2xl font-black">
            {formatINR(summary.reduce((total, entry) => total + entry.spend, 0))}
          </p>
        </Card>
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${t('common.search')} · ${t('common.supplier')}`}
            className="pl-9"
          />
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(({ supplier, products, latest, spend }) => (
            <Card key={supplier.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold">{supplier.name}</h2>
                    <Badge tone="neutral">{supplier.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {supplier.contact || '—'} · {supplier.phone || t('common.noPhone')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(supplier)}>
                  <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-bg/60 p-2.5">
                  <p className="kicker">{t('suppliers.lead')}</p>
                  <p className="num mt-1 text-sm font-bold">{supplier.leadTimeDays} {t('common.days')}</p>
                </div>
                <div className="rounded-xl bg-bg/60 p-2.5">
                  <p className="kicker">{t('suppliers.minOrder')}</p>
                  <p className="num mt-1 text-sm font-bold">{formatINR(supplier.minOrder)}</p>
                </div>
                <div className="rounded-xl bg-bg/60 p-2.5">
                  <p className="kicker">{t('common.products')}</p>
                  <p className="num mt-1 text-sm font-bold">{products.length}</p>
                </div>
                <div className="rounded-xl bg-bg/60 p-2.5">
                  <p className="kicker">{t('common.total')}</p>
                  <p className="num mt-1 text-sm font-bold">{formatINR(spend)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <p className="text-[11px] text-muted">
                  {t('suppliers.lastPurchase')}:{' '}
                  <strong className="text-ink">{latest ? `${formatDate(latest.date)} · ${formatINR(latest.items.reduce((sum, item) => sum + item.qty * item.costPrice, 0))}` : '—'}</strong>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.phone && (
                    <>
                      <a href={`tel:${supplier.phone.replace(/\s/g, '')}`} className={buttonClass('secondary', 'sm')}>
                        <Phone className="h-3.5 w-3.5" /> {t('suppliers.call')}
                      </a>
                      <button
                        type="button"
                        onClick={() => openWhatsApp(supplier.phone, reminder(supplier))}
                        className={buttonClass('secondary', 'sm')}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> {t('suppliers.whatsapp')}
                      </button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setDetailId(supplier.id)}>
                    <IndianRupee className="h-3.5 w-3.5" /> {t('suppliers.priceHistory')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title={t('suppliers.empty')}
          body={t('suppliers.sub')}
          action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('suppliers.add')}</Button>}
        />
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t('common.edit') : t('suppliers.add')}
        description={t('suppliers.sub')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.name')} required>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label={t('suppliers.contact')}>
            <Input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
          </Field>
          <Field label={t('common.phone')}>
            <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="9876543210" />
          </Field>
          <Field label={t('common.category')}>
            <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </Field>
          <Field label={t('suppliers.lead')}>
            <Input type="number" min={0} value={form.leadTimeDays} onChange={(event) => setForm({ ...form, leadTimeDays: event.target.value })} />
          </Field>
          <Field label={t('suppliers.minOrder')}>
            <Input type="number" min={0} value={form.minOrder} onChange={(event) => setForm({ ...form, minOrder: event.target.value })} />
          </Field>
        </div>
        <p className="mt-3 rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
          {t('suppliers.sub')}
        </p>
      </Dialog>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail ? detail.supplier.name : ''}
        description={detail ? `${t('suppliers.priceHistory')} · ${detail.bills.length} ${t('purchases.history')}` : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line p-3">
                <p className="kicker">{t('common.products')}</p>
                <p className="num mt-1 text-xl font-black">{detail.products.length}</p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="kicker">{t('common.total')}</p>
                <p className="num mt-1 text-xl font-black">{formatINR(detail.spend)}</p>
              </div>
            </div>

            <div>
              <p className="kicker mb-2">{t('common.products')}</p>
              <div className="divide-y divide-line rounded-xl border border-line">
                {detail.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs">
                    <span className="min-w-0 truncate font-semibold">{lang === 'hi' ? product.nameHi : product.name}</span>
                    <span className="num shrink-0 text-muted">{formatINR(product.costPrice)}</span>
                  </div>
                ))}
                {detail.products.length === 0 && <p className="p-3 text-xs text-muted">{t('common.noData')}</p>}
              </div>
            </div>

            <div>
              <p className="kicker mb-2">{t('suppliers.priceHistory')}</p>
              <div className="space-y-2">
                {[...detail.bills].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((purchase) => (
                  <div key={purchase.id} className="rounded-xl border border-line p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">{purchase.invoiceNo}</p>
                      <p className="num font-bold">{formatINR(purchase.items.reduce((sum, item) => sum + item.qty * item.costPrice, 0))}</p>
                    </div>
                    <p className="mt-0.5 text-muted">{formatDate(purchase.date)} · {purchase.items.length} {t('common.items')}</p>
                  </div>
                ))}
                {detail.bills.length === 0 && <p className="text-xs text-muted">{t('purchases.empty')}</p>}
              </div>
            </div>

            {detail.supplier.phone && (
              <button
                type="button"
                onClick={() => openWhatsApp(detail.supplier.phone, reminder(detail.supplier))}
                className={buttonClass('primary', 'md', 'w-full')}
              >
                <MessageCircle className="h-4 w-4" /> {t('suppliers.whatsapp')}
              </button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
