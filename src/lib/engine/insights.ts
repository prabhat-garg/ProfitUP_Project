import type { AppState, ProductMetrics, StockStatus } from '../types';
import { groupBy, sum } from '../utils';
import { allProductMetrics } from './metrics';

export interface MoneyStuckBreakdown {
  totalValue: number;
  healthy: number;
  slow: number;
  dead: number;
  byCategory: Array<{ category: string; value: number; deadValue: number; products: number }>;
  products: ProductMetrics[];
  udhaar: number;
  freedLow: number;
  freedHigh: number;
  slowCount: number;
  deadCount: number;
}

export interface RecoveryAssumptions {
  slowRecoveryPct: number;
  deadRecoveryPct: number;
  returnSharePct: number;
}

export const DEFAULT_RECOVERY: RecoveryAssumptions = {
  slowRecoveryPct: 45,
  deadRecoveryPct: 25,
  returnSharePct: 30,
};

export function moneyStuck(
  state: AppState,
  assumptions: RecoveryAssumptions = DEFAULT_RECOVERY,
): MoneyStuckBreakdown {
  const metrics = allProductMetrics(state);
  const totalValue = metrics.reduce((total, metric) => total + metric.stockValue, 0);
  const byStatus = (status: StockStatus) =>
    metrics.filter((metric) => metric.status === status).reduce((total, metric) => total + metric.stockValue, 0);
  const slow = byStatus('slow');
  const dead = byStatus('dead');
  const grouped = groupBy(metrics, (metric) => metric.product.category);
  const byCategory = Object.entries(grouped)
    .map(([category, items]) => ({
      category,
      value: sum(items.map((item) => item.stockValue)),
      deadValue: sum(items.filter((item) => item.status === 'dead').map((item) => item.stockValue)),
      products: items.length,
    }))
    .sort((a, b) => b.value - a.value);
  const udhaar = state.customers.reduce((total, customer) => total + Math.max(0, customer.amountDue), 0);
  const freedLow = slow * (assumptions.slowRecoveryPct / 100) + dead * (assumptions.returnSharePct / 100);
  const freedHigh = slow * (assumptions.slowRecoveryPct / 100) + dead * (assumptions.deadRecoveryPct / 100);
  return {
    totalValue,
    healthy: byStatus('healthy'),
    slow,
    dead,
    byCategory,
    products: metrics,
    udhaar,
    freedLow,
    freedHigh,
    slowCount: metrics.filter((metric) => metric.status === 'slow').length,
    deadCount: metrics.filter((metric) => metric.status === 'dead').length,
  };
}

export interface ProfitRow {
  productId: string;
  name: string;
  category: string;
  units: number;
  marginPct: number;
  grossProfit: number;
  revenue: number;
  quadrant: 'star' | 'promote' | 'supplier' | 'drop';
}

export interface ProfitAnalysis {
  rows: ProfitRow[];
  totalRevenue: number;
  totalGrossProfit: number;
  grossMarginPct: number;
  netEstimate: number;
  expensesThisMonth: number;
  topEarners: ProfitRow[];
  lowMarginHighVolume: ProfitRow[];
  byCategory: Array<{ category: string; revenue: number; gross: number; margin: number }>;
  quadrants: Record<ProfitRow['quadrant'], ProfitRow[]>;
  priceLeaks: Array<{ productId: string; name: string; oldCost: number; newCost: number; increasePct: number }>;
}

export function profitAnalysis(state: AppState, days = 30): ProfitAnalysis {
  const metrics = allProductMetrics(state);
  const rows: ProfitRow[] = metrics.map((metric) => {
    const units = metric.dailyDemand * days;
    const revenue = units * metric.product.sellingPrice;
    const grossProfit = units * (metric.product.sellingPrice - metric.product.costPrice);
    return {
      productId: metric.product.id,
      name: metric.product.name,
      category: metric.product.category,
      units,
      marginPct: metric.marginPct,
      grossProfit,
      revenue,
      quadrant: 'drop',
    };
  });
  const medianUnits = [...rows].map((row) => row.units).sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? 0;
  const avgMargin = rows.length ? mean(rows.map((row) => row.marginPct)) : 0;
  rows.forEach((row) => {
    const highVolume = row.units >= medianUnits;
    const highMargin = row.marginPct >= Math.max(avgMargin, state.business.marginAlertPct);
    row.quadrant = highVolume && highMargin ? 'star' : highVolume ? 'supplier' : highMargin ? 'promote' : 'drop';
  });
  const totalRevenue = sum(rows.map((row) => row.revenue));
  const totalGrossProfit = sum(rows.map((row) => row.grossProfit));
  const month = new Date().toISOString().slice(0, 7);
  const expensesThisMonth = sum(
    state.expenses.filter((expense) => expense.date.startsWith(month)).map((expense) => expense.amount),
  );
  const grouped = groupBy(rows, (row) => row.category);
  const byCategory = Object.entries(grouped)
    .map(([category, items]) => {
      const revenue = sum(items.map((item) => item.revenue));
      const gross = sum(items.map((item) => item.grossProfit));
      return { category, revenue, gross, margin: revenue ? (gross / revenue) * 100 : 0 };
    })
    .sort((a, b) => b.gross - a.gross);
  const quadrants = groupBy(rows, (row) => row.quadrant) as Record<ProfitRow['quadrant'], ProfitRow[]>;
  const priceLeaks = findPriceLeaks(state);
  return {
    rows,
    totalRevenue,
    totalGrossProfit,
    grossMarginPct: totalRevenue ? (totalGrossProfit / totalRevenue) * 100 : 0,
    netEstimate: totalGrossProfit - expensesThisMonth,
    expensesThisMonth,
    topEarners: [...rows].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 5),
    lowMarginHighVolume: rows
      .filter((row) => row.marginPct < state.business.marginAlertPct && row.units > medianUnits * 0.5)
      .sort((a, b) => b.revenue - a.revenue),
    byCategory,
    quadrants: {
      star: quadrants.star ?? [],
      promote: quadrants.promote ?? [],
      supplier: quadrants.supplier ?? [],
      drop: quadrants.drop ?? [],
    },
    priceLeaks,
  };
}

function findPriceLeaks(state: AppState) {
  const purchases = [...state.purchases]
    .filter((purchase) => purchase.received)
    .sort((a, b) => a.date.localeCompare(b.date));
  const leaks: ProfitAnalysis['priceLeaks'] = [];
  state.products.forEach((product) => {
    const prices = purchases
      .flatMap((purchase) =>
        purchase.items
          .filter((item) => item.productId === product.id)
          .map((item) => ({ date: purchase.date, cost: item.costPrice })),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    if (prices.length < 2) return;
    const oldCost = prices[prices.length - 2].cost;
    const newCost = prices[prices.length - 1].cost;
    if (oldCost > 0 && newCost > oldCost * 1.05) {
      leaks.push({
        productId: product.id,
        name: product.name,
        oldCost,
        newCost,
        increasePct: ((newCost - oldCost) / oldCost) * 100,
      });
    }
  });
  return leaks;
}

export interface ExpenseAlert {
  category: string;
  current: number;
  previous: number;
  threeMonthAverage: number;
  increasePct: number;
  reason: 'month_over_month' | 'three_month_average';
}

export function expenseAlerts(state: AppState, now = new Date()): ExpenseAlert[] {
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
  const categories = Array.from(new Set(state.expenses.map((expense) => expense.category)));
  const alerts: ExpenseAlert[] = [];
  categories.forEach((category) => {
    const current = state.expenses
      .filter((expense) => expense.category === category && expense.date.startsWith(currentKey))
      .reduce((total, expense) => total + expense.amount, 0);
    const previousAmount = state.expenses
      .filter((expense) => expense.category === category && expense.date.startsWith(previousKey))
      .reduce((total, expense) => total + expense.amount, 0);
    const lastThree = [0, 1, 2].map((months) => {
      const date = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return state.expenses
        .filter((expense) => expense.category === category && expense.date.startsWith(key))
        .reduce((total, expense) => total + expense.amount, 0);
    });
    const average = mean(lastThree.filter((value) => value > 0));
    if (current > 0 && previousAmount > 0 && current > previousAmount * 1.5) {
      alerts.push({
        category,
        current,
        previous: previousAmount,
        threeMonthAverage: average,
        increasePct: ((current - previousAmount) / previousAmount) * 100,
        reason: 'month_over_month',
      });
    } else if (current > 0 && average > 0 && current > average * 1.3) {
      alerts.push({
        category,
        current,
        previous: previousAmount,
        threeMonthAverage: average,
        increasePct: ((current - average) / average) * 100,
        reason: 'three_month_average',
      });
    }
  });
  return alerts.sort((a, b) => b.increasePct - a.increasePct);
}

export interface AgeingBuckets {
  current: number;
  days0to7: number;
  days8to30: number;
  days30plus: number;
  total: number;
  customers: Array<{ id: string; name: string; amount: number; daysOverdue: number; bucket: string }>;
}

export function udhaarAgeing(state: AppState, now = new Date()): AgeingBuckets {
  const buckets: AgeingBuckets = {
    current: 0,
    days0to7: 0,
    days8to30: 0,
    days30plus: 0,
    total: 0,
    customers: [],
  };
  state.customers.forEach((customer) => {
    const due = new Date(`${customer.dueDate}T00:00:00`);
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000));
    let bucket = 'current';
    if (daysOverdue > 30) bucket = '30plus';
    else if (daysOverdue >= 8) bucket = '8to30';
    else if (daysOverdue >= 1) bucket = '0to7';
    if (bucket === 'current') buckets.current += customer.amountDue;
    if (bucket === '0to7') buckets.days0to7 += customer.amountDue;
    if (bucket === '8to30') buckets.days8to30 += customer.amountDue;
    if (bucket === '30plus') buckets.days30plus += customer.amountDue;
    buckets.total += customer.amountDue;
    buckets.customers.push({
      id: customer.id,
      name: customer.name,
      amount: customer.amountDue,
      daysOverdue,
      bucket,
    });
  });
  return buckets;
}

export interface RevenueSanity {
  estimated: number;
  low: number | null;
  high: number | null;
  verdict: 'close' | 'missing' | 'unknown';
  gapPct: number;
}

export function revenueSanity(state: AppState, analysis = profitAnalysis(state)): RevenueSanity {
  const range = state.business.monthlySalesRange;
  if (!range) {
    return { estimated: analysis.totalRevenue, low: null, high: null, verdict: 'unknown', gapPct: 0 };
  }
  const [low, high] = range.split('-').map(Number);
  const estimated = analysis.totalRevenue;
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return { estimated, low: null, high: null, verdict: 'unknown', gapPct: 0 };
  }
  const verdict = estimated >= low * 0.85 && estimated <= high * 1.15 ? 'close' : 'missing';
  const midpoint = (low + high) / 2;
  return {
    estimated,
    low,
    high,
    verdict,
    gapPct: midpoint ? ((estimated - midpoint) / midpoint) * 100 : 0,
  };
}

export interface DataHealth {
  score: number;
  missingCost: number;
  missingSelling: number;
  staleCounts: boolean;
  daysSinceCount: number | null;
  productsWithoutCount: number;
  missingSupplier: number;
  estimatedProducts: number;
  issues: Array<{ id: string; title: string; detail: string; severity: 'warn' | 'info' }>;
}

export function dataHealth(state: AppState): DataHealth {
  const metrics = allProductMetrics(state);
  const latest = [...state.stockCounts].sort((a, b) => b.date.localeCompare(a.date))[0];
  const countIds = new Set(latest?.items.map((item) => item.productId) ?? []);
  const missingCost = state.products.filter((product) => product.costPrice <= 0).length;
  const missingSelling = state.products.filter((product) => product.sellingPrice <= 0).length;
  const missingSupplier = state.products.filter(
    (product) => !state.suppliers.some((supplier) => supplier.id === product.supplierId),
  ).length;
  const productsWithoutCount = state.products.filter((product) => !countIds.has(product.id)).length;
  const daysSinceCount = latest
    ? Math.floor((Date.now() - new Date(`${latest.date}T00:00:00`).getTime()) / 86_400_000)
    : null;
  const estimatedProducts = metrics.filter((metric) => metric.demandSource === 'estimated').length;
  const issues: DataHealth['issues'] = [];
  if (missingCost) issues.push({ id: 'cost', title: 'Cost price missing', detail: `${missingCost} products cannot show profit until cost price is added.`, severity: 'warn' });
  if (missingSelling) issues.push({ id: 'selling', title: 'Selling price missing', detail: `${missingSelling} products cannot show margin.`, severity: 'warn' });
  if (productsWithoutCount) issues.push({ id: 'count', title: 'Not in last stock count', detail: `${productsWithoutCount} products are missing from the latest count.`, severity: 'warn' });
  if (estimatedProducts) issues.push({ id: 'estimated', title: 'Demand is estimated', detail: `${estimatedProducts} products use stock movement estimates because item-wise sales are not available.`, severity: 'info' });
  if (daysSinceCount !== null && daysSinceCount > 7) issues.push({ id: 'stale', title: 'Stock count is stale', detail: `Last count was ${daysSinceCount} days ago.`, severity: 'warn' });
  let score = 100;
  score -= Math.min(30, missingCost * 5);
  score -= Math.min(20, missingSelling * 5);
  score -= Math.min(15, productsWithoutCount * 2);
  score -= daysSinceCount !== null && daysSinceCount > 7 ? 15 : 0;
  score -= missingSupplier ? 10 : 0;
  return {
    score: Math.max(0, score),
    missingCost,
    missingSelling,
    staleCounts: daysSinceCount === null || daysSinceCount > 7,
    daysSinceCount,
    productsWithoutCount,
    missingSupplier,
    estimatedProducts,
    issues,
  };
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
