import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Storefront from './pages/Storefront';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerRegister from './pages/auth/CustomerRegister';
import CustomerProfile from './pages/CustomerProfile';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomize from './pages/admin/Customize';
import StorefrontEditor from './pages/admin/StorefrontEditor';
import AdminSettings from './pages/admin/Settings';
import AdminRevenue from './pages/admin/Revenue';

export default function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <Toaster position="top-center" toastOptions={{
            style: { background: '#1a1a1a', color: '#f5f1e8', border: '1px solid rgba(191,162,78,0.16)', borderRadius: 12, fontSize: 14 },
          }} />
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
          </Routes>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
