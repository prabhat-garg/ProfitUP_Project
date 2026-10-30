export const pricing = {
  currency: 'INR',
  indicative: true,
  plans: [
    {
      id: 'free',
      nameKey: 'landing.freeName',
      bodyKey: 'landing.freeBody',
      price: '₹0',
      cadence: '',
      featured: false,
      cta: 'tryDemo',
    },
    {
      id: 'pro',
      nameKey: 'landing.proName',
      bodyKey: 'landing.proBody',
      price: '₹—',
      cadence: 'price not finalised',
      featured: true,
      cta: 'tryDemo',
    },
    {
      id: 'multi',
      nameKey: 'landing.multiName',
      bodyKey: 'landing.multiBody',
      price: '₹—',
      cadence: 'price not finalised',
      featured: false,
      cta: 'contact',
    },
  ],
};

export const siteConfig = {
  contactEmail: 'hello@profitup.example',
  contactPhone: '+91 00000 00000',
  whatsapp: '+91 00000 00000',
  demoOtpEnabled: import.meta.env.VITE_DEMO_OTP !== 'false',
  demoOtp: '1234',
  appName: 'ProfitUp',
  tagline: 'Know where your money is stuck. Know what to do next.',
  madeFor: 'Made for India’s small shops',
  festivalBoosts: [
    { id: 'none', label: 'No boost', value: 1 },
    { id: 'diwali', label: 'Diwali +30%', value: 1.3 },
    { id: 'wedding', label: 'Wedding +20%', value: 1.2 },
    { id: 'custom', label: 'Custom', value: 1.1 },
  ],
};

export const businessTypes = [
  'Kirana / General Store',
  'Medical / Pharmacy',
  'Cafe / Restaurant',
  'Bakery / Sweets',
  'Clothing',
  'Stationery',
  'Electronics',
  'Other',
];

export const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
