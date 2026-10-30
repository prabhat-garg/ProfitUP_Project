export type Lang = 'hi' | 'en' | 'hinglish';
export type DataLevel = 'orders_only' | 'orders_upi' | 'full_sales';
export type Confidence = 'basic' | 'good' | 'best';
export type StockStatus = 'healthy' | 'slow' | 'dead';
export type Urgency = 'today' | 'three' | 'five' | 'later';
export type Source = 'manual' | 'billing_export' | 'upi' | 'estimated';

export interface Business {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  pin: string;
  gstin?: string;
  years: number;
  dataLevel: DataLevel;
  stockCheckDay: number;
  consentGiven: boolean;
  slowDays: number;
  deadDays: number;
  safetyPct: number;
  marginAlertPct: number;
  monthlySalesRange?: string;
  expectedProfitPct?: number;
  phone: string;
  ownerName: string;
  language: Lang;
  notificationPrefs?: {
    stockReminder: boolean;
    expenseAlerts: boolean;
    orderAlerts: boolean;
    udhaarAlerts: boolean;
    weeklySummary: boolean;
    whatsappReminders: boolean;
  };
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  pin: string;
  isPrimary: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  leadTimeDays: number;
  minOrder: number;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  unit: string;
  packSize: number;
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  reorderMin: number;
  shelfLifeDays?: number;
  isActive: boolean;
  currentStock: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  qty: number;
  costPrice: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  invoiceNo: string;
  received: boolean;
  items: PurchaseItem[];
  note?: string;
  billPhotoName?: string;
}

export interface StockCountItem {
  productId: string;
  qty: number;
}

export interface StockCount {
  id: string;
  date: string;
  countedBy: string;
  items: StockCountItem[];
}

export interface SaleRecord {
  id: string;
  date: string;
  productId: string;
  qty: number;
  sellingPrice: number;
  source: Source;
}

export interface Expense {
  id: string;
  date: string;
  category:
    | 'rent'
    | 'electricity'
    | 'wages'
    | 'transport'
    | 'packaging'
    | 'repairs'
    | 'marketing'
    | 'other';
  amount: number;
  note: string;
  recurring: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  amountDue: number;
  dueDate: string;
  note?: string;
}

export interface UdhaarPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
}

export interface OrderList {
  id: string;
  createdAt: string;
  coverDays: number;
  safetyPct: number;
  festivalBoost: number;
  budgetLimit: number | null;
  status: 'draft' | 'sent' | 'received';
  totalCost: number;
  receivedAt?: string;
  items: Array<{
    productId: string;
    suggestedQty: number;
    finalQty: number;
    rate: number;
    reason: string;
  }>;
}

export interface ActionItem {
  id: string;
  type: 'reorder' | 'dead_stock' | 'expense' | 'margin' | 'udhaar' | 'stock_count' | 'data';
  title: string;
  detail: string;
  impactAmount: number;
  status: 'open' | 'done' | 'snoozed' | 'dismissed';
  snoozeUntil?: string;
  productId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'stock' | 'order' | 'expense' | 'udhaar' | 'summary' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  mock?: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface AppState {
  version: number;
  business: Business;
  outlets: Outlet[];
  suppliers: Supplier[];
  products: Product[];
  purchases: Purchase[];
  stockCounts: StockCount[];
  sales: SaleRecord[];
  expenses: Expense[];
  customers: Customer[];
  udhaarPayments: UdhaarPayment[];
  orderLists: OrderList[];
  actions: ActionItem[];
  notifications: AppNotification[];
  auditLog: AuditEntry[];
  seededAt: string;
}

export interface Session {
  id: string;
  type: 'demo' | 'owner';
  name: string;
  phone: string;
  createdAt: string;
}

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface DemandResult {
  productId: string;
  dailyDemand: number;
  source: 'sales' | 'estimated' | 'none';
  confidence: Confidence;
  unitsSold: number;
  windowDays: number;
  locked: boolean;
}

export interface ProductMetrics {
  product: Product;
  stock: number;
  dailyDemand: number;
  demandSource: 'sales' | 'estimated' | 'none';
  confidence: Confidence;
  daysLeft: number | null;
  status: StockStatus;
  daysWithoutMovement: number | null;
  urgency: Urgency;
  suggestedQty: number;
  stockValue: number;
  marginPct: number;
  unitsSold: number;
}
