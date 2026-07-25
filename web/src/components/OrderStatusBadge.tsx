import clsx from 'clsx';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'En attente', color: '#ff9800', bg: 'rgba(255,152,0,0.12)' },
  CONFIRMED: { label: 'Confirmée', color: '#2196f3', bg: 'rgba(33,150,243,0.12)' },
  PREPARING: { label: 'En préparation', color: '#9c27b0', bg: 'rgba(156,39,176,0.12)' },
  ON_THE_WAY: { label: 'En livraison', color: '#bfa24e', bg: 'rgba(191,162,78,0.12)' },
  DELIVERED: { label: 'Livrée', color: '#4caf50', bg: 'rgba(76,175,80,0.12)' },
  CANCELLED: { label: 'Annulée', color: '#d9603b', bg: 'rgba(217,96,59,0.12)' },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: '#8c8578', bg: 'rgba(140,133,120,0.12)' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg, fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {s.label}
    </span>
  );
}

const STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'];

export function OrderProgress({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(217,96,59,0.12)' }}>
          <span className="text-2xl">✕</span>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#d9603b' }}>Commande annulée</p>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="py-6">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const s = STATUS_MAP[step];
        return (
          <div key={step} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: done ? s.bg : '#1a1a1a', color: done ? s.color : '#555', border: done ? 'none' : '1px solid #333' }}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-0.5 h-6 mt-1" style={{ background: i < currentIdx ? s.color : '#333' }} />
              )}
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold" style={{ color: done ? s.color : '#555' }}>{s.label}</p>
              {isCurrent && <p className="text-xs mt-0.5" style={{ color: '#8c8578' }}>Statut actuel</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
