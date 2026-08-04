import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Overview, TopProduct, ProductCost } from './revenueTypes';
import { DA, downloadCSV } from './revenueUtils';

type Props = {
  overview: Overview;
  topProducts: TopProduct[];
  products: ProductCost[];
  t: (key: string) => string;
};

export default function RevenueReportsTab({ overview, topProducts, products, t }: Props) {
  const [cloudProviders, setCloudProviders] = useState<{ id: string; name: string; configured: boolean; connected: boolean; account?: any }[]>([]);
  const [cloudUploading, setCloudUploading] = useState<string | null>(null);

  useEffect(() => {
    api.get('/cloud/providers').then(r => setCloudProviders(r.data.providers || [])).catch(() => {});
  }, []);

  const exportExcel = () => {
    const date = new Date().toLocaleDateString('fr-FR');
    const rows: (string | number)[][] = [
      ['RAPPORT REVENUE - MISTER-DR', '', '', date], [],
      ['RESUME', ''],
      ["Chiffre d'affaires total", overview.totalRevenue],
      ['Cout des marchandises', overview.totalCostOfGoods],
      ['Marge brute', overview.grossProfit ?? overview.totalRevenue - overview.totalCostOfGoods],
      ['Livraisons encaissees', overview.deliveryRevenue || 0],
      ['Cout livreurs', -(overview.driverCost || 0)],
      ['Profit livraison', overview.deliveryProfit ?? 0],
      ['Salaires employes (mois)', -(overview.employeeCost || 0)],
      ['Profit net', overview.netProfit],
      ['Taux de reussite', `${overview.successRate}%`],
      ['Total commandes', overview.totalOrders],
      ['Livrees', overview.deliveredOrders],
      ['Annulees', overview.cancelledOrders], [],
      ['REVENU PAR PERIODE', ''],
      ["Aujourd'hui", overview.todayRevenue],
      ['Cette semaine', overview.weekRevenue],
      ['Ce mois', overview.monthRevenue], [],
      ['PERTES', ''],
      ['Commandes annulees', overview.cancelledLoss], [],
      ['TOP VENTES', 'Produit', 'Quantite', 'Revenu'],
      ...topProducts.map((p, i) => [`#${i + 1}`, p.name, p.quantity, p.revenue]), [],
      ['DETAIL PRODUITS', 'Prix vente', 'Prix achat', 'Marge', 'Marge %', 'Stock'],
      ...products.map(p => [p.name, p.salePrice, p.costPrice, p.margin, `${p.marginPercent}%`, p.stockQty]),
    ];
    downloadCSV(`revenue-mister-dr-${date}.csv`, rows);
    toast.success('CSV exporte !');
  };

  const generateCSVContent = (): string => {
    const date = new Date().toLocaleDateString('fr-FR');
    const rows: (string | number)[][] = [
      ['RAPPORT REVENUE - MISTER-DR', '', '', date], [],
      ['RESUME', ''],
      ["Chiffre d'affaires total", overview.totalRevenue],
      ['Cout des marchandises', overview.totalCostOfGoods],
      ['Marge brute', overview.grossProfit ?? overview.totalRevenue - overview.totalCostOfGoods],
      ['Livraisons encaissees', overview.deliveryRevenue || 0],
      ['Cout livreurs', -(overview.driverCost || 0)],
      ['Profit livraison', overview.deliveryProfit ?? 0],
      ['Salaires employes (mois)', -(overview.employeeCost || 0)],
      ['Profit net', overview.netProfit],
      ['Taux de reussite', `${overview.successRate}%`],
      ['Total commandes', overview.totalOrders],
      ['Livrees', overview.deliveredOrders],
      ['Annulees', overview.cancelledOrders], [],
      ['REVENU PAR PERIODE', ''],
      ["Aujourd'hui", overview.todayRevenue],
      ['Cette semaine', overview.weekRevenue],
      ['Ce mois', overview.monthRevenue], [],
      ['PERTES', ''],
      ['Commandes annulees', overview.cancelledLoss], [],
      ['TOP VENTES', 'Produit', 'Quantite', 'Revenu'],
      ...topProducts.map((p, i) => [`#${i + 1}`, p.name, p.quantity, p.revenue]), [],
      ['DETAIL PRODUITS', 'Prix vente', 'Prix achat', 'Marge', 'Marge %', 'Stock'],
      ...products.map(p => [p.name, p.salePrice, p.costPrice, p.margin, `${p.marginPercent}%`, p.stockQty]),
    ];
    return rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportToCloud = async (provider: string) => {
    setCloudUploading(provider);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const content = generateCSVContent();
      const res = await api.post('/cloud/export', { provider, filename: `revenue-mister-dr-${date}.csv`, mimeType: 'text/csv', content });
      const link = res.data.webViewLink || res.data.webUrl || '';
      toast.success(`Exporté vers ${provider === 'google_drive' ? 'Google Drive' : 'OneDrive'} !` + (link ? ` (${link})` : ''));
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur export cloud'); }
    finally { setCloudUploading(null); }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{t('reports.export_csv')}</p>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl" style={{ background: 'var(--admin-border3)' }}>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-gold)' }}>{DA(overview.totalRevenue)}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--admin-muted)' }}>{t('overview.total_revenue')}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: overview.netProfit >= 0 ? 'rgba(74,222,128,0.06)' : 'rgba(217,96,59,0.06)' }}>
            <p className="text-2xl font-extrabold" style={{ color: overview.netProfit >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{DA(overview.netProfit)}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--admin-muted)' }}>{t('cards.net_profit')}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.06)' }}>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-success)' }}>{overview.successRate}%</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--admin-muted)' }}>{t('reports.delivery_rate')}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)' }}>
            <p className="text-2xl font-extrabold" style={{ color: '#3b82f6' }}>{overview.deliveredOrders}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--admin-muted)' }}>{t('cards.delivered_orders')}</p>
          </div>
        </div>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs font-bold mb-4" style={{ color: 'var(--admin-gold)' }}>{t('reports.detail')}</p>
        <div className="space-y-2">
          {[
            { label: t('reports.gross_revenue'), value: overview.totalRevenue, color: 'var(--admin-success)' },
            { label: t('reports.cost_of_goods'), value: -overview.totalCostOfGoods, color: 'var(--admin-danger)' },
            { label: t('reports.gross_margin'), value: overview.grossProfit ?? (overview.totalRevenue - overview.totalCostOfGoods), color: 'var(--admin-gold)' },
            { label: t('reports.delivery_collected'), value: overview.deliveryRevenue || 0, color: '#0ea5e9' },
            { label: t('reports.driver_cost'), value: -(overview.driverCost || 0), color: 'var(--admin-danger)' },
            { label: t('reports.delivery_profit'), value: overview.deliveryProfit ?? 0, color: '#0ea5e9' },
            { label: t('reports.employee_cost'), value: -(overview.employeeCost || 0), color: '#f59e0b' },
            { label: t('reports.cancelled_loss'), value: -overview.cancelledLoss, color: 'var(--admin-danger)' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <span className="text-[11px]" style={{ color: 'var(--admin-muted)' }}>{row.label}</span>
              <span className="text-[11px] font-bold" style={{ color: row.value >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {row.value >= 0 ? '+' : ''}{DA(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--admin-border2)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{t('cards.net_profit').toUpperCase()}</span>
            <span className="text-sm font-extrabold" style={{ color: overview.netProfit >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
              {overview.netProfit >= 0 ? '+' : ''}{DA(overview.netProfit)}
            </span>
          </div>
        </div>
      </div>

      <div className="surface-card p-5">
        <p className="text-xs font-bold mb-4" style={{ color: 'var(--admin-gold)' }}>{t('tabs.reports')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.04)' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--admin-success)' }}>{overview.deliveredOrders}</p>
            <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{t('cards.delivered_orders')}</p>
            <div className="w-full h-1.5 rounded-full mt-2" style={{ background: 'var(--admin-surface2)' }}>
              <div className="h-full rounded-full" style={{ width: `${overview.successRate}%`, background: 'var(--admin-success)' }} />
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(217,96,59,0.04)' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--admin-danger)' }}>{overview.cancelledOrders}</p>
            <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{t('cards.cancelled_orders')}</p>
            <div className="w-full h-1.5 rounded-full mt-2" style={{ background: 'var(--admin-surface2)' }}>
              <div className="h-full rounded-full" style={{ width: `${overview.totalOrders > 0 ? (overview.cancelledOrders / overview.totalOrders) * 100 : 0}%`, background: 'var(--admin-danger)' }} />
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(191,162,78,0.04)' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--admin-gold)' }}>{DA(overview.totalRevenue)}</p>
            <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{t('overview.total_revenue')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
