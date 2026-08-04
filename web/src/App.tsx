import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { CartProvider } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { AuthProvider } from './context/AuthContext';
import CustomerShell from './components/CustomerShell';
import AdminLayout from './components/layout/AdminLayout';

const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const CustomerLogin = lazy(() => import('./pages/auth/CustomerLogin'));
const CustomerRegister = lazy(() => import('./pages/auth/CustomerRegister'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCustomize = lazy(() => import('./pages/admin/Customize'));
const StorefrontEditor = lazy(() => import('./pages/admin/StorefrontEditor'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'));
const AdminArchive = lazy(() => import('./pages/admin/ArchiveView'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminEmployees = lazy(() => import('./pages/admin/Employees'));

function PageLoader() {
  return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#888' }}>Chargement…</div>;
}

function HomeRedirect() {
  useEffect(() => { window.location.replace('/'); }, []);
  return <PageLoader />;
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <Toaster position="top-center" toastOptions={{
              style: { background: '#12121c', color: '#f2f2f7', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 12, fontSize: 14 },
            }} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/checkout" element={<CustomerShell><Checkout /></CustomerShell>} />
                <Route path="/track" element={<CustomerShell><OrderTracking /></CustomerShell>} />
                <Route path="/track/:token" element={<CustomerShell><OrderTracking /></CustomerShell>} />
                <Route path="/auth/login" element={<CustomerShell><CustomerLogin /></CustomerShell>} />
                <Route path="/auth/register" element={<CustomerShell><CustomerRegister /></CustomerShell>} />
                <Route path="/profile" element={<CustomerShell><CustomerProfile /></CustomerShell>} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="customize" element={<AdminCustomize />} />
                  <Route path="editor" element={<StorefrontEditor />} />
                  <Route path="revenue" element={<AdminRevenue />} />
                  <Route path="archive" element={<AdminArchive />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="employees" element={<AdminEmployees />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="/admin/editor/full" element={<StorefrontEditor fullScreen />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
