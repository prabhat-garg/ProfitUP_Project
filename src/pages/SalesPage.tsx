import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeIndianRupee,
  Download,
  Plus,
  ReceiptText,
  Trash2,
  Upload,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCompactINR, formatDate, formatINR, formatNumber, pct } from '../lib/format';
import { salesCSV } from '../lib/exports';
import { todayISO } from '../lib/utils';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, EmptyState, Field, Input, Select, buttonClass, useToast } from '../components/ui';
import type { Lang, Source } from '../lib/types';

const sourceLabels: Record<Lang, Record<Source, string>> = {
  en: { manual: 'Manual', billing_export: 'Billing export', upi: 'UPI', estimated: 'Estimated' },
  hi: { manual: 'मैन्युअल', billing_export: 'बिलिंग एक्सपोर्ट', upi: 'UPI', estimated: 'अनुमानित' },
  hinglish: { manual: 'Manual', billing_export: 'Billing export', upi: 'UPI', estimated: 'Andaaza' },
};

export default function SalesPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { addSale, deleteSale } = useAppData();
  const { push } = useToast();

  const activeProducts = state.products.filter((product) => product.isActive);
  const [date, setDate] = useState(todayISO());
  const [productId, setProductId] = useState(activeProducts[0]?.id ?? '');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState(String(activeProducts[0]?.sellingPrice ?? ''));
  const [source, setSource] = useState<Source>('manual');
  const [search, setSearch] = useState('');

  const productMap = useMemo(() => new Map(state.products.map((product) => [product.id, product])), [state.products]);
  const totalRevenue = state.sales.reduce((total, sale) => total + sale.qty * sale.sellingPrice, 0);
  const totalUnits = state.sales.reduce((total, sale) => total + sale.qty, 0);
  const totalCost = state.sales.reduce((total, sale) => {
    const product = productMap.get(sale.productId);
    return total + sale.qty * (product?.costPrice ?? sale.sellingPrice);
  }, 0);
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;

  const since = new Date();
  since.setDate(since.getDate() - 13);
  const trend = useMemo(() => {
    return Array.from({ length: 14 }).map((_, index) => {
      const value = new Date(since);
      value.setDate(since.getDate() + index);
      const key = value.toISOString().slice(0, 10);
      const daySales = state.sales.filter((sale) => sale.date === key);
      return {
        key,
        name: value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: Math.round(daySales.reduce((total, sale) => total + sale.qty * sale.sellingPrice, 0)),
      };
    });
  }, [state.sales, since]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...state.sales]
      .filter((sale) => {
        if (!query) return true;
        const product = productMap.get(sale.productId);
        return (product?.name ?? '').toLowerCase().includes(query) || sale.date.includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 100);
  }, [state.sales, productMap, search]);

  const selectProduct = (id: string) => {
    setProductId(id);
    const product = productMap.get(id);
    if (product) setPrice(String(product.sellingPrice));
  };

  const submit = () => {
    const quantity = Number(qty);
    const sellingPrice = Number(price);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      push({ title: t('common.requiredField'), tone: 'error' });
      return;
    }
    addSale({ date, productId, qty: quantity, sellingPrice, source });
    push({ title: t('common.added'), body: `${productMap.get(productId)?.name ?? ''} · ${formatINR(quantity * sellingPrice)}` });
    setQty('1');
  };

  const remove = (id: string) => {
    deleteSale(id);
    push({ title: t('common.saved') });
  };

  return (
    <div>
      <PageHeader
        number="16"
        title={t('nav.sales')}
        sub={t('profit.noSalesNote')}
        actions={
          <>
            <Link to="/app/imports?kind=sales" className={buttonClass('secondary')}>
              <Upload className="h-4 w-4" /> {t('imports.title')}
            </Link>
            <Button variant="secondary" onClick={() => salesCSV(state)}>
              <Download className="h-4 w-4" /> {t('common.csv')}
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="kicker">{t('profit.revenue')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(totalRevenue)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><Badge tone="neutral">{t('common.actual')}</Badge></div>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('profit.gross')}</p>
          <p className="num mt-2 text-2xl font-black">{formatINR(grossProfit)}</p>
          <div className="mt-2 text-[11px] text-muted">{t('common.margin')} {pct(grossMargin)}</div>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('common.units')}</p>
          <p className="num mt-2 text-2xl font-black">{formatNumber(totalUnits)}</p>
          <div className="mt-2 text-[11px] text-muted">{t('common.itemCount', { count: state.sales.length })}</div>
        </Card>
        <Card className="p-4">
          <p className="kicker">{t('status.estimated')}</p>
          <p className="num mt-2 text-2xl font-black">
            {state.products.filter((product) => product.isActive).length - new Set(state.sales.map((sale) => sale.productId)).size}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('profit.noSalesNote')}</p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="kicker">{t('expenses.trend')}</p>
                <p className="mt-1 text-xs text-muted">{t('common.last7')} / 14</p>
              </div>
              <Badge tone="green">{t('common.actual')}</Badge>
            </div>
            <div className="mt-4 h-[230px]">
              {state.sales.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted)' }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactINR(Number(value))} />
                    <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ borderRadius: 12, borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text)' }} />
                    <Bar dataKey="revenue" fill="var(--primary-strong)" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={<ReceiptText className="h-5 w-5" />}
                  title={t('imports.sales')}
                  body={t('imports.salesHint')}
                  action={<Link to="/app/imports?kind=sales" className={buttonClass('primary', 'sm')}>{t('imports.upload')}</Link>}
                />
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <div>
                <p className="kicker">{t('common.actual')}</p>
                <h2 className="mt-1 text-sm font-extrabold">{t('nav.sales')}</h2>
              </div>
              <Input className="h-9 max-w-[220px] text-xs" placeholder={t('common.search')} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            {filtered.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line bg-bg/60">
                    <tr className="table-head">
                      <th className="px-3 py-2.5">{t('common.date')}</th>
                      <th className="px-3 py-2.5">{t('common.product')}</th>
                      <th className="px-3 py-2.5 text-right">{t('common.qty')}</th>
                      <th className="px-3 py-2.5 text-right">{t('common.rate')}</th>
                      <th className="px-3 py-2.5 text-right">{t('common.total')}</th>
                      <th className="px-3 py-2.5">{t('common.status')}</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((sale) => {
                      const product = productMap.get(sale.productId);
                      return (
                        <tr key={sale.id} className="hover:bg-bg/40">
                          <td className="num px-3 py-2.5 text-xs">{formatDate(sale.date)}</td>
                          <td className="px-3 py-2.5">
                            <p className="max-w-[220px] truncate text-xs font-bold">{product?.name ?? sale.productId}</p>
                            <p className="text-[10px] text-muted">{product?.category ?? '-'}</p>
                          </td>
                          <td className="num px-3 py-2.5 text-right text-xs">{formatNumber(sale.qty)}</td>
                          <td className="num px-3 py-2.5 text-right text-xs">{formatINR(sale.sellingPrice)}</td>
                          <td className="num px-3 py-2.5 text-right text-xs font-bold">{formatINR(sale.qty * sale.sellingPrice)}</td>
                          <td className="px-3 py-2.5">
                            <Badge tone={sale.source === 'estimated' ? 'amber' : sale.source === 'manual' ? 'neutral' : 'blue'}>
                              {sourceLabels[lang][sale.source]}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button type="button" onClick={() => remove(sale.id)} className="rounded-lg p-1.5 text-muted hover:text-danger" aria-label={t('common.delete')}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState icon={<ReceiptText className="h-5 w-5" />} title={t('common.noData')} body={t('imports.salesHint')} />
              </div>
            )}
            {filtered.length > 0 && (
              <div className="border-t border-line p-3 text-right text-[11px] text-muted">
                {t('imports.sampleRows')} · {filtered.length} {t('common.items')}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <p className="kicker">{t('common.add')}</p>
            <div className="mt-4 space-y-3">
              <Field label={t('common.product')} required>
                <Select value={productId} onChange={(event) => selectProduct(event.target.value)}>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('common.qty')} required>
                  <Input type="number" min={1} inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} />
                </Field>
                <Field label={t('common.rate')} required>
                  <Input type="number" min={0} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('common.date')}>
                  <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </Field>
                <Field label={t('common.status')}>
                  <Select value={source} onChange={(event) => setSource(event.target.value as Source)}>
                    {(['manual', 'billing_export', 'upi', 'estimated'] as const).map((option) => (
                      <option key={option} value={option}>{sourceLabels[lang][option]}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button className="w-full" onClick={submit}>
                <Plus className="h-4 w-4" /> {t('common.add')}
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('imports.salesHint')}</p>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><BadgeIndianRupee className="h-4 w-4 text-primary" /> {t('common.howCalculated')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('profit.grossVsNet')}</p>
            <Link to="/app/reports" className={buttonClass('secondary', 'sm', 'mt-3 w-full justify-between')}>
              {t('reports.title')} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card className="p-4">
            <p className="kicker">{t('imports.title')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('imports.salesHint')}</p>
            <Link to="/app/imports?kind=sales" className={buttonClass('primary', 'sm', 'mt-3 w-full')}>
              <Upload className="h-3.5 w-3.5" /> {t('imports.upload')}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
