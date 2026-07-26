import { useState, useEffect } from 'react';
import { Database, Github, Cloud, Rocket, CheckCircle, XCircle, Loader2, Copy, ExternalLink, Eye, EyeOff, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

type TestResult = { ok: boolean; message?: string; error?: string };
type Step = { msg: string; ok: boolean };

export default function AdminSettings() {
  const [tab, setTab] = useState<'supabase' | 'github' | 'render' | 'deploy'>('supabase');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ supabase: false, github: false, render: false });

  const [sbUrl, setSbUrl] = useState('');
  const [sbAnon, setSbAnon] = useState('');
  const [sbService, setSbService] = useState('');
  const [sbTest, setSbTest] = useState<TestResult | null>(null);
  const [sbIniting, setSbIniting] = useState(false);
  const [sbShowKeys, setSbShowKeys] = useState(false);

  const [ghToken, setGhToken] = useState('');
  const [ghRepo, setGhRepo] = useState('delivery-api');
  const [ghTest, setGhTest] = useState<TestResult | null>(null);
  const [ghPushing, setGhPushing] = useState(false);
  const [ghShowToken, setGhShowToken] = useState(false);

  const [rdToken, setRdToken] = useState('');
  const [rdService, setRdService] = useState('delivery-api');
  const [rdTest, setRdTest] = useState<TestResult | null>(null);
  const [rdDeploying, setRdDeploying] = useState(false);

  const [deploySteps, setDeploySteps] = useState<Step[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [sqlContent, setSqlContent] = useState('');

  useEffect(() => {
    loadSavedConfig();
  }, []);

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
    setLoading(false);
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
      if (r.data.ok) { setStatus(s => ({ ...s, supabase: true })); toast.success('Supabase connecté!'); saveConfig(); }
    } catch (e: any) { setSbTest({ ok: false, error: e.response?.data?.error || 'Connection failed' }); }
  };

  const initDatabase = async () => {
    setSbIniting(true);
    setDeploySteps([{ msg: 'Initialisation de la base de données...', ok: true }]);
    try {
      const r = await api.post('/setup/supabase/init', { url: sbUrl, serviceKey: sbService });
      setDeploySteps(prev => [...prev, { msg: r.data.message || 'Done!', ok: true }]);
      if (r.data.manual) {
        setSqlContent(r.data.sql);
        setShowSql(true);
        setDeploySteps(prev => [...prev, { msg: 'Copiez le SQL ci-dessous et collez-le dans Supabase SQL Editor', ok: true }]);
      }
      toast.success('Base initialisée!');
    } catch (e: any) {
      setDeploySteps(prev => [...prev, { msg: e.response?.data?.error || 'Init failed', ok: false }]);
    }
    setSbIniting(false);
  };

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
      if (r.data.ok) toast.success('Code pushé sur GitHub!');
      else toast.error(r.data.error);
    } catch (e: any) {
      setDeploySteps([{ msg: e.response?.data?.error || 'Push failed', ok: false }]);
    }
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
        token: rdToken,
        repoUrl: `https://github.com/${ghRepo.includes('/') ? ghRepo : 'Mister-D7/' + ghRepo}.git`,
        serviceName: rdService,
        envVars,
      });
      setDeploySteps(r.data.steps || []);
      if (r.data.ok) toast.success('Déployé sur Render!');
    } catch (e: any) {
      setDeploySteps([{ msg: e.response?.data?.error || 'Deploy failed', ok: false }]);
    }
    setRdDeploying(false);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlContent);
    toast.success('SQL copié!');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: '#bfa24e' }} />
    </div>
  );

  const tabs = [
    { key: 'supabase', label: 'Supabase', icon: Database, ok: status.supabase },
    { key: 'github', label: 'GitHub', icon: Github, ok: status.github },
    { key: 'render', label: 'Render', icon: Cloud, ok: status.render },
    { key: 'deploy', label: 'Push to Web', icon: Rocket, ok: false },
  ] as const;

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className="w-2 h-2 rounded-full inline-block" style={{ background: ok ? '#4ade80' : '#d9603b' }} />
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.12)' }}>
          <Rocket size={20} style={{ color: '#bfa24e' }} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Configuration</h1>
          <p className="text-xs" style={{ color: '#8c8578' }}>Setup wizard — configureer votre infrastructure</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="surface-card p-3 mb-4 flex items-center gap-6">
        {tabs.slice(0, 3).map(t => (
          <div key={t.key} className="flex items-center gap-2 cursor-pointer" onClick={() => setTab(t.key)}>
            <StatusDot ok={t.ok} />
            <span className="text-[11px] font-semibold" style={{ color: t.ok ? '#4ade80' : '#8c8578' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
            style={{ background: tab === t.key ? 'rgba(191,162,78,0.15)' : '#1a1a1a', color: tab === t.key ? '#bfa24e' : '#8c8578' }}>
            <t.icon size={13} /> {t.label}
            {t.ok && <CheckCircle size={11} style={{ color: '#4ade80' }} />}
          </button>
        ))}
      </div>

      {/* ═══ SUPABASE TAB ═══ */}
      {tab === 'supabase' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>CONNEXION SUPABASE</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Project URL</label>
                <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="input-field text-xs w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Anon Key</label>
                <div className="relative">
                  <input value={sbAnon} onChange={e => setSbAnon(e.target.value)} type={sbShowKeys ? 'text' : 'password'} placeholder="eyJ..." className="input-field text-xs w-full pr-8" />
                  <button onClick={() => setSbShowKeys(!sbShowKeys)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: '#555' }} /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Service Role Key</label>
                <div className="relative">
                  <input value={sbService} onChange={e => setSbService(e.target.value)} type={sbShowKeys ? 'text' : 'password'} placeholder="eyJ..." className="input-field text-xs w-full pr-8" />
                  <button onClick={() => setSbShowKeys(!sbShowKeys)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: '#555' }} /></button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={testSupabase} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                  <Database size={12} /> Tester
                </button>
                {sbTest && (
                  <span className="text-[11px] flex items-center gap-1" style={{ color: sbTest.ok ? '#4ade80' : '#d9603b' }}>
                    {sbTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {sbTest.message || sbTest.error}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>INITIALISER LA BASE</p>
            <p className="text-[11px] mb-3" style={{ color: '#555' }}>
              Crée toutes les tables (products, orders, categories, etc.) dans votre projet Supabase.
            </p>
            <button onClick={initDatabase} disabled={sbIniting || !sbUrl || !sbService}
              className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
              {sbIniting ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              {sbIniting ? 'Initialisation...' : 'Initialiser la base'}
            </button>
            <p className="text-[10px] mt-2" style={{ color: '#8c8578' }}>
              Astuce: Si l'init automatique échoue, copiez le SQL et collez-le dans Supabase SQL Editor
            </p>
            <button onClick={async () => {
              try { const r = await api.get('/setup/supabase/sql'); setSqlContent(r.data.sql); setShowSql(true); } catch {}
            }} className="text-[10px] mt-1 underline" style={{ color: '#bfa24e' }}>
              Voir le SQL
            </button>
          </div>

          {showSql && (
            <div className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold" style={{ color: '#bfa24e' }}>SQL MIGRATION</p>
                <div className="flex gap-2">
                  <button onClick={copySql} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold" style={{ background: '#1a1a1a', color: '#bfa24e' }}>
                    <Copy size={11} /> Copier
                  </button>
                  <button onClick={() => setShowSql(false)} className="text-[10px]" style={{ color: '#8c8578' }}>Fermer</button>
                </div>
              </div>
              <pre className="text-[9px] p-3 rounded-lg overflow-auto max-h-80" style={{ background: '#0a0a0a', color: '#8c8578' }}>
                {sqlContent}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ═══ GITHUB TAB ═══ */}
      {tab === 'github' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>GITHUB TOKEN</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Personal Access Token</label>
                <div className="relative">
                  <input value={ghToken} onChange={e => setGhToken(e.target.value)} type={ghShowToken ? 'text' : 'password'} placeholder="ghp_xxxxxxxxxxxx" className="input-field text-xs w-full pr-8" />
                  <button onClick={() => setGhShowToken(!ghShowToken)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: '#555' }} /></button>
                </div>
                <p className="text-[9px] mt-1" style={{ color: '#555' }}>
                  Scope: <code>repo</code> — <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: '#bfa24e' }}>Créer un token <ExternalLink size={9} /></a>
                </p>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Nom du repository</label>
                <input value={ghRepo} onChange={e => setGhRepo(e.target.value)} placeholder="delivery-api" className="input-field text-xs w-full" />
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={testGitHub} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                  <Github size={12} /> Tester
                </button>
                {ghTest && (
                  <span className="text-[11px] flex items-center gap-1" style={{ color: ghTest.ok ? '#4ade80' : '#d9603b' }}>
                    {ghTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {ghTest.message || ghTest.error}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>PUSH CODE</p>
            <p className="text-[11px] mb-3" style={{ color: '#555' }}>
              Push tout le code (server + frontend) vers GitHub. Le repository sera créé automatiquement s'il n'existe pas.
            </p>
            <button onClick={pushCode} disabled={ghPushing || !ghToken}
              className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
              {ghPushing ? <Loader2 size={12} className="animate-spin" /> : <Github size={12} />}
              {ghPushing ? 'Push en cours...' : 'Push vers GitHub'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ RENDER TAB ═══ */}
      {tab === 'render' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>RENDER API KEY</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>API Key</label>
                <input value={rdToken} onChange={e => setRdToken(e.target.value)} type="password" placeholder="rnd_xxxxxxxxxxxx" className="input-field text-xs w-full" />
                <p className="text-[9px] mt-1" style={{ color: '#555' }}>
                  <a href="https://dashboard.render.com/settings#api-keys" target="_blank" rel="noreferrer" style={{ color: '#bfa24e' }}>Obtenir une clé API <ExternalLink size={9} /></a>
                </p>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Nom du service</label>
                <input value={rdService} onChange={e => setRdService(e.target.value)} placeholder="delivery-api" className="input-field text-xs w-full" />
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={testRender} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                  <Cloud size={12} /> Tester
                </button>
                {rdTest && (
                  <span className="text-[11px] flex items-center gap-1" style={{ color: rdTest.ok ? '#4ade80' : '#d9603b' }}>
                    {rdTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {rdTest.message || rdTest.error}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#8c8578' }}>DÉPLOYER SUR RENDER</p>
            <p className="text-[11px] mb-3" style={{ color: '#555' }}>
              Crée ou met à jour le service Web sur Render. Les variables d'environnement sont configurées automatiquement.
            </p>
            <button onClick={deployToRender} disabled={rdDeploying || !rdToken}
              className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
              {rdDeploying ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
              {rdDeploying ? 'Déploiement...' : 'Déployer sur Render'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ DEPLOY TAB ═══ */}
      {tab === 'deploy' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-4" style={{ color: '#bfa24e' }}>PUSHER LES MISES A JOUR</p>
            <p className="text-[11px] mb-4" style={{ color: '#555' }}>
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

          {/* Steps log */}
          {deploySteps.length > 0 && (
            <div className="surface-card p-5">
              <p className="text-xs font-bold mb-3" style={{ color: '#8c8578' }}>LOG</p>
              <div className="space-y-1">
                {deploySteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < deploySteps.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    {s.ok ? <CheckCircle size={12} style={{ color: '#4ade80', marginTop: 2 }} /> : <XCircle size={12} style={{ color: '#d9603b', marginTop: 2 }} />}
                    <span className="text-[11px]" style={{ color: s.ok ? '#8c8578' : '#d9603b' }}>{s.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick setup guide */}
          <div className="surface-card p-5">
            <p className="text-xs font-bold mb-4" style={{ color: '#8c8578' }}>GUIDE RAPIDE</p>
            <div className="space-y-3">
              {[
                { step: 1, title: 'Supabase', desc: 'Créez un projet sur supabase.co → Copiez les clés', done: status.supabase },
                { step: 2, title: 'GitHub', desc: 'Créez un token avec scope "repo" → Copiez-le', done: status.github },
                { step: 3, title: 'Render', desc: 'Créez un compte → Account Settings → API Keys', done: status.render },
                { step: 4, title: 'Push & Deploy', desc: 'Cliquez sur Push GitHub puis Deploy Render', done: false },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: item.done ? 'rgba(74,222,128,0.04)' : '#0a0a0a' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ background: item.done ? '#4ade80' : 'rgba(191,162,78,0.15)', color: item.done ? '#0a0a0a' : '#bfa24e' }}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">{item.title}</p>
                    <p className="text-[10px]" style={{ color: '#555' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
