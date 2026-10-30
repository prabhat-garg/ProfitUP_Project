import type { AppState, Product, ProductMetrics, StockStatus, Urgency } from '../types';
import {
  calculateDemand,
  daysLeft,
  getCurrentStock,
  getDaysWithoutMovement,
  getStockStatus,
  getUrgency,
} from './stock';

export function marginPct(product: Product): number {
  if (!product.sellingPrice || product.sellingPrice <= 0) return 0;
  return ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100;
}

export function stockValue(product: Product, stock = product.currentStock) {
  return Math.max(0, stock) * Math.max(0, product.costPrice);
}

export function productMetrics(
  state: AppState,
  product: Product,
  options: { leadTimeDays?: number } = {},
): ProductMetrics {
  const stock = getCurrentStock(state, product);
  const demand = calculateDemand(state, product);
  const left = daysLeft(stock, demand.dailyDemand);
  const movement = getDaysWithoutMovement(state, product);
  const status = getStockStatus(state, product, movement);
  const supplier = state.suppliers.find((entry) => entry.id === product.supplierId);
  const urgency = getUrgency(left, options.leadTimeDays ?? supplier?.leadTimeDays ?? 0);
  return {
    product,
    stock,
    dailyDemand: demand.dailyDemand,
    demandSource: demand.source,
    confidence: demand.confidence,
    daysLeft: left,
    status,
    daysWithoutMovement: movement,
    urgency,
    suggestedQty: 0,
    stockValue: stockValue(product, stock),
    marginPct: marginPct(product),
    unitsSold: demand.unitsSold,
  };
}

export function allProductMetrics(state: AppState): ProductMetrics[] {
  return state.products
    .filter((product) => product.isActive)
    .map((product) => productMetrics(state, product));
}

export interface InventorySummary {
  totalValue: number;
  byStatus: Record<StockStatus, { value: number; count: number }>;
  totalProducts: number;
  healthyCount: number;
  slowCount: number;
  deadCount: number;
  reorderCount: number;
  reorderValue: number;
  averageMargin: number;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyGrossProfit: number;
  potentialMonthlyRevenue: number;
}

export function inventorySummary(state: AppState, metrics = allProductMetrics(state)): InventorySummary {
  const byStatus: InventorySummary['byStatus'] = {
    healthy: { value: 0, count: 0 },
    slow: { value: 0, count: 0 },
    dead: { value: 0, count: 0 },
  };
  let reorderCount = 0;
  let reorderValue = 0;
  let marginTotal = 0;
  let revenue = 0;
  let gross = 0;
  metrics.forEach((metric) => {
    byStatus[metric.status].value += metric.stockValue;
    byStatus[metric.status].count += 1;
    marginTotal += metric.marginPct;
    if (metric.urgency !== 'later') {
      reorderCount += 1;
      const qty = Math.max(0, Math.ceil(metric.dailyDemand * 7 * 1.1 - metric.stock));
      reorderValue += qty * metric.product.costPrice;
    }
    revenue += metric.dailyDemand * 30 * metric.product.sellingPrice;
    gross += metric.dailyDemand * 30 * (metric.product.sellingPrice - metric.product.costPrice);
  });
  const totalValue = metrics.reduce((total, metric) => total + metric.stockValue, 0);
  return {
    totalValue,
    byStatus,
    totalProducts: metrics.length,
    healthyCount: byStatus.healthy.count,
    slowCount: byStatus.slow.count,
    deadCount: byStatus.dead.count,
    reorderCount,
    reorderValue,
    averageMargin: metrics.length ? marginTotal / metrics.length : 0,
    estimatedMonthlyRevenue: revenue,
    estimatedMonthlyGrossProfit: gross,
    potentialMonthlyRevenue: state.business.expectedProfitPct
      ? revenue
      : revenue,
  };
}

export interface ReorderCandidate extends ProductMetrics {
  urgencyRank: number;
  supplierName: string;
  savings?: number;
  excluded?: string;
}

export function urgencyRank(urgency: Urgency) {
  return { today: 0, three: 1, five: 2, later: 3 }[urgency];
}

export function urgencyColor(urgency: Urgency) {
  return {
    today: 'danger',
    three: 'accent',
    five: 'warning',
    later: 'muted',
  }[urgency];
}
