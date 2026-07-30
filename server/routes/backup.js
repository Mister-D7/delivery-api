import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';
import {
  exportAllTables, importAllTables, saveBackupLocal,
  listLocalBackups, deleteLocalBackup, readBackupFile,
  getSchedulerState, restartScheduler, stopScheduler, cleanOldAutoBackups,
} from '../lib/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

const upload = multer({
  dest: path.join(__dirname, '..', '..', 'backups', 'tmp'),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.use(adminAuth);

router.post('/export', async (req, res) => {
  try {
    const { saveLocal = false } = req.body || {};
    const backup = await exportAllTables();

    if (saveLocal) {
      const saved = saveBackupLocal(backup, 'manual');
      return res.json({ ok: true, ...saved, rowCounts: backup.rowCounts });
    }

    const jsonStr = JSON.stringify(backup, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="delivery-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(jsonStr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { backup: backupData } = req.body;
    if (!backupData || !backupData.tables) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    const { checksum, ...rest } = backupData;
    const jsonStr = JSON.stringify({ ...rest });
    const computedChecksum = crypto.createHash('sha256').update(jsonStr).digest('hex');

    if (checksum && computedChecksum !== checksum) {
      return res.status(400).json({ error: 'Checksum mismatch' });
    }

    const result = await importAllTables(backupData);
    await restartScheduler();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import-file', upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const content = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);
    const backupData = JSON.parse(content);
    if (!backupData.tables) return res.status(400).json({ error: 'Invalid backup format' });

    const result = await importAllTables(backupData);
    await restartScheduler();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'backup_settings')
      .single();

    const scheduler = getSchedulerState();
    res.json({
      autoBackup: data?.value?.autoBackup || false,
      frequency: data?.value?.frequency || 'daily',
      keepCount: data?.value?.keepCount || 10,
      lastBackupAt: data?.value?.lastBackupAt || null,
      scheduler,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { autoBackup, frequency, keepCount } = req.body;

    const settings = {
      autoBackup: !!autoBackup,
      frequency: ['hourly', 'daily', 'weekly'].includes(frequency) ? frequency : 'daily',
      keepCount: Math.max(1, Math.min(50, Number(keepCount) || 10)),
    };

    const { data: existing } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'backup_settings')
      .single();
    if (existing?.value?.lastBackupAt) settings.lastBackupAt = existing.value.lastBackupAt;

    await supabase
      .from('delivery_settings')
      .upsert({ key: 'backup_settings', value: settings }, { onConflict: 'key' });

    if (settings.autoBackup) await restartScheduler();
    else stopScheduler();

    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const localBackups = listLocalBackups();
    res.json({ local: localBackups.map(b => ({ id: b.filename, filename: b.filename, fileSize: b.fileSize, createdAt: b.createdAt, type: b.type })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const filename = req.params.id;
    if (!/^backup-(manual|auto)-.+\.json$/.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
    const backupData = readBackupFile(filename);
    if (!backupData) return res.status(404).json({ error: 'Backup not found' });
    const jsonStr = JSON.stringify(backupData, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonStr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const filename = req.params.id;
    if (!/^backup-(manual|auto)-.+\.json$/.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
    const deleted = deleteLocalBackup(filename);
    res.json({ ok: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/run-now', async (req, res) => {
  try {
    const backup = await exportAllTables();
    const saved = saveBackupLocal(backup, 'auto');
    cleanOldAutoBackups(10);

    const { data: existing } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'backup_settings')
      .single();
    const settings = existing?.value || {};
    await supabase
      .from('delivery_settings')
      .upsert({ key: 'backup_settings', value: { ...settings, lastBackupAt: new Date().toISOString() } }, { onConflict: 'key' });

    res.json({ ok: true, ...saved, rowCounts: backup.rowCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
