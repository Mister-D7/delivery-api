import { Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.12)' }}>
          <SettingsIcon size={20} style={{ color: '#bfa24e' }} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Settings</h1>
          <p className="text-xs" style={{ color: '#8c8578' }}>Configuration de la livraison</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GitHub */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.1)' }}>
              <span className="text-sm font-bold" style={{ color: '#bfa24e' }}>GH</span>
            </div>
            <div>
              <p className="text-xs font-bold">GitHub</p>
              <p className="text-[10px]" style={{ color: '#555' }}>Dépôt & Deploy</p>
            </div>
          </div>
          <div className="space-y-2">
            <input placeholder="GitHub Token" className="input-field w-full text-[11px]" disabled />
            <input placeholder="Repository (Mister-D7/delivery-app)" className="input-field w-full text-[11px]" disabled />
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#444' }}>Bientôt disponible</p>
        </div>

        {/* Supabase */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.1)' }}>
              <span className="text-sm font-bold" style={{ color: '#bfa24e' }}>SB</span>
            </div>
            <div>
              <p className="text-xs font-bold">Supabase</p>
              <p className="text-[10px]" style={{ color: '#555' }}>Base de données</p>
            </div>
          </div>
          <div className="space-y-2">
            <input placeholder="Supabase URL" className="input-field w-full text-[11px]" disabled />
            <input placeholder="Anon Key" className="input-field w-full text-[11px]" disabled />
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#444' }}>Bientôt disponible</p>
        </div>

        {/* Render */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.1)' }}>
              <span className="text-sm font-bold" style={{ color: '#bfa24e' }}>RD</span>
            </div>
            <div>
              <p className="text-xs font-bold">Render</p>
              <p className="text-[10px]" style={{ color: '#555' }}>Hébergement</p>
            </div>
          </div>
          <div className="space-y-2">
            <input placeholder="Render API Key" className="input-field w-full text-[11px]" disabled />
            <input placeholder="Service ID" className="input-field w-full text-[11px]" disabled />
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#444' }}>Bientôt disponible</p>
        </div>

        {/* Notifications */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.1)' }}>
              <span className="text-sm font-bold" style={{ color: '#bfa24e' }}>🔔</span>
            </div>
            <div>
              <p className="text-xs font-bold">Notifications</p>
              <p className="text-[10px]" style={{ color: '#555' }}>Alertes & Toast</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: '#8c8578' }}>Sons de notification</span>
              <div className="w-8 h-4 rounded-full" style={{ background: '#333' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: '#8c8578' }}>Toast Windows</span>
              <div className="w-8 h-4 rounded-full" style={{ background: '#bfa24e' }} />
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#444' }}>Bientôt disponible</p>
        </div>
      </div>
    </div>
  );
}
