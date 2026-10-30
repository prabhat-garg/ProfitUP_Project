import type { AppState, Product, Purchase, SaleRecord, Supplier } from '../lib/types';
import { addDays, isoDate, roundUpToPack, uid } from '../lib/utils';

export const DEMO_SHOP_NAME = 'Sharma General Store';

const suppliers: Supplier[] = [
  {
    id: 'sup_sharma',
    name: 'Sharma Distributors',
    contact: 'Rakesh Sharma',
    phone: '9876543210',
    leadTimeDays: 2,
    minOrder: 1500,
    category: 'Grocery & Snacks',
  },
  {
    id: 'sup_dairy',
    name: 'Bhopal Dairy Hub',
    contact: 'Imran Khan',
    phone: '9826011223',
    leadTimeDays: 1,
    minOrder: 800,
    category: 'Dairy & Beverages',
  },
  {
    id: 'sup_fmcg',
    name: 'MP FMCG Supply',
    contact: 'Neha Jain',
    phone: '91790 44556',
    leadTimeDays: 3,
    minOrder: 2500,
    category: 'Personal Care & Household',
  },
];

type Row = [
  name: string,
  nameHi: string,
  category: string,
  unit: string,
  pack: number,
  cost: number,
  sell: number,
  stock: number,
  demand: number,
  supplier: number,
  shelfLife: number | undefined,
];

const rows: Row[] = [
  ['Tata Salt 1kg', 'टाटा नमक 1 किग्रा', 'Grocery', 'kg', 1, 18, 24, 42, 1.8, 0, 365],
  ['Aashirvaad Atta 5kg', 'आशीर्वाद आटा 5 किग्रा', 'Grocery', 'bag', 1, 235, 285, 18, 1.2, 0, 180],
  ['Fortune Sunflower Oil 1L', 'फॉर्च्यून सूरजमुखी तेल 1 लीटर', 'Grocery', 'l', 1, 138, 155, 44, 3.4, 0, 270],
  ['Sagar Sugar 1kg', 'सागर चीनी 1 किग्रा', 'Grocery', 'kg', 1, 42, 46, 55, 4.1, 0, 365],
  ['Toor Dal 1kg', 'तूर दाल 1 किग्रा', 'Grocery', 'kg', 1, 118, 140, 24, 1.6, 0, 180],
  ['India Gate Basmati 5kg', 'इंडिया गेट बासमती 5 किग्रा', 'Grocery', 'bag', 1, 420, 499, 12, 0.9, 0, 365],
  ['Besan 500g', 'बेसन 500 ग्राम', 'Grocery', 'pack', 1, 48, 62, 20, 0.8, 0, 120],
  ['Rajma 1kg', 'राजमा 1 किग्रा', 'Grocery', 'kg', 1, 105, 128, 10, 0.5, 0, 180],
  ['Poha 500g', 'पोहा 500 ग्राम', 'Grocery', 'pack', 1, 28, 38, 16, 0.6, 0, 90],
  ['Haldi Powder 200g', 'हल्दी पाउडर 200 ग्राम', 'Grocery', 'pack', 1, 45, 60, 22, 0.7, 0, 365],
  ['Chilli Powder 200g', 'मिर्च पाउडर 200 ग्राम', 'Grocery', 'pack', 1, 55, 72, 3, 0.65, 0, 365],
  ['Tata Tea 500g', 'टाटा चाय 500 ग्राम', 'Grocery', 'pack', 1, 165, 205, 15, 1.1, 0, 365],
  ['Amul Milk 500ml', 'अमूल दूध 500 मिली', 'Dairy', 'pack', 1, 26, 28, 12, 5.8, 1, 2],
  ['Amul Butter 500g', 'अमूल बटर 500 ग्राम', 'Dairy', 'pack', 1, 245, 275, 8, 0.8, 1, 90],
  ['Dahi 400g', 'दही 400 ग्राम', 'Dairy', 'pack', 1, 35, 45, 18, 2.2, 1, 3],
  ['Paneer 200g', 'पनीर 200 ग्राम', 'Dairy', 'pack', 1, 75, 95, 3, 1.1, 1, 3],
  ['Amul Cheese 200g', 'अमूल चीज़ 200 ग्राम', 'Dairy', 'pack', 1, 125, 145, 7, 0.4, 1, 60],
  ['Milkmaid 400g', 'मिल्कमेड 400 ग्राम', 'Dairy', 'tin', 1, 145, 165, 9, 0.3, 1, 180],
  ['Lassi 200ml', 'लस्सी 200 मिली', 'Dairy', 'pack', 1, 18, 25, 22, 1.3, 1, 7],
  ['Parle-G 250g', 'पारले-जी 250 ग्राम', 'Snacks', 'pack', 1, 22, 30, 10, 2.6, 0, 120],
  ['Haldiram Bhujia 400g', 'हल्दीराम भुजिया 400 ग्राम', 'Snacks', 'pack', 1, 72, 90, 14, 0.9, 0, 90],
  ['Kurkure 90g', 'कुरकुरे 90 ग्राम', 'Snacks', 'pack', 1, 15, 20, 44, 3.2, 0, 90],
  ['Lays 52g', 'लेज़ 52 ग्राम', 'Snacks', 'pack', 1, 15, 20, 8, 3.5, 0, 60],
  ['Good Day 200g', 'गुड डे 200 ग्राम', 'Snacks', 'pack', 1, 28, 35, 25, 1.2, 0, 120],
  ['Oreo 120g', 'ओरियो 120 ग्राम', 'Snacks', 'pack', 1, 30, 40, 12, 0.7, 0, 120],
  ['Bingo 70g', 'बिंगो 70 ग्राम', 'Snacks', 'pack', 1, 10, 15, 50, 2.9, 0, 90],
  ['Mixture 1kg', 'मिक्सचर 1 किग्रा', 'Snacks', 'kg', 1, 120, 150, 35, 0, 0, 45],
  ['Rusk 300g', 'रस्क 300 ग्राम', 'Snacks', 'pack', 1, 32, 42, 20, 0.8, 0, 120],
  ['Namkeen Mix 500g', 'मिक्स नमकीन 500 ग्राम', 'Snacks', 'pack', 1, 68, 88, 50, 0, 0, 60],
  ['Dairy Milk Chocolate 40g', 'डेयरी मिल्क चॉकलेट 40 ग्राम', 'Snacks', 'pack', 1, 20, 30, 30, 1.1, 0, 120],
  ['Coca-Cola 750ml', 'कोका-कोला 750 मिली', 'Beverages', 'bottle', 1, 32, 40, 24, 2.1, 0, 120],
  ['Thums Up 750ml', 'थम्स अप 750 मिली', 'Beverages', 'bottle', 1, 32, 40, 18, 1.6, 0, 120],
  ['Frooti 600ml', 'फ्रूटी 600 मिली', 'Beverages', 'bottle', 1, 28, 35, 16, 1.0, 0, 90],
  ['Real Juice 1L', 'रियल जूस 1 लीटर', 'Beverages', 'pack', 1, 85, 105, 8, 0.55, 0, 120],
  ['Bisleri 1L', 'बिसलेरी 1 लीटर', 'Beverages', 'bottle', 1, 12, 20, 9, 4.8, 0, 180],
  ['Red Bull 250ml', 'रेड बुल 250 मिली', 'Beverages', 'can', 1, 95, 120, 12, 0.3, 0, 180],
  ['Ready Tea 200ml', 'रेडी टी 200 मिली', 'Beverages', 'pack', 1, 15, 20, 28, 1.4, 0, 60],
  ['Bru Coffee 50g', 'ब्रू कॉफी 50 ग्राम', 'Beverages', 'jar', 1, 120, 150, 5, 0.25, 0, 180],
  ['Glucon-D 500g', 'ग्लूकोन-डी 500 ग्राम', 'Beverages', 'pack', 1, 140, 175, 30, 0, 0, 180],
  ['Cold Coffee 200ml', 'कोल्ड कॉफी 200 मिली', 'Beverages', 'pack', 1, 35, 45, 22, 0, 0, 90],
  ['Colgate 200g', 'कोलगेट 200 ग्राम', 'Personal Care', 'pack', 1, 78, 95, 16, 0.8, 2, 365],
  ['Lifebuoy Soap 100g', 'लाइफबॉय साबुन 100 ग्राम', 'Personal Care', 'pack', 1, 28, 35, 42, 1.7, 2, 365],
  ['Dove Shampoo 340ml', 'डव शैम्पू 340 मिली', 'Personal Care', 'bottle', 1, 245, 285, 7, 0.35, 2, 365],
  ['Vaseline 200ml', 'वैसलीन 200 मिली', 'Personal Care', 'jar', 1, 98, 120, 9, 0.25, 2, 365],
  ['Nivea Cream 60ml', 'निविया क्रीम 60 मिली', 'Personal Care', 'pack', 1, 165, 195, 20, 0, 2, 365],
  ['Razor Pack', 'रेजर पैक', 'Personal Care', 'pack', 1, 45, 60, 18, 0.35, 2, 365],
  ['Toothbrush', 'टूथब्रश', 'Personal Care', 'piece', 1, 20, 35, 30, 0.6, 2, 365],
  ['Face Wash 100g', 'फेस वॉश 100 ग्राम', 'Personal Care', 'pack', 1, 140, 175, 8, 0.2, 2, 365],
  ['Sanitary Pads', 'सैनिटरी पैड्स', 'Personal Care', 'pack', 1, 42, 55, 20, 0.8, 2, 365],
  ['Baby Diapers M', 'बेबी डायपर M', 'Personal Care', 'pack', 1, 380, 440, 5, 0.3, 2, 365],
  ['Hair Oil 200ml', 'हेयर ऑयल 200 मिली', 'Personal Care', 'bottle', 1, 75, 95, 16, 0.45, 2, 365],
  ['Surf Excel 1kg', 'सर्फ एक्सेल 1 किग्रा', 'Household', 'pack', 1, 165, 195, 18, 1.0, 2, 365],
  ['Vim Bar', 'विम बार', 'Household', 'piece', 1, 10, 15, 9, 2.2, 2, 365],
  ['Harpic 500ml', 'हार्पिक 500 मिली', 'Household', 'bottle', 1, 88, 110, 1, 0.4, 2, 365],
  ['Lizol 500ml', 'लिज़ोल 500 मिली', 'Household', 'bottle', 1, 95, 120, 8, 0.3, 2, 365],
  ['Garbage Bags', 'कचरा बैग', 'Household', 'pack', 1, 45, 65, 14, 0.35, 2, 365],
  ['Mosquito Coil', 'मच्छर कॉइल', 'Household', 'pack', 1, 35, 45, 24, 0.9, 2, 365],
  ['Room Freshener', 'रूम फ्रेशनर', 'Household', 'can', 1, 145, 180, 15, 0, 2, 365],
  ['Aluminium Foil', 'एल्युमिनियम फॉइल', 'Household', 'pack', 1, 80, 100, 6, 0.2, 2, 365],
  ['Dishwash Liquid 500ml', 'डिशवॉश लिक्विड 500 मिली', 'Household', 'bottle', 1, 90, 115, 12, 0.45, 2, 365],
];

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function productId(index: number) {
  return `prd_${String(index + 1).padStart(2, '0')}`;
}

export function getStockValue(products: Product[]): number {
  return products.reduce((total, product) => total + product.currentStock * product.costPrice, 0);
}

export function createDemoState(now = new Date()): AppState {
  const today = isoDate(now);
  const products: Product[] = rows.map((row, index) => ({
    id: productId(index),
    name: row[0],
    nameHi: row[1],
    category: row[2],
    unit: row[3],
    packSize: row[4],
    costPrice: row[5],
    sellingPrice: row[6],
    supplierId: suppliers[row[9]].id,
    reorderMin: 5,
    shelfLifeDays: row[10],
    isActive: true,
    currentStock: row[7],
    createdAt: isoDate(addDays(now, -180)),
  }));

  const demands = new Map(products.map((product, index) => [product.id, rows[index][8]]));

  // Four purchase waves across the 49-day stock-count window.
  const purchaseOffsets = [7, 21, 35, 49];
  const purchases: Purchase[] = [];
  const purchasedBetween = new Map<string, number>();
  purchaseOffsets.forEach((offset, wave) => {
    suppliers.forEach((supplier, supplierIndex) => {
      const items = products
        .filter((product) => product.supplierId === supplier.id)
        .filter((product) => (demands.get(product.id) ?? 0) > 0)
        .map((product) => {
          const daily = demands.get(product.id) ?? 0;
          const qty = Math.max(1, roundUpToPack(daily * 14 * 1.06, product.packSize));
          purchasedBetween.set(product.id, (purchasedBetween.get(product.id) ?? 0) + qty);
          return { productId: product.id, qty, costPrice: product.costPrice };
        });
      if (items.length) {
        purchases.push({
          id: `pur_${offset}_${supplierIndex}`,
          date: isoDate(addDays(now, -offset)),
          supplierId: supplier.id,
          invoiceNo: `INV-${String(810 + wave * 3 + supplierIndex)}`,
          received: true,
          items,
          note: wave === 0 ? 'Weekly replenishment' : undefined,
        });
      }
    });
  });

  // Weekly counts, generated backwards from today's known stock.
  const countOffsets = [3, 10, 17, 24, 31, 38, 45, 52];
  const counts: Array<{ offset: number; items: Array<{ productId: string; qty: number }> }> = [];
  products.forEach((product) => {
    let qty = product.currentStock;
    const daily = demands.get(product.id) ?? 0;
    countOffsets.forEach((offset, index) => {
      if (index > 0) {
        const intervalStart = countOffsets[index - 1];
        const intervalEnd = offset;
        let bought = 0;
        purchases.forEach((purchase) => {
          const purchaseOffset = Math.round((now.getTime() - new Date(`${purchase.date}T00:00:00`).getTime()) / 86_400_000);
          if (purchaseOffset >= intervalEnd && purchaseOffset < intervalStart) {
            bought += purchase.items.find((item) => item.productId === product.id)?.qty ?? 0;
          }
        });
        qty = Math.max(0, Math.round(qty + daily * 7 - bought));
      }
      const existing = counts.find((count) => count.offset === offset);
      if (existing) existing.items.push({ productId: product.id, qty });
      else counts.push({ offset, items: [{ productId: product.id, qty }] });
    });
  });

  const stockCounts = countOffsets.map((offset, index) => ({
    id: `stk_${index + 1}`,
    date: isoDate(addDays(now, -offset)),
    countedBy: index === 0 ? 'Prabhat (Owner)' : 'Demo seed',
    items: counts.find((count) => count.offset === offset)?.items ?? [],
  }));

  // Sales for the first 40 products with demand. The remaining products stay estimated.
  const saleProducts = products.filter((product) => (demands.get(product.id) ?? 0) > 0).slice(0, 40);
  const sales: SaleRecord[] = [];
  const random = seededRandom(20261029);
  saleProducts.forEach((product, productIndex) => {
    const daily = demands.get(product.id) ?? 0;
    for (let day = 0; day < 56; day += 1) {
      const variance = 0.72 + random() * 0.56;
      const qty = Math.max(0, Math.round(daily * variance));
      if (qty === 0) continue;
      sales.push({
        id: `sal_${product.id}_${day}`,
        date: isoDate(addDays(now, -day)),
        productId: product.id,
        qty,
        sellingPrice: product.sellingPrice,
        source: productIndex % 5 === 0 ? 'manual' : 'billing_export',
      });
    }
  });

  const expenseMonths = [3, 2, 1, 0].map((monthsAgo) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.min(5, now.getDate()));
    return isoDate(date);
  });
  const expenses = [
    ...expenseMonths.map((date) => ({ id: uid('exp_rent'), date, category: 'rent' as const, amount: 18000, note: 'Shop rent', recurring: true })),
    ...expenseMonths.map((date, i) => ({
      id: uid('exp_elec'),
      date,
      category: 'electricity' as const,
      amount: [5200, 5450, 6100, 9800][i],
      note: i === 3 ? 'AC repair + summer cooling' : 'MPPKVVCL bill',
      recurring: false,
    })),
    ...expenseMonths.map((date) => ({ id: uid('exp_wage'), date, category: 'wages' as const, amount: 22000, note: 'Staff wages', recurring: true })),
    ...expenseMonths.map((date) => ({ id: uid('exp_trans'), date, category: 'transport' as const, amount: 3100 + Math.round(Math.random() * 400), note: 'Tempo / loading', recurring: false })),
    ...expenseMonths.map((date) => ({ id: uid('exp_pack'), date, category: 'packaging' as const, amount: 1850, note: 'Carry bags and wraps', recurring: true })),
    { id: uid('exp_repair'), date: expenseMonths[3], category: 'repairs' as const, amount: 2400, note: 'Freezer repair', recurring: false },
  ];

  const customers = [
    { id: 'cus_1', name: 'Ramesh Yadav', phone: '9876500011', amountDue: 2400, dueDate: isoDate(addDays(now, -36)), note: 'Monthly grocery' },
    { id: 'cus_2', name: 'Sunita Verma', phone: '9827002233', amountDue: 1250, dueDate: isoDate(addDays(now, -18)), note: 'Dairy + snacks' },
    { id: 'cus_3', name: 'Imran Ali', phone: '9179004455', amountDue: 3200, dueDate: isoDate(addDays(now, -5)), note: 'Wedding supplies' },
    { id: 'cus_4', name: 'Kavita Patel', phone: '9301007788', amountDue: 850, dueDate: isoDate(addDays(now, -2)), note: 'Monthly khata' },
    { id: 'cus_5', name: 'Sanjay Gupta', phone: '9425009911', amountDue: 1750, dueDate: isoDate(addDays(now, 4)), note: 'Will pay Friday' },
  ];

  const orderItemProductIds = products
    .filter((p) => (demands.get(p.id) ?? 0) > 0)
    .slice(0, 12)
    .map((p) => combinedQty(p, demands.get(p.id) ?? 0));
  const pastOrder = {
    id: 'ord_seed_1',
    createdAt: isoDate(addDays(now, -24)),
    coverDays: 7,
    safetyPct: 10,
    festivalBoost: 1,
    budgetLimit: null,
    status: 'received' as const,
    totalCost: orderItemProductIds.reduce((total, item) => total + item.finalQty * item.rate, 0),
    receivedAt: isoDate(addDays(now, -23)),
    items: orderItemProductIds,
  };

  return {
    version: 1,
    business: {
      id: 'biz_sharma',
      name: DEMO_SHOP_NAME,
      type: 'Kirana / General Store',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pin: '462001',
      gstin: '23ABCDE1234F1Z5',
      years: 12,
      dataLevel: 'orders_upi',
      stockCheckDay: 0,
      consentGiven: true,
      slowDays: 15,
      deadDays: 30,
      safetyPct: 10,
      marginAlertPct: 8,
      monthlySalesRange: '100000-300000',
      expectedProfitPct: 18,
      phone: '9876543210',
      ownerName: 'Prabhat Sharma',
      language: 'hi',
    },
    outlets: [
      { id: 'out_main', name: 'Main Branch', address: '12, New Market, TT Nagar', city: 'Bhopal', pin: '462003', isPrimary: true },
      { id: 'out_second', name: 'Bairagarh Branch', address: 'Shop 4, Lalghati Square', city: 'Bhopal', pin: '462030', isPrimary: false },
    ],
    suppliers,
    products,
    purchases,
    stockCounts,
    sales,
    expenses,
    customers,
    udhaarPayments: [],
    orderLists: [pastOrder],
    actions: [
      {
        id: 'act_reorder',
        type: 'reorder',
        title: 'Order milk, paneer, Parle-G and 5 more today',
        detail: '8 products will run out within 5 days. The suggested order costs ₹3,940 and covers the next 7 days.',
        impactAmount: 3940,
        status: 'open',
        createdAt: today,
      },
      {
        id: 'act_dead',
        type: 'dead_stock',
        title: '₹18,045 is locked in 6 non-moving products',
        detail: 'Bundle namkeen and mixture, return unopened room freshener stock, and stop reordering Nivea cream.',
        impactAmount: 18045,
        status: 'open',
        createdAt: today,
      },
      {
        id: 'act_electricity',
        type: 'expense',
        title: 'Electricity bill is 60% higher than last month',
        detail: 'This month ₹9,800 vs ₹6,100 last month. Check the freezer and AC load before the next billing cycle.',
        impactAmount: 3700,
        status: 'open',
        createdAt: today,
      },
      {
        id: 'act_margin',
        type: 'margin',
        title: 'Oil and sugar sell fast but earn thin margins',
        detail: 'Fortune oil margin is 11.0% and sugar 8.7%. Try a 2% supplier negotiation or bundle with a high-margin item.',
        impactAmount: 2300,
        status: 'open',
        createdAt: today,
      },
      {
        id: 'act_udhaar',
        type: 'udhaar',
        title: '₹5,650 udhaar is overdue by more than 7 days',
        detail: 'Ramesh Yadav and Sunita Verma are the oldest. Send the WhatsApp reminder from the Udhaar page.',
        impactAmount: 5650,
        status: 'open',
        createdAt: today,
      },
      {
        id: 'act_stock',
        type: 'stock_count',
        title: 'Weekly stock count is due in 2 days',
        detail: 'A fresh count keeps demand estimates honest. 12 high-value products are sorted first in the guided flow.',
        impactAmount: 0,
        status: 'open',
        createdAt: today,
      },
    ],
    notifications: [
      { id: 'not_1', type: 'stock', title: 'Stock count due Sunday', body: 'Last count was 3 days ago. Keep 20 minutes free for the guided count.', createdAt: new Date(now.getTime() - 3600_000).toISOString(), read: false, mock: true },
      { id: 'not_2', type: 'expense', title: 'Electricity bill spike', body: 'This month is 60% above last month. Open Kharcha to review.', createdAt: new Date(now.getTime() - 7200_000).toISOString(), read: false, mock: true },
      { id: 'not_3', type: 'udhaar', title: '2 udhaar payments overdue', body: '₹5,650 is overdue by more than 7 days.', createdAt: new Date(now.getTime() - 86_400_000).toISOString(), read: false, mock: true },
      { id: 'not_4', type: 'order', title: 'Last order received', body: 'The 24-day-old order was marked received. Stock numbers are updated from counts, not assumed.', createdAt: new Date(now.getTime() - 2 * 86_400_000).toISOString(), read: true, mock: true },
      { id: 'not_5', type: 'summary', title: 'Weekly summary ready', body: 'Profit, dead stock and reorder changes for the last 7 days.', createdAt: new Date(now.getTime() - 3 * 86_400_000).toISOString(), read: true, mock: true },
    ],
    auditLog: [
      { id: 'aud_1', at: new Date(now.getTime() - 3 * 86_400_000).toISOString(), actor: 'Prabhat (Owner)', action: 'Stock count saved', detail: '60 products counted. 8 variances flagged for review.' },
      { id: 'aud_2', at: new Date(now.getTime() - 7 * 86_400_000).toISOString(), actor: 'Prabhat (Owner)', action: 'Purchase bill added', detail: 'Sharma Distributors bill INV-810, ₹8,420.' },
      { id: 'aud_3', at: new Date(now.getTime() - 24 * 86_400_000).toISOString(), actor: 'Prabhat (Owner)', action: 'Order marked received', detail: '12 products, 7-day cover.' },
    ],
    seededAt: now.toISOString(),
  };
}

function combinedQty(product: Product, daily: number) {
  const finalQty = Math.max(1, roundUpToPack(daily * 7 * 1.1, product.packSize));
  return {
    productId: product.id,
    suggestedQty: finalQty,
    finalQty,
    rate: product.costPrice,
    reason: '7-day cover with 10% safety',
  };
}

export function resetDemoState() {
  return createDemoState(new Date());
}
