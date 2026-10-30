import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ActionItem,
  AppState,
  Business,
  Customer,
  Expense,
  OrderList,
  Product,
  Purchase,
  SaleRecord,
  Session,
  StockCount,
  Supplier,
} from '../lib/types';
import { readJSON, removeKey, stateKey, writeJSON } from '../lib/storage';
import { createDemoState } from '../data/seed';
import { createEmptyState, createSampleStateFor, DEMO_SESSION, sessionForPhone } from '../lib/demo';
import { todayISO, uid } from '../lib/utils';

interface AppDataContextValue {
  session: Session | null;
  state: AppState | null;
  isDemo: boolean;
  ready: boolean;
  loginDemo: () => void;
  signIn: (phone: string, name?: string) => void;
  signUp: (details: {
    phone: string;
    ownerName: string;
    businessName: string;
    businessType: string;
    city: string;
    pin: string;
    language: string;
    dataLevel?: Business['dataLevel'];
  }) => void;
  logout: () => void;
  resetDemo: () => void;
  loadSampleData: () => void;
  replaceState: (next: AppState) => void;
  updateBusiness: (patch: Partial<Business>) => void;
  updateOutlet: (id: string, patch: Partial<AppState['outlets'][number]>) => void;
  addOutlet: (name: string, address: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  archiveProduct: (id: string) => void;
  bulkUpdatePrices: (updates: Array<{ id: string; costPrice: number; sellingPrice: number }>) => void;
  addPurchase: (purchase: Omit<Purchase, 'id'>) => Purchase;
  addStockCount: (count: Omit<StockCount, 'id'>) => StockCount;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;
  addSale: (sale: Omit<SaleRecord, 'id'>) => SaleRecord;
  addSales: (sales: Array<Omit<SaleRecord, 'id'>>) => number;
  deleteSale: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  recordPayment: (customerId: string, amount: number, note?: string) => void;
  saveOrder: (order: Omit<OrderList, 'id' | 'createdAt'> & { id?: string }) => OrderList;
  updateOrderStatus: (id: string, status: OrderList['status']) => void;
  updateAction: (id: string, status: ActionItem['status']) => void;
  logActivity: (action: string, detail: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteAccount: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function loadStateForSession(session: Session): AppState {
  const stored = readJSON<AppState | null>(stateKey(session.id), null);
  if (stored && stored.version === 1) return stored;
  if (session.type === 'demo') return createDemoState(new Date());
  return createEmptyState({ phone: session.phone, ownerName: session.name });
}

function audit(state: AppState, action: string, detail: string, actor?: string): AppState {
  return {
    ...state,
    auditLog: [
      {
        id: uid('aud'),
        at: new Date().toISOString(),
        actor: actor || state.business.ownerName || 'Owner',
        action,
        detail,
      },
      ...state.auditLog,
    ].slice(0, 200),
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    readJSON<Session | null>('session', null),
  );
  const [state, setState] = useState<AppState | null>(() => {
    const storedSession = readJSON<Session | null>('session', null);
    if (!storedSession) return null;
    return loadStateForSession(storedSession);
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session || !state) {
      setReady(true);
      return;
    }
    writeJSON(stateKey(session.id), state);
    writeJSON('session', session);
    setReady(true);
  }, [session, state]);

  const activate = useCallback((nextSession: Session) => {
    const nextState = loadStateForSession(nextSession);
    setSession(nextSession);
    setState(nextState);
    writeJSON('session', nextSession);
    writeJSON(stateKey(nextSession.id), nextState);
  }, []);

  const loginDemo = useCallback(() => {
    activate(DEMO_SESSION);
  }, [activate]);

  const signIn = useCallback(
    (phone: string, name = 'Shop Owner') => {
      activate(sessionForPhone(phone, name));
    },
    [activate],
  );

  const signUp = useCallback(
    (details: {
      phone: string;
      ownerName: string;
      businessName: string;
      businessType: string;
      city: string;
      pin: string;
      language: string;
      dataLevel?: Business['dataLevel'];
    }) => {
      const nextSession = sessionForPhone(details.phone, details.ownerName);
      const next = createEmptyState({
        phone: details.phone,
        ownerName: details.ownerName,
        name: details.businessName,
        type: details.businessType,
        city: details.city,
        pin: details.pin,
        language: details.language as AppState['business']['language'],
        dataLevel: details.dataLevel,
      });
      setSession(nextSession);
      setState(next);
      writeJSON('session', nextSession);
      writeJSON(stateKey(nextSession.id), next);
    },
    [],
  );

  const logout = useCallback(() => {
    setSession(null);
    setState(null);
    removeKey('session');
  }, []);

  const mutate = useCallback((recipe: (current: AppState) => AppState) => {
    setState((current) => (current ? recipe(current) : current));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createDemoState(new Date());
    setState(fresh);
    setSession((current) => {
      const next = current?.type === 'demo' ? current : DEMO_SESSION;
      writeJSON(stateKey(next.id), fresh);
      return next;
    });
  }, []);

  const loadSampleData = useCallback(() => {
    mutate((current) => {
      const sample = createSampleStateFor(current.business.name, current.business.phone);
      sample.business = {
        ...sample.business,
        name: current.business.name || sample.business.name,
        ownerName: current.business.ownerName || sample.business.ownerName,
        phone: current.business.phone || sample.business.phone,
        language: current.business.language,
        dataLevel: current.business.dataLevel,
        stockCheckDay: current.business.stockCheckDay,
      };
      sample.outlets = current.outlets.length
        ? [{ ...current.outlets[0], name: current.outlets[0].name || 'Main Branch' }, ...sample.outlets.slice(1)]
        : sample.outlets;
      sample.auditLog = [
        ...current.auditLog,
        {
          id: uid('aud'),
          at: new Date().toISOString(),
          actor: current.business.ownerName,
          action: 'Sample data loaded',
          detail: 'Sample shop data added to this account.',
        },
      ];
      return sample;
    });
  }, [mutate]);

  const replaceState = useCallback((next: AppState) => {
    mutate(() => next);
  }, [mutate]);

  const updateBusiness = useCallback(
    (patch: Partial<Business>) => {
      mutate((current) =>
        audit({ ...current, business: { ...current.business, ...patch } }, 'Settings updated', Object.keys(patch).join(', ')),
      );
    },
    [mutate],
  );

  const updateOutlet = useCallback(
    (id: string, patch: Partial<AppState['outlets'][number]>) => {
      mutate((current) => ({
        ...current,
        outlets: current.outlets.map((outlet) => (outlet.id === id ? { ...outlet, ...patch } : outlet)),
      }));
    },
    [mutate],
  );

  const addOutlet = useCallback(
    (name: string, address: string) => {
      mutate((current) =>
        audit(
          {
            ...current,
            outlets: [
              ...current.outlets,
              {
                id: uid('out'),
                name: name || `Outlet ${current.outlets.length + 1}`,
                address,
                city: current.business.city,
                pin: current.business.pin,
                isPrimary: current.outlets.length === 0,
              },
            ],
          },
          'Outlet added',
          name,
        ),
      );
    },
    [mutate],
  );

  const addProduct = useCallback(
    (product: Omit<Product, 'id' | 'createdAt'>) => {
      const created: Product = { ...product, id: uid('prd'), createdAt: todayISO() };
      mutate((current) =>
        audit(
          { ...current, products: [created, ...current.products] },
          'Product added',
          `${created.name} · ${created.category}`,
        ),
      );
      return created;
    },
    [mutate],
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      mutate((current) => {
        const product = current.products.find((entry) => entry.id === id);
        return audit(
          {
            ...current,
            products: current.products.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
          },
          'Product updated',
          product?.name ?? id,
        );
      });
    },
    [mutate],
  );

  const archiveProduct = useCallback(
    (id: string) => {
      mutate((current) => {
        const product = current.products.find((entry) => entry.id === id);
        return audit(
          {
            ...current,
            products: current.products.map((entry) =>
              entry.id === id ? { ...entry, isActive: false } : entry,
            ),
          },
          'Product archived',
          product?.name ?? id,
        );
      });
    },
    [mutate],
  );

  const bulkUpdatePrices = useCallback(
    (updates: Array<{ id: string; costPrice: number; sellingPrice: number }>) => {
      mutate((current) => {
        const map = new Map(updates.map((update) => [update.id, update]));
        return audit(
          {
            ...current,
            products: current.products.map((product) => {
              const update = map.get(product.id);
              return update ? { ...product, ...update } : product;
            }),
          },
          'Bulk price update',
          `${updates.length} products`,
        );
      });
    },
    [mutate],
  );

  const addPurchase = useCallback(
    (purchase: Omit<Purchase, 'id'>) => {
      const created: Purchase = { ...purchase, id: uid('pur') };
      mutate((current) =>
        audit(
          {
            ...current,
            purchases: [created, ...current.purchases],
            products: current.products.map((product) => {
              const item = created.items.find((entry) => entry.productId === product.id);
              return item && created.received
                ? { ...product, currentStock: product.currentStock + item.qty }
                : product;
            }),
          },
          'Purchase bill added',
          `${created.invoiceNo} · ${created.items.length} items`,
        ),
      );
      return created;
    },
    [mutate],
  );

  const addStockCount = useCallback(
    (count: Omit<StockCount, 'id'>) => {
      const created: StockCount = { ...count, id: uid('stk') };
      mutate((current) =>
        audit(
          {
            ...current,
            stockCounts: [created, ...current.stockCounts],
            products: current.products.map((product) => {
              const item = created.items.find((entry) => entry.productId === product.id);
              return item ? { ...product, currentStock: item.qty } : product;
            }),
          },
          'Stock count saved',
          `${created.items.length} products counted`,
        ),
      );
      return created;
    },
    [mutate],
  );

  const addExpense = useCallback(
    (expense: Omit<Expense, 'id'>) => {
      const created: Expense = { ...expense, id: uid('exp') };
      mutate((current) =>
        audit(
          { ...current, expenses: [created, ...current.expenses] },
          'Expense added',
          `${created.category} · ₹${created.amount}`,
        ),
      );
      return created;
    },
    [mutate],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      mutate((current) => {
        const expense = current.expenses.find((entry) => entry.id === id);
        return audit(
          { ...current, expenses: current.expenses.filter((entry) => entry.id !== id) },
          'Expense deleted',
          expense ? `${expense.category} · ₹${expense.amount}` : id,
        );
      });
    },
    [mutate],
  );

  const addSale = useCallback(
    (sale: Omit<SaleRecord, 'id'>) => {
      const created: SaleRecord = { ...sale, id: uid('sal') };
      mutate((current) => {
        const product = current.products.find((entry) => entry.id === created.productId);
        return audit(
          { ...current, sales: [created, ...current.sales] },
          'Sale added',
          `${product?.name ?? created.productId} · ${created.qty} units`,
        );
      });
      return created;
    },
    [mutate],
  );

  const addSales = useCallback(
    (records: Array<Omit<SaleRecord, 'id'>>) => {
      const created = records.map((record) => ({ ...record, id: uid('sal') }));
      mutate((current) =>
        audit(
          { ...current, sales: [...created, ...current.sales] },
          'Sales imported',
          `${created.length} rows`,
        ),
      );
      return created.length;
    },
    [mutate],
  );

  const deleteSale = useCallback(
    (id: string) => {
      mutate((current) =>
        audit(
          { ...current, sales: current.sales.filter((entry) => entry.id !== id) },
          'Sale deleted',
          id,
        ),
      );
    },
    [mutate],
  );

  const addSupplier = useCallback(
    (supplier: Omit<Supplier, 'id'>) => {
      const created: Supplier = { ...supplier, id: uid('sup') };
      mutate((current) =>
        audit(
          { ...current, suppliers: [created, ...current.suppliers] },
          'Supplier added',
          created.name,
        ),
      );
      return created;
    },
    [mutate],
  );

  const updateSupplier = useCallback(
    (id: string, patch: Partial<Supplier>) => {
      mutate((current) =>
        audit(
          {
            ...current,
            suppliers: current.suppliers.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
          },
          'Supplier updated',
          current.suppliers.find((entry) => entry.id === id)?.name ?? id,
        ),
      );
    },
    [mutate],
  );

  const addCustomer = useCallback(
    (customer: Omit<Customer, 'id'>) => {
      const created: Customer = { ...customer, id: uid('cus') };
      mutate((current) =>
        audit(
          { ...current, customers: [created, ...current.customers] },
          'Udhaar customer added',
          `${created.name} · ₹${created.amountDue}`,
        ),
      );
      return created;
    },
    [mutate],
  );

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) => {
      mutate((current) =>
        audit(
          {
            ...current,
            customers: current.customers.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
          },
          'Udhaar customer updated',
          current.customers.find((entry) => entry.id === id)?.name ?? id,
        ),
      );
    },
    [mutate],
  );

  const recordPayment = useCallback(
    (customerId: string, amount: number, note = '') => {
      mutate((current) => {
        const customer = current.customers.find((entry) => entry.id === customerId);
        if (!customer) return current;
        const applied = Math.min(Math.max(0, amount), customer.amountDue);
        return audit(
          {
            ...current,
            customers: current.customers.map((entry) =>
              entry.id === customerId ? { ...entry, amountDue: Math.max(0, entry.amountDue - applied) } : entry,
            ),
            udhaarPayments: [
              { id: uid('pay'), customerId, amount: applied, date: todayISO() },
              ...current.udhaarPayments,
            ],
          },
          'Udhaar payment recorded',
          `${customer.name} · ₹${applied}${note ? ` · ${note}` : ''}`,
        );
      });
    },
    [mutate],
  );

  const saveOrder = useCallback(
    (order: Omit<OrderList, 'id' | 'createdAt'> & { id?: string }) => {
      const created: OrderList = {
        ...order,
        id: order.id ?? uid('ord'),
        createdAt: new Date().toISOString(),
      };
      mutate((current) => {
        const exists = current.orderLists.some((entry) => entry.id === created.id);
        return audit(
          {
            ...current,
            orderLists: exists
              ? current.orderLists.map((entry) => (entry.id === created.id ? { ...entry, ...created, createdAt: entry.createdAt } : entry))
              : [created, ...current.orderLists],
          },
          exists ? 'Order list updated' : 'Order list created',
          `${created.items.length} items · ₹${Math.round(created.totalCost)}`,
        );
      });
      return created;
    },
    [mutate],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderList['status']) => {
      mutate((current) =>
        audit(
          {
            ...current,
            orderLists: current.orderLists.map((order) =>
              order.id === id
                ? {
                    ...order,
                    status,
                    receivedAt: status === 'received' ? new Date().toISOString() : order.receivedAt,
                  }
                : order,
            ),
          },
          'Order status changed',
          `${id} → ${status}`,
        ),
      );
    },
    [mutate],
  );

  const updateAction = useCallback(
    (id: string, status: ActionItem['status']) => {
      mutate((current) =>
        audit(
          {
            ...current,
            actions: current.actions.map((action) =>
              action.id === id
                ? {
                    ...action,
                    status,
                    snoozeUntil:
                      status === 'snoozed'
                        ? new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
                        : undefined,
                  }
                : action,
            ),
          },
          'Action updated',
          `${id} → ${status}`,
        ),
      );
    },
    [mutate],
  );

  const logActivity = useCallback(
    (action: string, detail: string) => {
      mutate((current) => audit(current, action, detail));
    },
    [mutate],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      mutate((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      }));
    },
    [mutate],
  );

  const markAllNotificationsRead = useCallback(() => {
    mutate((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  }, [mutate]);

  const deleteAccount = useCallback(() => {
    if (session) removeKey(stateKey(session.id));
    removeKey('session');
    setSession(null);
    setState(null);
  }, [session]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      session,
      state,
      isDemo: session?.type === 'demo',
      ready,
      loginDemo,
      signIn,
      signUp,
      logout,
      resetDemo,
      loadSampleData,
      replaceState,
      updateBusiness,
      updateOutlet,
      addOutlet,
      addProduct,
      updateProduct,
      archiveProduct,
      bulkUpdatePrices,
      addPurchase,
      addStockCount,
      addExpense,
      deleteExpense,
      addSale,
      addSales,
      deleteSale,
      addSupplier,
      updateSupplier,
      addCustomer,
      updateCustomer,
      recordPayment,
      saveOrder,
      updateOrderStatus,
      updateAction,
      logActivity,
      markNotificationRead,
      markAllNotificationsRead,
      deleteAccount,
    }),
    [
      session,
      state,
      ready,
      loginDemo,
      signIn,
      signUp,
      logout,
      resetDemo,
      loadSampleData,
      replaceState,
      updateBusiness,
      updateOutlet,
      addOutlet,
      addProduct,
      updateProduct,
      archiveProduct,
      bulkUpdatePrices,
      addPurchase,
      addStockCount,
      addExpense,
      deleteExpense,
      addSale,
      addSales,
      deleteSale,
      addSupplier,
      updateSupplier,
      addCustomer,
      updateCustomer,
      recordPayment,
      saveOrder,
      updateOrderStatus,
      updateAction,
      logActivity,
      markNotificationRead,
      markAllNotificationsRead,
      deleteAccount,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}

export function useRequiredState() {
  const { state } = useAppData();
  if (!state) throw new Error('App state is not loaded');
  return state;
}
