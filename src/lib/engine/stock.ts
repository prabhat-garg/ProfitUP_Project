import type { AppState, Confidence, DemandResult, Product, StockStatus, Urgency } from '../types';
import { daysBetween, safeDivide } from '../utils';

export const DEMAND_WINDOW_DAYS = 30;
export const SHORT_WINDOW_DAYS = 14;

export function getLatestStockCount(state: AppState) {
  return [...state.stockCounts].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getSortedCounts(state: AppState) {
  return [...state.stockCounts].sort((a, b) => a.date.localeCompare(b.date));
}

export function getCurrentStock(state: AppState, product: Product): number {
  const latest = getLatestStockCount(state);
  const item = latest?.items.find((entry) => entry.productId === product.id);
  const baseline = item?.qty ?? product.currentStock ?? 0;
  if (!latest) return Math.max(0, baseline);
  const receivedAfterCount = state.purchases
    .filter((purchase) => purchase.received && purchase.date > latest.date)
    .flatMap((purchase) => purchase.items)
    .filter((purchaseItem) => purchaseItem.productId === product.id)
    .reduce((total, purchaseItem) => total + purchaseItem.qty, 0);
  return Math.max(0, baseline + receivedAfterCount);
}

export function getSalesForProduct(state: AppState, productId: string, sinceDays = DEMAND_WINDOW_DAYS) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return state.sales.filter((sale) => sale.productId === productId && sale.date >= cutoffISO);
}

export function getPurchasedQty(state: AppState, productId: string, afterDate: string, untilDate: string) {
  return state.purchases
    .filter((purchase) => purchase.received && purchase.date > afterDate && purchase.date <= untilDate)
    .flatMap((purchase) => purchase.items)
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.qty, 0);
}

export function confidenceFor(state: AppState, source: 'sales' | 'estimated' | 'none'): Confidence {
  if (source === 'none') return 'basic';
  if (state.business.dataLevel === 'full_sales' && source === 'sales') return 'best';
  if (state.business.dataLevel === 'orders_upi' && source === 'sales') return 'good';
  return 'basic';
}

/**
 * Demand is based on item-wise sales where available, otherwise:
 * estimated units sold = opening stock + purchases received - closing stock,
 * divided by the days between two valid stock counts.
 */
export function calculateDemand(state: AppState, product: Product): DemandResult {
  const sales = getSalesForProduct(state, product.id);
  if (sales.length > 0) {
    const dates = sales.map((sale) => sale.date).sort();
    const first = new Date(`${dates[0]}T00:00:00`);
    const last = new Date(`${dates[dates.length - 1]}T00:00:00`);
    const span = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1);
    const windowDays = span < 14 ? SHORT_WINDOW_DAYS : DEMAND_WINDOW_DAYS;
    const unitsSold = sales.reduce((total, sale) => total + sale.qty, 0);
    const dailyDemand = unitsSold / Math.max(1, Math.min(windowDays, Math.max(span, 1)));
    return {
      productId: product.id,
      dailyDemand,
      source: 'sales',
      confidence: confidenceFor(state, 'sales'),
      unitsSold,
      windowDays,
      locked: false,
    };
  }

  const counts = getSortedCounts(state).filter((count) =>
    count.items.some((item) => item.productId === product.id),
  );
  if (counts.length >= 2) {
    const first = counts[0];
    const last = counts[counts.length - 1];
    const opening = first.items.find((item) => item.productId === product.id)?.qty ?? 0;
    const closing = last.items.find((item) => item.productId === product.id)?.qty ?? getCurrentStock(state, product);
    const purchased = getPurchasedQty(state, product.id, first.date, last.date);
    const days = Math.max(1, daysBetween(first.date, last.date));
    const estimatedUnits = Math.max(0, opening + purchased - closing);
    return {
      productId: product.id,
      dailyDemand: safeDivide(estimatedUnits, days),
      source: 'estimated',
      confidence: 'basic',
      unitsSold: estimatedUnits,
      windowDays: days,
      locked: false,
    };
  }

  return {
    productId: product.id,
    dailyDemand: 0,
    source: 'none',
    confidence: 'basic',
    unitsSold: 0,
    windowDays: 0,
    locked: true,
  };
}

export function daysLeft(stock: number, dailyDemand: number): number | null {
  if (!Number.isFinite(dailyDemand) || dailyDemand <= 0) return null;
  return Math.max(0, stock / dailyDemand);
}

export function getUrgency(days: number | null, leadTimeDays = 0): Urgency {
  if (days === null) return 'later';
  if (days <= 1 || days <= leadTimeDays) return 'today';
  if (days <= 3) return 'three';
  if (days <= 5) return 'five';
  return 'later';
}

export function getDaysWithoutMovement(state: AppState, product: Product): number | null {
  const sales = state.sales
    .filter((sale) => sale.productId === product.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (sales.length) return daysBetween(sales[0].date);
  const counts = getSortedCounts(state);
  if (counts.length) return daysBetween(counts[0].date);
  return null;
}

export function getStockStatus(
  state: AppState,
  product: Product,
  movementDays = getDaysWithoutMovement(state, product),
): StockStatus {
  if (movementDays === null) return 'healthy';
  if (movementDays >= state.business.deadDays) return 'dead';
  if (movementDays >= state.business.slowDays) return 'slow';
  return 'healthy';
}

export function getStockstatusLabel(status: StockStatus) {
  return status;
}

export function daysSinceLastCount(state: AppState) {
  const latest = getLatestStockCount(state);
  return latest ? daysBetween(latest.date) : null;
}

export function isStockCountStale(state: AppState) {
  const days = daysSinceLastCount(state);
  return days === null || days > 7;
}

export function movementLabel(days: number | null) {
  if (days === null) return 'No movement data';
  if (days === 0) return 'Moved today';
  return `${days} days without movement`;
}
