import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileText,
  History,
  Save,
  Send,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { buildOrderPlan, orderListCSV, orderListWhatsApp, DEFAULT_ORDER_OPTIONS, type OrderPlan } from '../lib/engine/orders';
import { formatDate, formatINR, formatNumber } from '../lib/format';
import { copyText, downloadFile, sortedUnique } from '../lib/utils';
import { siteConfig } from '../config/site';
import { PageHeader, EstimatedBadge } from '../components/shared';
import { Badge, Button, Card, Dialog, Drawer, EmptyState, Field, Input, Select, buttonClass, useToast } from '../components/ui';
import { orderPlanPDF } from '../lib/exports';

export default function OrderPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { saveOrder, updateOrderStatus } = useAppData();
  const { push } = useToast();
  const [coverDays, setCoverDays] = useState(7);
  const [safetyPct, setSafetyPct] = useState(state.business.safetyPct || 10);
  const [festivalBoost, setFestivalBoost] = useState(1);
  const [budget, setBudget] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [category, setCategory] = useState('');
  const [focusIds, setFocusIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('pu_order_preselect') || '[]') as string[];
    } catch {
      return [];
    }
  });
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmReceived, setConfirmReceived] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem('pu_order_preselect');
  }, []);

  const plan = useMemo<OrderPlan>(() => {
    return buildOrderPlan(state, {
      ...DEFAULT_ORDER_OPTIONS,
      coverDays,
      safetyPct,
      festivalBoost,
      budgetLimit: budget.trim() === '' ? null : Math.max(0, Number(budget) || 0),
      supplierId: supplierId || undefined,
      categories: category ? [category] : undefined,
      productIds: focusIds.length ? focusIds : undefined,
    });
  }, [state, coverDays, safetyPct, festivalBoost, budget, supplierId, category, focusIds]);

  const items = useMemo(
    () => plan.items.map((item) => ({ ...item, finalQty: overrides[item.productId] ?? item.finalQty })),
    [plan.items, overrides],
  );
  const total = items.reduce((sum, item) => sum + item.finalQty * item.rate, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.finalQty, 0);
  const categories = sortedUnique(state.products.map((product) => product.category));
  const savedOrder = state.orderLists.find((order) => order.id === savedId);
  const detailOrder = state.orderLists.find((order) => order.id === detailId);

  const buildSaved = () =>
    saveOrder({
      id: savedId ?? undefined,
      coverDays,
      safetyPct,
      festivalBoost,
      budgetLimit: budget.trim() === '' ? null : Math.max(0, Number(budget) || 0),
      status: savedOrder?.status ?? 'draft',
      totalCost: total,
      items: items.map((item) => ({
        productId: item.productId,
        suggestedQty: item.suggestedQty,
        finalQty: item.finalQty,
        rate: item.rate,
        reason: item.reasonCode,
      })),
    });

  const onSave = () => {
    if (!items.length) {
      push({ title: t('order.empty'), tone: 'error' });
      return;
    }
    const order = buildSaved();
    setSavedId(order.id);
    push({ title: t('order.draftSaved'), body: formatINR(total) });
  };

  const onSent = () => {
    const order = buildSaved();
    setSavedId(order.id);
    updateOrderStatus(order.id, 'sent');
    push({ title: t('order.sent'), body: formatINR(total) });
  };

  const onReceived = () => {
    if (!savedId) {
      push({ title: t('order.saveFirst'), tone: 'error' });
      return;
    }
    updateOrderStatus(savedId, 'received');
    setConfirmReceived(false);
    push({ title: t('order.received') });
  };

  const copyWhatsApp = async () => {
    await copyText(orderListWhatsApp(state, { ...plan, items, totalCost: total }, lang));
    push({ title: t('common.copied'), body: t('order.whatsappHelp') });
  };

  const reasonText = (code: string) => {
    const map: Record<string, string> = {
      urgent_cover: t('urgency.todayHint'),
      three_day_cover: t('urgency.threeHint'),
      cover_days: `${coverDays} ${t('common.days')} ${t('common.cover').toLowerCase()} + ${safetyPct}%`,
      dead_stock: t('status.dead'),
      no_demand: t('common.noData'),
      enough_stock: t('common.stock'),
    };
    return map[code] ?? code;
  };

  return (
    <div>
      <PageHeader
        number="03"
        title={t('order.title')}
        sub={t('order.sub')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setHistoryOpen(true)}><History className="h-4 w-4" /> {t('order.history')}</Button>
            <Button onClick={onSave}><Save className="h-4 w-4" /> {t('common.saveDraft')}</Button>
          </>
        }
      />

      {focusIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-xs font-semibold text-primary">
          <span>{focusIds.length} {t('radar.selected', { count: focusIds.length })}</span>
          <button type="button" className="underline underline-offset-2" onClick={() => setFocusIds([])}>{t('common.clear')}</button>
        </div>
      )}

      <Card className="mb-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field label={t('order.cover')}>
            <Select value={coverDays} onChange={(event) => setCoverDays(Number(event.target.value))}>
              {[3, 7, 10, 15, 21, 30].map((days) => <option key={days} value={days}>{days} {t('common.days')}</option>)}
            </Select>
          </Field>
          <Field label={t('order.safety')}>
            <Input type="number" min={0} max={100} value={safetyPct} onChange={(event) => setSafetyPct(Math.max(0, Number(event.target.value) || 0))} />
          </Field>
          <Field label={t('order.festival')}>
            <Select value={festivalBoost} onChange={(event) => setFestivalBoost(Number(event.target.value))}>
              {siteConfig.festivalBoosts.map((boost) => <option key={boost.id} value={boost.value}>{boost.label}</option>)}
            </Select>
          </Field>
          <Field label={t('order.budget')} hint={t('common.optional')}>
            <Input type="number" min={0} placeholder="—" value={budget} onChange={(event) => setBudget(event.target.value)} />
          </Field>
          <Field label={t('order.supplierFilter')}>
            <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">{t('common.allSuppliers')}</option>
              {state.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 w-auto min-w-[150px] text-xs">
              <option value="">{t('common.allCategories')}</option>
              {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </Select>
            <span className="text-xs text-muted">{t('order.pendingOrders')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={plan.items.some((item) => item.confidence === 'basic') ? 'amber' : 'green'}>
              {plan.items.some((item) => item.confidence === 'basic') ? t('status.estimated') : t('common.actual')}
            </Badge>
            <span className="text-xs text-muted">{items.length} {t('common.items')} · {totalUnits} {t('common.units')}</span>
            <span className="num text-lg font-black">{formatINR(total)}</span>
          </div>
        </div>
      </Card>

      {plan.warnings.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {plan.warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl border border-accent/30 bg-[var(--warning-soft)] px-3 py-2 text-xs font-semibold text-accent">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {warning}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-5">
          {items.length ? items.map((item) => (
            <Card key={item.productId} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold">{lang === 'hi' ? item.nameHi : item.name}</h3>
                    <Badge tone="neutral">{item.supplierName}</Badge>
                    {item.confidence === 'basic' && <EstimatedBadge />}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {t('radar.stock')} {formatNumber(item.stock, 1)} · {t('radar.demand')} {item.dailyDemand.toFixed(2)}{t('common.perDay')} · {t('radar.daysLeft')} {item.daysLeft === null ? '—' : `${item.daysLeft.toFixed(1)} ${t('common.days')}`}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">{t('common.reason')}: {reasonText(item.reasonCode)}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <span className="label">{t('order.suggested')}</span>
                    <p className="num text-sm font-bold">{item.suggestedQty}</p>
                  </div>
                  <div className="w-24">
                    <label className="label" htmlFor={`qty-${item.productId}`}>{t('order.final')}</label>
                    <Input
                      id={`qty-${item.productId}`}
                      type="number"
                      min={0}
                      step={item.productId ? 1 : 1}
                      value={item.finalQty}
                      onChange={(event) => setOverrides((current) => ({ ...current, [item.productId]: Math.max(0, Number(event.target.value) || 0) }))}
                      className="h-9 text-right"
                    />
                  </div>
                  <div className="text-right">
                    <span className="label">{t('order.rate')}</span>
                    <p className="num text-sm">{formatINR(item.rate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="label">{t('order.lineTotal')}</span>
                    <p className="num text-sm font-bold">{formatINR(item.finalQty * item.rate)}</p>
                  </div>
                </div>
              </div>
              {overrides[item.productId] !== undefined && overrides[item.productId] !== item.suggestedQty && (
                <p className="mt-2 text-[11px] font-semibold text-accent">{t('order.edited')}: {item.suggestedQty} → {item.finalQty}</p>
              )}
            </Card>
          )) : (
            <EmptyState icon={<ShoppingCart className="h-5 w-5" />} title={t('order.empty')} body={t('order.sub')} action={<Button variant="secondary" onClick={() => { setBudget(''); setCoverDays(7); setFocusIds([]); setSupplierId(''); }}>{t('order.generate')}</Button>} />
          )}

          {plan.skipped.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="kicker">{t('order.skipped')}</p>
                  <p className="mt-1 text-xs text-muted">{t('order.skippedSub')}</p>
                </div>
                <Badge tone="neutral">{plan.skipped.length}</Badge>
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {plan.skipped.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-xs">
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 text-muted">{reasonText(item.reasonCode)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {plan.excludedByBudget.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="kicker">{t('order.excluded')}</p>
                <Badge tone="red">{plan.excludedByBudget.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted">{plan.warnings.find((warning) => warning.includes('budget')) ?? t('order.budgetTooLow')}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <p className="kicker">{t('order.currentPlan')}</p>
            <p className="num mt-2 text-3xl font-black tracking-tight">{formatINR(total)}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <EstimatedBadge />
              <span>{t('common.estimatedNote')}</span>
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
              <div className="flex justify-between"><dt className="text-muted">{t('order.original')}</dt><dd className="num font-bold">{formatINR(plan.totalCost)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('common.items')}</dt><dd className="num font-bold">{items.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('common.units')}</dt><dd className="num font-bold">{totalUnits}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('order.cover')}</dt><dd className="font-bold">{coverDays} {t('common.days')}</dd></div>
            </dl>
            <div className="mt-4 grid gap-2">
              <Button onClick={onSave}><Save className="h-4 w-4" /> {t('common.saveDraft')}</Button>
              <Button variant="secondary" onClick={onSent} disabled={!items.length}><Send className="h-4 w-4" /> {t('common.markSent')}</Button>
              <Button variant="secondary" onClick={() => setConfirmReceived(true)} disabled={!savedId}><Truck className="h-4 w-4" /> {t('common.markReceived')}</Button>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <p className="kicker mb-2">{t('common.actions')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={copyWhatsApp}><ClipboardCopy className="h-3.5 w-3.5" /> {t('common.whatsapp')}</Button>
                <Button variant="secondary" size="sm" onClick={() => downloadFile('profitup-order.csv', orderListCSV({ ...plan, items, totalCost: total }), 'text/csv;charset=utf-8')}><Download className="h-3.5 w-3.5" /> {t('common.csv')}</Button>
                <Button variant="secondary" size="sm" onClick={() => orderPlanPDF(state, { ...plan, items, totalCost: total }, lang, savedOrder)}><FileText className="h-3.5 w-3.5" /> {t('common.pdf')}</Button>
                <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)}><History className="h-3.5 w-3.5" /> {t('order.history')}</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="kicker">{t('order.supplierTotals')}</p>
            <div className="mt-3 space-y-2">
              {plan.supplierTotals.length ? plan.supplierTotals.map((supplier) => {
                const live = items.filter((item) => item.supplierId === supplier.supplierId).reduce((sum, item) => sum + item.finalQty * item.rate, 0);
                return (
                  <div key={supplier.supplierId} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{supplier.supplierName}</p>
                      <p className="num text-sm font-bold">{formatINR(live)}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">{supplier.products} {t('common.items')} · {t('order.minOrder')} {formatINR(supplier.minOrder)}</p>
                    {live < supplier.minOrder && <Badge tone="amber" className="mt-2">{t('order.belowMin')}</Badge>}
                  </div>
                );
              }) : <p className="text-xs text-muted">{t('order.empty')}</p>}
            </div>
          </Card>

          {savedOrder && (
            <Card className="border-primary/30 p-4 text-xs">
              <p className="kicker text-primary">{t('common.saved')}</p>
              <p className="mt-2 font-bold">{savedOrder.id}</p>
              <p className="text-muted">{savedOrder.status} · {formatDate(savedOrder.createdAt.slice(0, 10))} · {formatINR(savedOrder.totalCost)}</p>
            </Card>
          )}

          <div className="rounded-xl border border-line bg-bg/50 p-3 text-[11px] leading-relaxed text-muted">
            <p className="mb-1 font-bold text-ink">{t('common.howCalculated')}</p>
            <p>{t('order.sub')}</p>
            <p className="mt-1">{t('order.markReceivedHint')}</p>
          </div>
        </div>
      </div>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={t('order.history')}
        description={t('order.pendingOrders')}
        size="lg"
      >
        {state.orderLists.length ? (
          <div className="space-y-2">
            {state.orderLists.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
                <div>
                  <p className="text-sm font-bold">{order.id} · {formatINR(order.totalCost)}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatDate(order.createdAt.slice(0, 10))} · {order.items.length} {t('common.items')} · {order.coverDays} {t('common.days')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={order.status === 'received' ? 'green' : order.status === 'sent' ? 'blue' : 'neutral'}>{order.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setDetailId(order.id); setHistoryOpen(false); }}>{t('common.open')}</Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">{t('order.noHistory')}</p>}
      </Dialog>

      <Drawer
        open={Boolean(detailOrder)}
        onClose={() => setDetailId(null)}
        title={detailOrder ? `${t('order.history')} · ${detailOrder.id}` : ''}
        description={detailOrder ? `${formatDate(detailOrder.createdAt.slice(0, 10))} · ${formatINR(detailOrder.totalCost)}` : undefined}
        footer={detailOrder ? (
          <>
            <Button variant="secondary" onClick={() => orderPlanPDF(state, { ...plan, items, totalCost: detailOrder.totalCost }, lang, detailOrder)}><FileText className="h-4 w-4" /> {t('common.pdf')}</Button>
            {detailOrder.status === 'sent' && <Button onClick={() => { updateOrderStatus(detailOrder.id, 'received'); setDetailId(null); push({ title: t('order.received') }); }}>{t('common.markReceived')}</Button>}
          </>
        ) : undefined}
      >
        {detailOrder && (
          <div className="space-y-3">
            <Badge tone={detailOrder.status === 'received' ? 'green' : detailOrder.status === 'sent' ? 'blue' : 'neutral'}>{detailOrder.status}</Badge>
            <div className="divide-y divide-line rounded-xl border border-line">
              {detailOrder.items.map((item) => {
                const product = state.products.find((entry) => entry.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{product?.name ?? item.productId}</p>
                      <p className="text-muted">{item.finalQty} × {formatINR(item.rate)} · {item.reason}</p>
                    </div>
                    <span className="num font-bold">{formatINR(item.finalQty * item.rate)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted">{t('common.estimatedNote')}</p>
          </div>
        )}
      </Drawer>

      <Dialog
        open={confirmReceived}
        onClose={() => setConfirmReceived(false)}
        title={t('common.markReceived')}
        description={t('order.markReceivedHint')}
        footer={<><Button variant="secondary" onClick={() => setConfirmReceived(false)}>{t('common.cancel')}</Button><Button onClick={onReceived}>{t('common.markReceived')}</Button></>}
      >
        <div className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>{t('order.markReceivedHint')} {t('purchases.receivedNote')}</p>
        </div>
      </Dialog>

      <div className="mt-5 flex justify-end">
        <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowRight className="h-3.5 w-3.5 -rotate-90" /> Top
        </button>
      </div>
    </div>
  );
}
