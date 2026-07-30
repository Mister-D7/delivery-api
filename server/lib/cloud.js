import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

/* ══════════════════════════════════════════
   PROVIDER CONFIGS
   ══════════════════════════════════════════ */

const PROVIDERS = {
  google_drive: {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files',
    filesUrl: 'https://www.googleapis.com/drive/v3/files',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    getClientId: () => process.env.GOOGLE_DRIVE_CLIENT_ID,
    getClientSecret: () => process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  },
  onedrive: {
    name: 'OneDrive',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    uploadUrl: 'https://graph.microsoft.com/v1.0/me/drive/root:/',
    filesUrl: 'https://graph.microsoft.com/v1.0/me/drive',
    scopes: ['files.ReadWrite'],
    getClientId: () => process.env.ONEDRIVE_CLIENT_ID,
    getClientSecret: () => process.env.ONEDRIVE_CLIENT_SECRET,
  },
};

/* ══════════════════════════════════════════
   OAuth URL GENERATION
   ══════════════════════════════════════════ */

export function getAuthUrl(provider, flow = 'cloud') {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const clientId = config.getClientId();
  if (!clientId) throw new Error(`${config.name} client ID not configured. Set ${provider.toUpperCase()}_CLIENT_ID in .env`);

  const nonce = crypto.randomBytes(16).toString('hex');
  const state = `${flow}:${provider}:${nonce}`;
  const redirectUri = BASE_URL;

  // Auth flow (login) uses only basic scopes — no verification needed in production
  const scopes = flow === 'auth' || flow === 'auth-customer'
    ? ['openid', 'email', 'profile']
    : config.scopes;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
  });

  if (flow === 'cloud') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  if (provider === 'onedrive') {
    params.set('response_mode', 'query');
  }

  return { url: `${config.authUrl}?${params.toString()}`, state, redirectUri };
}

/* ══════════════════════════════════════════
   TOKEN EXCHANGE
   ══════════════════════════════════════════ */

export async function exchangeCode(provider, code, redirectUri) {
  const config = PROVIDERS[provider];
  const body = new URLSearchParams({
    client_id: config.getClientId(),
    client_secret: config.getClientSecret(),
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }

  return res.json();
}

/* ══════════════════════════════════════════
   TOKEN REFRESH
   ══════════════════════════════════════════ */

export async function refreshToken(provider, refreshTok) {
  const config = PROVIDERS[provider];
  const body = new URLSearchParams({
    client_id: config.getClientId(),
    client_secret: config.getClientSecret(),
    refresh_token: refreshTok,
    grant_type: 'refresh_token',
  });

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

/* ══════════════════════════════════════════
   GET VALID ACCESS TOKEN
   ══════════════════════════════════════════ */

async function getValidToken(connection) {
  if (!connection.refresh_token) return connection.access_token;

  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 min buffer

  if (expiresAt && expiresAt - now > buffer) {
    return connection.access_token;
  }

  // Token expired or about to expire → refresh
  try {
    const tokens = await refreshToken(connection.provider, connection.refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('delivery_cloud_connections')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return tokens.access_token;
  } catch (err) {
    console.error('Token refresh failed:', err.message);
    return connection.access_token; // Try with old token
  }
}

/* ══════════════════════════════════════════
   GET USER INFO
   ══════════════════════════════════════════ */

export async function getUserInfo(provider, accessToken) {
  if (provider === 'google_drive') {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { email: data.email, name: data.name };
  }

  if (provider === 'onedrive') {
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { email: data.mail || data.userPrincipalName, name: data.displayName };
  }

  return null;
}

/* ══════════════════════════════════════════
   CREATE FOLDER
   ══════════════════════════════════════════ */

export async function createFolder(provider, accessToken, folderName, parentFolderId) {
  if (provider === 'google_drive') {
    const body = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) body.parents = [parentFolderId];

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Create folder failed: ${err}`);
    }
    const data = await res.json();
    return { id: data.id, name: data.name };
  }

  if (provider === 'onedrive') {
    const path = parentFolderId
      ? `/drives/root:/${folderName}:`
      : `/drives/root:/${folderName}:`;

    const res = await fetch(`https://graph.microsoft.com/v1.0/me${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: folderName, folder: {} }),
    });

    if (!res.ok) {
      // Folder might already exist, try to find it
      const searchRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${folderName}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (searchRes.ok) {
        const existing = await searchRes.json();
        return { id: existing.id, name: existing.name };
      }
      throw new Error('Create folder failed');
    }
    const data = await res.json();
    return { id: data.id, name: data.name };
  }
}

/* ══════════════════════════════════════════
   UPLOAD FILE
   ══════════════════════════════════════════ */

export async function uploadFile(provider, accessToken, { filename, mimeType, content, folderId }) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');

  if (provider === 'google_drive') {
    const metadata = { name: filename };
    if (folderId) metadata.parents = [folderId];

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([buffer], { type: mimeType }), filename);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed: ${err}`);
    }
    const data = await res.json();
    return { id: data.id, name: data.name, webViewLink: `https://drive.google.com/file/d/${data.id}/view` };
  }

  if (provider === 'onedrive') {
    const parentPath = folderId ? `items/${folderId}` : 'root';
    const uploadPath = `https://graph.microsoft.com/v1.0/me/drive/${parentPath}:/${filename}:/content`;

    const res = await fetch(uploadPath, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: buffer,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed: ${err}`);
    }
    const data = await res.json();
    return { id: data.id, name: data.name, webUrl: data.webUrl };
  }
}

/* ══════════════════════════════════════════
   ENSURE FOLDER EXISTS
   ══════════════════════════════════════════ */

export async function ensureFolder(provider, accessToken, folderName, parentFolderId) {
  // Check if folder already exists
  if (provider === 'google_drive') {
    const q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const params = new URLSearchParams({ q, fields: 'files(id,name)' });
    if (parentFolderId) params.set('q', `${q} and '${parentFolderId}' in parents`);

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return { id: data.files[0].id, name: data.files[0].name };
      }
    }

    // Create it
    return createFolder(provider, accessToken, folderName, parentFolderId);
  }

  if (provider === 'onedrive') {
    // Try to find
    const parentPath = parentFolderId ? `items/${parentFolderId}` : 'root';
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/${parentPath}:/${folderName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.ok) {
      const data = await res.json();
      return { id: data.id, name: data.name };
    }

    return createFolder(provider, accessToken, folderName, parentFolderId);
  }
}

/* ════════════════════════════════════════
   DATABASE HELPERS
   ════════════════════════════════════════ */

export async function getConnections() {
  try {
    const { data, error } = await supabase
      .from('delivery_cloud_connections')
      .select('id, provider, account_email, account_name, folder_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('  ⚠  Cloud connections table not found. Run schema-cloud.sql');
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

export async function getConnection(provider) {
  try {
    const { data, error } = await supabase
      .from('delivery_cloud_connections')
      .select('*')
      .eq('provider', provider)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveConnection(provider, tokens, accountInfo) {
  try {
    // Delete existing connection for this provider
    await supabase.from('delivery_cloud_connections').delete().eq('provider', provider);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('delivery_cloud_connections')
      .insert({
        provider,
        account_email: accountInfo?.email || 'unknown',
        account_name: accountInfo?.name || provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: expiresAt,
        folder_name: 'MISTER-DR Backups',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    throw new Error(`Save connection failed. Run schema-cloud.sql first. ${err.message}`);
  }
}

export async function deleteConnection(id) {
  try {
    const { error } = await supabase
      .from('delivery_cloud_connections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    throw new Error(`Delete connection failed. ${err.message}`);
  }
}

/* ════════════════════════════════════════
   HIGH-LEVEL: EXPORT TO CLOUD
   ════════════════════════════════════════ */

export async function exportToCloud(provider, { filename, mimeType, content }) {
  const conn = await getConnection(provider);
  if (!conn) throw new Error(`No ${provider} connection found`);

  const accessToken = await getValidToken(conn);
  const folder = await ensureFolder(provider, accessToken, conn.folder_name || 'MISTER-DR Backups');
  const result = await uploadFile(provider, accessToken, {
    filename,
    mimeType,
    content,
    folderId: folder.id,
  });

  return { ...result, folder: folder.name };
}

export { PROVIDERS };
