import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  Download,
  Globe2,
  History,
  Languages,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { businessTypes, weekDays } from '../config/site';
import { fullBackupCSV } from '../lib/exports';
import { formatDateTime } from '../lib/format';
import { PageHeader } from '../components/shared';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Field,
  Input,
  Select,
  buttonClass,
  useToast,
} from '../components/ui';
import type { Business, Lang, ThemeChoice } from '../lib/types';

const defaultPrefs: NonNullable<Business['notificationPrefs']> = {
  stockReminder: true,
  expenseAlerts: true,
  orderAlerts: false,
  udhaarAlerts: true,
  weeklySummary: true,
  whatsappReminders: false,
};

const prefsLabels: Array<{ key: keyof NonNullable<Business['notificationPrefs']>; labelKey: string; noteKey?: string }> = [
  { key: 'stockReminder', labelKey: 'settings.stockReminder' },
  { key: 'expenseAlerts', labelKey: 'settings.expenseAlerts' },
  { key: 'orderAlerts', labelKey: 'settings.orderAlerts' },
  { key: 'udhaarAlerts', labelKey: 'settings.udhaarAlerts' },
  { key: 'weeklySummary', labelKey: 'settings.weeklySummary' },
  { key: 'whatsappReminders', labelKey: 'settings.whatsappReminders' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { state, session, updateBusiness, addOutlet, resetDemo, deleteAccount } = useAppData();
  const required = useRequiredState();
  const { lang, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { push } = useToast();
  const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null);

  const business = state?.business ?? required.business;
  const [profile, setProfile] = useState({ ownerName: business.ownerName, phone: business.phone });
  const [details, setDetails] = useState({
    name: business.name,
    type: business.type,
    city: business.city,
    state: business.state,
    pin: business.pin,
    gstin: business.gstin ?? '',
    dataLevel: business.dataLevel,
    monthlySalesRange: business.monthlySalesRange ?? '100000-300000',
    expectedProfitPct: String(business.expectedProfitPct ?? ''),
  });
  const [ops, setOps] = useState({
    slowDays: String(business.slowDays),
    deadDays: String(business.deadDays),
    safetyPct: String(business.safetyPct),
    marginAlertPct: String(business.marginAlertPct),
    stockCheckDay: String(business.stockCheckDay),
  });
  const [prefs, setPrefs] = useState({ ...defaultPrefs, ...(business.notificationPrefs ?? {}) });
  const [consent, setConsent] = useState(business.consentGiven);
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [language, setLanguageState] = useState<Lang>(lang);

  const save = () => {
    const slow = Math.max(1, Number(ops.slowDays) || 30);
    const dead = Math.max(slow + 1, Number(ops.deadDays) || 60);
    updateBusiness({
      ownerName: profile.ownerName.trim() || 'Owner',
      phone: profile.phone.trim(),
      name: details.name.trim() || business.name,
      type: details.type,
      city: details.city.trim(),
      state: details.state.trim(),
      pin: details.pin.trim(),
      gstin: details.gstin.trim() || undefined,
      dataLevel: details.dataLevel,
      monthlySalesRange: details.monthlySalesRange,
      expectedProfitPct: Number(details.expectedProfitPct) || 0,
      slowDays: slow,
      deadDays: dead,
      safetyPct: Math.max(0, Number(ops.safetyPct) || 0),
      marginAlertPct: Math.max(0, Number(ops.marginAlertPct) || 0),
      stockCheckDay: Number(ops.stockCheckDay),
      notificationPrefs: prefs,
      consentGiven: consent,
      language,
    });
    setLanguage(language);
    push({ title: t('settings.saved') });
  };

  const addOutletNow = () => {
    if (!outletName.trim()) {
      push({ title: t('common.requiredField'), tone: 'error' });
      return;
    }
    addOutlet(outletName.trim(), outletAddress.trim());
    setOutletName('');
    setOutletAddress('');
    push({ title: t('common.added') });
  };

  return (
    <div>
      <PageHeader
        number="18"
        title={t('settings.title')}
        sub={t('settings.sub')}
        actions={
          <Button onClick={save}>
            <Check className="h-4 w-4" /> {t('common.save')}
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Card className="p-4 sm:p-5" id="profile">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.profile')}</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t('auth.ownerName')} required>
                <Input value={profile.ownerName} onChange={(event) => setProfile((current) => ({ ...current, ownerName: event.target.value }))} />
              </Field>
              <Field label={t('common.phone')}>
                <Input inputMode="tel" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value.replace(/[^\d]/g, '').slice(0, 10) }))} />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t('settings.language')}>
                <div className="relative">
                  <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Select className="pl-9" value={language} onChange={(event) => setLanguageState(event.target.value as Lang)}>
                    <option value="hi">हिन्दी</option>
                    <option value="en">English</option>
                    <option value="hinglish">Hinglish</option>
                  </Select>
                </div>
              </Field>
              <Field label={t('common.theme')}>
                <Select value={theme} onChange={(event) => setTheme(event.target.value as ThemeChoice)}>
                  <option value="light">{t('common.light')}</option>
                  <option value="dark">{t('common.dark')}</option>
                  <option value="system">{t('common.system')}</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-4 sm:p-5" id="business">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.business')}</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t('auth.businessName')} required>
                <Input value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label={t('auth.businessType')}>
                <Select value={details.type} onChange={(event) => setDetails((current) => ({ ...current, type: event.target.value }))}>
                  {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </Select>
              </Field>
              <Field label={t('common.city')}>
                <Input value={details.city} onChange={(event) => setDetails((current) => ({ ...current, city: event.target.value }))} />
              </Field>
              <Field label={t('common.state')}>
                <Input value={details.state} onChange={(event) => setDetails((current) => ({ ...current, state: event.target.value }))} />
              </Field>
              <Field label={t('common.pin')}>
                <Input inputMode="numeric" value={details.pin} onChange={(event) => setDetails((current) => ({ ...current, pin: event.target.value.replace(/[^\d]/g, '').slice(0, 6) }))} />
              </Field>
              <Field label={t('common.gstin')} hint={t('common.optional')}>
                <Input value={details.gstin} onChange={(event) => setDetails((current) => ({ ...current, gstin: event.target.value.toUpperCase().slice(0, 15) }))} />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t('common.dataLevel')}>
                <Select value={details.dataLevel} onChange={(event) => setDetails((current) => ({ ...current, dataLevel: event.target.value as Business['dataLevel'] }))}>
                  <option value="orders_only">{t('common.basic')}</option>
                  <option value="orders_upi">{t('common.good')}</option>
                  <option value="full_sales">{t('common.best')}</option>
                </Select>
              </Field>
              <Field label={t('onboarding.salesQ')}>
                <Select value={details.monthlySalesRange} onChange={(event) => setDetails((current) => ({ ...current, monthlySalesRange: event.target.value }))}>
                  <option value="0-100000">{t('onboarding.sales1')}</option>
                  <option value="100000-300000">{t('onboarding.sales2')}</option>
                  <option value="300000-500000">{t('onboarding.sales3')}</option>
                  <option value="500000-99999999">{t('onboarding.sales4')}</option>
                </Select>
              </Field>
              <Field label={t('onboarding.profitQ')} hint={t('common.estimatedNote')}>
                <Input inputMode="decimal" value={details.expectedProfitPct} onChange={(event) => setDetails((current) => ({ ...current, expectedProfitPct: event.target.value.replace(/[^\d.]/g, '') }))} />
              </Field>
            </div>
          </Card>

          <Card className="p-4 sm:p-5" id="thresholds">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.thresholds')}</h2>
            </div>
            <p className="mt-1 text-xs text-muted">{t('dead.valueNote')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t('settings.slowDays')}>
                <Input type="number" min={1} value={ops.slowDays} onChange={(event) => setOps((current) => ({ ...current, slowDays: event.target.value }))} />
              </Field>
              <Field label={t('settings.deadDays')}>
                <Input type="number" min={2} value={ops.deadDays} onChange={(event) => setOps((current) => ({ ...current, deadDays: event.target.value }))} />
              </Field>
              <Field label={t('settings.safety')}>
                <Input type="number" min={0} value={ops.safetyPct} onChange={(event) => setOps((current) => ({ ...current, safetyPct: event.target.value }))} />
              </Field>
              <Field label={t('settings.marginAlert')}>
                <Input type="number" min={0} value={ops.marginAlertPct} onChange={(event) => setOps((current) => ({ ...current, marginAlertPct: event.target.value }))} />
              </Field>
              <Field label={t('settings.stockDay')}>
                <Select value={ops.stockCheckDay} onChange={(event) => setOps((current) => ({ ...current, stockCheckDay: event.target.value }))}>
                  {weekDays.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-4 sm:p-5" id="notifications">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.notifications')}</h2>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {prefsLabels.map((pref) => (
                <div key={pref.key} className="rounded-xl border border-line bg-bg/40 p-3">
                  <Checkbox
                    checked={prefs[pref.key]}
                    onChange={(checked) => setPrefs((current) => ({ ...current, [pref.key]: checked }))}
                    label={<span className="text-xs font-semibold">{t(pref.labelKey)}</span>}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-[var(--warning-soft)] p-3 text-[11px] leading-relaxed text-accent">{t('settings.mockNote')}</p>
          </Card>

          <Card className="p-4 sm:p-5" id="outlets">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.outlets')}</h2>
            </div>
            <div className="mt-4 space-y-2">
              {state?.outlets.map((outlet) => (
                <div key={outlet.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-bg/40 p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-bold">{outlet.name} {outlet.isPrimary && <Badge tone="green">{t('common.shop')}</Badge>}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">{outlet.address || '-'} · {outlet.city} {outlet.pin}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder={t('settings.outlets')} value={outletName} onChange={(event) => setOutletName(event.target.value)} />
              <Input placeholder={t('common.address')} value={outletAddress} onChange={(event) => setOutletAddress(event.target.value)} />
              <Button variant="secondary" onClick={addOutletNow}><Plus className="h-4 w-4" /> {t('common.add')}</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.privacy')}</h2>
            </div>
            <div className="mt-3">
              <Checkbox checked={consent} onChange={setConsent} label={<span className="text-xs leading-relaxed">{t('settings.dataConsent')}</span>} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('settings.demoNote')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/privacy" className={buttonClass('ghost', 'sm')}>{t('footer.privacy')}</a>
              <a href="/terms" className={buttonClass('ghost', 'sm')}>{t('footer.terms')}</a>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-sm font-extrabold">{t('settings.export')}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('settings.exportNote')}</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => { fullBackupCSV(required); push({ title: t('settings.exportReady') }); }}>
              <Download className="h-4 w-4" /> {t('settings.export')}
            </Button>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('settings.activity')}</h2>
            </div>
            <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {state?.auditLog.slice(0, 12).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-line bg-bg/40 p-2.5 text-[11px]">
                  <p className="font-bold">{entry.action}</p>
                  <p className="mt-0.5 line-clamp-2 text-muted">{entry.detail}</p>
                  <p className="mt-1 text-[10px] text-muted">{formatDateTime(entry.at, lang)}</p>
                </div>
              ))}
              {!state?.auditLog.length && <p className="text-xs text-muted">{t('common.noData')}</p>}
            </div>
            <a href="/app/reports" className={buttonClass('ghost', 'sm', 'mt-3 w-full justify-between')}>{t('reports.title')} <Check className="h-3.5 w-3.5" /></a>
          </Card>

          <Card className="border-accent/30 p-4 sm:p-5">
            <h2 className="text-sm font-extrabold">{t('settings.resetDemo')}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('settings.resetWarn')}</p>
            {session?.type === 'demo' ? (
              <Button variant="secondary" className="mt-3 w-full" onClick={() => setConfirm('reset')}>
                <RotateCcw className="h-4 w-4" /> {t('common.resetDemo')}
              </Button>
            ) : (
              <p className="mt-3 rounded-lg bg-bg p-2.5 text-[11px] text-muted">{t('common.demo')}</p>
            )}
          </Card>

          <Card className="border-danger/30 p-4 sm:p-5">
            <h2 className="text-sm font-extrabold text-danger">{t('settings.deleteAccount')}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('settings.deleteWarn')}</p>
            <Button variant="danger" className="mt-3 w-full" onClick={() => setConfirm('delete')}>
              <Trash2 className="h-4 w-4" /> {t('settings.deleteAccount')}
            </Button>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? t('settings.deleteAccount') : t('settings.resetDemo')}
        description={confirm === 'delete' ? t('settings.deleteWarn') : t('settings.resetWarn')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>{t('common.cancel')}</Button>
            <Button
              variant={confirm === 'delete' ? 'danger' : 'primary'}
              onClick={() => {
                if (confirm === 'delete') {
                  deleteAccount();
                  navigate('/');
                } else {
                  resetDemo();
                  push({ title: t('settings.saved') });
                }
                setConfirm(null);
              }}
            >
              {confirm === 'delete' ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              {t('common.yes')}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">{confirm === 'delete' ? t('settings.deleteWarn') : t('settings.resetWarn')}</p>
      </Dialog>
    </div>
  );
}
