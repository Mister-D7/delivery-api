import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

type Customer = { id: string; name: string; email: string; phone?: string; addresses?: any };
type CustomerAuthCtx = {
  customer: Customer | null;
  token: string | null;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; addresses?: any }) => Promise<void>;
  loading: boolean;
};

const CustomerAuthContext = createContext<CustomerAuthCtx>(null!);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('delivery_customer');
    const savedToken = localStorage.getItem('delivery_customer_token');
    if (savedToken) {
      setToken(savedToken);
      if (saved) {
        try { setCustomer(JSON.parse(saved)); } catch {}
      }
      // Fetch profile if token exists but no cached customer (e.g., Google login)
      if (!saved) {
        api.get('/auth/me').then(res => {
          const c = res.data.user;
          if (c.role === 'customer') {
            setCustomer(c);
            localStorage.setItem('delivery_customer', JSON.stringify(c));
          }
        }).catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  const setAuth = (t: string, c: Customer) => {
    localStorage.setItem('delivery_customer_token', t);
    localStorage.setItem('delivery_customer', JSON.stringify(c));
    setToken(t);
    setCustomer(c);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }) => {
    const res = await api.post('/auth/register', data);
    setAuth(res.data.token, res.data.customer);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setAuth(res.data.token, res.data.customer);
  };

  const logout = () => {
    localStorage.removeItem('delivery_customer_token');
    localStorage.removeItem('delivery_customer');
    setToken(null);
    setCustomer(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; addresses?: any }) => {
    const res = await api.put('/auth/profile', data);
    const updated = { ...customer, ...res.data };
    localStorage.setItem('delivery_customer', JSON.stringify(updated));
    setCustomer(updated);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, token, register, login, logout, updateProfile, loading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
