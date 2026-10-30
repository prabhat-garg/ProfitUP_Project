import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PublicFooter, PublicHeader } from '../components/layout';
import { Logo } from '../components/shared';
import { buttonClass } from '../components/ui';
import type { Lang } from '../lib/types';

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalCopy {
  kicker: string;
  privacyTitle: string;
  privacyIntro: string;
  termsTitle: string;
  termsIntro: string;
  updated: string;
  templateNote: string;
  privacy: LegalSection[];
  terms: LegalSection[];
}

const copy: Record<Lang, LegalCopy> = {
  en: {
    kicker: 'Legal',
    privacyTitle: 'Privacy policy',
    privacyIntro: 'What ProfitUp stores, why it stores it, and what you can do about it.',
    termsTitle: 'Terms of use',
    termsIntro: 'The practical rules for using this demo and any future ProfitUp account.',
    updated: 'Last updated: 29 October 2026',
    templateNote: 'This is a product template, not legal advice. Have a qualified lawyer review it before launch.',
    privacy: [
      {
        title: 'What we collect',
        body: [
          'Shop profile: business name, owner name, phone number, city, state, PIN, business type, language and outlet details you choose to enter.',
          'Shop records you add or import: products, purchase bills, stock counts, sales rows, expenses, supplier details, udhaar customers and payment records.',
          'App activity: actions you mark done or snooze, settings changes, order lists, notifications and an audit log of changes made in the app.',
        ],
      },
      {
        title: 'Where the demo stores data',
        body: [
          'This demo stores data in your browser localStorage under a key tied to the current demo or owner session. It does not send shop records to a ProfitUp server.',
          'Clearing site data, using a private window or deleting the account from Settings removes that local copy. There is no server backup in demo mode.',
        ],
      },
      {
        title: 'Why we use it',
        body: [
          'To calculate demand estimates, reorder suggestions, dead-stock value, profit estimates, expense alerts, udhaar ageing and reports you request.',
          'To remember your language, theme, thresholds and notification preferences so the app behaves consistently between visits.',
          'To show an activity log so a shop owner can see what changed and when.',
        ],
      },
      {
        title: 'Sharing',
        body: [
          'Demo mode does not sell, rent or share your data with advertisers. Files you deliberately download, copy to WhatsApp or share with a CA or supplier leave the app at your instruction.',
          'If a production backend is connected, data access must be limited by authentication and row-level security. The project README documents the intended Supabase policies.',
        ],
      },
      {
        title: 'Your choices',
        body: [
          'You can edit or delete records inside the app, export a backup CSV, reset demo data, withdraw consent in Settings and delete the account data stored in this browser.',
          'Some records may remain in exported files you downloaded earlier. Those copies are outside ProfitUp’s control.',
        ],
      },
      {
        title: 'Security and limits',
        body: [
          'Browser storage is not multi-user security. Anyone with access to this browser profile may be able to read the demo data. Do not enter real customer or financial data into a shared demo device.',
          'Production use requires Supabase Auth, row-level security, encrypted transport and operational safeguards. Those are not active in this local demo.',
        ],
      },
      {
        title: 'Contact',
        body: [
          'Questions about this policy can be sent to hello@profitup.example. This address is a placeholder and must be replaced before launch.',
        ],
      },
    ],
    terms: [
      {
        title: 'Acceptance',
        body: [
          'By using this demo you agree to these terms. If you do not agree, do not use the app or enter shop data.',
        ],
      },
      {
        title: 'Demo and sample data',
        body: [
          'Demo mode is a product demonstration. It includes sample records for a fictional Sharma General Store in Bhopal. Sample figures, customers, suppliers and notifications are not real business records.',
          'Demo mode does not send WhatsApp messages, SMS, payments or emails. Screens labelled “Mock: not sent” are visual examples only.',
        ],
      },
      {
        title: 'Estimates, not audited accounts',
        body: [
          'Demand, reorder quantities, profit, money stuck, recovery values, data-health scores and reports are planning estimates. They depend on the records and assumptions you provide.',
          'ProfitUp is not an accountant, lender, tax adviser or auditor. Reports are not audited financial statements and must not be filed as statutory accounts without professional review.',
        ],
      },
      {
        title: 'Your responsibilities',
        body: [
          'Enter accurate records, keep your device secure, and confirm prices, stock and supplier terms before placing an order.',
          'You are responsible for the data you import and for having the right to use it. Do not upload another business’s confidential data without permission.',
        ],
      },
      {
        title: 'Availability and changes',
        body: [
          'The demo is provided as-is, without a service-level guarantee. Features, thresholds, copy and sample data may change.',
          'Production pricing and paid-plan terms are not finalised in this build. Any price shown as a placeholder must not be treated as an offer.',
        ],
      },
      {
        title: 'Limitation of liability',
        body: [
          'To the extent permitted by law, ProfitUp is not liable for business losses, lost profits, stock decisions, supplier disputes or data loss arising from use of this demo.',
          'Nothing in these terms limits rights that cannot be limited under applicable Indian law.',
        ],
      },
      {
        title: 'Governing law',
        body: [
          'These terms are intended to be governed by the laws of India. Disputes would be subject to the courts at the operator’s registered location, once a real operator is appointed.',
        ],
      },
    ],
  },
  hi: {
    kicker: 'कानूनी',
    privacyTitle: 'प्राइवेसी पॉलिसी',
    privacyIntro: 'ProfitUp क्या सेव करता है, क्यों सेव करता है, और आप क्या कर सकते हैं।',
    termsTitle: 'उपयोग की शर्तें',
    termsIntro: 'इस डेमो और भविष्य के ProfitUp अकाउंट के लिए व्यावहारिक नियम।',
    updated: 'अंतिम अपडेट: 29 अक्टूबर 2026',
    templateNote: 'यह प्रोडक्ट टेम्पलेट है, कानूनी सलाह नहीं। लॉन्च से पहले वकील से जांच कराएं।',
    privacy: [
      {
        title: 'हम क्या इकट्ठा करते हैं',
        body: [
          'दुकान की प्रोफाइल: बिजनेस का नाम, मालिक का नाम, फोन, शहर, राज्य, पिन, बिजनेस टाइप, भाषा और आपके बताए आउटलेट की जानकारी।',
          'आपके द्वारा जोड़े या इम्पोर्ट किए गए रिकॉर्ड: प्रोडक्ट, खरीद बिल, स्टॉक काउंट, बिक्री पंक्तियां, खर्चे, सप्लायर, उधार ग्राहक और पेमेंट।',
          'ऐप गतिविधि: पूरा या स्नूज़ किए गए काम, सेटिंग बदलाव, ऑर्डर लिस्ट, नोटिफिकेशन और बदलावों का ऑडिट लॉग।',
        ],
      },
      {
        title: 'डेमो डेटा कहां रहता है',
        body: [
          'यह डेमो डेटा आपके ब्राउज़र के localStorage में मौजूदा डेमो या ओनर सेशन की key में रखता है। दुकान का डेटा ProfitUp सर्वर पर नहीं भेजा जाता।',
          'साइट डेटा साफ करने, प्राइवेट विंडो इस्तेमाल करने या सेटिंग्स से अकाउंट डिलीट करने पर यह लोकल कॉपी हट जाती है। डेमो में सर्वर बैकअप नहीं है।',
        ],
      },
      {
        title: 'डेटा क्यों इस्तेमाल होता है',
        body: [
          'मांग का अनुमान, रीऑर्डर सुझाव, डेड स्टॉक value, मुनाफे का अनुमान, खर्चे के अलर्ट, उधार की उम्र और रिपोर्ट बनाने के लिए।',
          'भाषा, थीम, थ्रेशोल्ड और नोटिफिकेशन पसंद याद रखने के लिए, ताकि अगली बार ऐप वैसा ही चले।',
          'गतिविधि लॉग दिखाने के लिए, ताकि मालिक देख सके कि क्या और कब बदला।',
        ],
      },
      {
        title: 'साझा करना',
        body: [
          'डेमो मोड आपका डेटा विज्ञापनदाताओं को बेचता, किराए पर देता या साझा नहीं करता। आपकी मर्जी से डाउनलोड की गई फाइल, व्हाट्सएप कॉपी या CA/सप्लायर को भेजी गई जानकारी ऐप से बाहर जाती है।',
          'अगर प्रोडक्शन बैकएंड जुड़े, तो डेटा एक्सेस ऑथेंटिकेशन और row-level security से सीमित होना चाहिए। प्रोजेक्ट README में Supabase नीति लिखी है।',
        ],
      },
      {
        title: 'आपके विकल्प',
        body: [
          'आप ऐप में रिकॉर्ड बदल या हटा सकते हैं, बैकअप CSV डाउनलोड कर सकते हैं, डेमो रीसेट कर सकते हैं, सेटिंग्स में सहमति वापस ले सकते हैं और ब्राउज़र का अकाउंट डेटा डिलीट कर सकते हैं।',
          'पहले डाउनलोड की गई फाइलों में डेटा रह सकता है। वे कॉपी ProfitUp के नियंत्रण से बाहर हैं।',
        ],
      },
      {
        title: 'सुरक्षा और सीमाएं',
        body: [
          'ब्राउज़र स्टोरेज मल्टी-यूजर सुरक्षा नहीं है। जिसके पास इस ब्राउज़र प्रोफाइल की पहुंच है, वह डेमो डेटा पढ़ सकता है। साझा डेमो डिवाइस में असली ग्राहक या वित्तीय डेटा न डालें।',
          'प्रोडक्शन के लिए Supabase Auth, row-level security, एन्क्रिप्टेड ट्रांसपोर्ट और ऑपरेशनल सुरक्षा चाहिए। ये इस लोकल डेमो में सक्रिय नहीं हैं।',
        ],
      },
      {
        title: 'संपर्क',
        body: [
          'इस पॉलिसी पर सवाल hello@profitup.example पर भेजें। यह पता प्लेसहोल्डर है और लॉन्च से पहले बदलना जरूरी है।',
        ],
      },
    ],
    terms: [
      {
        title: 'स्वीकृति',
        body: ['इस डेमो का उपयोग करके आप इन शर्तों से सहमत होते हैं। सहमत न हों तो ऐप इस्तेमाल न करें और दुकान का डेटा दर्ज न करें।'],
      },
      {
        title: 'डेमो और सैंपल डेटा',
        body: [
          'डेमो मोड प्रोडक्ट का प्रदर्शन है। इसमें भोपाल के काल्पनिक शर्मा जनरल स्टोर के सैंपल रिकॉर्ड हैं। सैंपल आंकड़े, ग्राहक, सप्लायर और नोटिफिकेशन असली कारोबारी रिकॉर्ड नहीं हैं।',
          'डेमो मोड व्हाट्सएप, SMS, पेमेंट या ईमेल नहीं भेजता। “मॉक: नहीं भेजा” वाले स्क्रीन सिर्फ उदाहरण हैं।',
        ],
      },
      {
        title: 'अनुमान, ऑडिटेड हिसाब नहीं',
        body: [
          'मांग, रीऑर्डर मात्रा, मुनाफा, फंसा पैसा, रिकवरी value, डेटा-हेल्थ स्कोर और रिपोर्ट योजना के अनुमान हैं। ये आपके रिकॉर्ड और मान्यताओं पर निर्भर हैं।',
          'ProfitUp अकाउंटेंट, लेंडर, टैक्स सलाहकार या ऑडिटर नहीं है। रिपोर्ट ऑडिटेड वित्तीय विवरण नहीं हैं और पेशेवर जांच के बिना सरकारी हिसाब में न लगाएं।',
        ],
      },
      {
        title: 'आपकी जिम्मेदारी',
        body: [
          'सही रिकॉर्ड डालें, डिवाइस सुरक्षित रखें और ऑर्डर से पहले रेट, स्टॉक और सप्लायर की शर्तें जांचें।',
          'आप जो डेटा इम्पोर्ट करते हैं उसकी जिम्मेदारी आपकी है। किसी दूसरे कारोबार का गोपनीय डेटा बिना अनुमति न डालें।',
        ],
      },
      {
        title: 'उपलब्धता और बदलाव',
        body: [
          'डेमो जैसा है वैसा दिया जाता है, किसी सेवा-स्तर की गारंटी के बिना। फीचर, थ्रेशोल्ड, टेक्स्ट और सैंपल डेटा बदल सकते हैं।',
          'इस बिल्ड में प्रोडक्शन कीमत और पेड-प्लान शर्तें तय नहीं हैं। प्लेसहोल्डर कीमत को ऑफर न मानें।',
        ],
      },
      {
        title: 'जिम्मेदारी की सीमा',
        body: [
          'कानून की सीमा तक, ProfitUp इस डेमो के उपयोग से होने वाले कारोबारी नुकसान, खोए मुनाफे, स्टॉक फैसलों, सप्लायर विवाद या डेटा नुकसान के लिए जिम्मेदार नहीं है।',
          'इन शर्तों में ऐसा कुछ नहीं है जो भारतीय कानून के उन अधिकारों को सीमित करे जिन्हें सीमित नहीं किया जा सकता।',
        ],
      },
      {
        title: 'लागू कानून',
        body: ['ये शर्तें भारत के कानून से संचालित होने के लिए हैं। असली ऑपरेटर नियुक्त होने पर विवाद उसके पंजीकृत स्थान की अदालतों के अधीन होंगे।'],
      },
    ],
  },
  hinglish: {
    kicker: 'Legal',
    privacyTitle: 'Privacy policy',
    privacyIntro: 'ProfitUp kya store karta hai, kyun karta hai, aur aap kya kar sakte hain.',
    termsTitle: 'Terms of use',
    termsIntro: 'Is demo aur future ProfitUp account ke practical rules.',
    updated: 'Last updated: 29 October 2026',
    templateNote: 'Yeh product template hai, legal advice nahi. Launch se pehle lawyer se review karayein.',
    privacy: [
      {
        title: 'Kya collect hota hai',
        body: [
          'Shop profile: business name, owner name, phone, city, state, PIN, business type, language aur aapke bataye outlets.',
          'Aapke add ya import kiye records: products, purchase bills, stock counts, sales rows, expenses, suppliers, udhaar customers aur payments.',
          'App activity: done ya snoozed actions, settings changes, order lists, notifications aur changes ka audit log.',
        ],
      },
      {
        title: 'Demo data kahan rehta hai',
        body: [
          'Yeh demo data aapke browser localStorage mein current demo ya owner session ki key ke andar rehta hai. Shop records ProfitUp server par nahi jaate.',
          'Site data clear karne, private window use karne ya Settings se account delete karne par local copy hat jaati hai. Demo mein server backup nahi hai.',
        ],
      },
      {
        title: 'Data kyun use hota hai',
        body: [
          'Demand estimate, reorder suggestion, dead-stock value, profit estimate, expense alerts, udhaar ageing aur reports banane ke liye.',
          'Language, theme, thresholds aur notification preferences yaad rakhne ke liye.',
          'Activity log dikhane ke liye, taaki owner dekh sake kya aur kab badla.',
        ],
      },
      {
        title: 'Sharing',
        body: [
          'Demo mode aapka data advertisers ko bechta, rent par deta ya share nahi karta. Aapki marzi se download ki gayi file, WhatsApp copy ya CA/supplier ko bheji info app se bahar jaati hai.',
          'Agar production backend juda ho, to data access authentication aur row-level security se limited hona chahiye. README mein Supabase policy likhi hai.',
        ],
      },
      {
        title: 'Aapke options',
        body: [
          'Aap app mein records edit/delete kar sakte hain, backup CSV download kar sakte hain, demo reset kar sakte hain, Settings mein consent withdraw kar sakte hain aur browser ka account data delete kar sakte hain.',
          'Pehle download ki gayi files mein data reh sakta hai. Woh copies ProfitUp ke control se bahar hain.',
        ],
      },
      {
        title: 'Security aur limits',
        body: [
          'Browser storage multi-user security nahi hai. Jiske paas is browser profile ka access hai, woh demo data padh sakta hai. Shared demo device mein real customer ya financial data na daalein.',
          'Production ke liye Supabase Auth, row-level security, encrypted transport aur operational safeguards chahiye. Yeh is local demo mein active nahi hain.',
        ],
      },
      {
        title: 'Contact',
        body: ['Is policy par sawaal hello@profitup.example par bhejein. Yeh address placeholder hai aur launch se pehle badalna zaroori hai.'],
      },
    ],
    terms: [
      {
        title: 'Acceptance',
        body: ['Is demo ko use karke aap in terms se agree karte hain. Agree nahi hain to app use na karein aur shop data enter na karein.'],
      },
      {
        title: 'Demo aur sample data',
        body: [
          'Demo mode product demonstration hai. Isme Bhopal ke fictional Sharma General Store ke sample records hain. Sample figures, customers, suppliers aur notifications real business records nahi hain.',
          'Demo mode WhatsApp, SMS, payment ya email nahi bhejta. “Mock: not sent” wale screens sirf examples hain.',
        ],
      },
      {
        title: 'Estimates, audited accounts nahi',
        body: [
          'Demand, reorder quantity, profit, money stuck, recovery value, data-health score aur reports planning estimates hain. Yeh aapke records aur assumptions par depend karte hain.',
          'ProfitUp accountant, lender, tax adviser ya auditor nahi hai. Reports audited financial statements nahi hain aur professional review ke bina statutory accounts mein use nahi karni chahiye.',
        ],
      },
      {
        title: 'Aapki responsibility',
        body: [
          'Sahi records daalein, device secure rakhein aur order se pehle rate, stock aur supplier terms confirm karein.',
          'Aap jo data import karte hain uski zimmedari aapki hai. Kisi doosre business ka confidential data bina permission na daalein.',
        ],
      },
      {
        title: 'Availability aur changes',
        body: [
          'Demo as-is diya jaata hai, bina service-level guarantee ke. Features, thresholds, copy aur sample data badal sakte hain.',
          'Is build mein production pricing aur paid-plan terms final nahi hain. Placeholder price ko offer na maanein.',
        ],
      },
      {
        title: 'Liability ki limit',
        body: [
          'Law ki limit tak, ProfitUp is demo ke use se hone wale business loss, lost profit, stock decisions, supplier disputes ya data loss ke liye liable nahi hai.',
          'In terms mein aisa kuch nahi jo Indian law ke un rights ko limit kare jo limit nahi kiye ja sakte.',
        ],
      },
      {
        title: 'Governing law',
        body: ['Yeh terms India ke laws se governed hone ke liye hain. Real operator appoint hone par disputes uske registered location ke courts ke under honge.'],
      },
    ],
  },
};

function LegalLayout({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/" className={buttonClass('ghost', 'sm', 'mb-8')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        {children}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted"><LockKeyhole className="h-4 w-4" /> {icon}</div>
          <div className="flex gap-2">
            <Link to="/privacy" className={buttonClass('secondary', 'sm')}>Privacy</Link>
            <Link to="/terms" className={buttonClass('secondary', 'sm')}>Terms</Link>
            <Link to="/app/help" className={buttonClass('ghost', 'sm')}>Help</Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function LegalBody({
  kicker,
  title,
  intro,
  updated,
  templateNote,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  templateNote: string;
  sections: LegalSection[];
}) {
  return (
    <article>
      <header className="border-b border-line pb-8">
        <div className="mb-4 flex items-center gap-3">
          <Logo compact />
          <span className="kicker">{kicker}</span>
        </div>
        <h1 className="display text-4xl text-ink sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{intro}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pill"><CalendarDays className="h-3 w-3" /> {updated}</span>
          <span className="pill"><FileText className="h-3 w-3" /> Demo template</span>
        </div>
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-[var(--warning-soft)] p-3 text-[11px] leading-relaxed text-accent">{templateNote}</p>
      </header>
      <div className="divide-y divide-line">
        {sections.map((section, index) => (
          <section key={section.title} className="grid gap-4 py-7 sm:grid-cols-[0.25fr_0.75fr]">
            <div className="flex items-start gap-3">
              <span className="num text-[10px] font-black text-muted">{String(index + 1).padStart(2, '0')}</span>
              <h2 className="text-sm font-extrabold sm:text-base">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-muted">{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-2 rounded-xl bg-primary-soft p-3 text-xs text-primary">
        <ShieldCheck className="h-4 w-4 shrink-0" /> Estimates are planning aids, not audited financial statements. Demo data is sample data.
      </div>
    </article>
  );
}

export function PrivacyPage() {
  const { lang } = useLanguage();
  const text = copy[lang];
  return (
    <LegalLayout icon={<LockKeyhole className="h-4 w-4" />}>
      <LegalBody
        kicker={`${text.kicker} — Privacy`}
        title={text.privacyTitle}
        intro={text.privacyIntro}
        updated={text.updated}
        templateNote={text.templateNote}
        sections={text.privacy}
      />
    </LegalLayout>
  );
}

export function TermsPage() {
  const { lang } = useLanguage();
  const text = copy[lang];
  return (
    <LegalLayout icon={<FileText className="h-4 w-4" />}>
      <LegalBody
        kicker={`${text.kicker} — Terms`}
        title={text.termsTitle}
        intro={text.termsIntro}
        updated={text.updated}
        templateNote={text.templateNote}
        sections={text.terms}
      />
    </LegalLayout>
  );
}
