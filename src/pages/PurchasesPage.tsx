import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FileText,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatINR, formatNumber } from '../lib/format';
import { todayISO } from '../lib/utils';
import { PageHeader } from '../components/shared';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  buttonClass,
  useToast,
} from '../components/ui';

interface BillItem {
  productId: string;
  qty: string;
  costPrice: string;
}

const emptyItem = (productId = '', costPrice = ''): BillItem => ({ productId, qty: '1', costPrice });

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { addPurchase } = useAppData();
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [receivedFilter, setReceivedFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id ?? '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [received, setReceived] = useState(true);
  const [note, setNote] = useState('');
  const [billPhotoName, setBillPhotoName] = useState('');
  const [items, setItems] = useState<BillItem[]>(() => {
    const first = state.products.find((product) => product.isActive);
    return [emptyItem(first?.id ?? '', first ? String(first.costPrice) : '')];
  });

  const supplierMap = useMemo(
    () => new Map(state.suppliers.map((supplier) => [supplier.id, supplier])),
    [state.suppliers],
  );
  const productMap = useMemo(
    () => new Map(state.products.map((product) => [product.id, product])),
    [state.products],
  );
  const billTotal = (bill: { items: Array<{ qty: number; costPrice: number }> }) =>
    bill.items.reduce((total, item) => total + item.qty * item.costPrice, 0);

  const bills = useMemo(
    () =>
      [...state.purchases]
        .filter((purchase) => supplierFilter === 'all' || purchase.supplierId === supplierFilter)
        .filter((purchase) => receivedFilter === 'all' || (receivedFilter === 'received' ? purchase.received : !purchase.received))
        .filter((purchase) => {
          if (!search.trim()) return true;
          const supplier = supplierMap.get(purchase.supplierId)?.name ?? '';
          return `${purchase.invoiceNo} ${supplier} ${purchase.note ?? ''}`.toLowerCase().includes(search.toLowerCase());
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.purchases, supplierFilter, receivedFilter, search, supplierMap],
  );

  const detail = state.purchases.find((purchase) => purchase.id === detailId);
  const monthKey = todayISO().slice(0, 7);
  const monthSpend = state.purchases
    .filter((purchase) => purchase.date.startsWith(monthKey))
    .reduce((total, purchase) => total + billTotal(purchase), 0);
  const receivedValue = state.purchases
    .filter((purchase) => purchase.received)
    .reduce((total, purchase) => total + billTotal(purchase), 0);

  const orderTotal = items.reduce(
    (total, item) => total + Math.max(0, Number(item.qty) || 0) * Math.max(0, Number(item.costPrice) || 0),
    0,
  );

  const resetForm = () => {
    const first = state.products.find((product) => product.isActive);
    setDate(todayISO());
    setSupplierId(state.suppliers[0]?.id ?? '');
    setInvoiceNo('');
    setReceived(true);
    setNote('');
    setBillPhotoName('');
    setItems([emptyItem(first?.id ?? '', first ? String(first.costPrice) : '')]);
  };

  const pickProduct = (index: number, productId: string) => {
    const product = productMap.get(productId);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, productId, costPrice: product ? String(product.costPrice) : item.costPrice }
          : item,
      ),
    );
  };

  const save = () => {
    if (!supplierId) {
      push({ title: t('purchases.noSupplier'), tone: 'error' });
      return;
    }
    if (!invoiceNo.trim()) {
      push({ title: t('common.requiredField'), body: t('purchases.invoice'), tone: 'error' });
      return;
    }
    const validItems = items
      .filter((item) => item.productId && Number(item.qty) > 0 && Number(item.costPrice) > 0)
      .map((item) => ({
        productId: item.productId,
        qty: Math.max(1, Number(item.qty) || 1),
        costPrice: Math.max(0, Number(item.costPrice) || 0),
      }));
    if (!validItems.length) {
      push({ title: t('common.requiredField'), body: t('purchases.items'), tone: 'error' });
      return;
    }
    addPurchase({
      date,
      supplierId,
      invoiceNo: invoiceNo.trim(),
      received,
      items: validItems,
      note: note.trim() || undefined,
      billPhotoName: billPhotoName || undefined,
    });
    push({
      title: t('purchases.saved'),
      body: `${invoiceNo.trim()} · ${formatINR(validItems.reduce((total, item) => total + item.qty * item.costPrice, 0))}`,
    });
    setOpen(false);
    resetForm();
  };

  return (
    <div>
      <PageHeader
        number="10"
        title={t('purchases.title')}
        sub={t('purchases.sub')}
        actions={
          <>
            <Link to="/app/imports?kind=purchases" className={buttonClass('secondary')}>
              <Upload className="h-4 w-4" /> {t('nav.import')}
            </Link>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4" /> {t('purchases.add')}
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="kicker">{t('purchases.history')}</p>
          <p className="num mt-2 text-2xl font-black">{state.purchases.length}</p>
          <p className="mt-1 text-[11px] text-muted">{t('common.itemCount', { count: state.purchases.length })}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('common.thisMonth')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(monthSpend)}</p>
          <p className="mt-1 text-[11px] text-muted">{t('purchases.total')}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('purchases.received')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(receivedValue)}</p>
          <p className="mt-1 text-[11px] text-muted">{t('purchases.receivedNote')}</p>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('common.supplier')}</p>
          <p className="num mt-2 text-2xl font-black">{state.suppliers.length}</p>
          <Link to="/app/suppliers" className="mt-1 inline-block text-[11px] font-bold text-primary">{t('nav.suppliers')}</Link>
        </Card>
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`${t('common.search')} · ${t('purchases.invoice')}`}
              className="pl-9"
            />
          </div>
          <Select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="w-auto min-w-[150px]" aria-label={t('common.supplier')}>
            <option value="all">{t('common.allSuppliers')}</option>
            {state.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </Select>
          <Select value={receivedFilter} onChange={(event) => setReceivedFilter(event.target.value)} className="w-auto min-w-[140px]" aria-label={t('common.status')}>
            <option value="all">{t('common.all')} · {t('common.status')}</option>
            <option value="received">{t('purchases.received')}</option>
            <option value="pending">{t('purchases.notReceived')}</option>
          </Select>
        </div>
      </Card>

      {state.suppliers.length === 0 && (
        <div className="mb-5 rounded-xl border border-accent/30 bg-[var(--warning-soft)] px-4 py-3 text-xs font-semibold text-accent">
          {t('purchases.noSupplier')}{' '}
          <Link to="/app/suppliers" className="underline">{t('suppliers.add')}</Link>
        </div>
      )}

      {bills.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-bg/60">
                <tr className="table-head">
                  <th className="px-3 py-3">{t('common.date')}</th>
                  <th className="px-3 py-3">{t('purchases.invoice')}</th>
                  <th className="px-3 py-3">{t('common.supplier')}</th>
                  <th className="px-3 py-3 text-right">{t('purchases.items')}</th>
                  <th className="px-3 py-3">{t('common.status')}</th>
                  <th className="px-3 py-3 text-right">{t('purchases.total')}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bills.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-bg/40">
                    <td className="num px-3 py-3 text-xs">{formatDate(purchase.date)}</td>
                    <td className="px-3 py-3">
                      <button type="button" className="text-left font-bold hover:text-primary" onClick={() => setDetailId(purchase.id)}>
                        {purchase.invoiceNo}
                      </button>
                      {purchase.billPhotoName && (
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Paperclip className="h-2.5 w-2.5" /> {purchase.billPhotoName}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">{supplierMap.get(purchase.supplierId)?.name ?? t('common.noSupplier')}</td>
                    <td className="num px-3 py-3 text-right text-xs">{purchase.items.length}</td>
                    <td className="px-3 py-3">
                      <Badge tone={purchase.received ? 'green' : 'amber'} dot>
                        {purchase.received ? t('purchases.received') : t('purchases.notReceived')}
                      </Badge>
                    </td>
                    <td className="num px-3 py-3 text-right text-xs font-bold">{formatINR(billTotal(purchase))}</td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(purchase.id)}>
                        <FileText className="h-3.5 w-3.5" /> {t('common.open')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<Truck className="h-5 w-5" />}
          title={t('purchases.empty')}
          body={t('purchases.sub')}
          action={
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { resetForm(); setOpen(true); }}><Plus className="h-4 w-4" /> {t('purchases.add')}</Button>
              <Link to="/app/imports?kind=purchases" className={buttonClass('secondary')}>{t('nav.import')}</Link>
            </div>
          }
        />
      )}

      <div className="mt-5 rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
        <p className="font-bold text-ink">{t('common.howCalculated')}</p>
        <p className="mt-1">{t('purchases.receivedNote')} {t('common.estimatedNote')}</p>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('purchases.add')}
        description={t('purchases.sub')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.date')} required>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label={t('purchases.supplier')} required>
            <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              {state.suppliers.length === 0 && <option value="">{t('common.noSupplier')}</option>}
              {state.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('purchases.invoice')} required>
            <Input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} placeholder="INV-101" />
          </Field>
          <Field label={t('purchases.billPhoto')} hint={t('purchases.photoNote')}>
            <label className={buttonClass('secondary', 'md', 'w-full cursor-pointer')}>
              <Paperclip className="h-4 w-4" />
              {billPhotoName || t('purchases.billPhoto')}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(event) => setBillPhotoName(event.target.files?.[0]?.name ?? '')}
              />
            </label>
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="kicker">{t('purchases.items')}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const first = state.products.find((product) => product.isActive);
                setItems((current) => [...current, emptyItem(first?.id ?? '', first ? String(first.costPrice) : '')]);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> {t('purchases.addItem')}
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_72px_88px_32px] items-end gap-2">
                <Select value={item.productId} onChange={(event) => pickProduct(index, event.target.value)} aria-label={t('common.product')}>
                  <option value="">{t('common.product')}</option>
                  {state.products.filter((product) => product.isActive).map((product) => (
                    <option key={product.id} value={product.id}>{lang === 'hi' ? product.nameHi : product.name}</option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(event) => setItems((current) => current.map((entry, i) => (i === index ? { ...entry, qty: event.target.value } : entry)))}
                  aria-label={t('common.qty')}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.costPrice}
                  onChange={(event) => setItems((current) => current.map((entry, i) => (i === index ? { ...entry, costPrice: event.target.value } : entry)))}
                  aria-label={t('common.cost')}
                />
                <button
                  type="button"
                  className="mb-1 rounded-lg p-1.5 text-muted hover:text-danger"
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  aria-label={t('common.delete')}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-bg/50 px-3 py-2">
            <span className="text-xs text-muted">{t('purchases.total')}</span>
            <span className="num text-lg font-black">{formatINR(orderTotal)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field label={t('common.note')} hint={t('common.optional')}>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </Field>
          <Checkbox
            checked={received}
            onChange={setReceived}
            label={<span>{t('purchases.received')} <span className="block text-[11px] text-muted">{t('purchases.receivedNote')}</span></span>}
          />
        </div>
      </Dialog>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail ? `${t('purchases.invoice')} · ${detail.invoiceNo}` : ''}
        description={detail ? `${supplierMap.get(detail.supplierId)?.name ?? ''} · ${formatDate(detail.date)}` : undefined}
        footer={detail ? (
          <Badge tone={detail.received ? 'green' : 'amber'} dot>
            {detail.received ? t('purchases.received') : t('purchases.notReceived')}
          </Badge>
        ) : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line p-3">
                <p className="kicker">{t('purchases.items')}</p>
                <p className="num mt-1 text-xl font-black">{detail.items.length}</p>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="kicker">{t('purchases.total')}</p>
                <p className="num mt-1 text-xl font-black">{formatINR(billTotal(detail))}</p>
              </div>
            </div>
            <div className="divide-y divide-line rounded-xl border border-line">
              {detail.items.map((item) => {
                const product = productMap.get(item.productId);
                return (
                  <div key={item.productId} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{product ? (lang === 'hi' ? product.nameHi : product.name) : item.productId}</p>
                      <p className="text-muted">{formatNumber(item.qty, 0)} × {formatINR(item.costPrice)}</p>
                    </div>
                    <span className="num font-bold">{formatINR(item.qty * item.costPrice)}</span>
                  </div>
                );
              })}
            </div>
            {detail.note && (
              <div className="rounded-xl border border-line bg-bg/50 p-3 text-xs">
                <p className="kicker mb-1">{t('common.note')}</p>
                <p>{detail.note}</p>
              </div>
            )}
            {detail.billPhotoName && (
              <div className="flex items-center gap-2 rounded-xl border border-line p-3 text-xs text-muted">
                <Paperclip className="h-3.5 w-3.5" /> {detail.billPhotoName}
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-muted">{t('purchases.receivedNote')}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
