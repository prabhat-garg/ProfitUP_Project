import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, ShoppingBasket } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppData } from '../context/AppDataContext';
import { PublicFooter, PublicHeader } from '../components/layout';
import { buttonClass } from '../components/ui';
import type { Lang } from '../lib/types';

const copy: Record<Lang, { kicker: string; title: string; body: string; home: string; demo: string; login: string; dashboard: string }> = {
  en: {
    kicker: 'Page not found',
    title: 'This shelf is empty.',
    body: 'The page you were looking for does not exist, or it moved. Nothing was changed in your shop data.',
    home: 'Back to home',
    demo: 'Open demo shop',
    login: 'Login',
    dashboard: 'Go to dashboard',
  },
  hi: {
    kicker: 'पेज नहीं मिला',
    title: 'यह शेल्फ खाली है।',
    body: 'आप जो पेज खोज रहे थे वह मौजूद नहीं है या हट गया है। आपके दुकान के डेटा में कुछ नहीं बदला।',
    home: 'होम पर वापस',
    demo: 'डेमो दुकान खोलें',
    login: 'लॉगिन',
    dashboard: 'डैशबोर्ड खोलें',
  },
  hinglish: {
    kicker: 'Page nahi mila',
    title: 'Yeh shelf khaali hai.',
    body: 'Jo page aap dhoondh rahe the woh exist nahi karta ya move ho gaya. Aapke shop data mein kuch nahi badla.',
    home: 'Home par wapas',
    demo: 'Demo dukaan kholo',
    login: 'Login',
    dashboard: 'Dashboard kholo',
  },
};

export default function NotFoundPage() {
  const { lang } = useLanguage();
  const { session } = useAppData();
  const text = copy[lang];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="kicker mb-3">{text.kicker}</p>
              <p className="display num text-[clamp(5rem,18vw,11rem)] leading-none text-primary/20">404</p>
              <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">{text.title}</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{text.body}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link to="/" className={buttonClass('primary', 'lg')}>
                  <ArrowLeft className="h-4 w-4" /> {text.home}
                </Link>
                <Link to={session ? '/app' : '/demo'} className={buttonClass('secondary', 'lg')}>
                  {session ? text.dashboard : text.demo} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {!session && (
                <p className="mt-4 text-xs text-muted">
                  <Link to="/login" className="font-bold text-primary underline underline-offset-2">{text.login}</Link>
                </p>
              )}
            </div>

            <div className="relative">
              <div className="surface relative overflow-hidden p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <span className="kicker">ProfitUp · 404</span>
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ['01', 'Reorder Radar', '/app/reorder'],
                    ['02', 'Smart Order List', '/app/order'],
                    ['03', 'Money Stuck', '/app/money-stuck'],
                    ['04', 'Ask ProfitUp', '/app/ask'],
                  ].map(([number, label, href]) => (
                    <Link
                      key={href}
                      to={session ? href : '/demo'}
                      className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 px-4 py-3 text-sm font-bold transition hover:border-primary"
                    >
                      <span className="num text-[10px] text-muted">{number}</span>
                      {label}
                      <ArrowRight className="ml-auto h-4 w-4 text-muted" />
                    </Link>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary-soft p-3 text-xs text-primary-dark">
                  <ShoppingBasket className="h-4 w-4 shrink-0" />
                  <span>Sharma General Store demo · no login needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
