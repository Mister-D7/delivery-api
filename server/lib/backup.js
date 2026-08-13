import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import supabase from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const ALL_TABLES = [
  'users',
  'delivery_customers',
  'delivery_categories',
  'delivery_products',
  'delivery_orders',
  'delivery_order_items',
  'delivery_order_status_history',
  'delivery_order_messages',
  'delivery_settings',
  'delivery_themes',
  'delivery_banners',
  'delivery_coupons',
  'delivery_combos',
  'delivery_employees',
  'delivery_employee_payments',
];

export async function exportAllTables(exclude = []) {
  const tables = {};
  const rowCounts = {};

  for (const tableName of ALL_TABLES) {
    if (exclude.includes(tableName)) {
      tables[tableName] = [];
      rowCounts[tableName] = 0;
      continue;
    }
    let allRows = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(`Backup: error reading ${tableName}:`, error.message);
        tables[tableName] = [];
        rowCounts[tableName] = 0;
        break;
      }

      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    tables[tableName] = allRows;
    rowCounts[tableName] = allRows.length;
  }

  const backup = {
    version: '1.0',
    app: 'mister-dr-delivery',
    exportedAt: new Date().toISOString(),
    tables,
    rowCounts,
  };

  const jsonStr = JSON.stringify(backup);
  backup.checksum = crypto.createHash('sha256').update(jsonStr).digest('hex');

  return backup;
}

export function saveBackupLocal(backup, type = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${type}-${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);
  const jsonStr = JSON.stringify(backup, null, 2);

  fs.writeFileSync(filePath, jsonStr, 'utf-8');

  return {
    filePath,
    filename,
    fileSize: Buffer.byteLength(jsonStr),
    checksum: backup.checksum,
  };
}

export async function importAllTables(backup) {
  const results = {};
  const summary = { restored: 0, errors: 0, errorDetails: [] };

  const importOrder = [
    'users',
    'delivery_customers',
    'delivery_categories',
    'delivery_products',
    'delivery_settings',
    'delivery_themes',
    'delivery_banners',
    'delivery_coupons',
    'delivery_combos',
    'delivery_employees',
    'delivery_employee_payments',
    'delivery_orders',
    'delivery_order_items',
    'delivery_order_status_history',
    'delivery_order_messages',
  ];

  for (const tableName of importOrder) {
    const rows = backup.tables?.[tableName];
    if (!rows || rows.length === 0) {
      results[tableName] = { imported: 0, skipped: true };
      continue;
    }

    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.warn(`Backup import: could not clear ${tableName}:`, deleteError.message);
    }

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' });

      if (insertError) {
        console.error(`Backup import: error inserting into ${tableName}:`, insertError.message);
        summary.errors++;
        summary.errorDetails.push({ table: tableName, error: insertError.message, batch: i });
      } else {
        summary.restored += batch.length;
      }
    }

    results[tableName] = { imported: rows.length };
  }

  return { results, summary };
}

export function listLocalBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith('backup-'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(filePath);
      const type = f.includes('auto') ? 'auto' : 'manual';
      return { filename: f, filePath, fileSize: stat.size, createdAt: stat.birthtime.toISOString(), type };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteLocalBackup(filename) {
  const filePath = path.join(BACKUP_DIR, filename);
  if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); return true; }
  return false;
}

export function readBackupFile(filename) {
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function cleanOldAutoBackups(keepCount = 10) {
  const backups = listLocalBackups().filter(b => b.type === 'auto');
  if (backups.length <= keepCount) return 0;
  const toDelete = backups.slice(keepCount);
  for (const b of toDelete) deleteLocalBackup(b.filename);
  return toDelete.length;
}

let schedulerInterval = null;
let schedulerState = { active: false, frequency: 'daily', lastRun: null };

const FREQUENCY_MS = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export async function startScheduler() {
  const { data } = await supabase
    .from('delivery_settings')
    .select('value')
    .eq('key', 'backup_settings')
    .single();

  const settings = data?.value || {};
  if (!settings.autoBackup) {
    schedulerState = { active: false, frequency: 'daily', lastRun: null };
    return;
  }

  const frequency = settings.frequency || 'daily';
  const intervalMs = FREQUENCY_MS[frequency];
  if (!intervalMs) return;

  stopScheduler();
  schedulerState = { active: true, frequency, lastRun: settings.lastBackupAt || null };

  console.log(`⚡ Auto-backup scheduler started (${frequency})`);

  schedulerInterval = setInterval(async () => {
    try {
      console.log(`⚡ Running auto-backup (${frequency})...`);
      const backup = await exportAllTables();
      saveBackupLocal(backup, 'auto');
      cleanOldAutoBackups(10);
      const now = new Date().toISOString();
      schedulerState.lastRun = now;
      await supabase
        .from('delivery_settings')
        .upsert({ key: 'backup_settings', value: { ...settings, lastBackupAt: now } }, { onConflict: 'key' });
    } catch (err) {
      console.error('⚠️ Auto-backup error:', err.message);
    }
  }, intervalMs);
}

export function stopScheduler() {
  if (schedulerInterval) { clearInterval(schedulerInterval); schedulerInterval = null; }
  schedulerState.active = false;
}

export function getSchedulerState() {
  return { ...schedulerState };
}

export async function restartScheduler() {
  stopScheduler();
  await startScheduler();
}
