import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

type User = { id: string; name: string; email: string; role: string };
type AuthCtx = { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean };

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('delivery_user');
    if (saved) try { setUser(JSON.parse(saved)); } catch {}
    setLoading(false);

    const onStorage = () => {
      const s = localStorage.getItem('delivery_user');
      if (s) try { setUser(JSON.parse(s)); } catch { setUser(null); }
      else setUser(null);
    };
    window.addEventListener('auth-login', onStorage);
    return () => window.removeEventListener('auth-login', onStorage);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('delivery_token', token);
    localStorage.setItem('delivery_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
