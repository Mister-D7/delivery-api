import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const STATUS_KEYS: Record<string, string> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  ON_THE_WAY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ff9800',
  CONFIRMED: '#2196f3',
  PREPARING: '#9c27b0',
  ON_THE_WAY: '#bfa24e',
  DELIVERED: '#4caf50',
  CANCELLED: '#d9603b',
};

const STATUS_BG: Record<string, string> = {
  PENDING: 'rgba(255,152,0,0.12)',
  CONFIRMED: 'rgba(33,150,243,0.12)',
  PREPARING: 'rgba(156,39,176,0.12)',
  ON_THE_WAY: 'rgba(191,162,78,0.12)',
  DELIVERED: 'rgba(76,175,80,0.12)',
  CANCELLED: 'rgba(217,96,59,0.12)',
};

export function useStatusLabel() {
  const { t } = useTranslation('order-status');
  return (status: string): string => {
    const key = STATUS_KEYS[status];
    return key ? t(key) : status;
  };
}

export default function OrderStatusBadge({ status }: { status: string }) {
  const label = useStatusLabel()(status);
  const color = STATUS_COLORS[status] || '#8c8578';
  const bg = STATUS_BG[status] || 'rgba(140,133,120,0.12)';
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color, background: bg, fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {label}
    </span>
  );
}

const STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'];

export function OrderProgress({ status }: { status: string }) {
  const { t } = useTranslation('order-status');
  if (status === 'CANCELLED') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(217,96,59,0.12)' }}>
          <span className="text-2xl">✕</span>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#d9603b' }}>{t('cancelled_title')}</p>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="py-6">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const color = STATUS_COLORS[step];
        const bg = STATUS_BG[step];
        return (
          <div key={step} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: done ? bg : '#1a1a1a', color: done ? color : '#555', border: done ? 'none' : '1px solid #333' }}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-0.5 h-6 mt-1" style={{ background: i < currentIdx ? color : '#333' }} />
              )}
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold" style={{ color: done ? color : '#555' }}>{t(STATUS_KEYS[step])}</p>
              {isCurrent && <p className="text-xs mt-0.5" style={{ color: '#8c8578' }}>{t('current')}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
