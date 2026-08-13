import { Eye, Github, Loader2, CheckCircle, XCircle, ExternalLink } from '../../../components/adminIcons';

type Props = {
  t: (k: string) => string;
  ghToken: string; setGhToken: (v: string) => void;
  ghRepo: string; setGhRepo: (v: string) => void;
  ghTest: any; ghPushing: boolean; ghShowToken: boolean; setGhShowToken: (v: boolean) => void;
  testGitHub: () => void; pushCode: () => void;
};

export default function GitHubTab(props: Props) {
  const { t, ghToken, setGhToken, ghRepo, setGhRepo, ghTest, ghPushing, ghShowToken, setGhShowToken, testGitHub, pushCode } = props;

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>GITHUB TOKEN</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Personal Access Token</label>
            <div className="relative">
              <input value={ghToken} onChange={e => setGhToken(e.target.value)} type={ghShowToken ? 'text' : 'password'} placeholder="ghp_xxxxxxxxxxxx" className="input-field text-xs w-full pr-8" />
              <button onClick={() => setGhShowToken(!ghShowToken)} className="absolute right-2 top-1/2 -translate-y-1/2"><Eye size={13} style={{ color: 'var(--admin-muted2)' }} /></button>
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'var(--admin-muted2)' }}>
              Scope: <code>repo</code> — <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: 'var(--admin-gold)' }}>Créer un token <ExternalLink size={9} /></a>
            </p>
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Nom du repository</label>
            <input value={ghRepo} onChange={e => setGhRepo(e.target.value)} placeholder="delivery-api" className="input-field text-xs w-full" />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={testGitHub} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
              <Github size={12} /> Tester
            </button>
            {ghTest && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: ghTest.ok ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {ghTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {ghTest.message || ghTest.error}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>{t('github.push')}</p>
        <p className="text-[11px] mb-3" style={{ color: 'var(--admin-muted2)' }}>
          Push tout le code (server + frontend) vers GitHub. Le repository sera créé automatiquement s'il n'existe pas.
        </p>
        <button onClick={pushCode} disabled={ghPushing || !ghToken}
          className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          {ghPushing ? <Loader2 size={12} className="animate-spin" /> : <Github size={12} />}
          {ghPushing ? 'Push en cours...' : 'Push vers GitHub'}
        </button>
      </div>
    </div>
  );
}
