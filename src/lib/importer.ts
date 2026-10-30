import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { AppState } from './types';
import { parseNumber, todayISO } from './utils';

export type ImportKind = 'products' | 'purchases' | 'stock' | 'sales' | 'expenses';

export interface ImportField {
  key: string;
  label: string;
  aliases: string[];
  required?: boolean;
  hint?: string;
}

export const importFields: Record<ImportKind, ImportField[]> = {
  products: [
    { key: 'name', label: 'Product name', aliases: ['name', 'product', 'product name', 'item', 'item name'], required: true },
    { key: 'nameHi', label: 'Hindi name', aliases: ['hindi name', 'name hi', 'namehindi', 'hindi'] },
    { key: 'category', label: 'Category', aliases: ['category', 'group', 'type'], required: true },
    { key: 'unit', label: 'Unit', aliases: ['unit', 'uom'], required: true },
    { key: 'packSize', label: 'Pack size', aliases: ['pack size', 'pack', 'packsize'], required: true },
    { key: 'costPrice', label: 'Cost price', aliases: ['cost price', 'cost', 'purchase price', 'buy price'], required: true },
    { key: 'sellingPrice', label: 'Selling price', aliases: ['selling price', 'sell price', 'mrp', 'price'], required: true },
    { key: 'supplierName', label: 'Supplier', aliases: ['supplier', 'supplier name', 'vendor'] },
    { key: 'stock', label: 'Opening stock', aliases: ['stock', 'opening stock', 'qty', 'quantity'] },
    { key: 'reorderMin', label: 'Reorder minimum', aliases: ['reorder min', 'reorder minimum', 'minimum', 'min stock'] },
  ],
  purchases: [
    { key: 'date', label: 'Bill date', aliases: ['date', 'bill date', 'invoice date'], required: true },
    { key: 'invoice', label: 'Invoice number', aliases: ['invoice', 'invoice no', 'bill no', 'invoice number'], required: true },
    { key: 'supplier', label: 'Supplier', aliases: ['supplier', 'supplier name', 'vendor'], required: true },
    { key: 'product', label: 'Product', aliases: ['product', 'product name', 'item', 'item name'], required: true },
    { key: 'qty', label: 'Quantity', aliases: ['qty', 'quantity', 'units'], required: true },
    { key: 'costPrice', label: 'Cost price', aliases: ['cost price', 'cost', 'rate', 'purchase rate'], required: true },
  ],
  stock: [
    { key: 'product', label: 'Product', aliases: ['product', 'product name', 'item', 'item name'], required: true },
    { key: 'qty', label: 'Counted quantity', aliases: ['qty', 'quantity', 'counted qty', 'counted quantity', 'stock'], required: true },
  ],
  sales: [
    { key: 'date', label: 'Sale date', aliases: ['date', 'sale date', 'bill date'], required: true },
    { key: 'product', label: 'Product', aliases: ['product', 'product name', 'item', 'item name'], required: true },
    { key: 'qty', label: 'Quantity', aliases: ['qty', 'quantity', 'units'], required: true },
    { key: 'sellingPrice', label: 'Selling price', aliases: ['selling price', 'sell price', 'rate', 'price'] },
  ],
  expenses: [
    { key: 'date', label: 'Date', aliases: ['date', 'expense date'], required: true },
    { key: 'category', label: 'Category', aliases: ['category', 'head', 'type'], required: true },
    { key: 'amount', label: 'Amount', aliases: ['amount', 'value', 'expense'], required: true },
    { key: 'note', label: 'Note', aliases: ['note', 'notes', 'description', 'remark'] },
    { key: 'recurring', label: 'Recurring', aliases: ['recurring', 'monthly', 'fixed'] },
  ],
};

export interface ParsedSheet {
  fileName: string;
  headers: string[];
  rows: string[][];
}

export async function parseImportFile(file: File): Promise<ParsedSheet> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' });
    const data = parsed.data.filter((row) => row.some((cell) => String(cell).trim() !== ''));
    if (!data.length) throw new Error('The file has no rows.');
    return { fileName: file.name, headers: data[0].map((cell) => String(cell).trim()), rows: data.slice(1).map((row) => row.map((cell) => String(cell ?? '').trim())) };
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no sheets.');
  const raw = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
  const data = raw.map((row) => row.map((cell) => String(cell ?? '').trim())).filter((row) => row.some(Boolean));
  if (!data.length) throw new Error('The sheet has no rows.');
  return { fileName: file.name, headers: data[0], rows: data.slice(1) };
}

export function suggestMapping(kind: ImportKind, headers: string[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const mapping: Record<string, number> = {};
  importFields[kind].forEach((field) => {
    const aliases = [field.key, field.label, ...field.aliases].map(normalize);
    const index = headers.findIndex((header) => aliases.includes(normalize(header)));
    if (index >= 0) mapping[field.key] = index;
  });
  return mapping;
}

export interface ImportIssue {
  row: number;
  message: string;
}

export interface ImportResult {
  records: Array<Record<string, string | number | boolean>>;
  errors: ImportIssue[];
  warnings: string[];
  totalRows: number;
}

const normalizeCategory = (value: string) => {
  const lower = value.toLowerCase().trim();
  const allowed = ['rent', 'electricity', 'wages', 'transport', 'packaging', 'repairs', 'marketing', 'other'];
  const aliases: Record<string, string> = {
    salary: 'wages',
    staff: 'wages',
    labour: 'wages',
    power: 'electricity',
    bijli: 'electricity',
    kiraya: 'rent',
    transport: 'transport',
    packing: 'packaging',
    repair: 'repairs',
    ads: 'marketing',
  };
  if (allowed.includes(lower)) return lower;
  return aliases[lower] ?? 'other';
};

const normalizeDate = (value: string) => {
  if (!value) return '';
  const direct = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
};

const truthy = (value: string) => /^(yes|y|true|1|haan|ha|हाँ)$/i.test(value.trim());

export function buildImport(
  kind: ImportKind,
  rows: string[][],
  mapping: Record<string, number>,
  state: AppState,
): ImportResult {
  const errors: ImportIssue[] = [];
  const warnings: string[] = [];
  const records: ImportResult['records'] = [];
  const fields = importFields[kind];
  const missing = fields.filter((field) => field.required && mapping[field.key] === undefined);
  if (missing.length) {
    warnings.push(`Required columns are not mapped: ${missing.map((field) => field.label).join(', ')}.`);
  }
  const valueAt = (row: string[], key: string) => {
    const index = mapping[key];
    return index === undefined ? '' : String(row[index] ?? '').trim();
  };
  const productByName = new Map(state.products.map((product) => [product.name.toLowerCase(), product]));
  const supplierByName = new Map(state.suppliers.map((supplier) => [supplier.name.toLowerCase(), supplier]));
  const invoiceGroups = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!row.some((cell) => String(cell).trim())) return;
    const pushError = (message: string) => errors.push({ row: rowNumber, message });

    if (kind === 'products') {
      const name = valueAt(row, 'name');
      const category = valueAt(row, 'category');
      const unit = valueAt(row, 'unit') || 'unit';
      const packSize = parseNumber(valueAt(row, 'packSize')) || 1;
      const costPrice = parseNumber(valueAt(row, 'costPrice'));
      const sellingPrice = parseNumber(valueAt(row, 'sellingPrice'));
      if (!name) return pushError('Product name is required.');
      if (!category) return pushError('Category is required.');
      if (costPrice <= 0) return pushError('Cost price must be more than 0.');
      if (sellingPrice <= 0) return pushError('Selling price must be more than 0.');
      const supplierName = valueAt(row, 'supplierName');
      records.push({
        name,
        nameHi: valueAt(row, 'nameHi') || name,
        category,
        unit,
        packSize,
        costPrice,
        sellingPrice,
        supplierName,
        supplierId: supplierByName.get(supplierName.toLowerCase())?.id ?? '',
        stock: parseNumber(valueAt(row, 'stock')),
        reorderMin: parseNumber(valueAt(row, 'reorderMin')) || 0,
      });
      return;
    }

    if (kind === 'purchases') {
      const date = normalizeDate(valueAt(row, 'date'));
      const invoice = valueAt(row, 'invoice');
      const supplier = valueAt(row, 'supplier');
      const productName = valueAt(row, 'product');
      const qty = parseNumber(valueAt(row, 'qty'));
      const costPrice = parseNumber(valueAt(row, 'costPrice'));
      if (!date) return pushError('Date is missing or not recognised.');
      if (!invoice) return pushError('Invoice number is required.');
      if (!supplier) return pushError('Supplier is required.');
      if (!productName) return pushError('Product is required.');
      if (qty <= 0) return pushError('Quantity must be more than 0.');
      if (costPrice <= 0) return pushError('Cost price must be more than 0.');
      const product = productByName.get(productName.toLowerCase());
      if (!product) return pushError(`Product "${productName}" is not in the catalogue. Import products first.`);
      const supplierRecord = supplierByName.get(supplier.toLowerCase());
      if (!supplierRecord) return pushError(`Supplier "${supplier}" is not in the supplier list.`);
      invoiceGroups.add(`${invoice}|${supplierRecord.id}|${date}`);
      records.push({ date, invoice, supplierId: supplierRecord.id, productId: product.id, qty, costPrice });
      return;
    }

    if (kind === 'stock') {
      const productName = valueAt(row, 'product');
      const qty = parseNumber(valueAt(row, 'qty'));
      const product = productByName.get(productName.toLowerCase());
      if (!product) return pushError(`Product "${productName}" is not in the catalogue.`);
      if (valueAt(row, 'qty') === '' || qty < 0) return pushError('Counted quantity must be 0 or more.');
      records.push({ productId: product.id, qty });
      return;
    }

    if (kind === 'sales') {
      const date = normalizeDate(valueAt(row, 'date'));
      const productName = valueAt(row, 'product');
      const qty = parseNumber(valueAt(row, 'qty'));
      const product = productByName.get(productName.toLowerCase());
      if (!date) return pushError('Date is missing or not recognised.');
      if (!product) return pushError(`Product "${productName}" is not in the catalogue.`);
      if (qty <= 0) return pushError('Quantity must be more than 0.');
      const sellingPrice = parseNumber(valueAt(row, 'sellingPrice')) || product?.sellingPrice || 0;
      records.push({ date, productId: product.id, qty, sellingPrice });
      return;
    }

    const date = normalizeDate(valueAt(row, 'date')) || todayISO();
    const amount = parseNumber(valueAt(row, 'amount'));
    if (amount <= 0) return pushError('Amount must be more than 0.');
    records.push({
      date,
      category: normalizeCategory(valueAt(row, 'category')),
      amount,
      note: valueAt(row, 'note'),
      recurring: truthy(valueAt(row, 'recurring')),
    });
  });

  if (!rows.length) errors.push({ row: 1, message: 'No data rows found.' });
  return { records, errors, warnings, totalRows: rows.length };
}

export function issueReportCSV(errors: ImportIssue[]) {
  return [['Row', 'Problem'], ...errors.map((issue) => [String(issue.row), issue.message])];
}
