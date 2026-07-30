import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

/* ════════════════════════════════════════
   EMAIL SETTINGS (stored in delivery_settings)
   ════════════════════════════════════════ */

export async function getEmailSettings() {
  const { data } = await supabase
    .from('delivery_settings')
    .select('value')
    .eq('key', 'email_backup_settings')
    .maybeSingle();
  return data?.value || null;
}

export async function saveEmailSettings(settings) {
  const { error } = await supabase
    .from('delivery_settings')
    .upsert({ key: 'email_backup_settings', value: settings }, { onConflict: 'key' });
  if (error) throw error;
}

/* ════════════════════════════════════════
   CREATE TRANSPORTER
   ════════════════════════════════════════ */

function createTransporter(settings) {
  return nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: settings.smtpPort || 587,
    secure: false,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });
}

/* ════════════════════════════════════════
   TEST CONNECTION
   ════════════════════════════════════════ */

export async function testEmailConnection(settings) {
  const transporter = createTransporter(settings);
  await transporter.verify();
  return { ok: true, message: 'Connexion SMTP réussie' };
}

/* ════════════════════════════════════════
   SEND BACKUP EMAIL
   ════════════════════════════════════════ */

export async function sendBackupEmail(settings, backupContent, filename) {
  const transporter = createTransporter(settings);
  const date = new Date().toLocaleDateString('fr-FR');
  const sizeKB = (Buffer.byteLength(backupContent) / 1024).toFixed(1);

  const info = await transporter.sendMail({
    from: `"MISTER-DR Backup" <${settings.smtpUser}>`,
    to: settings.recipientEmail || settings.smtpUser,
    subject: `📦 Backup MISTER-DR — ${date}`,
    text: `Backup automatique MISTER-DR Delivery.\nFichier: ${filename}\nTaille: ${sizeKB} KB\nDate: ${date}`,
    attachments: [{
      filename,
      content: backupContent,
      contentType: 'application/json',
    }],
  });

  return { ok: true, messageId: info.messageId };
}
