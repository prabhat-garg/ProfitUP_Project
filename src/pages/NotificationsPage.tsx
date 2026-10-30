import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  ClipboardList,
  PackageSearch,
  ReceiptIndianRupee,
  Settings,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { useAppData, useRequiredState } from '../context/AppDataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime } from '../lib/format';
import { PageHeader } from '../components/shared';
import { Badge, Button, Card, EmptyState, Tabs, buttonClass } from '../components/ui';
import type { AppNotification } from '../lib/types';

const meta: Record<AppNotification['type'], { icon: typeof Bell; to: string; tone: 'green' | 'amber' | 'red' | 'blue' | 'saffron' | 'violet' | 'neutral' }> = {
  stock: { icon: ClipboardList, to: '/app/stock-count', tone: 'green' },
  order: { icon: PackageSearch, to: '/app/order', tone: 'blue' },
  expense: { icon: ReceiptIndianRupee, to: '/app/expenses', tone: 'violet' },
  udhaar: { icon: Users, to: '/app/udhaar', tone: 'saffron' },
  summary: { icon: WalletCards, to: '/app/reports', tone: 'amber' },
  system: { icon: Sparkles, to: '/app', tone: 'neutral' },
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const state = useRequiredState();
  const { markNotificationRead, markAllNotificationsRead } = useAppData();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const unread = state.notifications.filter((notification) => !notification.read).length;
  const list = useMemo(
    () => [...state.notifications]
      .filter((notification) => (tab === 'unread' ? !notification.read : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.notifications, tab],
  );

  return (
    <div>
      <PageHeader
        number="19"
        title={t('notifications.title')}
        sub={t('notifications.sub')}
        actions={
          <>
            <Link to="/app/settings#notifications" className={buttonClass('secondary')}>
              <Settings className="h-4 w-4" /> {t('notifications.settings')}
            </Link>
            <Button onClick={markAllNotificationsRead} disabled={!unread}>
              <CheckCheck className="h-4 w-4" /> {t('notifications.markAll')}
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(value) => setTab(value as 'all' | 'unread')}
          tabs={[
            { id: 'all', label: t('notifications.all'), count: state.notifications.length },
            { id: 'unread', label: t('notifications.unread'), count: unread },
          ]}
        />
        <p className="text-[11px] font-semibold text-muted">{t('notifications.mock')}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          {list.length ? (
            <div className="divide-y divide-line">
              {list.map((notification) => {
                const item = meta[notification.type];
                const Icon = item.icon;
                return (
                  <div key={notification.id} className={`flex items-start gap-3 p-4 transition hover:bg-bg/50 ${!notification.read ? 'bg-primary-soft/30' : ''}`}>
                    <span className={`mt-0.5 rounded-xl p-2.5 ${
                      item.tone === 'green' ? 'bg-primary-soft text-primary'
                        : item.tone === 'blue' ? 'bg-[var(--info-soft)] text-info'
                          : item.tone === 'red' ? 'bg-[var(--danger-soft)] text-danger'
                            : item.tone === 'violet' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                              : item.tone === 'saffron' ? 'bg-[var(--warning-soft)] text-accent'
                                : 'bg-bg text-muted'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold">{notification.title}</p>
                        {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label={t('notifications.unread')} />}
                      <Badge tone={item.tone}>{t(`notifications.${notification.type}`)}</Badge>
                        {notification.mock && <Badge tone="amber">{t('notifications.mock')}</Badge>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{notification.body}</p>
                      <p className="mt-1.5 text-[10px] text-muted">{formatDateTime(notification.createdAt, lang)}</p>
                    </div>
                    <Link
                      to={item.to}
                      onClick={() => markNotificationRead(notification.id)}
                      className="shrink-0 rounded-lg p-2 text-muted hover:bg-bg hover:text-primary"
                      aria-label={t('notifications.open')}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title={t('notifications.empty')}
                body={t('notifications.sub')}
                action={<Link to="/app/actions" className={buttonClass('secondary', 'sm')}>{t('actions.title')}</Link>}
              />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <p className="kicker">{t('notifications.title')}</p>
            <div className="mt-3 space-y-2 text-xs">
              {(['stock', 'order', 'expense', 'udhaar', 'summary', 'system'] as const).map((type) => {
                const count = state.notifications.filter((notification) => notification.type === type).length;
                return (
                  <div key={type} className="flex items-center justify-between gap-3 rounded-lg bg-bg p-2.5">
                    <span className="text-muted">{t(`notifications.${type}`)}</span>
                    <span className="num font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border-accent/30 p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-accent"><Bell className="h-4 w-4" /> {t('settings.notifications')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('settings.mockNote')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('notifications.sub')}</p>
            <Link to="/app/settings#notifications" className={buttonClass('secondary', 'sm', 'mt-3 w-full')}>
              {t('notifications.settings')}
            </Link>
          </Card>

          <Card className="p-4">
            <p className="kicker">{t('actions.weekly')}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t('reports.sub')}</p>
            <Link to="/app/reports" className={buttonClass('primary', 'sm', 'mt-3 w-full justify-between')}>
              {t('reports.title')} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
