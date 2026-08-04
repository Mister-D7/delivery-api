import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'mister-dr-delivery-2026';
const JWT_EXPIRES = '365d';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/* ══════════════════════════════════════════
   RESILIENT FETCH
   Retries transient DNS/network failures (e.g. ENOTFOUND) that can
   otherwise surface as "fetch failed" during Google OAuth exchanges.
   Only retries when fetch throws (network-level); HTTP responses pass
   through untouched.
   ══════════════════════════════════════════ */

export async function fetchWithRetry(url, options, retries = 4) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      const wait = 250 * (i + 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* ══════════════════════════════════════════
   GOOGLE LOGIN — CUSTOMER
   ══════════════════════════════════════════ */

export async function handleGoogleCustomerLogin(code) {
  const redirectUri = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google login not configured');
  }

  // Exchange code for tokens
  const tokenRes = await fetchWithRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetchWithRetry('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) throw new Error('Failed to get Google user info');
  const googleUser = await userRes.json();

  // Find or create customer in DB
  const { data: existing } = await supabase
    .from('delivery_customers')
    .select('*')
    .eq('email', googleUser.email)
    .maybeSingle();

  if (existing) {
    return signToken({ email: existing.email, role: 'customer' });
  }

  // Create new customer
  const { data: newCustomer, error: createErr } = await supabase
    .from('delivery_customers')
    .insert({
      email: googleUser.email,
      name: googleUser.name || 'Client',
      password_hash: hashPassword(Math.random().toString(36)),
    })
    .select()
    .single();

  if (createErr) throw new Error(`Failed to create customer: ${createErr.message}`);
  return signToken({ email: newCustomer.email, role: 'customer' });
}

/* ══════════════════════════════════════════
   GOOGLE LOGIN — ADMIN
   ══════════════════════════════════════════ */

export async function handleGoogleLogin(code) {
  const redirectUri = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google login not configured');
  }

  // Exchange code for tokens
  const tokenRes = await fetchWithRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetchWithRetry('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) throw new Error('Failed to get Google user info');
  const googleUser = await userRes.json();

  // Find or create user in DB
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleUser.id)
    .maybeSingle();

  if (existingUser) {
    // Update avatar if changed
    if (existingUser.avatar_url !== googleUser.picture) {
      await supabase.from('users').update({ avatar_url: googleUser.picture }).eq('id', existingUser.id);
    }
    return signToken({ email: existingUser.email, role: 'admin' });
  }

  // Check if email already exists (without google_id)
  const { data: emailUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', googleUser.email)
    .maybeSingle();

  if (emailUser) {
    // Link Google account to existing user
    await supabase.from('users').update({
      google_id: googleUser.id,
      avatar_url: googleUser.picture,
    }).eq('id', emailUser.id);
    return signToken({ email: emailUser.email, role: 'admin' });
  }

  // Create new admin user
  const { data: newUser, error: createErr } = await supabase
    .from('users')
    .insert({
      email: googleUser.email,
      name: googleUser.name,
      google_id: googleUser.id,
      avatar_url: googleUser.picture,
      password_hash: hashPassword(Math.random().toString(36)),
      role: 'admin',
    })
    .select()
    .single();

  if (createErr) throw new Error(`Failed to create user: ${createErr.message}`);
  return signToken({ email: newUser.email, role: 'admin' });
}
