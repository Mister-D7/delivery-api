import { useState, useEffect } from 'react';
import { Database, Github, Cloud, Rocket, CheckCircle, XCircle, Loader2, HardDrive, Store } from '../../components/adminIcons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SupabaseTab from './settings/SupabaseTab';
import GitHubTab from './settings/GitHubTab';
import RenderTab from './settings/RenderTab';
import BackupTab from './settings/BackupTab';

const STORE_TYPE_OPTIONS = [
  { type: 'tech', label: 'Tech', emoji: '🖥️', desc: 'Design tech professionnel' },
  { type: 'gaming', label: 'Gaming', emoji: '🎮', desc: 'Design sombre cybersport' },
  { type: 'clothes', label: 'Vêtements & Mode', emoji: '👔', desc: 'Élégance beige & laiton' },
  { type: 'grocery', label: 'Épicerie & Bio', emoji: '🛒', desc: 'Vert nature, Bootstrap' },
  { type: 'food', label: 'Food & Agro', emoji: '🍽️', desc: 'Style vintage food broker' },
] as const;

type Step = { msg: string; ok: boolean };

export default function AdminSettings() {
  const { t } = useTranslation(['settings', 'backup']);
  const [tab, setTab] = useState<'supabase' | 'github' | 'render' | 'deploy' | 'backup'>('supabase');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ supabase: false, github: false, render: false });

  const [sbUrl, setSbUrl] = useState('');
  const [sbAnon, setSbAnon] = useState('');
  const [sbService, setSbService] = useState('');
  const [sbTest, setSbTest] = useState<any>(null);
  const [sbIniting, setSbIniting] = useState(false);
  const [sbShowKeys, setSbShowKeys] = useState(false);

  const [ghToken, setGhToken] = useState('');
  const [ghRepo, setGhRepo] = useState('delivery-api');
  const [ghTest, setGhTest] = useState<any>(null);
  const [ghPushing, setGhPushing] = useState(false);
  const [ghShowToken, setGhShowToken] = useState(false);

  const [rdToken, setRdToken] = useState('');
  const [rdService, setRdService] = useState('delivery-api');
  const [rdTest, setRdTest] = useState<any>(null);
  const [rdDeploying, setRdDeploying] = useState(false);

  const [deploySteps, setDeploySteps] = useState<Step[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [storeType, setStoreType] = useState(() => {
    try { return localStorage.getItem('delivery_store_type') || 'tech'; } catch { return 'tech'; }
  });

  useEffect(() => {
    loadSavedConfig();
    setLoading(false);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('delivery_store_type', storeType); } catch {}
  }, [storeType]);

  const loadSavedConfig = async () => {
    try {
      const r = await api.get('/setup/test');
      setStatus(r.data);
    } catch {}
    try {
      const r = await api.get('/storefront/settings/setup_config');
      const cfg = r.data;
      if (cfg) {
        if (cfg.sb_url) setSbUrl(cfg.sb_url);
        if (cfg.sb_anon) setSbAnon(cfg.sb_anon);
        if (cfg.sb_service) setSbService(cfg.sb_service);
        if (cfg.gh_token) setGhToken(cfg.gh_token);
        if (cfg.gh_repo) setGhRepo(cfg.gh_repo);
        if (cfg.rd_token) setRdToken(cfg.rd_token);
        if (cfg.rd_service) setRdService(cfg.rd_service);
      }
    } catch {}
  };

  const saveConfig = async () => {
    try {
      await api.put('/storefront/settings/setup_config', {
        value: { sb_url: sbUrl, sb_anon: sbAnon, sb_service: sbService, gh_token: ghToken, gh_repo: ghRepo, rd_token: rdToken, rd_service: rdService },
      });
    } catch {}
  };

  const testSupabase = async () => {
    try {
      const r = await api.post('/setup/supabase/test', { url: sbUrl, anonKey: sbAnon, serviceKey: sbService });
      setSbTest(r.data);
      if (r.data.ok) { setStatus(s => ({ ...s, supabase: true })); toast.success('Connexion OK'); saveConfig(); }
    } catch (e: any) { setSbTest({ ok: false, error: e.response?.data?.error || 'Connection failed' }); }
  };

  const initDatabase = async () => {
    setSbIniting(true);
    setDeploySteps([{ msg: 'Initialisation...', ok: true }]);
    try {
      const r = await api.post('/setup/supabase/init', { url: sbUrl, serviceKey: sbService });
      setDeploySteps(prev => [...prev, { msg: r.data.message || 'OK', ok: true }]);
      if (r.data.manual) { setSqlContent(r.data.sql); setShowSql(true); setDeploySteps(prev => [...prev, { msg: 'SQL prêt', ok: true }]); }
      toast.success('Base initialisée');
    } catch (e: any) { setDeploySteps(prev => [...prev, { msg: e.response?.data?.error || 'Init failed', ok: false }]); }
    setSbIniting(false);
  };

  const viewSql = async () => {
    try { const r = await api.get('/setup/supabase/sql'); setSqlContent(r.data.sql); setShowSql(true); } catch {}
  };

  const copySql = () => { navigator.clipboard.writeText(sqlContent); toast.success('Copié !'); };

  const testGitHub = async () => {
    try {
      const r = await api.post('/setup/github/test', { token: ghToken });
      setGhTest(r.data);
      if (r.data.ok) { setStatus(s => ({ ...s, github: true })); toast.success(r.data.message); saveConfig(); }
    } catch (e: any) { setGhTest({ ok: false, error: e.response?.data?.error || 'Auth failed' }); }
  };

  const pushCode = async () => {
    setGhPushing(true);
    setDeploySteps([]);
    try {
      const r = await api.post('/setup/github/push', { token: ghToken, repoName: ghRepo });
      setDeploySteps(r.data.steps || []);
      if (r.data.ok) toast.success('Push OK');
      else toast.error(r.data.error);
    } catch (e: any) { setDeploySteps([{ msg: e.response?.data?.error || 'Push failed', ok: false }]); }
    setGhPushing(false);
  };

  const testRender = async () => {
    try {
      const r = await api.post('/setup/render/test', { token: rdToken });
      setRdTest(r.data);
      if (r.data.ok) { setStatus(s => ({ ...s, render: true })); toast.success(r.data.message); saveConfig(); }
    } catch (e: any) { setRdTest({ ok: false, error: e.response?.data?.error || 'Auth failed' }); }
  };

  const deployToRender = async () => {
    setRdDeploying(true);
    setDeploySteps([]);
    try {
      const envVars: Record<string, string> = {};
      if (sbUrl) envVars.SUPABASE_URL = sbUrl;
      if (sbAnon) envVars.SUPABASE_ANON_KEY = sbAnon;
      if (sbService) envVars.SUPABASE_SERVICE_KEY = sbService;
      if (ghToken) envVars.GITHUB_TOKEN = ghToken;
      envVars.JWT_SECRET = 'mister-dr-delivery-2026';
      envVars.PORT = '4000';
      const r = await api.post('/setup/render/deploy', {
        token: rdToken, repoUrl: `https://github.com/${ghRepo.includes('/') ? ghRepo : 'Mister-D7/' + ghRepo}.git`, serviceName: rdService, envVars,
      });
      setDeploySteps(r.data.steps || []);
      if (r.data.ok) toast.success('Déployé !');
    } catch (e: any) { setDeploySteps([{ msg: e.response?.data?.error || 'Deploy failed', ok: false }]); }
    setRdDeploying(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--admin-gold)' }} />
    </div>
  );

  const tabs = [
    { key: 'supabase', label: 'Supabase', icon: Database, ok: status.supabase },
    { key: 'github', label: 'GitHub', icon: Github, ok: status.github },
    { key: 'render', label: 'Render', icon: Cloud, ok: status.render },
    { key: 'deploy', label: 'Déployer', icon: Rocket, ok: false },
    { key: 'backup', label: 'Backup', icon: HardDrive, ok: false },
  ] as const;

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className="w-2 h-2 rounded-full inline-block" style={{ background: ok ? 'var(--admin-success)' : 'var(--admin-danger)' }} />
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--admin-border2)' }}>
          <Rocket size={20} style={{ color: 'var(--admin-gold)' }} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>
          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Setup wizard — configureer votre infrastructure</p>
        </div>
      </div>

      <div className="surface-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Store size={14} style={{ color: 'var(--admin-gold)' }} />
          <span className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--admin-gold)' }}>TYPE DE BOUTIQUE</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STORE_TYPE_OPTIONS.map(opt => (
            <button key={opt.type} onClick={() => setStoreType(opt.type)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all"
              style={{
                background: storeType === opt.type ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)',
                outline: storeType === opt.type ? '2px solid var(--admin-gold)' : '2px solid transparent',
              }}>
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-[10px] font-bold leading-tight" style={{ color: storeType === opt.type ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>{opt.label}</span>
              <span className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card p-3 mb-4 flex items-center gap-6">
        {tabs.slice(0, 3).map(t => (
          <div key={t.key} className="flex items-center gap-2 cursor-pointer" onClick={() => setTab(t.key)}>
            <StatusDot ok={t.ok} />
            <span className="text-[11px] font-semibold" style={{ color: t.ok ? 'var(--admin-success)' : 'var(--admin-muted)' }}>{t.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
            style={{ background: tab === t.key ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: tab === t.key ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
            <t.icon size={13} /> {t.label}
            {t.ok && <CheckCircle size={11} style={{ color: 'var(--admin-success)' }} />}
          </button>
        ))}
      </div>

      {tab === 'supabase' && (
        <SupabaseTab
          t={t} sbUrl={sbUrl} setSbUrl={setSbUrl} sbAnon={sbAnon} setSbAnon={setSbAnon}
          sbService={sbService} setSbService={setSbService} sbTest={sbTest} sbIniting={sbIniting}
          sbShowKeys={sbShowKeys} setSbShowKeys={setSbShowKeys}
          showSql={showSql} sqlContent={sqlContent}
          testSupabase={testSupabase} initDatabase={initDatabase}
          setShowSql={setShowSql} copySql={copySql} viewSql={viewSql}
        />
      )}

      {tab === 'github' && (
        <GitHubTab
          t={t} ghToken={ghToken} setGhToken={setGhToken} ghRepo={ghRepo} setGhRepo={setGhRepo}
          ghTest={ghTest} ghPushing={ghPushing} ghShowToken={ghShowToken} setGhShowToken={setGhShowToken}
          testGitHub={testGitHub} pushCode={pushCode}
        />
      )}

      {tab === 'render' && (
        <RenderTab
          t={t} rdToken={rdToken} setRdToken={setRdToken} rdService={rdService} setRdService={setRdService}
          rdTest={rdTest} rdDeploying={rdDeploying}
          testRender={testRender} deployToRender={deployToRender}
        />
      )}

      {tab === 'deploy' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-gold)' }}>PUSH & DEPLOY</p>
            <p className="text-[11px] mb-4" style={{ color: 'var(--admin-muted2)' }}>
              Après avoir fait des changements locaux, cliquez ici pour pousser le code vers GitHub et redéployer sur Render automatiquement.
            </p>
            <div className="flex gap-3">
              <button onClick={pushCode} disabled={ghPushing || !ghToken}
                className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
                {ghPushing ? <Loader2 size={12} className="animate-spin" /> : <Github size={12} />}
                {ghPushing ? 'Push...' : '1. Push GitHub'}
              </button>
              <button onClick={deployToRender} disabled={rdDeploying || !rdToken}
                className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
                {rdDeploying ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                {rdDeploying ? 'Deploy...' : '2. Deploy Render'}
              </button>
            </div>
          </div>

          {deploySteps.length > 0 && (
            <div className="surface-card p-5">
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--admin-muted)' }}>LOG</p>
              <div className="space-y-1">
                {deploySteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < deploySteps.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    {s.ok ? <CheckCircle size={12} style={{ color: 'var(--admin-success)', marginTop: 2 }} /> : <XCircle size={12} style={{ color: 'var(--admin-danger)', marginTop: 2 }} />}
                    <span className="text-[11px]" style={{ color: s.ok ? 'var(--admin-muted)' : 'var(--admin-danger)' }}>{s.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="surface-card p-5">
            <p className="text-xs font-bold mb-4" style={{ color: 'var(--admin-muted)' }}>GUIDE</p>
            <div className="space-y-3">
              {[
                { step: 1, title: 'Supabase', desc: 'Créez un projet sur supabase.co → Copiez les clés', done: status.supabase },
                { step: 2, title: 'GitHub', desc: 'Créez un token avec scope "repo" → Copiez-le', done: status.github },
                { step: 3, title: 'Render', desc: 'Créez un compte → Account Settings → API Keys', done: status.render },
                { step: 4, title: 'Push & Deploy', desc: 'Cliquez sur Push GitHub puis Deploy Render', done: false },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: item.done ? 'rgba(74,222,128,0.04)' : 'var(--admin-bg)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ background: item.done ? 'var(--admin-success)' : 'var(--admin-gold-bg)', color: item.done ? 'var(--admin-bg)' : 'var(--admin-gold)' }}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">{item.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'backup' && <BackupTab />}
    </div>
  );
}
