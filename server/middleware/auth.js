import { verifyToken } from '../lib/auth.js';
import supabase from '../lib/supabase.js';

export async function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required' });

    const decoded = verifyToken(header.slice(7));
    if (!decoded || !decoded.email) return res.status(401).json({ error: 'Invalid token' });

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', decoded.email)
      .single();

    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function customerAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required' });

    const decoded = verifyToken(header.slice(7));
    if (!decoded || !decoded.email) return res.status(401).json({ error: 'Invalid token' });

    const { data: customer } = await supabase
      .from('delivery_customers')
      .select('id, name, email, phone, addresses')
      .eq('email', decoded.email)
      .single();

    if (!customer) return res.status(401).json({ error: 'Customer not found' });
    req.customer = customer;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const decoded = verifyToken(header.slice(7));
    if (decoded?.email) {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('email', decoded.email)
        .single();
      if (user) req.user = user;
    }
  } catch {}
  next();
}
