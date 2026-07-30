import { Router } from 'express';
import { adminAuth } from '../middleware/auth.js';
import { getEmailSettings, saveEmailSettings, testEmailConnection, sendBackupEmail } from '../lib/email.js';
import { exportAllTables, saveBackupLocal } from '../lib/backup.js';

const router = Router();
router.use(adminAuth);

/* ════════════════════════════════════════
   GET /email/settings — get saved email config
   ════════════════════════════════════════ */
router.get('/settings', async (req, res) => {
  try {
    const settings = await getEmailSettings();
    // Never send password back to frontend
    if (settings?.smtpPass) {
      settings.smtpPass = '••••••••';
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /email/settings — save email config
   ════════════════════════════════════════ */
router.post('/settings', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, recipientEmail } = req.body;
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Don't overwrite password if it's the masked value
    const existing = await getEmailSettings();
    const finalPass = (smtpPass === '••••••••' && existing?.smtpPass) ? existing.smtpPass : smtpPass;

    await saveEmailSettings({
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort || 587,
      smtpUser,
      smtpPass: finalPass,
      recipientEmail: recipientEmail || smtpUser,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /email/test — test SMTP connection
   ════════════════════════════════════════ */
router.post('/test', async (req, res) => {
  try {
    const settings = await getEmailSettings();
    if (!settings) return res.status(400).json({ error: "Configurer l'email d'abord" });
    const result = await testEmailConnection(settings);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ════════════════════════════════════════
   POST /email/backup — generate backup + send to email
   ════════════════════════════════════════ */
router.post('/backup', async (req, res) => {
  try {
    const settings = await getEmailSettings();
    if (!settings) return res.status(400).json({ error: "Configurer l'email d'abord" });

    // Generate backup
    const backup = await exportAllTables();
    const jsonContent = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-mister-dr-${timestamp}.json`;

    // Also save locally
    await saveBackupLocal(backup, 'email');

    // Send to email
    const result = await sendBackupEmail(settings, jsonContent, filename);
    res.json({ ok: true, filename, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
