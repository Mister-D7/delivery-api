import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { CartProvider } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import AdminLayout from './components/layout/AdminLayout';

const Storefront = lazy(() => import('./pages/Storefront'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const CustomerLogin = lazy(() => import('./pages/auth/CustomerLogin'));
const CustomerRegister = lazy(() => import('./pages/auth/CustomerRegister'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCustomize = lazy(() => import('./pages/admin/Customize'));
const StorefrontEditor = lazy(() => import('./pages/admin/StorefrontEditor'));
const StorefrontBuilder = lazy(() => import('./pages/admin/StorefrontBuilder'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'));

function PageLoader() {
  return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#888' }}>Chargement…</div>;
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <Toaster position="top-center" toastOptions={{
              style: { background: '#1a1a1a', color: '#f5f1e8', border: '1px solid rgba(191,162,78,0.16)', borderRadius: 12, fontSize: 14 },
            }} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<><Header /><Storefront /></>} />
                <Route path="/checkout" element={<><Header /><Checkout /></>} />
                <Route path="/track" element={<><Header /><OrderTracking /></>} />
                <Route path="/track/:token" element={<><Header /><OrderTracking /></>} />
                <Route path="/auth/login" element={<CustomerLogin />} />
                <Route path="/auth/register" element={<CustomerRegister />} />
                <Route path="/profile" element={<><Header /><CustomerProfile /></>} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="customize" element={<AdminCustomize />} />
                  <Route path="editor" element={<StorefrontEditor />} />
                  <Route path="revenue" element={<AdminRevenue />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="/admin/editor/full" element={<StorefrontEditor fullScreen />} />
                <Route path="/admin/builder" element={<StorefrontBuilder />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
