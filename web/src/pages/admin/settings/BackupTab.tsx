import { useState, useEffect, useRef } from 'react';
import { HardDrive, Download, Upload, Play, Trash2, ToggleLeft, ToggleRight, Loader2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import AdminSelect from '../AdminSelect';

export default function BackupTab() {
  const { t } = useTranslation(['settings', 'backup']);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bkAutoEnabled, setBkAutoEnabled] = useState(false);
  const [bkFrequency, setBkFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [bkKeepCount, setBkKeepCount] = useState(10);
  const [bkList, setBkList] = useState<any[]>([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [bkSaving, setBkSaving] = useState(false);
  const [bkRunning, setBkRunning] = useState(false);

  const [cloudProviders, setCloudProviders] = useState<{ id: string; name: string; configured: boolean; connected: boolean; account?: any }[]>([]);
  const [cloudBackupLoading, setCloudBackupLoading] = useState<string | null>(null);
  const [cloudConnecting, setCloudConnecting] = useState<string | null>(null);

  const [emailSettings, setEmailSettings] = useState({ smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: '', smtpPass: '', recipientEmail: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailBackupLoading, setEmailBackupLoading] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);

  useEffect(() => {
    loadBackupSettings();
    loadBackupList();
    loadCloudProviders();
    loadEmailSettings();
  }, []);

  const loadBackupSettings = async () => {
    try { const r = await api.get('/backup/settings'); const d = r.data; if (d) { setBkAutoEnabled(d.autoEnabled ?? false); setBkFrequency(d.frequency ?? 'daily'); setBkKeepCount(d.keepCount ?? 10); } } catch {}
  };
  const loadBackupList = async () => { try { const r = await api.get('/backup/list'); setBkList(r.data?.backups || []); } catch {} };
  const saveBackupSettings = async () => {
    setBkSaving(true);
    try { await api.put('/backup/settings', { autoEnabled: bkAutoEnabled, frequency: bkFrequency, keepCount: bkKeepCount }); toast.success('Sauvegardé'); } catch { toast.error('Erreur'); }
    setBkSaving(false);
  };
  const runBackupNow = async () => {
    setBkRunning(true);
    try { await api.post('/backup/run-now'); toast.success('Backup lancé'); loadBackupList(); } catch { toast.error('Erreur'); }
    setBkRunning(false);
  };
  const exportBackupLocal = async () => {
    setBkLoading(true);
    try { await api.post('/backup/export', { saveLocal: true }); toast.success('Exporté'); loadBackupList(); } catch { toast.error('Erreur'); }
    setBkLoading(false);
  };
  const exportBackupDownload = async () => {
    setBkLoading(true);
    try {
      const r = await api.post('/backup/export', { saveLocal: false });
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON téléchargé');
    } catch { toast.error('Erreur'); }
    setBkLoading(false);
  };
  const downloadBackup = async (id: string) => {
    try {
      const r = await api.get(`/backup/download/${id}`);
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup-${id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erreur'); }
  };
  const deleteBackup = async (id: string) => {
    try { await api.delete(`/backup/${id}`); toast.success('Supprimé'); loadBackupList(); } catch { toast.error('Erreur'); }
  };
  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setBkLoading(true);
      await api.post('/backup/import', { backup: json });
      toast.success('Importé');
      loadBackupList();
    } catch { toast.error('Erreur import'); }
    setBkLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const loadCloudProviders = async () => { try { const r = await api.get('/cloud/providers'); setCloudProviders(r.data.providers || []); } catch {} };
  const connectCloud = async (provider: string) => {
    try {
      setCloudConnecting(provider);
      const r = await api.get(`/cloud/connect/${provider}`);
      const w = window.open(r.data.url, '_blank', 'width=500,height=600');
      const poll = setInterval(() => { if (w && w.closed) { clearInterval(poll); loadCloudProviders(); setCloudConnecting(null); } }, 1000);
      setTimeout(() => { clearInterval(poll); loadCloudProviders(); setCloudConnecting(null); }, 120000);
    } catch (err: any) { toast.error(err.response?.data?.error || err.message); setCloudConnecting(null); }
  };
  const disconnectCloud = async (id: string) => { try { await api.delete(`/cloud/disconnect/${id}`); toast.success('Déconnecté'); loadCloudProviders(); } catch { toast.error('Erreur'); } };
  const backupToCloud = async (provider: string) => {
    setCloudBackupLoading(provider);
    try { const r = await api.post('/cloud/backup', { provider }); toast.success(`Backup envoyé vers ${provider === 'google_drive' ? 'Google Drive' : 'OneDrive'} !`); loadBackupList(); } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur backup cloud'); }
    finally { setCloudBackupLoading(null); }
  };
  const loadEmailSettings = async () => {
    try { const r = await api.get('/email/settings'); if (r.data.settings) { setEmailSettings(r.data.settings); setEmailConfigured(true); } } catch {}
  };
  const saveEmailSettingsHandler = async () => {
    setEmailSaving(true);
    try { await api.post('/email/settings', emailSettings); toast.success('Email config sauvegardée'); setEmailConfigured(true); } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setEmailSaving(false); }
  };
  const testEmailConnection = async () => {
    setEmailTesting(true);
    try { await api.post('/email/test'); toast.success('Connexion SMTP réussie !'); } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur connexion'); }
    finally { setEmailTesting(false); }
  };
  const sendBackupByEmail = async () => {
    setEmailBackupLoading(true);
    try { const r = await api.post('/email/backup'); toast.success(`Backup envoyé ! (${r.data.filename})`); loadBackupList(); } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur envoi'); }
    finally { setEmailBackupLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>AUTO-BACKUP</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Activer</span>
            <button onClick={() => setBkAutoEnabled(!bkAutoEnabled)}>
              {bkAutoEnabled ? <ToggleRight size={28} style={{ color: 'var(--admin-success)' }} /> : <ToggleLeft size={28} style={{ color: 'var(--admin-muted2)' }} />}
            </button>
          </div>
          {bkAutoEnabled && (
            <>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Fréquence</label>
                <AdminSelect value={bkFrequency} onChange={v => setBkFrequency(v as any)} className="w-full text-xs"
                  options={[
                    { value: 'hourly', label: 'Chaque heure' },
                    { value: 'daily', label: 'Quotidien' },
                    { value: 'weekly', label: 'Hebdomadaire' },
                  ]} />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Nombre max de backups</label>
                <input type="number" min={1} max={100} value={bkKeepCount} onChange={e => setBkKeepCount(Number(e.target.value))} className="input-field text-xs w-full" />
              </div>
            </>
          )}
          <button onClick={saveBackupSettings} disabled={bkSaving} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
            {bkSaving ? <Loader2 size={12} className="animate-spin" /> : null} Sauvegarder
          </button>
        </div>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>ACTIONS MANUELLES</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportBackupLocal} disabled={bkLoading} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
            <HardDrive size={12} /> Sauvegarder
          </button>
          <button onClick={exportBackupDownload} disabled={bkLoading} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
            <Download size={12} /> Télécharger JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={bkLoading} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
            <Upload size={12} /> Importer JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importBackup} className="hidden" />
          <button onClick={runBackupNow} disabled={bkRunning} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
            {bkRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Exécuter
          </button>
        </div>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>EMAIL BACKUP</p>
        <p className="text-[10px] mb-4" style={{ color: 'var(--admin-muted2)' }}>Sauvegardez par email. Utilisez un mot de passe d'application Gmail.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>SMTP Host</label>
              <input value={emailSettings.smtpHost} onChange={e => setEmailSettings(s => ({ ...s, smtpHost: e.target.value }))} className="input-field text-xs w-full" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Port</label>
              <input value={emailSettings.smtpPort} onChange={e => setEmailSettings(s => ({ ...s, smtpPort: e.target.value }))} className="input-field text-xs w-full" placeholder="587" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Email Gmail</label>
            <input type="email" value={emailSettings.smtpUser} onChange={e => setEmailSettings(s => ({ ...s, smtpUser: e.target.value }))} className="input-field text-xs w-full" placeholder="votre@gmail.com" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Mot de passe d'application</label>
            <input type="password" value={emailSettings.smtpPass} onChange={e => setEmailSettings(s => ({ ...s, smtpPass: e.target.value }))} className="input-field text-xs w-full" placeholder="abcd efgh ijkl mnop" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Envoyer à (optionnel)</label>
            <input type="email" value={emailSettings.recipientEmail} onChange={e => setEmailSettings(s => ({ ...s, recipientEmail: e.target.value }))} className="input-field text-xs w-full" placeholder="Même que l'email si vide" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEmailSettingsHandler} disabled={emailSaving || !emailSettings.smtpUser || !emailSettings.smtpPass} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
              {emailSaving ? <Loader2 size={11} className="animate-spin" /> : null} Sauvegarder
            </button>
            <button onClick={testEmailConnection} disabled={emailTesting || !emailConfigured} className="px-4 py-2 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-40" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              {emailTesting ? <Loader2 size={11} className="animate-spin" /> : null} Tester
            </button>
            <button onClick={sendBackupByEmail} disabled={emailBackupLoading || !emailConfigured} className="px-4 py-2 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-40" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--admin-success)' }}>
              {emailBackupLoading ? <Loader2 size={11} className="animate-spin" /> : null} Envoyer le backup
            </button>
          </div>
          {emailConfigured && <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--admin-success)' }}><Check size={10} /> Configuré — {emailSettings.smtpUser}</p>}
        </div>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>HISTORIQUE</p>
        {bkList.length === 0 ? (
          <p className="text-[11px]" style={{ color: 'var(--admin-muted2)' }}>Aucun backup pour le moment</p>
        ) : (
          <div className="space-y-1">
            {bkList.map((bk: any, i: number) => (
              <div key={bk.id || i} className="flex items-center justify-between py-2" style={{ borderBottom: i < bkList.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <HardDrive size={14} style={{ color: 'var(--admin-gold)' }} />
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--admin-muted)' }}>{bk.filename || bk.id}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>{bk.size ? `${(bk.size / 1024).toFixed(1)} KB` : ''} {bk.createdAt ? new Date(bk.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => downloadBackup(bk.id)} className="p-1.5 rounded-lg" style={{ background: 'var(--admin-border3)' }}>
                    <Download size={13} style={{ color: 'var(--admin-gold)' }} />
                  </button>
                  <button onClick={() => deleteBackup(bk.id)} className="p-1.5 rounded-lg" style={{ background: 'var(--admin-danger-bg)' }}>
                    <Trash2 size={13} style={{ color: 'var(--admin-danger)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
