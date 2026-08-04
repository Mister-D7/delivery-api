import supabase from './supabase.js';

const DEFAULT_DAYS = 30;
const THROTTLE_MS = 60 * 60 * 1000;

let lastRun = 0;

export async function getArchiveDays() {
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'archive_after_days')
      .maybeSingle();
    const n = Number(data?.value ?? DEFAULT_DAYS);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAYS;
  } catch {
    return DEFAULT_DAYS;
  }
}

export async function runAutoArchive() {
  const now = Date.now();
  if (now - lastRun < THROTTLE_MS) return { skipped: true };
  lastRun = now;

  try {
    const days = await getArchiveDays();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('delivery_orders')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .in('status', ['DELIVERED', 'CANCELLED'])
      .lt('updated_at', cutoff)
      .or('archived.is.null,archived.eq.false')
      .select('id');

    if (error) {
      console.log(`  ⚠ Auto-archive: ${error.message}`);
      return { error: error.message };
    }

    if (data?.length) {
      console.log(`  📦 Auto-archive: ${data.length} order(s) archived (after ${days} days)`);
    }
    return { archived: (data || []).length };
  } catch (err) {
    console.log(`  ⚠ Auto-archive: ${err.message}`);
    return { error: err.message };
  }
}

export function startArchiveScheduler() {
  if (!process.env.SUPABASE_URL) return;
  console.log(`  📦 Auto-archive active (every 6h, default ${DEFAULT_DAYS} days)`);
  setTimeout(() => runAutoArchive().catch(() => {}), 10 * 1000);
  setInterval(() => runAutoArchive().catch(() => {}), 6 * 60 * 60 * 1000);
}
