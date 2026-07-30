import { Eye, Database, Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';

type Props = {
  t: (k: string) => string;
  sbUrl: string; setSbUrl: (v: string) => void;
  sbAnon: string; setSbAnon: (v: string) => void;
  sbService: string; setSbService: (v: string) => void;
  sbTest: any; sbIniting: boolean; sbShowKeys: boolean; setSbShowKeys: (v: boolean) => void;
  showSql: boolean; sqlContent: string;
  testSupabase: () => void; initDatabase: () => void;
  setShowSql: (v: boolean) => void; copySql: () => void;
  viewSql: () => void;
};

export default function SupabaseTab(props: Props) {
  const { t, sbUrl, setSbUrl, sbAnon, setSbAnon, sbService, setSbService, sbTest, sbIniting, sbShowKeys, setSbShowKeys, showSql, sqlContent, testSupabase, initDatabase, setShowSql, copySql, viewSql } = props;

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>{t('supabase.title')}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Project URL</label>
            <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="input-field text-xs w-full" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Anon Key</label>
            <div className="relative">
              <input value={sbAnon} onChange={e => setSbAnon(e.target.value)} type={sbShowKeys ? 'text' : 'password'} placeholder="eyJ..." className="input-field text-xs w-full pr-8" />
              <button onClick={() => setSbShowKeys(!sbShowKeys)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: 'var(--admin-muted2)' }} /></button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Service Role Key</label>
            <div className="relative">
              <input value={sbService} onChange={e => setSbService(e.target.value)} type={sbShowKeys ? 'text' : 'password'} placeholder="eyJ..." className="input-field text-xs w-full pr-8" />
              <button onClick={() => setSbShowKeys(!sbShowKeys)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: 'var(--admin-muted2)' }} /></button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={testSupabase} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
              <Database size={12} /> {t('supabase.test')}
            </button>
            {sbTest && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: sbTest.ok ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {sbTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {sbTest.message || sbTest.error}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>{t('supabase.init')}</p>
        <p className="text-[11px] mb-3" style={{ color: 'var(--admin-muted2)' }}>
          Crée toutes les tables (products, orders, categories, etc.) dans votre projet Supabase.
        </p>
        <button onClick={initDatabase} disabled={sbIniting || !sbUrl || !sbService}
          className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          {sbIniting ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
          {sbIniting ? t('supabase.init') : t('supabase.init')}
        </button>
        <p className="text-[10px] mt-2" style={{ color: 'var(--admin-muted)' }}>{t('supabase.error')}</p>
        <button onClick={viewSql} className="text-[10px] mt-1 underline" style={{ color: 'var(--admin-gold)' }}>Voir le SQL</button>
      </div>
      {showSql && (
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{t('github.title')}</p>
            <div className="flex gap-2">
              <button onClick={copySql} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-gold)' }}>
                <Copy size={11} /> Copier
              </button>
              <button onClick={() => setShowSql(false)} className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Fermer</button>
            </div>
          </div>
          <pre className="text-[9px] p-3 rounded-lg overflow-auto max-h-80" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted)' }}>
            {sqlContent}
          </pre>
        </div>
      )}
    </div>
  );
}
