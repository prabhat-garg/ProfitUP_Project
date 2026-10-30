import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function roundUpToPack(qty: number, packSize: number) {
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  const pack = packSize > 0 ? packSize : 1;
  return Math.ceil(qty / pack) * pack;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function avg(values: number[]) {
  if (!values.length) return 0;
  return sum(values) / values.length;
}

export function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const group = key(item);
    (groups[group] ||= []).push(item);
    return groups;
  }, {});
}

export function sortedUnique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function safeDivide(numerator: number, denominator: number, fallback = 0) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return fallback;
  return numerator / denominator;
}

export function daysBetween(from: string | Date, to: string | Date = new Date()) {
  const start = typeof from === 'string' ? new Date(`${from}T00:00:00`) : new Date(from);
  const end = typeof to === 'string' ? new Date(`${to}T00:00:00`) : new Date(to);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: Date | string, days: number) {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function nextWeekday(from: Date, weekday: number, hour = 10) {
  const result = new Date(from);
  const diff = (weekday - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + (diff === 0 && result.getHours() >= hour ? 7 : diff));
  result.setHours(hour, 0, 0, 0);
  return result;
}

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  return Promise.resolve();
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const cleaned = value.replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
