import { jsPDF } from 'jspdf';
import type { AppState, Lang, OrderList } from './types';
import type { OrderPlan } from './engine/orders';
import { formatDate, formatINR, formatNumber } from './format';
import { downloadFile } from './utils';

export function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCSV(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function downloadCSV(filename: string, rows: Array<Array<unknown>>) {
  downloadFile(filename, `\uFEFF${toCSV(rows)}`, 'text/csv;charset=utf-8');
}

const labels = {
  hi: {
    order: 'ऑर्डर लिस्ट',
    shop: 'दुकान',
    date: 'तारीख',
    supplier: 'सप्लायर',
    product: 'प्रोडक्ट',
    qty: 'मात्रा',
    rate: 'रेट',
    total: 'कुल',
    estimated: 'अनुमानित लागत',
    note: 'यह अनुमान है, ऑर्डर देने से पहले रेट और उपलब्धता जांचें.',
    report: 'रिपोर्ट',
  },
  en: {
    order: 'Order list',
    shop: 'Shop',
    date: 'Date',
    supplier: 'Supplier',
    product: 'Product',
    qty: 'Qty',
    rate: 'Rate',
    total: 'Total',
    estimated: 'Estimated cost',
    note: 'This is an estimate. Confirm rates and availability before ordering.',
    report: 'Report',
  },
  hinglish: {
    order: 'Order list',
    shop: 'Dukaan',
    date: 'Date',
    supplier: 'Supplier',
    product: 'Product',
    qty: 'Qty',
    rate: 'Rate',
    total: 'Total',
    estimated: 'Andaaza cost',
    note: 'Yeh estimate hai. Order se pehle rate aur availability confirm karo.',
    report: 'Report',
  },
} as const;

function pdfHeader(doc: jsPDF, state: AppState, title: string, lang: Lang) {
  const copy = labels[lang];
  doc.setFillColor(11, 107, 61);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ProfitUp', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 19);
  doc.text(`${copy.shop}: ${state.business.name} · ${state.business.city}`, 196, 12, { align: 'right' });
  doc.text(`${copy.date}: ${formatDate(new Date())}`, 196, 19, { align: 'right' });
  doc.setTextColor(17, 24, 39);
}

function ensureSpace(doc: jsPDF, y: number, needed = 12) {
  if (y + needed < 282) return y;
  doc.addPage();
  return 20;
}

export function orderPlanPDF(state: AppState, plan: OrderPlan, lang: Lang = 'en', order?: OrderList) {
  const copy = labels[lang];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(doc, state, `${copy.order}${order ? ` · ${order.status}` : ''}`, lang);
  let y = 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${copy.estimated}: ${formatINR(plan.totalCost)} · ${plan.options.coverDays} days · ${plan.options.safetyPct}% safety`, 14, y);
  y += 10;

  const grouped = new Map<string, typeof plan.items>();
  plan.items.forEach((item) => {
    const list = grouped.get(item.supplierName) ?? [];
    list.push(item);
    grouped.set(item.supplierName, list);
  });

  grouped.forEach((items, supplier) => {
    y = ensureSpace(doc, y, 18);
    doc.setFillColor(232, 247, 239);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${copy.supplier}: ${supplier}`, 16, y);
    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    items.forEach((item) => {
      y = ensureSpace(doc, y);
      doc.text(item.name.slice(0, 62), 16, y);
      doc.text(`${item.finalQty} × ${formatINR(item.rate)}`, 142, y, { align: 'right' });
      doc.text(formatINR(item.finalQty * item.rate), 196, y, { align: 'right' });
      y += 6;
    });
    y += 3;
  });

  y = ensureSpace(doc, y, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${copy.total}: ${formatINR(plan.totalCost)}`, 196, y, { align: 'right' });
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(92, 102, 118);
  const note = doc.splitTextToSize(copy.note, 182);
  doc.text(note, 14, y);
  doc.text('ProfitUp · demo estimate, not an audited document.', 196, 290, { align: 'right' });
  doc.save(`profitup-order-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export interface ReportSection {
  heading: string;
  rows: Array<[string, string]>;
  body?: string;
}

export function reportPDF(state: AppState, title: string, sections: ReportSection[], lang: Lang = 'en') {
  const copy = labels[lang];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(doc, state, `${copy.report} · ${title}`, lang);
  let y = 38;
  sections.forEach((section) => {
    y = ensureSpace(doc, y, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(section.heading, 14, y);
    y += 3;
    doc.setDrawColor(229, 231, 235);
    doc.line(14, y, 196, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    section.rows.forEach(([label, value]) => {
      y = ensureSpace(doc, y);
      doc.text(label.slice(0, 80), 14, y);
      doc.text(value, 196, y, { align: 'right' });
      y += 6;
    });
    if (section.body) {
      y += 2;
      const lines = doc.splitTextToSize(section.body, 182);
      y = ensureSpace(doc, y, lines.length * 4 + 4);
      doc.setTextColor(92, 102, 118);
      doc.text(lines, 14, y);
      doc.setTextColor(17, 24, 39);
      y += lines.length * 4 + 2;
    }
    y += 6;
  });
  doc.setFontSize(8);
  doc.setTextColor(92, 102, 118);
  doc.text('Estimates are planning aids, not audited financial statements. Demo data is sample data.', 14, 290);
  doc.save(`profitup-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function salesCSV(state: AppState) {
  const productMap = new Map(state.products.map((product) => [product.id, product]));
  const rows: Array<Array<unknown>> = [['Date', 'Product', 'Qty', 'Selling price', 'Revenue', 'Source']];
  state.sales.forEach((sale) => {
    const product = productMap.get(sale.productId);
    rows.push([sale.date, product?.name ?? sale.productId, sale.qty, sale.sellingPrice, sale.qty * sale.sellingPrice, sale.source]);
  });
  downloadCSV('profitup-sales.csv', rows);
}

export function productsCSV(state: AppState) {
  const supplierMap = new Map(state.suppliers.map((supplier) => [supplier.id, supplier.name]));
  const rows: Array<Array<unknown>> = [
    ['Name', 'Hindi name', 'Category', 'Unit', 'Pack size', 'Cost price', 'Selling price', 'Supplier', 'Stock', 'Reorder min', 'Active'],
  ];
  state.products.forEach((product) => {
    rows.push([
      product.name,
      product.nameHi,
      product.category,
      product.unit,
      product.packSize,
      product.costPrice,
      product.sellingPrice,
      supplierMap.get(product.supplierId) ?? '',
      product.currentStock,
      product.reorderMin,
      product.isActive ? 'Yes' : 'No',
    ]);
  });
  downloadCSV('profitup-products.csv', rows);
}

export function expensesCSV(state: AppState) {
  const rows: Array<Array<unknown>> = [['Date', 'Category', 'Amount', 'Note', 'Recurring']];
  state.expenses.forEach((expense) => {
    rows.push([expense.date, expense.category, expense.amount, expense.note, expense.recurring ? 'Yes' : 'No']);
  });
  downloadCSV('profitup-expenses.csv', rows);
}

export function udhaarCSV(state: AppState) {
  const rows: Array<Array<unknown>> = [['Customer', 'Phone', 'Amount due', 'Due date', 'Note']];
  state.customers.forEach((customer) => {
    rows.push([customer.name, customer.phone, customer.amountDue, customer.dueDate, customer.note ?? '']);
  });
  downloadCSV('profitup-udhaar.csv', rows);
}

export function stockCSV(state: AppState) {
  const rows: Array<Array<unknown>> = [['Product', 'Category', 'Current stock', 'Cost price', 'Stock value']];
  state.products.forEach((product) => {
    rows.push([product.name, product.category, product.currentStock, product.costPrice, product.currentStock * product.costPrice]);
  });
  downloadCSV('profitup-stock.csv', rows);
}

export function fullBackupCSV(state: AppState) {
  const sections: Array<{ heading: string; rows: Array<Array<unknown>> }> = [
    { heading: 'BUSINESS', rows: [['Name', 'Type', 'City', 'State', 'PIN', 'Phone', 'Owner', 'Data level'], [state.business.name, state.business.type, state.business.city, state.business.state, state.business.pin, state.business.phone, state.business.ownerName, state.business.dataLevel]] },
    { heading: 'PRODUCTS', rows: [['Name', 'Category', 'Unit', 'Pack', 'Cost', 'Selling', 'Stock', 'Active'], ...state.products.map((product) => [product.name, product.category, product.unit, product.packSize, product.costPrice, product.sellingPrice, product.currentStock, product.isActive ? 'Yes' : 'No'])] },
    { heading: 'PURCHASES', rows: [['Date', 'Invoice', 'Supplier', 'Received', 'Items', 'Total'], ...state.purchases.map((purchase) => [purchase.date, purchase.invoiceNo, state.suppliers.find((supplier) => supplier.id === purchase.supplierId)?.name ?? '', purchase.received ? 'Yes' : 'No', purchase.items.length, purchase.items.reduce((total, item) => total + item.qty * item.costPrice, 0)])] },
    { heading: 'SALES', rows: [['Date', 'Product', 'Qty', 'Selling price', 'Source'], ...state.sales.map((sale) => [sale.date, state.products.find((product) => product.id === sale.productId)?.name ?? sale.productId, sale.qty, sale.sellingPrice, sale.source])] },
    { heading: 'EXPENSES', rows: [['Date', 'Category', 'Amount', 'Note', 'Recurring'], ...state.expenses.map((expense) => [expense.date, expense.category, expense.amount, expense.note, expense.recurring ? 'Yes' : 'No'])] },
    { heading: 'UDHAAR', rows: [['Customer', 'Phone', 'Amount due', 'Due date'], ...state.customers.map((customer) => [customer.name, customer.phone, customer.amountDue, customer.dueDate])] },
    { heading: 'STOCK COUNTS', rows: [['Date', 'Counted by', 'Products', 'Total units'], ...state.stockCounts.map((count) => [count.date, count.countedBy, count.items.length, count.items.reduce((total, item) => total + item.qty, 0)])] },
    { heading: 'ORDERS', rows: [['Created', 'Status', 'Cover days', 'Items', 'Total cost'], ...state.orderLists.map((order) => [order.createdAt, order.status, order.coverDays, order.items.length, formatNumber(order.totalCost)])] },
    { heading: 'ACTIVITY', rows: [['At', 'Actor', 'Action', 'Detail'], ...state.auditLog.map((entry) => [entry.at, entry.actor, entry.action, entry.detail])] },
  ];
  const content = [
    `ProfitUp backup · ${state.business.name}`,
    `Generated ${new Date().toISOString()}`,
    'This is a browser-generated backup. It is not an audited financial statement.',
    '',
    ...sections.flatMap(({ heading, rows }) => [`## ${heading}`, toCSV(rows), '']),
  ].join('\r\n');
  downloadFile(`profitup-backup-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${content}`, 'text/csv;charset=utf-8');
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(phone: string, text: string) {
  const url = whatsappLink(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const templates: Record<string, Array<Array<string>>> = {
  products: [
    ['Name', 'Hindi name', 'Category', 'Unit', 'Pack size', 'Cost price', 'Selling price', 'Supplier', 'Stock', 'Reorder min'],
    ['Tata Salt 1kg', 'टाटा नमक 1 किग्रा', 'Grocery', 'kg', '1', '18', '24', 'Sharma Distributors', '42', '12'],
  ],
  purchases: [
    ['Date', 'Invoice', 'Supplier', 'Product', 'Qty', 'Cost price'],
    ['2026-10-01', 'INV-101', 'Sharma Distributors', 'Tata Salt 1kg', '24', '18'],
  ],
  stock: [
    ['Product', 'Counted qty'],
    ['Tata Salt 1kg', '42'],
  ],
  sales: [
    ['Date', 'Product', 'Qty', 'Selling price'],
    ['2026-10-01', 'Tata Salt 1kg', '3', '24'],
  ],
  expenses: [
    ['Date', 'Category', 'Amount', 'Note', 'Recurring'],
    ['2026-10-01', 'electricity', '9800', 'MPPKVVCL bill', 'No'],
  ],
};

export function downloadTemplate(kind: keyof typeof templates) {
  downloadCSV(`profitup-${kind}-template.csv`, templates[kind]);
}

export function dataHealthCSV(health: { score: number; issues: Array<{ title: string; detail: string }> }) {
  downloadCSV('profitup-data-health.csv', [
    ['Data health score', String(health.score)],
    ...health.issues.map((issue) => [issue.title, issue.detail]),
  ]);
}
