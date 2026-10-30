import type { Lang } from './types';

export function formatINR(value: number, options: { decimals?: number; sign?: boolean } = {}) {
  const { decimals = 0, sign = false } = options;
  if (!Number.isFinite(value)) return '₹0';
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
  const prefix = value < 0 ? '−' : sign && value > 0 ? '+' : '';
  return `${prefix}₹${formatted}`;
}

export function formatCompactINR(value: number) {
  if (!Number.isFinite(value)) return '₹0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(abs >= 100_000_000 ? 0 : 1)} Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(abs >= 1_000_000 ? 0 : 1)} L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

export function formatNumber(value: number, decimals = 0) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: string | Date, _lang: Lang = 'en') {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
}

export function formatDateTime(date: string | Date, lang: Lang = 'en') {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  return `${formatDate(value, lang)}, ${value.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function relativeDays(date: string | Date, lang: Lang = 'en') {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  const diff = Math.floor((Date.now() - value.getTime()) / 86_400_000);
  if (diff <= 0) return lang === 'hi' ? 'आज' : lang === 'hinglish' ? 'Aaj' : 'Today';
  if (diff === 1) return lang === 'hi' ? 'कल' : lang === 'hinglish' ? 'Kal' : 'Yesterday';
  return lang === 'hi' ? `${diff} दिन पहले` : lang === 'hinglish' ? `${diff} din pehle` : `${diff} days ago`;
}

export function daysLabel(days: number | null, lang: Lang = 'en') {
  if (days === null) return lang === 'hi' ? 'मांग नहीं' : lang === 'hinglish' ? 'Demand nahi' : 'No demand';
  if (days < 1) return lang === 'hi' ? 'आज खत्म' : lang === 'hinglish' ? 'Aaj khatam' : 'Out today';
  return lang === 'hi' ? `${days.toFixed(0)} दिन` : lang === 'hinglish' ? `${days.toFixed(0)} din` : `${days.toFixed(0)} days`;
}

export function pct(value: number, decimals = 1) {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
