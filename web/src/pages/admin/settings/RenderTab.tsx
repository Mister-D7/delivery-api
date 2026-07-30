import { Cloud, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

type Props = {
  t: (k: string) => string;
  rdToken: string; setRdToken: (v: string) => void;
  rdService: string; setRdService: (v: string) => void;
  rdTest: any; rdDeploying: boolean;
  testRender: () => void; deployToRender: () => void;
};

export default function RenderTab(props: Props) {
  const { t, rdToken, setRdToken, rdService, setRdService, rdTest, rdDeploying, testRender, deployToRender } = props;

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>{t('render.api_key_label')}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>API Key</label>
            <input value={rdToken} onChange={e => setRdToken(e.target.value)} type="password" placeholder="rnd_xxxxxxxxxxxx" className="input-field text-xs w-full" />
            <p className="text-[9px] mt-1" style={{ color: 'var(--admin-muted2)' }}>
              <a href="https://dashboard.render.com/settings#api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--admin-gold)' }}>Obtenir une clé API <ExternalLink size={9} /></a>
            </p>
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>Nom du service</label>
            <input value={rdService} onChange={e => setRdService(e.target.value)} placeholder="delivery-api" className="input-field text-xs w-full" />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={testRender} className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
              <Cloud size={12} /> Tester
            </button>
            {rdTest && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: rdTest.ok ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {rdTest.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {rdTest.message || rdTest.error}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="surface-card p-5">
        <p className="text-xs font-bold tracking-wide mb-4" style={{ color: 'var(--admin-muted)' }}>{t('render.deploy')}</p>
        <p className="text-[11px] mb-3" style={{ color: 'var(--admin-muted2)' }}>
          Crée ou met à jour le service Web sur Render. Les variables d'environnement sont configurées automatiquement.
        </p>
        <button onClick={deployToRender} disabled={rdDeploying || !rdToken}
          className="gold-btn px-4 py-2 text-[11px] font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-40">
          {rdDeploying ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
          {rdDeploying ? 'Déploiement...' : 'Déployer sur Render'}
        </button>
      </div>
    </div>
  );
}
