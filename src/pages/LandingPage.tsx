import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Gift,
  LineChart,
  MessageCircleQuestion,
  ReceiptIndianRupee,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  TrendingDown,
  Users,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { nextWeekday } from '../lib/utils';
import { formatCompactINR, formatDate, formatINR } from '../lib/format';
import { createDemoState } from '../data/seed';
import {
  allProductMetrics,
  buildOrderPlan,
  daysSinceLastCount,
  expenseAlerts,
  inventorySummary,
  moneyStuck,
  profitAnalysis,
  udhaarAgeing,
} from '../lib/engine';
import { pricing } from '../config/site';
import { PublicFooter, PublicHeader } from '../components/layout';
import {
  Badge,
  Card,
  Tabs,
  Accordion,
  Reveal,
  buttonClass,
} from '../components/ui';
import {
  DataLevelBadge,
  EstimatedBadge,
  FlipCard,
  NumberedSection,
  StatusBadge,
  SystemPanel,
  Ticker,
  UrgencyChip,
} from '../components/shared';

const slides = [
  { key: 'stuck', en: 'Know where money is stuck', hi: 'पैसा कहाँ फँसा है, जानो', hinglish: 'Paisa kahan phasa hai, jaano' },
  { key: 'order', en: 'A 7-day order list in minutes', hi: 'मिनटों में 7-दिन की ऑर्डर लिस्ट', hinglish: 'Minute mein 7-din ki order list' },
  { key: 'stock', en: 'Dead stock and udhaar, one view', hi: 'डेड स्टॉक और उधार, एक जगह', hinglish: 'Dead stock aur udhaar, ek jagah' },
  { key: 'honest', en: 'No daily sales entry. Honest estimates.', hi: 'रोज़ सेल्स एंट्री नहीं। ईमानदार अनुमान।', hinglish: 'Roz sales entry nahi. Imaandaar andaza.' },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as 'hi' | 'en' | 'hinglish') || 'hi';
  const [slide, setSlide] = useState(0);
  const state = useMemo(() => createDemoState(new Date()), []);
  const metrics = useMemo(() => allProductMetrics(state), [state]);
  const summary = useMemo(() => inventorySummary(state, metrics), [state, metrics]);
  const stuck = useMemo(() => moneyStuck(state), [state]);
  const plan = useMemo(() => buildOrderPlan(state, { coverDays: 7, safetyPct: 10, festivalBoost: 1, budgetLimit: null }), [state]);
  const profit = useMemo(() => profitAnalysis(state), [state]);
  const alerts = useMemo(() => expenseAlerts(state), [state]);
  const ageing = useMemo(() => udhaarAgeing(state), [state]);
  const countDays = daysSinceLastCount(state);
  const nextCount = useMemo(() => nextWeekday(new Date(), state.business.stockCheckDay, 10), [state.business.stockCheckDay]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, []);

  const ticker = [
    `${metrics.filter((metric) => metric.urgency === 'today').length} products order today · sample`,
    `${formatINR(stuck.dead)} dead stock in ${stuck.deadCount} products · sample`,
    alerts[0] ? `${alerts[0].category} bill ${alerts[0].increasePct.toFixed(0)}% higher · sample` : 'Expenses stable this month · sample',
    `${formatINR(ageing.days30plus)} udhaar older than 30 days · sample`,
    `Next stock count ${formatDate(nextCount)} · sample`,
  ];

  return (
    <div className="bg-bg">
      <PublicHeader />
      <main id="top">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
          <div className="absolute -right-32 top-10 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:pb-16 lg:pt-20">
            <div className="flex flex-col justify-between">
              <div>
                <Reveal>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dark dark:text-primary">
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                      {t('landing.kicker')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">EST. FOR BHARAT</span>
                  </div>
                </Reveal>
                <Reveal delay={70}>
                  <h1 className="display max-w-4xl text-[clamp(2.4rem,5vw,5.6rem)] text-ink">
                    Know where your money is <span className="text-primary">stuck ! </span> Know what to do next.
                    {/* <span className="mt-1 block text-[clamp(1.45rem,3.9vw,3.15rem)] tracking-[-0.035em] text-ink/85">
                      ProfitUp batayega.
                    </span> */}
                  </h1>
                </Reveal>
                <Reveal delay={140}>
                  <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                    {t('landing.support')}
                  </p>
                </Reveal>
                <Reveal delay={210}>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to="/signup" className={buttonClass('primary', 'lg')}>
                      {t('landing.getStarted')} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/demo" className={buttonClass('secondary', 'lg')}>
                      <ShoppingBasket className="h-4 w-4" /> {t('landing.tryDemo')}
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-muted">{t('landing.noLogin')} · {t('common.sampleData')}</p>
                </Reveal>

                <Reveal delay={280}>
                  <div className="mt-10 border-t border-line pt-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="kicker">{String(slide + 1).padStart(2, '0')} / 04 · {t('landing.holdOn')}</span>
                      <div className="flex gap-1" role="tablist" aria-label="Hero messages">
                        {slides.map((item, index) => (
                          <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={slide === index}
                            aria-label={item[lang]}
                            onClick={() => setSlide(index)}
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              slide === index ? 'w-8 bg-primary' : 'w-2 bg-line hover:bg-muted',
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-lg font-bold tracking-tight sm:text-xl" aria-live="polite">
                      {slides[slide][lang]}
                    </p>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={330}>
                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
                  {[
                    ['60+', lang === 'hi' ? 'प्रोडक्ट ट्रैक' : 'products tracked'],
                    ['7 / 15', lang === 'hi' ? 'दिन की ऑर्डर लिस्ट' : 'day order lists'],
                    ['0', lang === 'hi' ? 'रोज़ की एंट्री' : 'daily entries'],
                    ['HI + EN', lang === 'hi' ? 'हिंदी + English' : 'Hindi + English'],
                  ].map(([value, label]) => (
                    <div key={label} className="bg-card p-3.5 sm:p-4">
                      <p className="num text-xl font-black tracking-tight sm:text-2xl">{value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-right text-[10px] text-muted">{t('landing.impactNote')}</p>
              </Reveal>
            </div>

            <Reveal delay={120} className="relative lg:pt-5">
              <div className="absolute -left-4 top-10 hidden rounded-xl border border-line bg-card p-3 shadow-lift sm:flex sm:items-center sm:gap-2 lg:-left-10">
                <span className="rounded-lg bg-[var(--warning-soft)] p-2 text-accent"><TrendingDown className="h-4 w-4" /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{lang === 'hi' ? 'डेड स्टॉक' : 'Dead stock'}</p>
                  <p className="num text-sm font-black">{formatINR(stuck.dead)}</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-2 z-10 hidden rounded-xl border border-line bg-card p-3 shadow-lift sm:flex sm:items-center sm:gap-2 lg:-left-8">
                <span className="rounded-lg bg-[var(--info-soft)] p-2 text-info"><RefreshCw className="h-4 w-4" /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{lang === 'hi' ? 'अनुमानित बचा पैसा' : 'Est. cash to free'}</p>
                  <p className="num text-sm font-black">{formatINR(stuck.freedLow)}–{formatCompactINR(stuck.freedHigh)}</p>
                </div>
              </div>
              <div className="rounded-[22px] border border-line bg-card p-3 shadow-lift">
                <div className="mb-3 flex items-center justify-between gap-3 px-1 pt-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{lang === 'hi' ? 'आज की दुकान' : 'Today at the shop'}</p>
                    <p className="text-sm font-extrabold">{state.business.name}</p>
                  </div>
                  <Badge tone="saffron">DEMO</Badge>
                </div>
                <SystemPanel state={state} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-line bg-bg/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{lang === 'hi' ? 'आज का ऑर्डर' : 'Order today'}</p>
                    <p className="num mt-1 text-lg font-black text-danger">{metrics.filter((m) => m.urgency === 'today').length}</p>
                    <p className="text-[10px] text-muted">{lang === 'hi' ? 'प्रोडक्ट' : 'products'}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-bg/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{lang === 'hi' ? 'अगली गिनती' : 'Next count'}</p>
                    <p className="num mt-1 text-lg font-black text-primary">{formatDate(nextCount).slice(0, 5)}</p>
                    <p className="text-[10px] text-muted">{countDays === null ? '—' : `${countDays} ${lang === 'hi' ? 'दिन पहले' : 'days ago'}`}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-dark dark:text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {lang === 'hi' ? '7-दिन ऑर्डर तैयार' : '7-day order ready'}
                  </div>
                  <span className="num text-xs font-bold">{formatINR(plan.totalCost)}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="border-y border-line bg-card">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            {[t('landing.trust1'), t('landing.trust2'), t('landing.trust3'), t('landing.trustRow')].map((item) => (
              <span key={item} className="flex items-center gap-2 text-[11px] font-semibold text-muted">
                <Check className="h-3.5 w-3.5 text-primary" /> {item}
              </span>
            ))}
          </div>
        </div>

        <Ticker items={ticker} />

        <NumberedSection
          id="problem"
          number="01"
          label={t('landing.problem')}
          title={t('landing.problemTitle')}
          intro={lang === 'hi' ? 'छोटी दुकान का असली दर्द चार्ट नहीं, रोज़ के फैसले हैं।' : lang === 'hinglish' ? 'Chhoti dukaan ka asli dard chart nahi, roz ke decision hain.' : 'The real pain in a small shop is not a chart. It is a decision every morning.'}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Boxes className="h-5 w-5" />,
                title: lang === 'hi' ? 'पैसा बिना बिके माल में फँसा' : lang === 'hinglish' ? 'Paisa bina bike maal mein phasa' : 'Money stuck in unsold stock',
                body: lang === 'hi' ? `${formatINR(stuck.dead)} छह प्रोडक्ट में फँसा है — सैंपल डेमो में।` : lang === 'hinglish' ? `${formatINR(stuck.dead)} chhe product mein phasa hai — sample demo mein.` : `${formatINR(stuck.dead)} is locked in six products in the sample demo.`,
                stat: formatCompactINR(stuck.dead),
              },
              {
                icon: <AlertTriangle className="h-5 w-5" />,
                title: lang === 'hi' ? 'अगली खरीद से पहले माल खत्म' : lang === 'hinglish' ? 'Agli purchase se pehle maal khatam' : 'Products run out before the next purchase',
                body: lang === 'hi' ? `${metrics.filter((m) => m.urgency !== 'later').length} प्रोडक्ट 5 दिन में खत्म या खतरे में हैं।` : lang === 'hinglish' ? `${metrics.filter((m) => m.urgency !== 'later').length} product 5 din mein khatam ya danger mein hain.` : `${metrics.filter((m) => m.urgency !== 'later').length} products are running out within 5 days.`,
                stat: String(metrics.filter((m) => m.urgency !== 'later').length),
              },
              {
                icon: <ReceiptIndianRupee className="h-5 w-5" />,
                title: lang === 'hi' ? 'बढ़ता खर्च, पतला मार्जिन' : lang === 'hinglish' ? 'Badhta kharch, patla margin' : 'Rising expenses, thin margins',
                body: alerts[0]
                  ? lang === 'hi'
                    ? `बिजली का बिल ${alerts[0].increasePct.toFixed(0)}% ऊपर है। तेल और चीनी पर मार्जिन 8–11%.`
                    : lang === 'hinglish'
                      ? `Bijli ka bill ${alerts[0].increasePct.toFixed(0)}% upar hai. Oil aur sugar par margin 8–11%.`
                      : `Electricity is ${alerts[0].increasePct.toFixed(0)}% higher. Oil and sugar earn only 8–11%.`
                  : 'Expenses are stable this month in the sample data.',
                stat: alerts[0] ? `+${alerts[0].increasePct.toFixed(0)}%` : '—',
              },
            ].map((problem, index) => (
              <Reveal key={problem.title} delay={index * 70}>
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-[var(--danger-soft)] p-2.5 text-danger">{problem.icon}</span>
                    <span className="num text-2xl font-black tracking-tight">{problem.stat}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold leading-snug">{problem.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{problem.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <div className="mt-8 overflow-hidden rounded-card border border-line">
              <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] bg-bg px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted sm:px-5">
                <span>{t('landing.comparison')}</span>
                <span>{lang === 'hi' ? 'आज के टूल' : lang === 'hinglish' ? 'Aaj ke tools' : 'Today’s tools'}</span>
                <span className="text-primary">ProfitUp</span>
              </div>
              {[
                [lang === 'hi' ? 'ऑर्डर कब करें' : 'When to reorder', lang === 'hi' ? 'अंदाज़ा' : 'Guesswork', lang === 'hi' ? '7/15 दिन की एडिटेबल लिस्ट' : '7/15-day editable list'],
                [lang === 'hi' ? 'डेड स्टॉक' : 'Dead stock', lang === 'hi' ? 'माल पर धूल' : 'Dust on the shelf', lang === 'hi' ? '₹ में फँसा पैसा + कदम' : '₹ stuck + next step'],
                [lang === 'hi' ? 'मुनाफा' : 'Profit', lang === 'hi' ? 'महीने के अंत में पता' : 'Only at month end', lang === 'hi' ? 'अनुमानित, कारण के साथ' : 'Estimated, explained'],
                [lang === 'hi' ? 'भाषा' : 'Language', 'English', 'हिंदी · English · Hinglish'],
              ].map(([label, old, now], index) => (
                <div key={label} className={cn('grid grid-cols-[1.2fr_0.9fr_0.9fr] items-center px-4 py-3.5 text-xs sm:px-5 sm:text-sm', index % 2 === 0 ? 'bg-card' : 'bg-card/60')}>
                  <span className="font-semibold">{label}</span>
                  <span className="text-muted">{old}</span>
                  <span className="flex items-center gap-1.5 font-semibold text-primary-dark dark:text-primary"><Check className="h-3.5 w-3.5 shrink-0" />{now}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </NumberedSection>

        <NumberedSection
          id="features"
          number="02"
          label={t('landing.features')}
          title={t('landing.featuresTitle')}
          intro={lang === 'hi' ? 'हर कार्ड पलटें — आसान भाषा में काम और आगे का रास्ता।' : lang === 'hinglish' ? 'Har card palto — aasan bhasha mein kaam aur aage ka raasta.' : 'Flip every card for a plain-language explanation and a link into the demo.'}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [<RefreshCw key="r" className="h-5 w-5" />, lang === 'hi' ? 'स्मार्ट रीऑर्डर' : 'Smart Reordering', lang === 'hi' ? 'मांग, लीड टाइम, सेफ्टी और पैक साइज से ऑर्डर मात्रा।' : 'Order quantity from demand, lead time, safety and pack size.', '/demo?next=/app/reorder'],
              [<Boxes key="b" className="h-5 w-5" />, lang === 'hi' ? 'डेड स्टॉक पकड़ें' : 'Dead Stock Detection', lang === 'hi' ? 'कौन सा माल 30+ दिन से नहीं बिका और कितना पैसा फँसा।' : 'Spot 30+ day non-movers and the money locked in them.', '/demo?next=/app/dead-stock'],
              [<CircleDollarSign key="c" className="h-5 w-5" />, lang === 'hi' ? 'फँसे पैसे का विश्लेषण' : 'Money Stuck Analysis', lang === 'hi' ? 'स्टॉक और उधार में फँसे पैसे का साफ हिसाब।' : 'Inventory and udhaar cash, split by health and category.', '/demo?next=/app/money-stuck'],
              [<BarChart3 key="p" className="h-5 w-5" />, lang === 'hi' ? 'मुनाफा और मार्जिन' : 'Profit & Margin Insights', lang === 'hi' ? 'स्टार, सप्लायर से बात, प्रोमोट या हटाओ — चार साफ खाने।' : 'Stars, supplier talk, promote or drop — four clear quadrants.', '/demo?next=/app/profit'],
              [<ReceiptIndianRupee key="e" className="h-5 w-5" />, lang === 'hi' ? 'खर्च अलर्ट' : 'Expense Alerts', lang === 'hi' ? '1.5× या 1.3× नियम से बढ़ता खर्च पकड़ें।' : 'Catch spending above 1.5× last month or 1.3× average.', '/demo?next=/app/expenses'],
              [<Users key="u" className="h-5 w-5" />, lang === 'hi' ? 'उधार ट्रैकिंग' : 'Udhaar Tracking', lang === 'hi' ? '0–7, 8–30, 30+ दिन की उम्र और व्हाट्सएप रिमाइंडर।' : '0–7, 8–30, 30+ day ageing with a WhatsApp reminder.', '/demo?next=/app/udhaar'],
              [<MessageCircleQuestion key="a" className="h-5 w-5" />, lang === 'hi' ? 'ProfitUp से पूछें' : 'Ask ProfitUp', lang === 'hi' ? 'आपके डेटा से जवाब, आंकड़ों के साथ। नियम-आधारित फॉलबैक।' : 'Answers from your data with cited figures and a rule-based fallback.', '/demo?next=/app/ask'],
              [<Gift key="g" className="h-5 w-5" />, lang === 'hi' ? 'त्योहार बूस्ट' : 'Festival Boost', lang === 'hi' ? 'दिवाली +30%, शादी +20%, पैक साइज तक राउंड।' : 'Diwali +30%, wedding +20%, rounded to pack size.', '/demo?next=/app/order'],
            ].map(([icon, title, body, href], index) => (
              <FlipCard key={String(title)} icon={icon as ReactNode} title={String(title)} body={String(body)} index={index + 1} href={String(href)} />
            ))}
          </div>
        </NumberedSection>

        <NumberedSection
          id="how"
          number="03"
          label={t('landing.how')}
          title={t('landing.howTitle')}
          intro={lang === 'hi' ? 'एक बार सेट करें, हफ्ते में पांच मिनट दें।' : lang === 'hinglish' ? 'Ek baar set karo, hafte mein paanch minute do.' : 'Set it once. Give it five minutes a week.'}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              [<ReceiptIndianRupee key="1" className="h-6 w-6" />, t('landing.step1Title'), t('landing.step1Body')],
              [<ClipboardCheck key="2" className="h-6 w-6" />, t('landing.step2Title'), t('landing.step2Body')],
              [<ShoppingCart key="3" className="h-6 w-6" />, t('landing.step3Title'), t('landing.step3Body')],
            ].map(([icon, title, body], index) => (
              <Reveal key={String(title)} delay={index * 80}>
                <Card className="relative h-full overflow-hidden p-6">
                  <span className="absolute -right-2 -top-4 num text-[90px] font-black leading-none text-line/40">{index + 1}</span>
                  <span className="relative rounded-2xl bg-primary-soft p-3 text-primary">{icon}</span>
                  <h3 className="relative mt-6 text-lg font-extrabold">{title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  <div className="relative mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                    <span className="rounded-full border border-line px-2 py-1">STEP {String(index + 1).padStart(2, '0')}</span>
                    <span>{index < 2 ? '→' : '✓'}</span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </NumberedSection>

        <NumberedSection
          id="data"
          number="04"
          label={t('landing.dataLevels')}
          title={t('landing.dataTitle')}
          intro={lang === 'hi' ? 'अनुमान को असली रिकॉर्ड जैसा नहीं दिखाते। हर आंकड़े पर भरोसे का लेवल होता है।' : lang === 'hinglish' ? 'Andaza ko asli record jaisa nahi dikhate. Har figure par bharose ka level hota hai.' : 'We never dress an estimate up as a record. Every insight carries its confidence level.'}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              ['basic', 'Basic', t('landing.basicBody'), ['orders_only'], <AlertTriangle key="a" className="h-5 w-5" />],
              ['good', 'Good', t('landing.goodBody'), ['orders_upi'], <LineChart key="b" className="h-5 w-5" />],
              ['best', 'Best', t('landing.bestBody'), ['full_sales'], <ShieldCheck key="c" className="h-5 w-5" />],
            ].map(([level, label, body, dataLevel, icon], index) => (
              <Reveal key={String(level)} delay={index * 70}>
                <Card className={cn('h-full p-5', level === 'best' && 'border-primary/40')}>
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-bg p-2.5 text-muted">{icon}</span>
                    <DataLevelBadge level={(dataLevel as string[])[0] as 'orders_only'} />
                  </div>
                  <h3 className="mt-5 text-xl font-black uppercase tracking-tight">{label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {level === 'basic' && <><EstimatedBadge /><Badge tone="neutral">Needs 2 counts</Badge></>}
                    {level === 'good' && <><Badge tone="blue">Partial item sales</Badge><Badge tone="blue">UPI context</Badge></>}
                    {level === 'best' && <><Badge tone="green">Item-wise sales</Badge><Badge tone="green">Best confidence</Badge></>}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {lang === 'hi' ? 'बिना दो स्टॉक गिनती: “Do stock counts to unlock estimates” — कोई नकली आंकड़ा नहीं।' : 'Without two stock counts: “Do stock counts to unlock estimates.” No made-up numbers.'}
          </div>
        </NumberedSection>

        <NumberedSection
          id="showcase"
          number="05"
          label={t('landing.showcase')}
          title={t('landing.showcaseTitle')}
          intro={lang === 'hi' ? 'ये स्क्रीन डेमो दुकान के असली डेटा से बनी हैं। नीचे टैब बदलकर देखें।' : lang === 'hinglish' ? 'Yeh screens demo dukaan ke asli data se bani hain. Neeche tab badal kar dekho.' : 'These views are built from the demo shop data — not screenshots. Switch tabs to explore.'}
        >
          <Showcase
            state={state}
            metrics={metrics}
            summary={summary}
            plan={plan}
            profit={profit}
            stuck={stuck}
          />
        </NumberedSection>

        <NumberedSection
          id="pricing"
          number="06"
          label={t('landing.pricing')}
          title={t('landing.pricingTitle')}
          intro={t('landing.indicative')}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.plans.map((planItem, index) => (
              <Reveal key={planItem.id} delay={index * 70}>
                <Card className={cn('relative h-full overflow-hidden p-6', planItem.featured && 'border-primary bg-primary-dark text-white')}>
                  {planItem.featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      {lang === 'hi' ? 'सुझाया' : 'Suggested'}
                    </span>
                  )}
                  <p className="kicker">{t('landing.indicative')}</p>
                  <h3 className={cn('mt-2 text-2xl font-black uppercase tracking-tight', planItem.featured && 'text-white')}>{t(planItem.nameKey)}</h3>
                  <p className={cn('num mt-4 text-4xl font-black tracking-tight', planItem.featured ? 'text-white' : 'text-ink')}>{planItem.price}</p>
                  <p className={cn('mt-1 text-[10px] font-bold uppercase tracking-wider', planItem.featured ? 'text-white/60' : 'text-muted')}>{planItem.cadence || t('landing.indicative')}</p>
                  <p className={cn('mt-4 text-sm leading-relaxed', planItem.featured ? 'text-white/80' : 'text-muted')}>{t(planItem.bodyKey)}</p>
                  <Link
                    to={planItem.cta === 'contact' ? '/#contact' : '/demo'}
                    className={cn('mt-6 w-full', planItem.featured ? 'btn-base bg-white text-primary-dark hover:bg-white/90' : buttonClass('secondary'))}
                  >
                    {planItem.featured ? t('landing.tryDemo') : t('nav.getStarted')} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <ul className={cn('mt-5 space-y-2 text-xs', planItem.featured ? 'text-white/80' : 'text-muted')}>
                    {(planItem.id === 'free'
                      ? ['1 outlet', '60 products', '7-day order list']
                      : planItem.id === 'pro'
                        ? ['15-day cover', 'Reports & Ask ProfitUp', 'Udhaar reminders']
                        : ['Multiple outlets', 'Consolidated dashboard', 'Staff access']
                    ).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0" /> {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">{t('landing.indicative')} No payment integration is connected.</p>
        </NumberedSection>

        <NumberedSection
          id="faq"
          number="07"
          label={t('landing.faq')}
          title={t('landing.faqTitle')}
          className="bg-bg"
        >
          <div className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
            <div className="rounded-card border border-line bg-card p-5">
              <span className="inline-flex rounded-xl bg-primary-soft p-3 text-primary"><MessageCircleQuestion className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-extrabold">{lang === 'hi' ? 'सवाल पूछें, सीधा जवाब पाएं' : lang === 'hinglish' ? 'Sawaal poochho, seedha jawab pao' : 'Ask a question. Get a straight answer.'}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{lang === 'hi' ? 'ऐप के अंदर Ask ProfitUp आपके डेटा से जवाब देता है।' : 'Inside the app, Ask ProfitUp answers from your data.'}</p>
              <Link to="/demo?next=/app/ask" className={cn(buttonClass('secondary', 'sm'), 'mt-4')}>
                {t('landing.tryDemo')} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Accordion
              defaultOpen="q1"
              items={[
                { id: 'q1', question: t('landing.faq1Q'), answer: t('landing.faq1A') },
                { id: 'q2', question: t('landing.faq2Q'), answer: t('landing.faq2A') },
                { id: 'q3', question: t('landing.faq3Q'), answer: t('landing.faq3A') },
                { id: 'q4', question: t('landing.faq4Q'), answer: t('landing.faq4A') },
                { id: 'q5', question: t('landing.faq5Q'), answer: t('landing.faq5A') },
                { id: 'q6', question: t('landing.faq6Q'), answer: t('landing.faq6A') },
              ]}
            />
          </div>
        </NumberedSection>

        <section className="relative overflow-hidden bg-primary-dark py-16 text-white sm:py-24">
          <div className="absolute inset-0 dot-bg opacity-10" aria-hidden="true" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-36 left-10 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">08 · {lang === 'hi' ? 'शुरू करें' : 'Start'}</p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <h2 className="display max-w-4xl text-4xl text-white sm:text-6xl lg:text-7xl">{t('landing.cta')}</h2>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{t('landing.ctaSub')}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/demo" className="btn-base min-h-12 bg-white px-6 py-3 text-primary-dark hover:bg-white/90">
                  <ShoppingBasket className="h-4 w-4" /> {t('landing.tryDemo')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/signup" className="btn-base min-h-12 border border-white/25 px-6 py-3 text-white hover:bg-white/10">
                  {t('landing.getStarted')}
                </Link>
                <p className="text-center text-[10px] uppercase tracking-wider text-white/50">No card. No daily entry.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Showcase({
  state,
  metrics,
  summary,
  plan,
  profit,
  stuck,
}: {
  state: ReturnType<typeof createDemoState>;
  metrics: ReturnType<typeof allProductMetrics>;
  summary: ReturnType<typeof inventorySummary>;
  plan: ReturnType<typeof buildOrderPlan>;
  profit: ReturnType<typeof profitAnalysis>;
  stuck: ReturnType<typeof moneyStuck>;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('dashboard');
  const urgent = [...metrics].filter((metric) => metric.urgency !== 'later').sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-card shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-muted">ProfitUp · Demo</span>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          ariaLabel="Product showcase"
          tabs={[
            { id: 'dashboard', label: t('nav.dashboard') },
            { id: 'radar', label: t('nav.reorder') },
            { id: 'order', label: t('nav.smartOrder') },
            { id: 'stuck', label: t('nav.moneyStuck') },
            { id: 'profit', label: t('nav.profit') },
          ]}
        />
      </div>
      <div className="min-h-[430px] bg-bg p-3 sm:p-5">
        {tab === 'dashboard' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker">Dashboard</p>
                <h3 className="text-xl font-extrabold tracking-tight">{state.business.name}</h3>
                <p className="text-xs text-muted">{state.business.city} · Demo data</p>
              </div>
              <Link to="/demo?next=/app" className={buttonClass('primary', 'sm')}>Next Order Banao <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                [t('dashboard.stockValue'), formatINR(summary.totalValue)],
                [t('dashboard.moneyStuck'), formatINR(stuck.dead)],
                [t('dashboard.reorderNeeded'), `${summary.reorderCount}`],
                [t('dashboard.monthlyProfit'), formatINR(profit.netEstimate)],
              ].map(([label, value], index) => (
                <div key={label} className="rounded-xl border border-line bg-card p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="num mt-2 text-base font-black sm:text-lg">{value}</p>
                  {index === 3 && <EstimatedBadge />}
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-xl border border-line bg-card p-4">
                <p className="kicker">Inventory health</p>
                <HealthBars summary={summary} />
              </div>
              <div className="rounded-xl border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="kicker">{t('dashboard.reorderPreview')}</p>
                  <span className="text-[10px] text-muted">Today · 3D · 5D</span>
                </div>
                <div className="mt-3 space-y-2">
                  {urgent.slice(0, 4).map((metric) => (
                    <div key={metric.product.id} className="flex items-center gap-3 rounded-lg bg-bg px-2.5 py-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{metric.product.name}</span>
                      <span className="num text-[10px] text-muted">{metric.stock} left</span>
                      <UrgencyChip urgency={metric.urgency} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="kicker">{t('dashboard.actionsTitle')}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {state.actions.slice(0, 3).map((action, index) => (
                  <div key={action.id} className="rounded-lg border border-line bg-bg/60 p-3">
                    <span className="num text-[9px] font-black text-muted">0{index + 1}</span>
                    <p className="mt-1 line-clamp-2 text-xs font-bold">{action.title}</p>
                    <p className="num mt-2 text-[10px] font-bold text-primary">{formatINR(action.impactAmount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'radar' && (
          <div className="overflow-hidden rounded-xl border border-line bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
              <div><p className="kicker">Reorder Radar</p><p className="text-sm font-bold">{urgent.length} products need attention</p></div>
              <Badge tone="red">{urgent.filter((m) => m.urgency === 'today').length} today</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="table-head">
                  <tr>{[t('radar.product'), t('radar.stock'), t('radar.daysLeft'), t('radar.qty'), t('radar.cost'), t('radar.urgency')].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {urgent.slice(0, 8).map((metric) => (
                    <tr key={metric.product.id}>
                      <td className="px-3 py-2.5 font-semibold">{metric.product.name}</td>
                      <td className="num px-3 py-2.5">{metric.stock}</td>
                      <td className="num px-3 py-2.5">{metric.daysLeft?.toFixed(1) ?? '—'}</td>
                      <td className="num px-3 py-2.5">{Math.ceil(metric.dailyDemand * 7 * 1.1 - metric.stock)}</td>
                      <td className="num px-3 py-2.5">{formatINR(Math.max(0, Math.ceil(metric.dailyDemand * 7 * 1.1 - metric.stock) * metric.product.costPrice))}</td>
                      <td className="px-3 py-2.5"><UrgencyChip urgency={metric.urgency} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'order' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-card p-3">
              <div><p className="kicker">Smart Order List</p><p className="text-sm font-bold">{plan.items.length} items · 7-day cover</p></div>
              <div className="flex gap-2"><Badge tone="green">10% safety</Badge><Badge tone="neutral">{formatINR(plan.totalCost)}</Badge></div>
            </div>
            <div className="rounded-xl border border-line bg-card">
              {plan.items.slice(0, 7).map((item) => (
                <div key={item.productId} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.name}</span>
                  <span className="num text-[10px] text-muted">{item.stock} → {item.finalQty}</span>
                  <span className="num text-xs font-bold">{formatINR(item.cost)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="red">{plan.skipped.length} dead / no-demand skipped</Badge>
              {plan.supplierTotals.map((supplier) => <Badge key={supplier.supplierId} tone={supplier.belowMinimum ? 'amber' : 'neutral'}>{supplier.supplierName}: {formatINR(supplier.total)}</Badge>)}
            </div>
          </div>
        )}
        {tab === 'stuck' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="kicker">Money Stuck</p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="num text-3xl font-black">{formatINR(stuck.totalValue)}</span>
                <span className="text-xs text-muted">inventory value</span>
              </div>
              <div className="mt-4 flex h-6 overflow-hidden rounded-full">
                <span className="bg-primary" style={{ width: `${(stuck.healthy / stuck.totalValue) * 100}%` }} />
                <span className="bg-accent" style={{ width: `${(stuck.slow / stuck.totalValue) * 100}%` }} />
                <span className="bg-danger" style={{ width: `${(stuck.dead / stuck.totalValue) * 100}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div><StatusBadge status="healthy" /><p className="num mt-1 font-bold">{formatINR(stuck.healthy)}</p></div>
                <div><StatusBadge status="slow" /><p className="num mt-1 font-bold">{formatINR(stuck.slow)}</p></div>
                <div><StatusBadge status="dead" /><p className="num mt-1 font-bold">{formatINR(stuck.dead)}</p></div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {stuck.byCategory.slice(0, 4).map((category) => (
                <div key={category.category} className="rounded-xl border border-line bg-card p-3">
                  <div className="flex items-center justify-between text-xs font-semibold"><span>{category.category}</span><span className="num">{formatINR(category.value)}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full bg-primary" style={{ width: `${(category.value / stuck.totalValue) * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-info/20 bg-[var(--info-soft)] p-3 text-xs text-info">
              Udhaar outstanding: <strong className="num">{formatINR(stuck.udhaar)}</strong>
            </div>
          </div>
        )}
        {tab === 'profit' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="kicker">Profit View</p>
              <p className="num mt-2 text-2xl font-black">{formatINR(profit.totalGrossProfit)}</p>
              <p className="text-xs text-muted">estimated gross / 30 days</p>
              <div className="mt-4 space-y-2">
                {profit.topEarners.slice(0, 4).map((row, index) => (
                  <div key={row.productId} className="flex items-center gap-2 text-xs">
                    <span className="num text-muted">0{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
                    <span className="num font-bold">{formatINR(row.grossProfit)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="kicker">Four quadrants</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['Stars', profit.quadrants.star.length, 'bg-primary-soft text-primary-dark dark:text-primary'],
                  ['Check supplier', profit.quadrants.supplier.length, 'bg-[var(--warning-soft)] text-accent'],
                  ['Promote', profit.quadrants.promote.length, 'bg-[var(--info-soft)] text-info'],
                  ['Drop', profit.quadrants.drop.length, 'bg-[var(--danger-soft)] text-danger'],
                ].map(([label, count, tone]) => (
                  <div key={String(label)} className={cn('rounded-xl p-3', String(tone))}>
                    <p className="text-[10px] font-bold uppercase tracking-wide">{label}</p>
                    <p className="num mt-1 text-2xl font-black">{String(count)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted">Gross profit = sales − cost of goods. Net estimate also subtracts expenses.</p>
            </div>
            <div className="md:col-span-2 rounded-xl border border-line bg-card p-4">
              <p className="kicker">Low margin, high volume</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profit.lowMarginHighVolume.map((row) => (
                  <Badge key={row.productId} tone="amber">{row.name} · {row.marginPct.toFixed(1)}%</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-card px-4 py-3">
        <p className="text-[10px] text-muted">Live components · sample shop · every figure is labelled</p>
        <Link to="/demo" className="inline-flex items-center gap-1 text-xs font-bold text-primary">Open demo shop <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}

function HealthBars({ summary }: { summary: ReturnType<typeof inventorySummary> }) {
  const { t } = useTranslation();
  const total = Math.max(1, summary.totalValue);
  return (
    <div className="mt-4">
      <div className="flex h-7 overflow-hidden rounded-full">
        <span className="bg-primary" style={{ width: `${(summary.byStatus.healthy.value / total) * 100}%` }} />
        <span className="bg-accent" style={{ width: `${(summary.byStatus.slow.value / total) * 100}%` }} />
        <span className="bg-danger" style={{ width: `${(summary.byStatus.dead.value / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {(['healthy', 'slow', 'dead'] as const).map((status) => (
          <div key={status}>
            <StatusBadge status={status} />
            <p className="num mt-1 text-xs font-bold">{formatINR(summary.byStatus[status].value)}</p>
            <p className="text-[9px] text-muted">{summary.byStatus[status].count} {t('common.products')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
