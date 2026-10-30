import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppShell, MorePage, PublicFooter, PublicHeader } from './components/layout';
import { DemoEntry, LoginPage, OnboardingPage, ProtectedRoute, SignupPage } from './pages/AuthPages';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

const HelpPage = lazy(() => import('./pages/HelpPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RadarPage = lazy(() => import('./pages/RadarPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const StockCountPage = lazy(() => import('./pages/StockCountPage'));
const DeadStockPage = lazy(() => import('./pages/DeadStockPage'));
const MoneyStuckPage = lazy(() => import('./pages/MoneyStuckPage'));
const ProfitPage = lazy(() => import('./pages/ProfitPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const UdhaarPage = lazy(() => import('./pages/UdhaarPage'));
const ActionsPage = lazy(() => import('./pages/ActionsPage'));
const AskPage = lazy(() => import('./pages/AskPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const ImportsPage = lazy(() => import('./pages/ImportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs font-semibold text-muted">Loading…</p>
      </div>
    </div>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return null;
}

function PublicHelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <HelpPage />
      </main>
      <PublicFooter />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/demo" element={<DemoEntry />} />
        <Route path="/help" element={<PublicHelpPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="reorder" element={<RadarPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="stock-count" element={<StockCountPage />} />
          <Route path="dead-stock" element={<DeadStockPage />} />
          <Route path="money-stuck" element={<MoneyStuckPage />} />
          <Route path="profit" element={<ProfitPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="udhaar" element={<UdhaarPage />} />
          <Route path="actions" element={<ActionsPage />} />
          <Route path="ask" element={<AskPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
