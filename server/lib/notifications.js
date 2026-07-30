import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, '..', '..', '.notifier-state.json');

let knownOrderIds = [];
let knownStatuses = {};
let pollInterval = null;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      knownOrderIds = data.knownOrderIds || [];
      knownStatuses = data.knownStatuses || {};
    }
  } catch { knownOrderIds = []; }
}

function saveState() {
  try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ knownOrderIds, knownStatuses, lastCheck: new Date().toISOString() }, null, 2));
  } catch {}
}

function showNotification(title, body) {
  if (process.platform !== 'win32') {
    console.log(`\n  🔔 ${title}\n  ${body}\n`);
    return;
  }
  try {
    const safeTitle = title.replace(/'/g, "''");
    const safeBody = body.replace(/'/g, "''").replace(/\n/g, ' ');
    const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$xml = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>${safeTitle}</text>
      <text>${safeBody}</text>
    </binding>
  </visual>
</toast>
"@
$doc = New-Object Windows.Data.Xml.Dom.XmlDocument
$doc.LoadXml($xml)
$toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("MISTER-DR").Show($toast)`;
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, { timeout: 10000 });
  } catch {}
}

function playBeep() {
  try {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$player = New-Object System.Media.SoundPlayer
$bytes = [System.IO.MemoryStream]::new()
$writer = New-Object System.IO.BinaryWriter($bytes)
function WriteShort($v) { $writer.Write([System.BitConverter]::GetBytes([System.Int16]$v)) }
function WriteInt($v) { $writer.Write([System.BitConverter]::GetBytes([System.Int32]$v)) }
function WriteShortAt($pos,$v) { $pos2=$writer.BaseStream.Position; $writer.BaseStream.Position=$pos; WriteShort $v; $writer.BaseStream.Position=$pos2 }
$sr=44100; $dur=0.5; $freq1=880; $freq2=1100
$ns=[int]($sr*$dur)
$writer.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF"))
WriteInt (36+$ns*2)
$writer.Write([System.Text.Encoding]::ASCII.GetBytes("WAVEfmt "))
WriteInt 16; WriteShort 1; WriteShort 1; WriteInt $sr; WriteInt ($sr*2); WriteShort 2; WriteShort 16
$writer.Write([System.Text.Encoding]::ASCII.GetBytes("data"))
WriteInt ($ns*2)
$half=$ns/2
for($i=0;$i -lt $ns;$i++){
  $t=$i/$sr
  $env=[Math]::Exp(-$t*8)
  if($i -lt $half){ $sig=[Math]::Sin(2*[Math]::PI*$freq1*$t)*$env } else { $sig=[Math]::Sin(2*[Math]::PI*$freq2*$t)*$env }
  WriteShort ([int]([Math]::Max(-32768,[Math]::Min(32767,$sig*20000))))
}
$writer.Flush(); $bytes.Position=0
$player.Stream=$bytes; $player.PlaySync()
$bytes.Dispose(); $writer.Dispose()`;
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '""')}"`, { timeout: 8000 });
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
    for (const order of orders) {
      const prevStatus = knownStatuses[order.id];
      if (prevStatus && prevStatus !== order.status) {
        const statusLabels = { PENDING: 'En attente', CONFIRMED: 'Confirmée', PREPARING: 'En préparation', ON_THE_WAY: 'En route', DELIVERED: 'Livrée', CANCELLED: 'Annulée' };
        const title = `📦 COMMANDE #${order.secure_token}`;
        const body = `${order.customer_name} — ${statusLabels[order.status] || order.status}`;
        showNotification(title, body);
        playBeep();
      }
      knownStatuses[order.id] = order.status;
    }

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
