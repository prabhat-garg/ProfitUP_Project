import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import {
  buildImport,
  importFields,
  issueReportCSV,
  parseImportFile,
  suggestMapping,
  type ImportKind,
  type ImportResult,
  type ParsedSheet,
} from '../lib/importer';
import { downloadCSV, downloadTemplate } from '../lib/exports';
import { formatINR } from '../lib/format';
import { todayISO } from '../lib/utils';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, Field, Select, buttonClass, useToast } from '../components/ui';
import type { Expense, SaleRecord } from '../lib/types';

const KINDS: ImportKind[] = ['products', 'purchases', 'stock', 'sales', 'expenses'];

const kindLabelKey: Record<ImportKind, string> = {
  products: 'imports.products',
  purchases: 'imports.purchases',
  stock: 'imports.stock',
  sales: 'imports.sales',
  expenses: 'imports.expenses',
};

const kindHintKey: Record<ImportKind, string> = {
  products: 'imports.productsHint',
  purchases: 'imports.purchasesHint',
  stock: 'imports.stockHint',
  sales: 'imports.salesHint',
  expenses: 'imports.expensesHint',
};

const kindTarget: Record<ImportKind, string> = {
  products: '/app/products',
  purchases: '/app/purchases',
  stock: '/app/stock-count',
  sales: '/app/sales',
  expenses: '/app/expenses',
};

function validKind(value: string | null): ImportKind {
  return KINDS.includes(value as ImportKind) ? (value as ImportKind) : 'products';
}

export default function ImportsPage() {
  const { t } = useTranslation();
  const state = useRequiredState();
  const { addProduct, addSupplier, addPurchase, addStockCount, addSales, addExpense } = useAppData();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<ImportKind>(() => validKind(params.get('kind')));
  const [step, setStep] = useState(1);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [committed, setCommitted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fields = importFields[kind];
  const validRows = result?.records.length ?? 0;
  const invalidRows = result?.errors.length ?? 0;

  const changeKind = (next: ImportKind) => {
    setKind(next);
    setStep(1);
    setSheet(null);
    setResult(null);
    setMapping({});
    setError('');
    setCommitted(0);
    setSkipped(0);
    setParams(next === 'products' ? {} : { kind: next }, { replace: true });
  };

  const reset = () => {
    setStep(1);
    setSheet(null);
    setResult(null);
    setMapping({});
    setError('');
    setCommitted(0);
    setSkipped(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const parsed = await parseImportFile(file);
      setSheet(parsed);
      setMapping(suggestMapping(kind, parsed.headers));
      setResult(null);
      setStep(2);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t('common.somethingWrong'));
    }
  };

  const preview = () => {
    if (!sheet) return;
    const built = buildImport(kind, sheet.rows, mapping, state);
    setResult(built);
    setStep(3);
  };

  const commit = () => {
    if (!result) return;
    let imported = 0;
    let missed = 0;

    if (kind === 'products') {
      const known = new Set(state.products.map((product) => product.name.toLowerCase()));
      const supplierCache = new Map(state.suppliers.map((supplier) => [supplier.name.toLowerCase(), supplier.id]));
      result.records.forEach((record) => {
        const name = String(record.name ?? '').trim();
        if (!name || known.has(name.toLowerCase())) {
          missed += 1;
          return;
        }
        let supplierId = String(record.supplierId ?? '');
        const supplierName = String(record.supplierName ?? '').trim();
        if (!supplierId && supplierName) {
          const cached = supplierCache.get(supplierName.toLowerCase());
          if (cached) supplierId = cached;
          else {
            const created = addSupplier({
              name: supplierName,
              contact: supplierName,
              phone: '',
              leadTimeDays: 2,
              minOrder: 0,
              category: String(record.category ?? 'Other'),
            });
            supplierId = created.id;
            supplierCache.set(supplierName.toLowerCase(), created.id);
          }
        }
        addProduct({
          name,
          nameHi: String(record.nameHi || name),
          category: String(record.category ?? 'Other'),
          unit: String(record.unit ?? 'unit'),
          packSize: Number(record.packSize) || 1,
          costPrice: Number(record.costPrice) || 0,
          sellingPrice: Number(record.sellingPrice) || 0,
          supplierId,
          reorderMin: Number(record.reorderMin) || 0,
          currentStock: Number(record.stock) || 0,
          isActive: true,
        });
        known.add(name.toLowerCase());
        imported += 1;
      });
    }

    if (kind === 'purchases') {
      const groups = new Map<string, { date: string; supplierId: string; invoiceNo: string; items: Array<{ productId: string; qty: number; costPrice: number }> }>();
      result.records.forEach((record) => {
        const date = String(record.date ?? todayISO());
        const supplierId = String(record.supplierId ?? '');
        const invoiceNo = String(record.invoice ?? '');
        const key = `${invoiceNo}|${supplierId}|${date}`;
        const group = groups.get(key) ?? { date, supplierId, invoiceNo, items: [] };
        group.items.push({
          productId: String(record.productId ?? ''),
          qty: Number(record.qty) || 0,
          costPrice: Number(record.costPrice) || 0,
        });
        groups.set(key, group);
      });
      groups.forEach((group) => {
        if (!group.items.length) return;
        addPurchase({ ...group, received: true, note: 'Imported from file' });
        imported += 1;
      });
    }

    if (kind === 'stock') {
      const items = result.records.map((record) => ({
        productId: String(record.productId ?? ''),
        qty: Number(record.qty) || 0,
      }));
      if (items.length) {
        addStockCount({ date: todayISO(), countedBy: state.business.ownerName || 'Owner', items });
        imported = items.length;
      }
    }

    if (kind === 'sales') {
      const records: Array<Omit<SaleRecord, 'id'>> = result.records.map((record) => ({
        date: String(record.date ?? todayISO()),
        productId: String(record.productId ?? ''),
        qty: Number(record.qty) || 0,
        sellingPrice: Number(record.sellingPrice) || 0,
        source: 'billing_export',
      }));
      imported = records.length ? addSales(records) : 0;
    }

    if (kind === 'expenses') {
      result.records.forEach((record) => {
        addExpense({
          date: String(record.date ?? todayISO()),
          category: String(record.category ?? 'other') as Expense['category'],
          amount: Number(record.amount) || 0,
          note: String(record.note ?? ''),
          recurring: Boolean(record.recurring),
        });
        imported += 1;
      });
    }

    setCommitted(imported);
    setSkipped(missed);
    setStep(4);
    push({ title: t('imports.imported', { count: imported }) });
  };

  const stepLabel = [t('imports.stepUpload'), t('imports.stepMap'), t('imports.stepPreview'), t('imports.stepDone')];

  return (
    <div>
      <PageHeader
        number="17"
        title={t('imports.title')}
        sub={t('imports.sub')}
        actions={
          <Button variant="secondary" onClick={() => downloadTemplate(kind)}>
            <Download className="h-4 w-4" /> {t('imports.downloadTemplate')}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-4 gap-2">
        {stepLabel.map((label, index) => {
          const value = index + 1;
          return (
            <button
              key={label}
              type="button"
              disabled={value > step}
              onClick={() => {
                if (value === 1) reset();
                if (value < step && sheet) setStep(value);
              }}
              className={`rounded-xl border p-2.5 text-left text-[11px] font-bold transition ${
                value === step ? 'border-primary bg-primary-soft text-primary' : value < step ? 'border-primary/30 text-primary' : 'border-line text-muted'
              }`}
            >
              <span className="num block text-[9px]">0{value}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          {step === 1 && (
            <Card className="p-5 sm:p-6">
              <p className="kicker">{t('imports.choose')}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {KINDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => changeKind(option)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      kind === option ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/50'
                    }`}
                  >
                    <span className={`mt-0.5 rounded-lg p-1.5 ${kind === option ? 'bg-primary text-white' : 'bg-bg text-muted'}`}>
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{t(kindLabelKey[option])}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{t(kindHintKey[option])}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-card border border-dashed border-line bg-bg/50 p-6 text-center">
                <div className="mx-auto mb-3 inline-flex rounded-2xl bg-primary-soft p-3 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <h2 className="text-base font-extrabold">{t('imports.upload')}</h2>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">{t('imports.uploadHint')}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv"
                  className="sr-only"
                  onChange={(event) => void onFile(event.target.files?.[0])}
                />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => fileRef.current?.click()} disabled={!state.products.length && kind !== 'products'}>
                    <Upload className="h-4 w-4" /> {t('imports.browse')}
                  </Button>
                  <Button variant="secondary" onClick={() => downloadTemplate(kind)}>
                    <Download className="h-4 w-4" /> {t('imports.downloadTemplate')}
                  </Button>
                </div>
                {!state.products.length && kind !== 'products' && (
                  <p className="mt-3 text-[11px] font-semibold text-accent">{t('imports.productsHint')}</p>
                )}
                {error && (
                  <p className="mt-3 rounded-lg bg-[var(--danger-soft)] p-2 text-xs font-semibold text-danger">{error}</p>
                )}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted">{t('imports.dateHint')}</p>
            </Card>
          )}

          {step === 2 && sheet && (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                <div>
                  <p className="kicker">{t('imports.mapping')}</p>
                  <p className="mt-1 text-xs font-semibold">{t('imports.fileReady', { name: sheet.fileName, rows: sheet.rows.length })}</p>
                </div>
                <Badge tone={kind === 'products' ? 'green' : 'blue'}>{t(kindLabelKey[kind])}</Badge>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted">{t('imports.mappingHint')}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <Field key={field.key} label={`${field.label}${field.required ? ` · ${t('imports.required')}` : ` · ${t('imports.optional')}`}`}>
                      <div className="relative">
                        <Select
                          value={mapping[field.key] ?? -1}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setMapping((current) => {
                              const next = { ...current };
                              if (value < 0) delete next[field.key];
                              else next[field.key] = value;
                              return next;
                            });
                          }}
                          className="pr-8"
                        >
                          <option value={-1}>{t('imports.ignore')}</option>
                          {sheet.headers.map((header, index) => (
                            <option key={`${header}-${index}`} value={index}>
                              {header || `${t('imports.row')} ${index + 1}`}
                            </option>
                          ))}
                        </Select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                      </div>
                    </Field>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap justify-between gap-2">
                  <Button variant="ghost" onClick={reset}><X className="h-4 w-4" /> {t('imports.reset')}</Button>
                  <Button onClick={preview}>{t('imports.preview')} <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="border-t border-line bg-bg/50 p-4">
                <p className="kicker mb-2">{t('imports.preview')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead>
                      <tr className="table-head">
                        {sheet.headers.map((header, index) => (
                          <th key={`${header}-${index}`} className="whitespace-nowrap px-2 py-2">{header || '-'}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {sheet.rows.slice(0, 4).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {sheet.headers.map((_, cellIndex) => (
                            <td key={cellIndex} className="max-w-[180px] truncate whitespace-nowrap px-2 py-1.5 text-muted">{row[cellIndex] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && result && (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
                <div>
                  <p className="kicker">{t('imports.preview')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="green">{t('imports.valid', { count: validRows })}</Badge>
                    {invalidRows > 0 && <Badge tone="red">{t('imports.invalid', { count: invalidRows })}</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(2)}>{t('imports.back')}</Button>
                  <Button onClick={commit} disabled={!validRows}><Check className="h-4 w-4" /> {t('imports.importValid')}</Button>
                </div>
              </div>
              {result.warnings.length > 0 && (
                <div className="border-b border-line bg-[var(--warning-soft)] p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-accent"><AlertTriangle className="h-3.5 w-3.5" /> {t('imports.warningsTitle')}</p>
                  {result.warnings.map((warning) => <p key={warning} className="mt-1 text-[11px] text-muted">{warning}</p>)}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-xs">
                  <thead className="border-b border-line bg-bg/60">
                    <tr className="table-head">
                      <th className="px-3 py-2.5">{t('imports.row')}</th>
                      {fields.map((field) => (
                        <th key={field.key} className="whitespace-nowrap px-3 py-2.5">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {result.records.slice(0, 20).map((record, index) => (
                      <tr key={index}>
                        <td className="num px-3 py-2 text-muted">{index + 2}</td>
                        {fields.map((field) => (
                          <td key={field.key} className="max-w-[200px] truncate px-3 py-2">{String(record[field.key] ?? '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line p-3 text-[11px] text-muted">{t('imports.sampleRows')}</p>
              {invalidRows > 0 && (
                <div className="border-t border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-bold text-danger"><AlertTriangle className="h-4 w-4" /> {t('imports.errorsTitle')}</p>
                    <Button variant="secondary" size="sm" onClick={() => downloadCSV('profitup-import-errors.csv', issueReportCSV(result.errors))}>
                      <Download className="h-3.5 w-3.5" /> {t('imports.downloadErrors')}
                    </Button>
                  </div>
                  <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-line">
                    {result.errors.map((issue) => (
                      <div key={`${issue.row}-${issue.message}`} className="flex items-start gap-3 border-b border-line px-3 py-2 text-xs last:border-0">
                        <span className="num shrink-0 font-bold text-danger">{t('imports.row')} {issue.row}</span>
                        <span className="text-muted">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {step === 4 && (
            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-full bg-primary-soft p-4 text-primary"><Check className="h-8 w-8" /></div>
              <h2 className="text-2xl font-black tracking-tight">{t('imports.imported', { count: committed })}</h2>
              {skipped > 0 && <p className="mt-2 text-xs text-muted">{t('imports.productsHint')} ({skipped})</p>}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={reset}><RotateCcw className="h-4 w-4" /> {t('imports.another')}</Button>
                <Link to={kindTarget[kind]} className={buttonClass('primary')}>
                  {t('common.openInApp')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-4">
            <p className="kicker">{t(kindLabelKey[kind])}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t(kindHintKey[kind])}</p>
            <p className="mt-3 rounded-xl bg-bg p-3 text-[11px] leading-relaxed text-muted">{t('imports.dateHint')}</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => downloadTemplate(kind)}>
              <Download className="h-4 w-4" /> {t('imports.downloadTemplate')}
            </Button>
          </Card>

          <Card className="p-4">
            <p className="kicker">{t('help.importGuide')}</p>
            <ol className="mt-3 space-y-2 text-xs text-muted">
              {[t('imports.stepUpload'), t('imports.stepMap'), t('imports.stepPreview'), t('imports.stepDone')].map((label, index) => (
                <li key={label} className="flex items-start gap-2">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">{index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('help.importGuideBody')}</p>
          </Card>

          <Card className="p-4">
            <p className="kicker">{t('common.dataLevel')}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted">{t('common.shop')}</span>
              <span className="font-bold">{state.business.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted">{t('common.productCount', { count: state.products.length })}</span>
              <span className="num font-bold">{formatINR(state.products.reduce((total, product) => total + product.currentStock * product.costPrice, 0))}</span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('common.noBackend')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
