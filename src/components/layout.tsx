import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  HelpCircle,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageSearch,
  ReceiptIndianRupee,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppData } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { Logo, LanguageSwitcher, ThemeToggle, OfflineBanner } from './shared';
import { Badge, buttonClass } from './ui';

const navItems = [
  { to: '/app', labelKey: 'nav.dashboard', icon: Home, end: true, number: '01' },
  { to: '/app/reorder', labelKey: 'nav.reorder', icon: PackageSearch, number: '02' },
  { to: '/app/order', labelKey: 'nav.smartOrder', icon: ShoppingCart, number: '03' },
  { to: '/app/stock-count', labelKey: 'nav.stockCount', icon: ClipboardList, number: '04' },
  { to: '/app/dead-stock', labelKey: 'nav.deadStock', icon: Boxes, number: '05' },
  { to: '/app/money-stuck', labelKey: 'nav.moneyStuck', icon: CircleDollarSign, number: '06' },
  { to: '/app/profit', labelKey: 'nav.profit', icon: BarChart3, number: '07' },
  { to: '/app/expenses', labelKey: 'nav.expenses', icon: ReceiptIndianRupee, number: '08' },
  { to: '/app/products', labelKey: 'nav.products', icon: LayoutGrid, number: '09' },
  { to: '/app/purchases', labelKey: 'nav.purchases', icon: Truck, number: '10' },
  { to: '/app/suppliers', labelKey: 'nav.suppliers', icon: Store, number: '11' },
  { to: '/app/udhaar', labelKey: 'nav.udhaar', icon: Users, number: '12' },
  { to: '/app/actions', labelKey: 'nav.actions', icon: Sparkles, number: '13' },
  { to: '/app/ask', labelKey: 'nav.ask', icon: Sparkles, number: '14' },
  { to: '/app/reports', labelKey: 'nav.reports', icon: ClipboardList, number: '15' },
];

const bottomNav = [
  { to: '/app', labelKey: 'nav.dashboard', icon: Home, end: true },
  { to: '/app/order', labelKey: 'nav.order', icon: ShoppingCart },
  { to: '/app/stock-count', labelKey: 'nav.stock', icon: ClipboardList },
  { to: '/app/profit', labelKey: 'nav.profit', icon: BarChart3 },
  { to: '/app/more', labelKey: 'nav.more', icon: MoreHorizontal },
];

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function PublicHeader() {
  const { t } = useTranslation();
  const { session } = useAppData();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = [
    ['01', t('nav.home'), '/#top'],
    ['02', t('nav.features'), '/#features'],
    ['03', t('nav.how'), '/#how'],
    ['04', t('nav.pricing'), '/#pricing'],
    ['05', t('nav.faq'), '/#faq'],
    ['06', t('nav.contact'), '/#contact'],
  ];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label={t('nav.home')}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
            {links.map(([number, label, href]) => (
              <a
                key={href}
                href={href}
                className="group flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted transition hover:text-ink"
              >
                <span className="text-[9px] text-muted/60 group-hover:text-primary">{number}</span>
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
            {session ? (
              <Link to="/app" className={buttonClass('primary', 'sm')}>
                {t('nav.dashboard')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonClass('ghost', 'sm')}>
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className={buttonClass('primary', 'sm')}>
                  {t('nav.getStarted')}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle compact />
            <button
              type="button"
              className="rounded-xl border border-line bg-card p-2.5"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('common.close') : 'Menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[70px] z-40 flex flex-col bg-bg lg:hidden">
          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Mobile primary">
            {links.map(([number, label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-5"
              >
                <span className="text-2xl font-extrabold uppercase tracking-tight">{label}</span>
                <span className="num text-xs text-muted">{number}</span>
              </a>
            ))}
          </nav>
          <div className="safe-bottom space-y-3 border-t border-line p-4">
            <div className="flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {session ? (
              <Link to="/app" onClick={() => setOpen(false)} className={cn(buttonClass('primary', 'lg'), 'w-full')}>
                {t('nav.dashboard')}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className={buttonClass('secondary', 'lg')}>
                  {t('nav.login')}
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} className={buttonClass('primary', 'lg')}>
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer id="contact" className="border-t border-line bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {t('landing.support')}
          </p>
          <div className="mt-5 flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <FooterColumn
          title={t('footer.product')}
          links={[
            [t('nav.features'), '/#features'],
            [t('nav.how'), '/#how'],
            [t('nav.pricing'), '/#pricing'],
            [t('nav.tryDemo'), '/demo'],
          ]}
        />
        <FooterColumn
          title={t('footer.help')}
          links={[
            [t('nav.faq'), '/#faq'],
            [t('help.templates'), '/help#templates'],
            [t('footer.contact'), 'mailto:hello@profitup.example'],
          ]}
        />
        <div>
          <h3 className="kicker mb-4">{t('footer.legal')}</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link className="hover:text-primary" to="/privacy">{t('footer.privacy')}</Link></li>
            <li><Link className="hover:text-primary" to="/terms">{t('footer.terms')}</Link></li>
            <li><Link className="hover:text-primary" to="/login">{t('nav.login')}</Link></li>
            <li><Link className="hover:text-primary" to="/signup">{t('nav.getStarted')}</Link></li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-muted">{t('footer.contactPlaceholder')}</p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="text-xs font-semibold text-primary">{t('footer.made')}</p>
        </div>
        <p className="mx-auto mt-3 max-w-7xl text-[10px] leading-relaxed text-muted">{t('footer.disclaimer')}</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="kicker mb-4">{title}</h3>
      <ul className="space-y-2.5 text-sm text-muted">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link className="hover:text-primary" to={href}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { state, session, logout } = useAppData();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const online = useOnlineStatus();
  if (!state || !session) return null;
  const unread = state.notifications.filter((notification) => !notification.read).length;
  const outlet = state.outlets[0];

  return (
    <div className="min-h-screen bg-bg">
      <OfflineBanner offline={!online} />
      <div className="flex min-h-[calc(100vh-0px)]">
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-card transition-[width] duration-200 lg:flex',
            collapsed ? 'w-[76px]' : 'w-[244px]',
          )}
          aria-label="Sidebar"
        >
          <div className={cn('flex h-[70px] items-center border-b border-line', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
            <Link to="/app" aria-label="ProfitUp home"><Logo compact={collapsed} /></Link>
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted hover:bg-bg"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? t(item.labelKey) : undefined}
                className={({ isActive }) =>
                  cn(
                    'mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-bg hover:text-ink',
                    isActive && 'bg-primary-soft text-primary-dark dark:text-primary',
                    collapsed && 'justify-center px-2',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>}
                {!collapsed && <span className="text-[9px] text-muted/50">{item.number}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line p-2">
            <NavLink to="/app/settings" className={cn('mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-bg', collapsed && 'justify-center px-2')}>
              <Settings className="h-4 w-4" />
              {!collapsed && t('nav.settings')}
            </NavLink>
            <NavLink to="/app/help" className={cn('mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-bg', collapsed && 'justify-center px-2')}>
              <HelpCircle className="h-4 w-4" />
              {!collapsed && t('nav.help')}
            </NavLink>
            {state.business.dataLevel === 'orders_only' && !collapsed && (
              <div className="mt-2 rounded-xl border border-info/20 bg-[var(--info-soft)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-info">{t('common.confidence')}: {t('common.basic')}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('landing.basicBody')}</p>
              </div>
            )}
            <div className={cn('mt-2 flex items-center gap-2 rounded-xl p-2', collapsed && 'justify-center')}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs font-bold text-white">
                {(state.business.ownerName || 'O').slice(0, 1)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{state.business.ownerName}</p>
                  <p className="truncate text-[10px] text-muted">{session.type === 'demo' ? t('common.demo') : state.business.phone}</p>
                </div>
              )}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-danger"
                  aria-label={t('auth.logout')}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between gap-3 border-b border-line bg-bg/90 px-3 backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/app" className="lg:hidden"><Logo compact /></Link>
              <div className="hidden h-8 w-px bg-line lg:block" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold sm:text-sm">{state.business.name}</p>
                <button type="button" className="flex items-center gap-1 text-[11px] text-muted">
                  <Store className="h-3 w-3" /> {outlet?.name} <ChevronRight className="h-3 w-3 rotate-90" />
                </button>
              </div>
              {session.type === 'demo' && <Badge tone="saffron" className="hidden sm:inline-flex">DEMO</Badge>}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:block"><LanguageSwitcher compact /></div>
              <ThemeToggle compact />
              <Link
                to="/app/notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:border-primary"
                aria-label={`${t('nav.notifications')} (${unread})`}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link
                to="/app/settings"
                className="hidden h-9 items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 text-xs font-semibold hover:border-primary sm:inline-flex"
              >
                <Settings className="h-3.5 w-3.5" />
                {lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-card/95 backdrop-blur-xl lg:hidden"
        aria-label="Bottom navigation"
      >
        <div className="safe-bottom grid grid-cols-5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted',
                  isActive && 'text-primary',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>

      <Link
        to="/app/order"
        className="fixed bottom-[76px] right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary-dark px-4 py-3 text-xs font-bold text-white shadow-lift lg:hidden"
      >
        <ShoppingCart className="h-4 w-4" />
        {t('dashboard.orderCta')}
      </Link>

    </div>
  );
}

const moreGroups = [
  {
    title: 'Stock & buying',
    items: [
      ['/app/reorder', 'nav.reorder', PackageSearch],
      ['/app/dead-stock', 'nav.deadStock', Boxes],
      ['/app/money-stuck', 'nav.moneyStuck', CircleDollarSign],
      ['/app/products', 'nav.products', LayoutGrid],
      ['/app/purchases', 'nav.purchases', Truck],
      ['/app/suppliers', 'nav.suppliers', Store],
      ['/app/sales', 'nav.sales', CreditCard],
    ],
  },
  {
    title: 'Money & people',
    items: [
      ['/app/expenses', 'nav.expenses', ReceiptIndianRupee],
      ['/app/udhaar', 'nav.udhaar', Users],
      ['/app/actions', 'nav.actions', Sparkles],
      ['/app/ask', 'nav.ask', Sparkles],
      ['/app/reports', 'nav.reports', WalletCards],
    ],
  },
] as const;

export function MorePage() {
  const { t } = useTranslation();
  const { state, resetDemo } = useAppData();
  if (!state) return null;
  return (
    <div>
      <div className="mb-6">
        <p className="kicker mb-2">MORE</p>
        <h1 className="page-title">{t('nav.more')}</h1>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {moreGroups.map((group) => (
          <div key={group.title} className="surface p-4">
            <h2 className="kicker mb-3">{group.title}</h2>
            <div className="grid gap-1 sm:grid-cols-2">
              {group.items.map(([to, label, Icon]) => (
                <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-bg">
                  <Icon className="h-4 w-4 text-muted" />
                  {t(label)}
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted" />
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="surface p-4">
          <h2 className="kicker mb-3">{t('settings.preferences')}</h2>
          <div className="space-y-2">
            <Link to="/app/settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-bg">
              <Settings className="h-4 w-4 text-muted" /> {t('nav.settings')}
            </Link>
            <Link to="/app/help" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-bg">
              <HelpCircle className="h-4 w-4 text-muted" /> {t('nav.help')}
            </Link>
            <Link to="/app/notifications" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-bg">
              <Bell className="h-4 w-4 text-muted" /> {t('nav.notifications')}
            </Link>
          </div>
        </div>
        <div className="surface p-4">
          <h2 className="kicker mb-3">Demo</h2>
          <p className="text-xs leading-relaxed text-muted">{t('common.noBackend')}</p>
          <button type="button" onClick={resetDemo} className={cn(buttonClass('secondary', 'sm'), 'mt-3')}>
            {t('common.resetDemo')}
          </button>
        </div>
      </div>
    </div>
  );
}
