import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, '..', '..', '.notifier-state.json');

let knownOrderIds = [];
let pollInterval = null;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      knownOrderIds = data.knownOrderIds || [];
    }
  } catch { knownOrderIds = []; }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ knownOrderIds, lastCheck: new Date().toISOString() }, null, 2));
  } catch {}
}

function showNotification(title, body) {
  if (process.platform !== 'win32') {
    console.log(`\n  🔔 ${title}\n  ${body}\n`);
    return;
  }
  try {
    const psScript = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '$n = New-Object System.Windows.Forms.NotifyIcon',
      '$n.Icon = [System.Drawing.SystemIcons]::Information',
      `$n.BalloonTipTitle = "${title.replace(/"/g, '""')}"`,
      `$n.BalloonTipText = "${body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      '$n.Visible = $true',
      '$n.ShowBalloonTip(8000)',
      'Start-Sleep -Seconds 3',
      '$n.Dispose()',
    ].join('; ');
    execSync(`powershell -NoProfile -Command "${psScript}"`, { timeout: 10000, stdio: 'ignore' });
  } catch {}
}

function playBeep() {
  try {
    execSync('powershell -NoProfile -Command "[Console]::Beep(800,300); Start-Sleep -Milliseconds 200; [Console]::Beep(1000,300)"', { timeout: 5000, stdio: 'ignore' });
  } catch {}
}

function formatItems(items) {
  if (!items?.length) return 'Aucun article';
  return items.map(i => `${i.quantity}x ${i.custom_name || i.name || 'Item'}`).join(', ');
}

async function checkNewOrders() {
  try {
    const { data: orders } = await supabase
      .from('delivery_orders')
      .select('id, secure_token, customer_name, phone, address, total, delivery_fee, status, delivery_order_items(name, quantity, custom_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!orders?.length) return;

    const currentIds = orders.map(o => o.id);

    if (knownOrderIds.length === 0) {
      knownOrderIds = currentIds;
      saveState();
      console.log(`  📋 Tracking ${orders.length} existing orders`);
      return;
    }

    const newOrders = orders.filter(o => !knownOrderIds.includes(o.id));

    for (const order of newOrders) {
      const items = formatItems(order.delivery_order_items);
      const title = `🛒 NOUVELLE COMMANDE!`;
      const body = `Client: ${order.customer_name}\nTel: ${order.phone}\nAdresse: ${order.address}\nArticles: ${items}\nTotal: ${order.total} DA`;

      console.log(`\n  ━━━ NOUVELLE COMMANDE ━━━`);
      console.log(`  Client:  ${order.customer_name}`);
      console.log(`  Tel:     ${order.phone}`);
      console.log(`  Adresse: ${order.address}`);
      console.log(`  Articles: ${items}`);
      console.log(`  Total:   ${order.total} DA (livraison: ${order.delivery_fee || 0} DA)`);
      console.log(`  Token:   #${order.secure_token}`);
      console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      showNotification(title, body);
      playBeep();
    }

    knownOrderIds = currentIds;
    saveState();
  } catch (err) {
    console.log(`  ⚠ Notification poll error: ${err.message}`);
  }
}

export function startOrderNotifier() {
  if (!process.env.SUPABASE_URL) return;
  loadState();
  console.log(`  🔔 Order notifications active (polling every 15s)`);
  checkNewOrders();
  pollInterval = setInterval(checkNewOrders, 15000);
}

export function stopOrderNotifier() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
