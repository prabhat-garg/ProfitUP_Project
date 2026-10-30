import type { AppState, ProductMetrics } from '../types';
import { roundUpToPack } from '../utils';
import { allProductMetrics, urgencyRank } from './metrics';

export interface OrderOptions {
  coverDays: number;
  safetyPct: number;
  festivalBoost: number;
  budgetLimit: number | null;
  supplierId?: string;
  categories?: string[];
  productIds?: string[];
}

export interface OrderSuggestionItem {
  productId: string;
  name: string;
  nameHi: string;
  supplierId: string;
  supplierName: string;
  stock: number;
  dailyDemand: number;
  daysLeft: number | null;
  suggestedQty: number;
  finalQty: number;
  rate: number;
  cost: number;
  urgency: ProductMetrics['urgency'];
  status: ProductMetrics['status'];
  confidence: ProductMetrics['confidence'];
  reasonCode: string;
  profitPerRupee: number;
  category: string;
}

export interface SkippedItem {
  productId: string;
  name: string;
  reasonCode: string;
  stockValue: number;
}

export interface SupplierTotal {
  supplierId: string;
  supplierName: string;
  total: number;
  minOrder: number;
  belowMinimum: boolean;
  products: number;
}

export interface OrderPlan {
  items: OrderSuggestionItem[];
  skipped: SkippedItem[];
  excludedByBudget: OrderSuggestionItem[];
  supplierTotals: SupplierTotal[];
  totalCost: number;
  originalCost: number;
  options: OrderOptions;
  warnings: string[];
}

export const DEFAULT_ORDER_OPTIONS: OrderOptions = {
  coverDays: 7,
  safetyPct: 10,
  festivalBoost: 1,
  budgetLimit: null,
};

export function pendingQty(state: AppState, productId: string) {
  return state.orderLists
    .filter((order) => order.status === 'sent')
    .flatMap((order) => order.items)
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.finalQty, 0);
}

export function suggestedOrderQty(
  state: AppState,
  metric: ProductMetrics,
  options: Pick<OrderOptions, 'coverDays' | 'safetyPct' | 'festivalBoost'>,
) {
  if (metric.dailyDemand <= 0) return 0;
  const base =
    metric.dailyDemand *
      Math.max(0.1, options.festivalBoost) *
      Math.max(1, options.coverDays) *
      (1 + Math.max(0, options.safetyPct) / 100) -
    metric.stock -
    pendingQty(state, metric.product.id);
  if (base <= 0) return 0;
  return Math.max(0, roundUpToPack(base, metric.product.packSize));
}

export function buildOrderPlan(state: AppState, options: OrderOptions): OrderPlan {
  const metrics = allProductMetrics(state);
  const supplierMap = new Map(state.suppliers.map((supplier) => [supplier.id, supplier]));
  const items: OrderSuggestionItem[] = [];
  const skipped: SkippedItem[] = [];

  metrics.forEach((metric) => {
    const product = metric.product;
    if (options.supplierId && product.supplierId !== options.supplierId) return;
    if (options.categories?.length && !options.categories.includes(product.category)) return;
    if (options.productIds?.length && !options.productIds.includes(product.id)) return;

    if (metric.status === 'dead') {
      skipped.push({
        productId: product.id,
        name: product.name,
        reasonCode: 'dead_stock',
        stockValue: metric.stockValue,
      });
      return;
    }
    if (metric.dailyDemand <= 0) {
      skipped.push({
        productId: product.id,
        name: product.name,
        reasonCode: 'no_demand',
        stockValue: metric.stockValue,
      });
      return;
    }
    const qty = suggestedOrderQty(state, metric, options);
    if (qty <= 0) {
      skipped.push({
        productId: product.id,
        name: product.name,
        reasonCode: 'enough_stock',
        stockValue: metric.stockValue,
      });
      return;
    }
    const supplier = supplierMap.get(product.supplierId);
    const profitPerRupee =
      product.costPrice > 0
        ? ((product.sellingPrice - product.costPrice) * metric.dailyDemand) / product.costPrice
        : 0;
    items.push({
      productId: product.id,
      name: product.name,
      nameHi: product.nameHi,
      supplierId: product.supplierId,
      supplierName: supplier?.name ?? 'Unknown supplier',
      stock: metric.stock,
      dailyDemand: metric.dailyDemand,
      daysLeft: metric.daysLeft,
      suggestedQty: qty,
      finalQty: qty,
      rate: product.costPrice,
      cost: qty * product.costPrice,
      urgency: metric.urgency,
      status: metric.status,
      confidence: metric.confidence,
      reasonCode:
        metric.urgency === 'today'
          ? 'urgent_cover'
          : metric.urgency === 'three'
            ? 'three_day_cover'
            : 'cover_days',
      profitPerRupee,
      category: product.category,
    });
  });

  items.sort((a, b) => {
    const urgencyDiff = urgencyRank(a.urgency) - urgencyRank(b.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;
    return b.profitPerRupee - a.profitPerRupee;
  });

  const originalCost = items.reduce((total, item) => total + item.cost, 0);
  const excludedByBudget: OrderSuggestionItem[] = [];
  let kept = items;
  if (options.budgetLimit !== null && options.budgetLimit >= 0) {
    let running = 0;
    kept = [];
    items.forEach((item) => {
      if (running + item.cost <= options.budgetLimit!) {
        kept.push(item);
        running += item.cost;
      } else {
        excludedByBudget.push(item);
      }
    });
  }

  const supplierTotals: SupplierTotal[] = [];
  state.suppliers.forEach((supplier) => {
    const supplierItems = kept.filter((item) => item.supplierId === supplier.id);
    if (!supplierItems.length) return;
    const total = supplierItems.reduce((sum, item) => sum + item.cost, 0);
    supplierTotals.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      total,
      minOrder: supplier.minOrder,
      belowMinimum: total < supplier.minOrder,
      products: supplierItems.length,
    });
  });

  const warnings: string[] = [];
  supplierTotals
    .filter((supplier) => supplier.belowMinimum)
    .forEach((supplier) =>
      warnings.push(
        `${supplier.supplierName}: ${supplier.products} items total below the ${supplier.minOrder} minimum.`,
      ),
    );
  if (excludedByBudget.length) {
    warnings.push(`${excludedByBudget.length} items excluded to stay inside the budget.`);
  }
  if (!kept.length && items.length) warnings.push('Budget is too low for even the highest-priority item.');

  return {
    items: kept,
    skipped,
    excludedByBudget,
    supplierTotals,
    totalCost: kept.reduce((total, item) => total + item.finalQty * item.rate, 0),
    originalCost,
    options,
    warnings,
  };
}

export function orderListWhatsApp(state: AppState, plan: OrderPlan, lang: 'hi' | 'en' | 'hinglish' = 'en') {
  const date = new Date().toLocaleDateString('en-IN');
  const bySupplier = new Map<string, OrderSuggestionItem[]>();
  plan.items.forEach((item) => {
    const items = bySupplier.get(item.supplierName) ?? [];
    items.push(item);
    bySupplier.set(item.supplierName, items);
  });
  const intro =
    lang === 'hi'
      ? `नमस्ते, ${state.business.name} के लिए ऑर्डर:`
      : lang === 'hinglish'
        ? `Namaste, ${state.business.name} ke liye order:`
        : `Namaste, order for ${state.business.name}:`;
  const parts = [intro, `Date: ${date}`, ''];
  bySupplier.forEach((items, supplier) => {
    parts.push(`— ${supplier} —`);
    items.forEach((item) => {
      parts.push(`• ${item.name} — ${item.finalQty} × ₹${item.rate} = ₹${item.finalQty * item.rate}`);
    });
    parts.push('');
  });
  parts.push(`Total: ₹${plan.totalCost.toLocaleString('en-IN')}`);
  parts.push(lang === 'hi' ? 'कृपया उपलब्धता और डिलीवरी की पुष्टि करें।' : 'Please confirm availability and delivery.');
  return parts.join('\n');
}

export function orderListCSV(plan: OrderPlan) {
  const header = 'Supplier,Product,Stock,Daily demand,Days left,Suggested qty,Final qty,Rate,Cost,Reason';
  const rows = plan.items.map((item) =>
    [
      item.supplierName,
      item.name,
      item.stock.toFixed(1),
      item.dailyDemand.toFixed(2),
      item.daysLeft === null ? 'No demand' : item.daysLeft.toFixed(1),
      item.suggestedQty,
      item.finalQty,
      item.rate,
      item.finalQty * item.rate,
      item.reasonCode,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  );
  return [header, ...rows].join('\n');
}
