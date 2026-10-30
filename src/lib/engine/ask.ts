import type { AppState, Confidence, Lang } from '../types';
import { formatCompactINR, formatINR } from '../format';
import { buildOrderPlan, DEFAULT_ORDER_OPTIONS } from './orders';
import { expenseAlerts, moneyStuck, profitAnalysis, udhaarAgeing } from './insights';
import { allProductMetrics } from './metrics';

export interface AskCitation {
  label: string;
  value: string;
}

export interface AskResponse {
  text: string;
  citations: AskCitation[];
  confidence: Confidence;
  source: 'rules' | 'llm';
  disclaimer: string;
}

const disclaimer = {
  hi: 'सलाह आपके डेटा पर आधारित है; फैसला आपका है।',
  en: 'Advice is based on your data; decisions are yours.',
  hinglish: 'Salah aapke data par based hai; decision aapka hai.',
};

export function answerQuestion(
  state: AppState,
  question: string,
  lang: Lang = 'en',
  context?: { productId?: string },
): AskResponse {
  const lower = question.toLowerCase();
  if (lower.includes('order') || lower.includes('ऑर्डर') || lower.includes('kya mangau') || lower.includes('reorder')) {
    return orderAnswer(state, lang);
  }
  if (
    lower.includes('dead') ||
    lower.includes('nahi bik') ||
    lower.includes('नहीं बिक') ||
    lower.includes('slow') ||
    lower.includes('stuck') ||
    lower.includes('फँसा')
  ) {
    return deadStockAnswer(state, lang);
  }
  if (lower.includes('profit') || lower.includes('मुनाफ') || lower.includes('margin') || lower.includes('munafa')) {
    return profitAnswer(state, lang);
  }
  if (lower.includes('expense') || lower.includes('kharch') || lower.includes('खर्च') || lower.includes('electricity')) {
    return expenseAnswer(state, lang);
  }
  if (lower.includes('udhaar') || lower.includes('उधार') || lower.includes('payment')) {
    return udhaarAnswer(state, lang);
  }
  if (lower.includes('diwali') || lower.includes('festival') || lower.includes('त्योहार')) {
    return festivalAnswer(state, lang);
  }
  if (context?.productId) {
    return productAnswer(state, context.productId, lang);
  }
  return overviewAnswer(state, lang);
}

function orderAnswer(state: AppState, lang: Lang): AskResponse {
  const plan = buildOrderPlan(state, { ...DEFAULT_ORDER_OPTIONS, coverDays: 7 });
  const top = [...plan.items].sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99)).slice(0, 6);
  const names = top.map((item) => `${item.name} (${item.finalQty})`).join(', ');
  const copy = {
    hi: `अगले 7 दिनों के लिए ${plan.items.length} प्रोडक्ट का ऑर्डर चाहिए. सबसे पहले: ${names || 'अभी कोई जरूरी ऑर्डर नहीं'}. कुल अनुमानित लागत ${formatINR(plan.totalCost)} है. ${plan.skipped.length} धीमे/बिना मांग वाले प्रोडक्ट छोड़े गए हैं.`,
    en: `You need ${plan.items.length} products for the next 7 days. First: ${names || 'nothing urgent right now'}. Estimated cost ${formatINR(plan.totalCost)}. ${plan.skipped.length} slow or no-demand products were skipped.`,
    hinglish: `Agle 7 din ke liye ${plan.items.length} product ka order chahiye. Pehle: ${names || 'abhi kuch urgent nahi'}. Total andaaza ${formatINR(plan.totalCost)}. ${plan.skipped.length} slow/no-demand product chhode gaye.`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'ऑर्डर लागत (अनुमानित)' : 'Order cost (estimated)', value: formatINR(plan.totalCost) },
      { label: lang === 'hi' ? 'जरूरी प्रोडक्ट' : 'Products to order', value: String(plan.items.length) },
      { label: lang === 'hi' ? 'छोड़े गए' : 'Skipped', value: String(plan.skipped.length) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function deadStockAnswer(state: AppState, lang: Lang): AskResponse {
  const stuck = moneyStuck(state);
  const dead = stuck.products
    .filter((metric) => metric.status === 'dead')
    .sort((a, b) => b.stockValue - a.stockValue);
  const names = dead.slice(0, 5).map((metric) => metric.product.name).join(', ');
  const copy = {
    hi: `${dead.length} प्रोडक्ट ${formatINR(stuck.dead)} में फँसे हैं. सबसे बड़े: ${names}. पहले बंडल ऑफर या सप्लायर रिटर्न से शुरुआत करें; इन्हें दोबारा ऑर्डर न करें.`,
    en: `${dead.length} products have ${formatINR(stuck.dead)} stuck. Biggest: ${names}. Start with a bundle offer or supplier return, and stop reordering them.`,
    hinglish: `${dead.length} product mein ${formatINR(stuck.dead)} phasa hai. Sabse bade: ${names}. Pehle bundle offer ya supplier return karo; inhe dobara order mat karo.`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'डेड स्टॉक' : 'Dead stock', value: formatINR(stuck.dead) },
      { label: lang === 'hi' ? 'प्रोडक्ट' : 'Products', value: String(dead.length) },
      { label: lang === 'hi' ? 'कुल स्टॉक' : 'Total inventory', value: formatINR(stuck.totalValue) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function profitAnswer(state: AppState, lang: Lang): AskResponse {
  const profit = profitAnalysis(state);
  const top = profit.topEarners[0];
  const leak = profit.lowMarginHighVolume[0];
  const copy = {
    hi: `अनुमानित मासिक ग्रॉस प्रॉफिट ${formatINR(profit.totalGrossProfit)} है. सबसे ज्यादा कमाई ${top?.name ?? '—'} से है. ${leak ? `${leak.name} ज्यादा बिकता है पर मार्जिन सिर्फ ${leak.marginPct.toFixed(1)}% है — सप्लायर से रेट या बंडल पर बात करें.` : 'अभी कोई बड़ा मार्जिन लीक नहीं दिखा.'}`,
    en: `Estimated monthly gross profit is ${formatINR(profit.totalGrossProfit)}. ${top?.name ?? 'No product'} earns the most. ${leak ? `${leak.name} sells well but earns only ${leak.marginPct.toFixed(1)}% — renegotiate the rate or bundle it.` : 'No major margin leak detected.'}`,
    hinglish: `Andaza monthly gross profit ${formatINR(profit.totalGrossProfit)} hai. Sabse zyada kamai ${top?.name ?? '—'} se hai. ${leak ? `${leak.name} zyada bikta hai par margin sirf ${leak.marginPct.toFixed(1)}% hai — supplier se rate ya bundle par baat karo.` : 'Abhi koi bada margin leak nahi dikha.'}`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'ग्रॉस प्रॉफिट (अनुमानित)' : 'Gross profit (estimated)', value: formatINR(profit.totalGrossProfit) },
      { label: lang === 'hi' ? 'नेट (अनुमानित)' : 'Net (estimated)', value: formatINR(profit.netEstimate) },
      { label: lang === 'hi' ? 'खर्च' : 'Expenses', value: formatINR(profit.expensesThisMonth) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function expenseAnswer(state: AppState, lang: Lang): AskResponse {
  const alerts = expenseAlerts(state);
  const first = alerts[0];
  const copy = first
    ? {
        hi: `${first.category} खर्च इस महीने ${formatINR(first.current)} है, पिछले महीने से ${first.increasePct.toFixed(0)}% ज्यादा. बिल और रेगुलर खर्च की जांच करें.`,
        en: `${first.category} spending is ${formatINR(first.current)} this month, ${first.increasePct.toFixed(0)}% higher. Check the bill and recurring charges.`,
        hinglish: `${first.category} kharch is mahine ${formatINR(first.current)} hai, pichhle mahine se ${first.increasePct.toFixed(0)}% zyada. Bill aur recurring charge check karo.`,
      }[lang]
    : {
        hi: 'इस महीने कोई बड़ा खर्च स्पाइक नहीं दिखा. फिर भी रेंट, बिजली और मजदूरी की समीक्षा करते रहें.',
        en: 'No major expense spike this month. Still review rent, electricity and wages regularly.',
        hinglish: 'Is mahine koi bada kharch spike nahi dikha. Phir bhi rent, bijli aur wages review karte raho.',
      }[lang];
  return {
    text: copy,
    citations: alerts.slice(0, 3).map((alert) => ({
      label: `${alert.category} (${alert.increasePct.toFixed(0)}%)`,
      value: formatINR(alert.current),
    })),
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function udhaarAnswer(state: AppState, lang: Lang): AskResponse {
  const ageing = udhaarAgeing(state);
  const oldest = [...ageing.customers].sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
  const copy = {
    hi: `कुल उधार ${formatINR(ageing.total)} है; ${formatINR(ageing.days30plus)} 30 दिन से ज्यादा पुराना है. ${oldest ? `${oldest.name} को ${oldest.daysOverdue} दिन हो गए.` : ''} व्हाट्सएप रिमाइंडर भेजें.`,
    en: `Total udhaar is ${formatINR(ageing.total)}; ${formatINR(ageing.days30plus)} is over 30 days old. ${oldest ? `${oldest.name} is ${oldest.daysOverdue} days overdue.` : ''} Send a WhatsApp reminder.`,
    hinglish: `Total udhaar ${formatINR(ageing.total)} hai; ${formatINR(ageing.days30plus)} 30 din se zyada purana hai. ${oldest ? `${oldest.name} ko ${oldest.daysOverdue} din ho gaye.` : ''} WhatsApp reminder bhejo.`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'कुल उधार' : 'Total udhaar', value: formatINR(ageing.total) },
      { label: '30+', value: formatINR(ageing.days30plus) },
      { label: '8–30', value: formatINR(ageing.days8to30) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function festivalAnswer(state: AppState, lang: Lang): AskResponse {
  const plan = buildOrderPlan(state, { ...DEFAULT_ORDER_OPTIONS, festivalBoost: 1.3 });
  const top = plan.items.slice(0, 5).map((item) => `${item.name} (${item.finalQty})`).join(', ');
  const copy = {
    hi: `दिवाली बूस्ट +30% के साथ ${formatINR(plan.totalCost)} का ऑर्डर बनता है. मुख्य आइटम: ${top}. यह अनुमान है, अपना बजट और स्टोर स्पेस देखकर मात्रा घटाएं.`,
    en: `With a +30% Diwali boost, the order plan is ${formatINR(plan.totalCost)}. Key items: ${top}. This is an estimate; adjust for your budget and shelf space.`,
    hinglish: `Diwali boost +30% ke saath ${formatINR(plan.totalCost)} ka order banta hai. Main item: ${top}. Yeh andaaza hai, budget aur shelf space dekhkar qty adjust karo.`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'फेस्टिवल बूस्ट' : 'Festival boost', value: '+30%' },
      { label: lang === 'hi' ? 'ऑर्डर लागत' : 'Order cost', value: formatINR(plan.totalCost) },
      { label: lang === 'hi' ? 'आइटम' : 'Items', value: String(plan.items.length) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function productAnswer(state: AppState, productId: string, lang: Lang): AskResponse {
  const metric = allProductMetrics(state).find((entry) => entry.product.id === productId);
  if (!metric) return overviewAnswer(state, lang);
  const copy = {
    hi: `${metric.product.name}: ${metric.stock} यूनिट बचे हैं, अनुमानित मांग ${metric.dailyDemand.toFixed(2)}/दिन है. ${metric.daysLeft === null ? 'मांग नहीं दिख रही.' : `लगभग ${metric.daysLeft.toFixed(1)} दिन का स्टॉक है.`}`,
    en: `${metric.product.name}: ${metric.stock} units left, estimated demand ${metric.dailyDemand.toFixed(2)}/day. ${metric.daysLeft === null ? 'No demand detected.' : `About ${metric.daysLeft.toFixed(1)} days of stock.`}`,
    hinglish: `${metric.product.name}: ${metric.stock} unit bache hain, andaaza demand ${metric.dailyDemand.toFixed(2)}/din. ${metric.daysLeft === null ? 'Demand nahi dikh rahi.' : `Lagbhag ${metric.daysLeft.toFixed(1)} din ka stock hai.`}`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'स्टॉक' : 'Stock', value: String(metric.stock) },
      { label: lang === 'hi' ? 'मांग' : 'Demand', value: metric.dailyDemand.toFixed(2) },
      { label: lang === 'hi' ? 'दिन बचे' : 'Days left', value: metric.daysLeft === null ? '—' : metric.daysLeft.toFixed(1) },
    ],
    confidence: metric.confidence,
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

function overviewAnswer(state: AppState, lang: Lang): AskResponse {  const profit = profitAnalysis(state);
  const stuck = moneyStuck(state);
  const plan = buildOrderPlan(state, DEFAULT_ORDER_OPTIONS);
  const copy = {
    hi: `आपके स्टोर में ${formatINR(stuck.totalValue)} का स्टॉक है, जिसमें ${formatINR(stuck.dead)} डेड है. अगले 7 दिनों के लिए ${plan.items.length} प्रोडक्ट ऑर्डर करने योग्य हैं. अनुमानित मासिक ग्रॉस प्रॉफिट ${formatINR(profit.totalGrossProfit)} है. पूछें: "क्या ऑर्डर करूं?", "कौन सा माल नहीं बिक रहा?"`,
    en: `Your store holds ${formatINR(stuck.totalValue)} of stock, including ${formatINR(stuck.dead)} dead. ${plan.items.length} products need ordering for the next 7 days. Estimated monthly gross profit is ${formatINR(profit.totalGrossProfit)}. Ask: "What should I order?" or "What is not selling?"`,
    hinglish: `Store mein ${formatINR(stuck.totalValue)} ka stock hai, jisme ${formatINR(stuck.dead)} dead hai. Agle 7 din ke liye ${plan.items.length} product order karne layak hain. Andaza monthly gross profit ${formatINR(profit.totalGrossProfit)} hai. Poochho: "Kya order karun?" ya "Kaunsa maal nahi bik raha?"`,
  }[lang];
  return {
    text: copy,
    citations: [
      { label: lang === 'hi' ? 'स्टॉक वैल्यू' : 'Stock value', value: formatCompactINR(stuck.totalValue) },
      { label: lang === 'hi' ? 'डेड स्टॉक' : 'Dead stock', value: formatCompactINR(stuck.dead) },
      { label: lang === 'hi' ? 'ऑर्डर आइटम' : 'Order items', value: String(plan.items.length) },
    ],
    confidence: 'basic',
    source: 'rules',
    disclaimer: disclaimer[lang],
  };
}

