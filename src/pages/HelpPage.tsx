import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Database,
  Download,
  FileSpreadsheet,
  HelpCircle,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { siteConfig } from '../config/site';
import { downloadTemplate, templates } from '../lib/exports';
import { PageHeader } from '../components/shared';
import { Accordion, Badge, Card, buttonClass } from '../components/ui';
import type { Lang } from '../lib/types';

const faqs: Record<Lang, Array<{ q: string; a: string }>> = {
  en: [
    {
      q: 'Do I need to enter every sale?',
      a: 'No. ProfitUp works from purchase bills, stock counts and order lists. Item-wise sales improve confidence from Basic to Good or Best, but they are optional.',
    },
    {
      q: 'How does the reorder suggestion work?',
      a: 'It estimates daily demand from recorded sales or stock movement, multiplies by your cover days and safety percentage, then subtracts current stock and pending orders. Pack size and budget limits are applied last.',
    },
    {
      q: 'Why is some demand labelled Estimated?',
      a: 'When item-wise sales are missing or too few, ProfitUp uses purchase and stock-count movement to estimate demand. Those rows are marked Estimated and never presented as actual sales.',
    },
    {
      q: 'What does Demo mode change?',
      a: 'Demo mode loads sample data for Sharma General Store, Bhopal into this browser. It does not connect to a server, does not send WhatsApp or SMS, and can be reset in Settings.',
    },
    {
      q: 'Can I use it on my phone?',
      a: 'Yes. The app is responsive from 360px upward and can be installed as a PWA from a supported browser. Data stays in this browser until a production backend is connected.',
    },
    {
      q: 'Is the profit number my final profit?',
      a: 'No. It is an estimate: estimated gross profit minus recorded expenses. It is not an audited financial statement and does not include every cost, tax or credit adjustment.',
    },
    {
      q: 'How do I bring in my existing data?',
      a: 'Open Imports, download the template for the record type, fill it in, upload, map the columns, review the preview and import only valid rows. You can download an error report for skipped rows.',
    },
    {
      q: 'How is my data protected?',
      a: 'In this demo, data is stored in your browser localStorage and is not sent to a server. Production requires Supabase Auth and row-level security, which are documented in the project README. Demo storage is not multi-user security.',
    },
  ],
  hi: [
    {
      q: 'क्या मुझे हर बिक्री दर्ज करनी होगी?',
      a: 'नहीं। ProfitUp खरीद बिल, स्टॉक काउंट और ऑर्डर लिस्ट से काम करता है। आइटम-वाइज बिक्री से भरोसा Basic से Good या Best होता है, लेकिन यह जरूरी नहीं है।',
    },
    {
      q: 'रीऑर्डर सुझाव कैसे बनता है?',
      a: 'दर्ज बिक्री या स्टॉक मूवमेंट से रोज की मांग का अनुमान लगता है। उसे कवर दिन और सेफ्टी प्रतिशत से गुणा करके मौजूदा स्टॉक और पेंडिंग ऑर्डर घटाए जाते हैं। पैक साइज और बजट अंत में लागू होते हैं।',
    },
    {
      q: 'कुछ मांग अनुमानित क्यों है?',
      a: 'जब आइटम-वाइज बिक्री नहीं है या बहुत कम है, तब खरीद और स्टॉक मूवमेंट से मांग का अनुमान लगता है। ऐसी पंक्तियां अनुमानित चिह्नित रहती हैं और असली बिक्री नहीं कही जातीं।',
    },
    {
      q: 'डेमो मोड में क्या बदलता है?',
      a: 'डेमो मोड इस ब्राउज़र में शर्मा जनरल स्टोर, भोपाल का सैंपल डेटा लोड करता है। यह सर्वर से नहीं जुड़ता, व्हाट्सएप या SMS नहीं भेजता, और सेटिंग्स से कभी भी रीसेट हो सकता है।',
    },
    {
      q: 'क्या मैं इसे फोन पर चला सकता हूं?',
      a: 'हां। ऐप 360px से बड़ी स्क्रीन पर ठीक चलता है और सपोर्टेड ब्राउज़र से PWA की तरह इंस्टॉल हो सकता है। प्रोडक्शन बैकएंड जुड़ने तक डेटा इसी ब्राउज़र में रहता है।',
    },
    {
      q: 'क्या मुनाफे का आंकड़ा अंतिम है?',
      a: 'नहीं। यह अनुमान है: अनुमानित ग्रॉस प्रॉफिट में से दर्ज खर्चा घटाया गया है। यह ऑडिटेड वित्तीय विवरण नहीं है और इसमें हर लागत, टैक्स या उधार समायोजन शामिल नहीं है।',
    },
    {
      q: 'पुराना डेटा कैसे लाऊं?',
      a: 'इम्पोर्ट खोलें, रिकॉर्ड का टेम्पलेट डाउनलोड करें, भरें, अपलोड करें, कॉलम मिलाएं, प्रीव्यू देखें और सिर्फ सही पंक्तियां इम्पोर्ट करें। छूटी पंक्तियों की एरर रिपोर्ट डाउनलोड हो सकती है।',
    },
    {
      q: 'मेरा डेटा कैसे सुरक्षित है?',
      a: 'इस डेमो में डेटा आपके ब्राउज़र के localStorage में रहता है और सर्वर पर नहीं जाता। प्रोडक्शन के लिए Supabase Auth और row-level security चाहिए, जो प्रोजेक्ट README में लिखा है। डेमो स्टोरेज मल्टी-यूजर सुरक्षा नहीं है।',
    },
  ],
  hinglish: [
    {
      q: 'Kya har sale enter karni padegi?',
      a: 'Nahi. ProfitUp purchase bills, stock counts aur order lists se kaam karta hai. Item-wise sales se confidence Basic se Good ya Best hota hai, lekin woh optional hai.',
    },
    {
      q: 'Reorder suggestion kaise banta hai?',
      a: 'Recorded sales ya stock movement se daily demand estimate hoti hai. Cover days aur safety % se multiply karke current stock aur pending orders minus hote hain. Pack size aur budget last mein lagte hain.',
    },
    {
      q: 'Kuch demand Estimated kyun hai?',
      a: 'Jab item-wise sales nahi hai ya bahut kam hai, tab purchase aur stock-count movement se demand estimate hoti hai. Aisi rows Estimated rehti hain, actual sales nahi kehlati.',
    },
    {
      q: 'Demo mode mein kya alag hai?',
      a: 'Demo mode is browser mein Sharma General Store, Bhopal ka sample data load karta hai. Server se connect nahi hota, WhatsApp ya SMS nahi bhejta, aur Settings se reset ho sakta hai.',
    },
    {
      q: 'Phone par chalega?',
      a: 'Haan. App 360px se badi screen par theek chalta hai aur supported browser se PWA ki tarah install ho sakta hai. Production backend judne tak data isi browser mein rehta hai.',
    },
    {
      q: 'Profit ka number final hai?',
      a: 'Nahi. Yeh estimate hai: estimated gross profit minus recorded expenses. Yeh audited financial statement nahi hai aur har cost, tax ya udhaar adjustment include nahi karta.',
    },
    {
      q: 'Purana data kaise laaun?',
      a: 'Imports kholo, record type ka template download karo, bharo, upload karo, columns map karo, preview dekho aur sirf valid rows import karo. Skipped rows ki error report download ho sakti hai.',
    },
    {
      q: 'Mera data safe kaise hai?',
      a: 'Is demo mein data aapke browser ke localStorage mein hai, server par nahi jaata. Production ke liye Supabase Auth aur row-level security chahiye, jo README mein documented hai. Demo storage multi-user security nahi hai.',
    },
  ],
};

const templateKinds = ['products', 'purchases', 'stock', 'sales', 'expenses'] as const;

export default function HelpPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const copy = faqs[lang];

  return (
    <div>
      <PageHeader
        number="20"
        title={t('help.title')}
        sub={t('help.sub')}
        actions={
          <a href="#templates" className={buttonClass('primary')}>
            <Download className="h-4 w-4" /> {t('help.templates')}
          </a>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line p-4">
              <HelpCircle className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.title')}</h2>
            </div>
            <div className="p-4">
              <Accordion items={copy.map((item, index) => ({ id: `faq-${index}`, question: item.q, answer: item.a }))} />
            </div>
          </Card>

          <Card className="p-4 sm:p-5" id="templates">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.templates')}</h2>
            </div>
            <p className="mt-1 text-xs text-muted">{t('imports.uploadHint')}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templateKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => downloadTemplate(kind)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-bg/50 p-3 text-left text-xs font-semibold transition hover:border-primary hover:text-primary"
                >
                  <span className="flex items-center gap-2"><Download className="h-3.5 w-3.5" /> {t(`help.template${kind.charAt(0).toUpperCase()}${kind.slice(1)}`)}</span>
                  <span className="text-[10px] text-muted">{templates[kind][0].length}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('imports.dateHint')}</p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.dataGuide')}</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                ['basic', 'orders_only', t('onboarding.data1')],
                ['good', 'orders_upi', t('onboarding.data2')],
                ['best', 'full_sales', t('onboarding.data3')],
              ].map(([level, key, body]) => (
                <div key={key} className="rounded-xl border border-line bg-bg/40 p-3">
                  <Badge tone={level === 'best' ? 'green' : level === 'good' ? 'blue' : 'amber'}>{t(`common.${level}`)}</Badge>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('landing.dataTitle')}</p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.demoGuide')}</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t('help.demoGuideBody')}</p>
            <div className="mt-3 rounded-xl bg-[var(--warning-soft)] p-3 text-[11px] leading-relaxed text-accent">{t('common.noBackend')}</div>
            <Link to="/demo" className={buttonClass('secondary', 'sm', 'mt-3 w-full')}>{t('nav.tryDemo')}</Link>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.importGuide')}</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t('help.importGuideBody')}</p>
            <Link to="/app/imports" className={buttonClass('primary', 'sm', 'mt-3 w-full')}>{t('imports.title')}</Link>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('help.contact')}</h2>
            </div>
            <p className="mt-1 text-[11px] text-muted">{t('help.contactNote')}</p>
            <div className="mt-3 space-y-2">
              <a href={`mailto:${siteConfig.contactEmail}`} className="flex items-center gap-2 rounded-xl border border-line p-2.5 text-xs font-semibold hover:border-primary">
                <Mail className="h-3.5 w-3.5 text-muted" /> {siteConfig.contactEmail}
              </a>
              <a href={`tel:${siteConfig.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 rounded-xl border border-line p-2.5 text-xs font-semibold hover:border-primary">
                <MessageSquareText className="h-3.5 w-3.5 text-muted" /> {siteConfig.contactPhone}
              </a>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold">{t('footer.legal')}</h2>
            </div>
            <div className="mt-3 space-y-1">
              <Link to="/privacy" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold hover:bg-bg">
                {t('footer.privacy')} <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              <Link to="/terms" className="flex items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold hover:bg-bg">
                {t('footer.terms')} <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-bg p-2 text-[10px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t('reports.disclaimer')}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
