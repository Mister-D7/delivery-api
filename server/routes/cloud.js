import { Router } from 'express';
import { adminAuth } from '../middleware/auth.js';
import {
  getAuthUrl, exchangeCode, getUserInfo, saveConnection,
  getConnections, getConnection, deleteConnection,
  exportToCloud, PROVIDERS,
} from '../lib/cloud.js';
import { exportAllTables, saveBackupLocal } from '../lib/backup.js';

const router = Router();

/* ════════════════════════════════════════
   GET /cloud/providers — list available providers + connection status
   ════════════════════════════════════════ */
router.get('/providers', adminAuth, async (req, res) => {
  try {
    const connections = await getConnections();
    const providers = Object.keys(PROVIDERS).map(key => {
      const config = PROVIDERS[key];
      const conn = connections.find(c => c.provider === key);
      const clientIdSet = !!config.getClientId();
      return {
        id: key,
        name: config.name,
        configured: clientIdSet,
        connected: !!conn,
        account: conn ? { email: conn.account_email, name: conn.account_name, folder: conn.folder_name } : null,
      };
    });
    res.json({ providers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   GET /cloud/connect/:provider — generate OAuth URL
   ════════════════════════════════════════ */
router.get('/connect/:provider', (req, res) => {
  try {
    const { url, state, redirectUri } = getAuthUrl(req.params.provider, 'cloud');
    res.json({ url, state, redirectUri });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   GET /cloud/callback/:provider — OAuth callback (browser redirect)
   ════════════════════════════════════════ */
router.get('/callback/:provider', async (req, res) => {
  const { provider } = req.params;
  const { code, error } = req.query;

  if (error || !code) {
    return res.send(`<html><body style="background:#0a0a0a;color:#f5f1e8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>❌ Connexion échouée</h2><p>${error || 'Code manquant'}</p><script>setTimeout(() => window.close(), 2000);</script></div></body></html>`);
  }

  try {
    const config = PROVIDERS[provider];
    const redirectUri = BASE_URL;
    const tokens = await exchangeCode(provider, code, redirectUri);
    const accessToken = tokens.access_token;
    const accountInfo = await getUserInfo(provider, accessToken);
    await saveConnection(provider, tokens, accountInfo);

    res.send(`<html><body style="background:#0a0a0a;color:#f5f1e8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>✅ ${config.name} connecté !</h2><p>${accountInfo?.email || ''}</p><script>setTimeout(() => window.close(), 1500);</script></div></body></html>`);
  } catch (err) {
    console.error('Cloud callback error:', err);
    res.send(`<html><body style="background:#0a0a0a;color:#f5f1e8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>❌ Erreur</h2><p>${err.message}</p><script>setTimeout(() => window.close(), 2000);</script></div></body></html>`);
  }
});

/* ════════════════════════════════════════
   DELETE /cloud/disconnect/:id — disconnect a provider
   ════════════════════════════════════════ */
router.delete('/disconnect/:id', async (req, res) => {
  try {
    await deleteConnection(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /cloud/export — export content to cloud
   body: { provider, filename, mimeType, content }
   ════════════════════════════════════════ */
router.post('/export', async (req, res) => {
  try {
    const { provider, filename, mimeType, content } = req.body;
    if (!provider || !filename || !content) {
      return res.status(400).json({ error: 'provider, filename, content required' });
    }
    const result = await exportToCloud(provider, {
      filename,
      mimeType: mimeType || 'text/csv',
      content,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /cloud/backup — full backup to cloud
   body: { provider }
   ════════════════════════════════════════ */
router.post('/backup', async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) return res.status(400).json({ error: 'provider required' });

    // Generate backup
    const backup = await exportAllTables();
    const jsonContent = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-cloud-${timestamp}.json`;

    // Save locally too
    await saveBackupLocal(backup, 'cloud');

    // Upload to cloud
    const result = await exportToCloud(provider, {
      filename,
      mimeType: 'application/json',
      content: jsonContent,
    });

    res.json({ ok: true, filename, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /cloud/test — test connection by listing files
   body: { provider }
   ════════════════════════════════════════ */
router.post('/test', async (req, res) => {
  try {
    const { provider } = req.body;
    const conn = await getConnection(provider);
    if (!conn) return res.status(404).json({ error: 'Not connected' });

    const { PROVIDERS } = await import('../lib/cloud.js');
    const config = PROVIDERS[provider];

    // Simple API call to test token
    let testUrl;
    if (provider === 'google_drive') testUrl = 'https://www.googleapis.com/drive/v3/about?fields=user';
    else testUrl = 'https://graph.microsoft.com/v1.0/me';

    const token = conn.access_token;
    const res2 = await fetch(testUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res2.ok) throw new Error(`API test failed: ${res2.status}`);
    res.json({ ok: true, message: 'Connection working' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
