import type { AppState, Business, Lang, Session } from './types';
import { uid } from './utils';
import { createDemoState, DEMO_SHOP_NAME } from '../data/seed';

export function createEmptyState(
  options: {
    name?: string;
    phone?: string;
    ownerName?: string;
    type?: string;
    city?: string;
    state?: string;
    pin?: string;
    dataLevel?: Business['dataLevel'];
    language?: Lang;
    stockCheckDay?: number;
    monthlySalesRange?: string;
    expectedProfitPct?: number;
  } = {},
): AppState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 1,
    business: {
      id: uid('biz'),
      name: options.name || 'My Shop',
      type: options.type || 'Kirana / General Store',
      city: options.city || 'Bhopal',
      state: options.state || 'Madhya Pradesh',
      pin: options.pin || '462001',
      years: 0,
      dataLevel: options.dataLevel || 'orders_only',
      stockCheckDay: options.stockCheckDay ?? 0,
      consentGiven: true,
      slowDays: 15,
      deadDays: 30,
      safetyPct: 10,
      marginAlertPct: 8,
      monthlySalesRange: options.monthlySalesRange,
      expectedProfitPct: options.expectedProfitPct,
      phone: options.phone || '',
      ownerName: options.ownerName || '',
      language: options.language || 'hi',
    },
    outlets: [
      {
        id: uid('out'),
        name: 'Main Branch',
        address: '',
        city: options.city || 'Bhopal',
        pin: options.pin || '462001',
        isPrimary: true,
      },
    ],
    suppliers: [],
    products: [],
    purchases: [],
    stockCounts: [],
    sales: [],
    expenses: [],
    customers: [],
    udhaarPayments: [],
    orderLists: [],
    actions: [],
    notifications: [
      {
        id: uid('not'),
        type: 'system',
        title: 'Welcome to ProfitUp',
        body: 'Start with a product list or a purchase bill. You do not need daily sales entries.',
        createdAt: new Date().toISOString(),
        read: false,
        mock: false,
      },
    ],
    auditLog: [
      {
        id: uid('aud'),
        at: new Date().toISOString(),
        actor: options.ownerName || 'Owner',
        action: 'Account created',
        detail: 'ProfitUp setup started.',
      },
    ],
    seededAt: today,
  };
}

export function createSampleStateFor(name: string, phone: string): AppState {
  const state = createDemoState(new Date());
  state.business.name = name || DEMO_SHOP_NAME;
  state.business.phone = phone;
  state.business.ownerName = name ? name.split(' ')[0] : state.business.ownerName;
  state.auditLog.unshift({
    id: uid('aud'),
    at: new Date().toISOString(),
    actor: state.business.ownerName,
    action: 'Sample data loaded',
    detail: 'Demo catalogue, purchases and counts copied into this account.',
  });
  return state;
}

export const DEMO_SESSION: Session = {
  id: 'demo',
  type: 'demo',
  name: 'Demo visitor',
  phone: '',
  createdAt: new Date().toISOString(),
};

export function sessionForPhone(phone: string, name = 'Shop Owner'): Session {
  return {
    id: `owner_${phone.replace(/\D/g, '')}`,
    type: 'owner',
    name,
    phone,
    createdAt: new Date().toISOString(),
  };
}
