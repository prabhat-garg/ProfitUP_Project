import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Archive,
  Download,
  IndianRupee,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { allProductMetrics } from '../lib/engine';
import { formatINR, formatNumber, pct } from '../lib/format';
import { cn, sortedUnique } from '../lib/utils';
import { productsCSV } from '../lib/exports';
import { PageHeader, EstimatedBadge, StatusBadge } from '../components/shared';
import { Badge, Button, Card, Checkbox, Dialog, EmptyState, Field, Input, Select, buttonClass, useToast } from '../components/ui';
import type { Product } from '../lib/types';

interface ProductForm {
  name: string;
  nameHi: string;
  category: string;
  unit: string;
  packSize: string;
  costPrice: string;
  sellingPrice: string;
  supplierId: string;
  reorderMin: string;
  shelfLifeDays: string;
  currentStock: string;
  isActive: boolean;
}

const emptyForm = (supplierId = ''): ProductForm => ({
  name: '',
  nameHi: '',
  category: '',
  unit: 'pack',
  packSize: '1',
  costPrice: '',
  sellingPrice: '',
  supplierId,
  reorderMin: '0',
  shelfLifeDays: '',
  currentStock: '0',
  isActive: true,
});

export default function ProductsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { addProduct, updateProduct, archiveProduct, bulkUpdatePrices } = useAppData();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(() => emptyForm(state.suppliers[0]?.id));
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<Record<string, { costPrice: string; sellingPrice: string }>>({});

  const metrics = useMemo(() => allProductMetrics(state), [state]);
  const categories = sortedUnique(state.products.map((product) => product.category));
  const rows = metrics
    .filter((metric) => category === 'all' || metric.product.category === category)
    .filter((metric) => status === 'all' || metric.status === status)
    .filter((metric) => {
      if (!search.trim()) return true;
      const supplier = state.suppliers.find((entry) => entry.id === metric.product.supplierId)?.name ?? '';
      return `${metric.product.name} ${metric.product.nameHi} ${metric.product.category} ${supplier}`.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.stockValue - a.stockValue);
  const archived = state.products.filter((product) => !product.isActive);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(state.suppliers[0]?.id));
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      nameHi: product.nameHi,
      category: product.category,
      unit: product.unit,
      packSize: String(product.packSize),
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      supplierId: product.supplierId,
      reorderMin: String(product.reorderMin),
      shelfLifeDays: product.shelfLifeDays ? String(product.shelfLifeDays) : '',
      currentStock: String(product.currentStock),
      isActive: product.isActive,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.category.trim() || Number(form.costPrice) <= 0 || Number(form.sellingPrice) <= 0) {
      push({ title: t('common.requiredField'), tone: 'error' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      nameHi: form.nameHi.trim() || form.name.trim(),
      category: form.category.trim(),
      unit: form.unit.trim() || 'pack',
      packSize: Math.max(1, Number(form.packSize) || 1),
      costPrice: Math.max(0, Number(form.costPrice) || 0),
      sellingPrice: Math.max(0, Number(form.sellingPrice) || 0),
      supplierId: form.supplierId || state.suppliers[0]?.id || '',
      reorderMin: Math.max(0, Number(form.reorderMin) || 0),
      shelfLifeDays: form.shelfLifeDays.trim() === '' ? undefined : Math.max(1, Number(form.shelfLifeDays) || 1),
      isActive: form.isActive,
      currentStock: Math.max(0, Number(form.currentStock) || 0),
    };
    if (editing) {
      updateProduct(editing.id, payload);
      push({ title: t('products.saved'), body: payload.name });
    } else {
      addProduct(payload);
      push({ title: t('products.added'), body: payload.name });
    }
    setOpen(false);
  };

  const openBulk = () => {
    const next: Record<string, { costPrice: string; sellingPrice: string }> = {};
    state.products.filter((product) => product.isActive).forEach((product) => {
      next[product.id] = { costPrice: String(product.costPrice), sellingPrice: String(product.sellingPrice) };
    });
    setBulkRows(next);
    setBulkOpen(true);
  };

  const saveBulk = () => {
    bulkUpdatePrices(
      Object.entries(bulkRows).map(([id, row]) => ({
        id,
        costPrice: Math.max(0, Number(row.costPrice) || 0),
        sellingPrice: Math.max(0, Number(row.sellingPrice) || 0),
      })),
    );
    push({ title: t('products.bulkSaved') });
    setBulkOpen(false);
  };

  const marginOf = (cost: number, selling: number) => (selling > 0 ? ((selling - cost) / selling) * 100 : 0);

  return (
    <div>
      <PageHeader
        number="09"
        title={t('products.title')}
        sub={t('products.sub')}
        actions={
          <>
            <Button variant="secondary" onClick={() => productsCSV(state)}><Download className="h-4 w-4" /> {t('products.export')}</Button>
            <Link to="/app/imports?kind=products" className={buttonClass('secondary')}><Upload className="h-4 w-4" /> {t('products.import')}</Link>
            <Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('products.add')}</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="kicker">{t('nav.products')}</p>
          <p className="num mt-2 text-2xl font-black">{state.products.filter((product) => product.isActive).length}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('products.stockValue')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(metrics.reduce((total, metric) => total + metric.stockValue, 0))}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('common.margin')}</p>
          <p className="num mt-2 text-2xl font-black">{pct(metrics.length ? metrics.reduce((total, metric) => total + metric.marginPct, 0) / metrics.length : 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('products.missing')}</p>
          <p className={cn('num mt-2 text-2xl font-black', state.products.some((product) => product.costPrice <= 0 || product.sellingPrice <= 0) && 'text-danger')}>
            {state.products.filter((product) => product.costPrice <= 0 || product.sellingPrice <= 0 || !product.supplierId).length}
          </p>
        </Card>
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('products.searchPlaceholder')} className="pl-9" />
          </div>
          <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-auto min-w-[140px]" aria-label={t('common.category')}>
            <option value="all">{t('common.allCategories')}</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-[130px]" aria-label={t('common.status')}>
            <option value="all">{t('common.all')} · {t('common.status')}</option>
            <option value="healthy">{t('status.healthy')}</option>
            <option value="slow">{t('status.slow')}</option>
            <option value="dead">{t('status.dead')}</option>
          </Select>
          <Button variant="outline" onClick={openBulk}><IndianRupee className="h-4 w-4" /> {t('products.bulkPrice')}</Button>
        </div>
      </Card>

      {rows.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="border-b border-line bg-bg/60">
                <tr className="table-head">
                  <th className="px-3 py-3">{t('common.product')}</th>
                  <th className="px-3 py-3 text-right">{t('common.stock')}</th>
                  <th className="px-3 py-3 text-right">{t('products.cost')}</th>
                  <th className="px-3 py-3 text-right">{t('products.selling')}</th>
                  <th className="px-3 py-3 text-right">{t('common.margin')}</th>
                  <th className="px-3 py-3 text-right">{t('products.stockValue')}</th>
                  <th className="px-3 py-3">{t('common.status')}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((metric) => {
                  const supplier = state.suppliers.find((entry) => entry.id === metric.product.supplierId);
                  return (
                    <tr key={metric.product.id} className="hover:bg-bg/40">
                      <td className="px-3 py-3">
                        <button type="button" className="text-left" onClick={() => openEdit(metric.product)}>
                          <span className="block font-bold hover:text-primary">{lang === 'hi' ? metric.product.nameHi : metric.product.name}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">{metric.product.category} · {supplier?.name ?? t('common.noSupplier')} · {metric.product.unit}</span>
                        </button>
                      </td>
                      <td className="num px-3 py-3 text-right">{formatNumber(metric.stock, 1)}</td>
                      <td className="num px-3 py-3 text-right">{formatINR(metric.product.costPrice)}</td>
                      <td className="num px-3 py-3 text-right">{formatINR(metric.product.sellingPrice)}</td>
                      <td className={cn('num px-3 py-3 text-right font-bold', metric.marginPct < state.business.marginAlertPct ? 'text-danger' : 'text-primary')}>{pct(metric.marginPct)}</td>
                      <td className="num px-3 py-3 text-right">{formatINR(metric.stockValue)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <StatusBadge status={metric.status} />
                          {metric.demandSource === 'estimated' && <EstimatedBadge />}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="rounded-lg p-1.5 text-muted hover:text-primary" onClick={() => openEdit(metric.product)} aria-label={t('common.edit')}><Pencil className="h-3.5 w-3.5" /></button>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-muted hover:text-danger"
                            onClick={() => { if (window.confirm(t('products.deleteConfirm'))) { archiveProduct(metric.product.id); push({ title: t('products.archived') }); } }}
                            aria-label={t('common.delete')}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<LayoutGrid className="h-5 w-5" />}
          title={t('products.none')}
          body={t('products.importHint')}
          action={<div className="flex flex-wrap gap-2"><Button onClick={openAdd}><Plus className="h-4 w-4" /> {t('products.add')}</Button><Link to="/app/imports?kind=products" className={buttonClass('secondary')}>{t('products.import')}</Link></div>}
        />
      )}

      {archived.length > 0 && (
        <Card className="mt-5 p-4">
          <p className="kicker">{t('products.archived')} · {archived.length}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {archived.map((product) => (
              <Badge key={product.id} tone="neutral">{product.name}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t('products.edit') : t('products.add')}
        description={t('products.sub')}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button onClick={save}>{t('common.save')}</Button></>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.name')} required><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label={t('products.nameHi')}><Input value={form.nameHi} onChange={(event) => setForm({ ...form, nameHi: event.target.value })} /></Field>
          <Field label={t('common.category')} required><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Grocery" /></Field>
          <Field label={t('products.unit')}><Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="kg / pack / bottle" /></Field>
          <Field label={t('products.pack')}><Input type="number" min={1} value={form.packSize} onChange={(event) => setForm({ ...form, packSize: event.target.value })} /></Field>
          <Field label={t('common.supplier')}>
            <Select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              <option value="">{t('common.noSupplier')}</option>
              {state.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </Select>
          </Field>
          <Field label={t('products.cost')} required><Input type="number" min={0} step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} /></Field>
          <Field label={t('products.selling')} required><Input type="number" min={0} step="0.01" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} /></Field>
          <Field label={t('products.reorderMin')}><Input type="number" min={0} value={form.reorderMin} onChange={(event) => setForm({ ...form, reorderMin: event.target.value })} /></Field>
          <Field label={t('products.shelf')} hint={t('common.optional')}><Input type="number" min={1} value={form.shelfLifeDays} onChange={(event) => setForm({ ...form, shelfLifeDays: event.target.value })} /></Field>
          <Field label={t('common.stock')}><Input type="number" min={0} value={form.currentStock} onChange={(event) => setForm({ ...form, currentStock: event.target.value })} /></Field>
          <div className="flex items-end pb-2"><Checkbox checked={form.isActive} onChange={(value) => setForm({ ...form, isActive: value })} label={t('products.active')} /></div>
        </div>
        <div className="mt-3 rounded-xl border border-line bg-bg/50 p-3 text-[11px] text-muted">
          {t('common.margin')}: <strong className="num text-ink">{pct(marginOf(Number(form.costPrice) || 0, Number(form.sellingPrice) || 0))}</strong> · {t('products.sub')}
        </div>
        {state.suppliers.length === 0 && (
          <p className="mt-3 text-xs text-accent">{t('purchases.noSupplier')} <Link to="/app/suppliers" className="font-bold underline">{t('suppliers.add')}</Link></p>
        )}
      </Dialog>

      <Dialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('products.bulkPrice')}
        description={t('products.sub')}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setBulkOpen(false)}>{t('common.cancel')}</Button><Button onClick={saveBulk}>{t('common.save')}</Button></>}
      >
        <div className="max-h-[55vh] overflow-y-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="table-head">
                <th className="px-2 py-2 text-left">{t('common.product')}</th>
                <th className="px-2 py-2">{t('products.cost')}</th>
                <th className="px-2 py-2">{t('products.selling')}</th>
                <th className="px-2 py-2 text-right">{t('common.margin')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {state.products.filter((product) => product.isActive).map((product) => {
                const row = bulkRows[product.id] ?? { costPrice: String(product.costPrice), sellingPrice: String(product.sellingPrice) };
                return (
                  <tr key={product.id}>
                    <td className="px-2 py-2 text-xs font-semibold">{product.name}</td>
                    <td className="px-2 py-2"><Input type="number" min={0} step="0.01" value={row.costPrice} className="h-8 text-right text-xs" onChange={(event) => setBulkRows((current) => ({ ...current, [product.id]: { ...row, costPrice: event.target.value } }))} /></td>
                    <td className="px-2 py-2"><Input type="number" min={0} step="0.01" value={row.sellingPrice} className="h-8 text-right text-xs" onChange={(event) => setBulkRows((current) => ({ ...current, [product.id]: { ...row, sellingPrice: event.target.value } }))} /></td>
                    <td className={cn('num px-2 py-2 text-right text-xs font-bold', marginOf(Number(row.costPrice) || 0, Number(row.sellingPrice) || 0) < state.business.marginAlertPct ? 'text-danger' : 'text-primary')}>{pct(marginOf(Number(row.costPrice) || 0, Number(row.sellingPrice) || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Dialog>
    </div>
  );
}
