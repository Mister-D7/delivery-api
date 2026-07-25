import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, Clock, ShoppingCart, AlertTriangle, FileText, Download, Printer, Table } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

type Overview = {
  totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number;
  cancelledLoss: number; rtoLoss: number; damagedLoss: number; totalCostOfGoods: number;
  netProfit: number; totalOrders: number; deliveredOrders: number; cancelledOrders: number; successRate: number;
};
type TopProduct = { name: string; quantity: number; revenue: number; cost: number };
type ProductCost = { id: string; name: string; salePrice: number; costPrice: number; margin: number; marginPercent: number; stockQty: number; imageUrl?: string };

const fmt = (n: number) => n.toLocaleString('fr-FR');
const DA = (n: number) => `${fmt(n)} DA`;

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRevenue() {
  const [tab, setTab] = useState<'overview' | 'products' | 'reports'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editSale, setEditSale] = useState('');

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

  useEffect(() => { fetchOverview(); fetchProducts(); }, []);
  useEffect(() => { fetchOverview(); }, [dateFrom, dateTo]);

  const saveProduct = async (id: string) => {
    try {
      await api.put(`/revenue/products/${id}`, { costPrice: Number(editCost), salePrice: Number(editSale) });
      toast.success('Prix sauvegardé');
      setEditingProduct(null);
      fetchProducts(); fetchOverview();
    } catch { toast.error('Erreur'); }
  };

  const exportExcel = () => {
    if (!overview) return;
    const date = new Date().toLocaleDateString('fr-FR');
    const rows: (string | number)[][] = [
      ['RAPPORT REVENUE — MISTER-DR', '', '', date],
      [],
      ['RÉSUMÉ', ''],
      ['Chiffre d\'affaires total', overview.totalRevenue],
      ['Profit net', overview.netProfit],
      ['Coût des marchandises', overview.totalCostOfGoods],
      ['Taux de réussite', `${overview.successRate}%`],
      ['Total commandes', overview.totalOrders],
      ['Livrées', overview.deliveredOrders],
      ['Annulées', overview.cancelledOrders],
      [],
      ['REVENU PAR PÉRIODE', ''],
      ['Aujourd\'hui', overview.todayRevenue],
      ['Cette semaine', overview.weekRevenue],
      ['Ce mois', overview.monthRevenue],
      [],
      ['PERTES', ''],
      ['Commandes annulées', overview.cancelledLoss],
      ['Retours/Refus (RTO)', overview.rtoLoss],
      ['Stock endommagé/perdu', overview.damagedLoss],
      [],
      ['TOP VENTES', 'Produit', 'Quantité', 'Revenu'],
      ...topProducts.map((p, i) => [`#${i + 1}`, p.name, p.quantity, p.revenue]),
      [],
      ['DÉTAIL PRODUITS', 'Prix vente', 'Prix achat', 'Marge', 'Marge %', 'Stock'],
      ...products.map(p => [p.name, p.salePrice, p.costPrice, p.margin, `${p.marginPercent}%`, p.stockQty]),
    ];
    downloadCSV(`revenue-mister-dr-${date}.csv`, rows);
    toast.success('Excel exporté !');
  };

  if (loading && !overview) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <DollarSign size={28} className="mx-auto mb-3 animate-pulse" style={{ color: '#bfa24e' }} />
        <p className="text-sm" style={{ color: '#8c8578' }}>Chargement...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header + Tabs — hidden in print */}
      <div className="no-print">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.12)' }}>
            <DollarSign size={20} style={{ color: '#bfa24e' }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Revenue</h1>
            <p className="text-xs" style={{ color: '#8c8578' }}>Finance & Rapports</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          {([['overview', 'Vue d\'ensemble', DollarSign], ['products', 'Produits', Package], ['reports', 'Rapports', FileText]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k as any)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors" style={{ background: tab === k ? 'rgba(191,162,78,0.15)' : '#1a1a1a', color: tab === k ? '#bfa24e' : '#8c8578' }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        {/* Export buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: '#1a1a1a', color: '#8c8578' }}>
            <Printer size={12} /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: '#1a1a1a', color: '#8c8578' }}>
            <Table size={12} /> Excel
          </button>
        </div>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === 'overview' && overview && (
        <div className="space-y-4" id="revenue-print">
          <div className="surface-card p-3 flex gap-3 items-end no-print">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Du</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Au</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-xs" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: '#1a1a1a', color: '#8c8578' }}>Réinitialiser</button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Aujourd\'hui', value: overview.todayRevenue, color: '#bfa24e' },
              { label: 'Cette semaine', value: overview.weekRevenue, color: '#3b82f6' },
              { label: 'Ce mois', value: overview.monthRevenue, color: '#4ade80' },
              { label: 'Total', value: overview.totalRevenue, color: '#a855f7' },
            ].map((c, i) => (
              <div key={i} className="surface-card p-4">
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#8c8578' }}>{c.label}</p>
                <p className="text-lg font-bold" style={{ color: c.color }}>{DA(c.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="surface-card p-4" style={{ border: '1px solid rgba(217,96,59,0.15)' }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#d9603b' }}>Commandes Annulées</p>
              <p className="text-lg font-bold" style={{ color: '#d9603b' }}>-{DA(overview.cancelledLoss)}</p>
              <p className="text-[10px] mt-1" style={{ color: '#555' }}>{overview.cancelledOrders} commande(s)</p>
            </div>
            <div className="surface-card p-4" style={{ border: '1px solid rgba(255,152,0,0.15)' }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#ff9800' }}>Retours / Refus (RTO)</p>
              <p className="text-lg font-bold" style={{ color: '#ff9800' }}>-{DA(overview.rtoLoss)}</p>
            </div>
            <div className="surface-card p-4" style={{ border: '1px solid rgba(168,85,247,0.15)' }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: '#a855f7' }}>Stock Endommagé / Perdu</p>
              <p className="text-lg font-bold" style={{ color: '#a855f7' }}>-{DA(overview.damagedLoss)}</p>
            </div>
          </div>

          <div className="surface-card p-5" style={{ background: overview.netProfit >= 0 ? 'rgba(74,222,128,0.04)' : 'rgba(217,96,59,0.04)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#8c8578' }}>PROFIT NET</p>
                <p className="text-2xl font-extrabold" style={{ color: overview.netProfit >= 0 ? '#4ade80' : '#d9603b' }}>
                  {overview.netProfit >= 0 ? '+' : ''}{DA(overview.netProfit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px]" style={{ color: '#555' }}>COGS: {DA(overview.totalCostOfGoods)}</p>
                <p className="text-[10px]" style={{ color: '#555' }}>Réussite: {overview.successRate}%</p>
                <p className="text-[10px]" style={{ color: '#555' }}>{overview.deliveredOrders}/{overview.totalOrders} livrées</p>
              </div>
            </div>
          </div>

          {topProducts.length > 0 && (
            <div className="surface-card p-4">
              <p className="text-xs font-bold mb-3" style={{ color: '#bfa24e' }}>TOP VENTES</p>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: i === 0 ? 'rgba(191,162,78,0.06)' : 'transparent' }}>
                    <span className="text-[10px] font-bold w-5 text-center" style={{ color: i < 3 ? '#bfa24e' : '#555' }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{p.name}</p>
                      <p className="text-[9px]" style={{ color: '#555' }}>{p.quantity} vendu(s)</p>
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: '#bfa24e' }}>{DA(p.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PRODUCTS TAB ═══ */}
      {tab === 'products' && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold no-print" style={{ color: '#8c8578' }}>Gérer le coût d'achat de chaque produit pour calculer le profit net</p>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto mb-3" style={{ color: '#333' }} />
              <p className="text-xs" style={{ color: '#555' }}>Ajoutez des produits dans le catalogue d'abord</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="surface-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{p.name}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[9px]" style={{ color: '#555' }}>Vente: <span style={{ color: '#bfa24e' }}>{DA(p.salePrice)}</span></span>
                        <span className="text-[9px]" style={{ color: '#555' }}>Coût: <span style={{ color: '#d9603b' }}>{DA(p.costPrice)}</span></span>
                        <span className="text-[9px]" style={{ color: '#555' }}>Marge: <span style={{ color: p.margin >= 0 ? '#4ade80' : '#d9603b' }}>{DA(p.margin)} ({p.marginPercent}%)</span></span>
                      </div>
                    </div>
                    <button onClick={() => { setEditingProduct(editingProduct === p.id ? null : p.id); setEditCost(String(p.costPrice)); setEditSale(String(p.salePrice)); }}
                      className="px-2 py-1 rounded-lg text-[9px] font-semibold no-print" style={{ background: '#1a1a1a', color: '#bfa24e' }}>
                      {editingProduct === p.id ? 'Annuler' : 'Modifier'}
                    </button>
                  </div>
                  {editingProduct === p.id && (
                    <div className="mt-3 p-3 rounded-lg flex gap-3 items-end no-print" style={{ background: '#0a0a0a' }}>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>PRIX ACHAT (DA)</label>
                        <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} className="input-field text-xs w-full" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>PRIX VENTE (DA)</label>
                        <input type="number" value={editSale} onChange={e => setEditSale(e.target.value)} className="input-field text-xs w-full" />
                      </div>
                      <button onClick={() => saveProduct(p.id)} className="gold-btn px-4 py-1.5 text-[10px] font-bold rounded-lg">Sauver</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ REPORTS TAB ═══ */}
      {tab === 'reports' && overview && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <p className="text-xs font-bold mb-4" style={{ color: '#bfa24e' }}>RÉSUMÉ EXÉCUTIF</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(191,162,78,0.06)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#bfa24e' }}>{DA(overview.totalRevenue)}</p>
                <p className="text-[10px] mt-1" style={{ color: '#8c8578' }}>Chiffre d'affaires</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: overview.netProfit >= 0 ? 'rgba(74,222,128,0.06)' : 'rgba(217,96,59,0.06)' }}>
                <p className="text-2xl font-extrabold" style={{ color: overview.netProfit >= 0 ? '#4ade80' : '#d9603b' }}>{DA(overview.netProfit)}</p>
                <p className="text-[10px] mt-1" style={{ color: '#8c8578' }}>Profit net</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.06)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#4ade80' }}>{overview.successRate}%</p>
                <p className="text-[10px] mt-1" style={{ color: '#8c8578' }}>Taux de réussite</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#3b82f6' }}>{overview.totalOrders}</p>
                <p className="text-[10px] mt-1" style={{ color: '#8c8578' }}>Total commandes</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold mb-4" style={{ color: '#bfa24e' }}>DÉTAIL FINANCIER</p>
            <div className="space-y-2">
              {[
                { label: 'Revenu brut (livraisons)', value: overview.totalRevenue, color: '#4ade80' },
                { label: 'Coût des marchandises (COGS)', value: -overview.totalCostOfGoods, color: '#d9603b' },
                { label: 'Marge brute', value: overview.totalRevenue - overview.totalCostOfGoods, color: '#bfa24e' },
                { label: 'Pertes commandes annulées', value: -overview.cancelledLoss, color: '#d9603b' },
                { label: 'Pertes retours/refus (RTO)', value: -overview.rtoLoss, color: '#ff9800' },
                { label: 'Stock endommagé/perdu', value: -overview.damagedLoss, color: '#a855f7' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <span className="text-[11px]" style={{ color: '#8c8578' }}>{row.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: row.value >= 0 ? '#4ade80' : '#d9603b' }}>
                    {row.value >= 0 ? '+' : ''}{DA(Math.abs(row.value))}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(191,162,78,0.2)' }}>
                <span className="text-xs font-bold" style={{ color: '#bfa24e' }}>PROFIT NET</span>
                <span className="text-sm font-extrabold" style={{ color: overview.netProfit >= 0 ? '#4ade80' : '#d9603b' }}>
                  {overview.netProfit >= 0 ? '+' : ''}{DA(overview.netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold mb-4" style={{ color: '#bfa24e' }}>RAPPORT LOGISTIQUE</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.04)' }}>
                <p className="text-lg font-bold" style={{ color: '#4ade80' }}>{overview.deliveredOrders}</p>
                <p className="text-[10px]" style={{ color: '#8c8578' }}>Livraisons réussies</p>
                <div className="w-full h-1.5 rounded-full mt-2" style={{ background: '#1a1a1a' }}>
                  <div className="h-full rounded-full" style={{ width: `${overview.successRate}%`, background: '#4ade80' }} />
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(217,96,59,0.04)' }}>
                <p className="text-lg font-bold" style={{ color: '#d9603b' }}>{overview.cancelledOrders}</p>
                <p className="text-[10px]" style={{ color: '#8c8578' }}>Annulées</p>
                <div className="w-full h-1.5 rounded-full mt-2" style={{ background: '#1a1a1a' }}>
                  <div className="h-full rounded-full" style={{ width: `${overview.totalOrders > 0 ? (overview.cancelledOrders / overview.totalOrders) * 100 : 0}%`, background: '#d9603b' }} />
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,152,0,0.04)' }}>
                <p className="text-lg font-bold" style={{ color: '#ff9800' }}>{DA(overview.rtoLoss)}</p>
                <p className="text-[10px]" style={{ color: '#8c8578' }}>Coût RTO (deux sens)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
