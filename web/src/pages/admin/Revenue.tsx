import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Package, FileText, Truck, Users } from '../../components/adminIcons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import type { Overview, TopProduct, ProductCost } from './revenueTypes';
import { DA } from './revenueUtils';
import RevenueCards from './RevenueCards';
import RevenueProductsTab from './RevenueProductsTab';
import RevenueReportsTab from './RevenueReportsTab';

export default function AdminRevenue() {
  const { t } = useTranslation('revenue');
  const { t: tc } = useTranslation('common');
  const [tab, setTab] = useState<'overview' | 'products' | 'reports'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo + 'T23:59:59');
      const r = await api.get(`/revenue?${params}`);
      setOverview(r.data.overview);
      setTopProducts(r.data.topProducts || []);
    } catch {}
    setLoading(false);
  };

  const fetchProducts = async () => {
    try { const r = await api.get('/revenue/products'); setProducts(r.data || []); } catch {}
  };

  const refresh = useCallback(() => { fetchOverview(); fetchProducts(); }, [dateFrom, dateTo]);

  useEffect(() => { fetchOverview(); fetchProducts(); }, []);
  useEffect(() => { fetchOverview(); }, [dateFrom, dateTo]);

  const allCardIds = ['today', 'week', 'month', 'total', 'deliveryRevenue', 'driverCost', 'deliveryProfit', 'employeeCost', 'orders', 'cancelled', 'lossCancelled', 'netProfit'];
  const getCardDefs = useCallback((o: Overview) => [
    { id: 'today', label: tc('time.today'), value: DA(o.todayRevenue), color: 'var(--admin-gold)', icon: DollarSign },
    { id: 'week', label: tc('time.this_week'), value: DA(o.weekRevenue), color: '#3b82f6', icon: DollarSign },
    { id: 'month', label: tc('time.this_month'), value: DA(o.monthRevenue), color: 'var(--admin-success)', icon: DollarSign },
    { id: 'total', label: t('overview.total_revenue'), value: DA(o.totalRevenue), color: '#a855f7', icon: DollarSign },
    { id: 'deliveryRevenue', label: t('cards.delivery_revenue'), value: DA(o.deliveryRevenue || 0), color: '#0ea5e9', icon: Truck },
    { id: 'driverCost', label: t('cards.driver_cost'), value: DA(o.driverCost || 0), color: 'var(--admin-danger)', icon: Truck },
    { id: 'deliveryProfit', label: t('cards.delivery_profit'), value: `${(o.deliveryProfit ?? 0) >= 0 ? '+' : ''}${DA(Math.abs(o.deliveryProfit ?? 0))}`, color: (o.deliveryProfit ?? 0) >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)', icon: Truck },
    { id: 'employeeCost', label: t('cards.employee_cost'), value: DA(o.employeeCost || 0), color: '#f59e0b', icon: Users },
    { id: 'orders', label: t('cards.delivered_orders'), value: String(o.deliveredOrders), color: 'var(--admin-success)', icon: Package },
    { id: 'cancelled', label: t('cards.cancelled_orders'), value: String(o.cancelledOrders), color: 'var(--admin-danger)', icon: Package },
    { id: 'lossCancelled', label: t('cards.loss_cancelled'), value: DA(o.revenueLossCancelled || o.cancelledLoss), color: 'var(--admin-danger)', icon: DollarSign },
    { id: 'netProfit', label: t('cards.net_profit'), value: `${o.netProfit >= 0 ? '+' : ''}${DA(Math.abs(o.netProfit))}`, color: o.netProfit >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)', icon: DollarSign },
  ], [t, tc]);

  if (loading && !overview) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <DollarSign size={28} className="mx-auto mb-3 animate-pulse" style={{ color: 'var(--admin-gold)' }} />
        <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{tc('actions.loading')}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="no-print">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--admin-border2)' }}>
            <DollarSign size={20} style={{ color: 'var(--admin-gold)' }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>
            <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{tc('nav.revenue')}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          {([['overview', tc('nav.revenue'), DollarSign], ['products', t('tabs.products'), Package], ['reports', t('reports.export_csv'), FileText]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k as any)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors" style={{ background: tab === k ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: tab === k ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && overview && (
        <div className="space-y-4" id="revenue-print">
          <div className="surface-card p-3 flex gap-3 items-end no-print">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('date_range.from')}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('date_range.to')}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-xs" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>{t('date_range.apply')}</button>
            )}
          </div>
          <RevenueCards overview={overview} getCardDefs={getCardDefs} allCardIds={allCardIds} />
          {topProducts.length > 0 && (
            <div className="surface-card p-4">
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--admin-gold)' }}>{t('overview.top_products')}</p>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: i === 0 ? 'var(--admin-border3)' : 'transparent' }}>
                    <span className="text-[10px] font-bold w-5 text-center" style={{ color: i < 3 ? 'var(--admin-gold)' : 'var(--admin-muted2)' }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{p.name}</p>
                      <p className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{p.quantity} {t('overview.units_sold')}</p>
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: 'var(--admin-gold)' }}>{DA(p.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'products' && <RevenueProductsTab products={products} onUpdate={refresh} t={t} />}
      {tab === 'reports' && overview && <RevenueReportsTab overview={overview} topProducts={topProducts} products={products} t={t} />}
    </div>
  );
}
