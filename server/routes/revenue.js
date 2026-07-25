import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.toISOString(); }
function startOfWeek(d = new Date()) { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - (day === 0 ? 6 : day - 1)); x.setHours(0, 0, 0, 0); return x.toISOString(); }
function startOfMonth(d = new Date()) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x.toISOString(); }

// GET /revenue — admin revenue overview
router.get('/', adminAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || null;
    const dateTo = to || null;

    // Fetch all orders (not cancelled) for revenue
    let baseQuery = supabase.from('delivery_orders').select('*, delivery_order_items(*)');
    if (dateFrom) baseQuery = baseQuery.gte('created_at', dateFrom);
    if (dateTo) baseQuery = baseQuery.lte('created_at', dateTo);
    const { data: allOrders } = await baseQuery;

    const orders = allOrders || [];
    const delivered = orders.filter(o => o.status === 'DELIVERED');
    const cancelled = orders.filter(o => o.status === 'CANCELLED');

    // Revenue = sum of delivered orders
    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);

    // Cancelled loss = sum of cancelled orders (before delivery)
    const cancelledLoss = cancelled.reduce((s, o) => s + (o.total || 0), 0);

    // Time-based revenue
    const todayStart = startOfDay();
    const weekStart = startOfWeek();
    const monthStart = startOfMonth();

    const todayRevenue = delivered.filter(o => o.created_at >= todayStart).reduce((s, o) => s + (o.total || 0), 0);
    const weekRevenue = delivered.filter(o => o.created_at >= weekStart).reduce((s, o) => s + (o.total || 0), 0);
    const monthRevenue = delivered.filter(o => o.created_at >= monthStart).reduce((s, o) => s + (o.total || 0), 0);

    // Product performance
    const productSales = {};
    for (const order of delivered) {
      for (const item of (order.delivery_order_items || [])) {
        const key = item.catalog_item_id || item.name;
        if (!productSales[key]) productSales[key] = { name: item.custom_name || item.name, quantity: 0, revenue: 0, cost: 0 };
        productSales[key].quantity += item.quantity || 0;
        productSales[key].revenue += (Number(item.unit_price) || 0) * (item.quantity || 0);
      }
    }

    // Fetch cost prices from catalog
    const { data: catalogItems } = await supabase.from('delivery_products').select('id, cost_price, sale_price');
    const costMap = new Map((catalogItems || []).map(c => [c.id, { cost: c.cost_price || 0, price: c.sale_price || 0 }]));

    let totalCostOfGoods = 0;
    for (const key in productSales) {
      const meta = costMap.get(key);
      if (meta) {
        productSales[key].cost = meta.cost * productSales[key].quantity;
        totalCostOfGoods += productSales[key].cost;
      }
    }

    // RTO / refused (ON_THE_WAY that got cancelled = refused)
    // For now, cancelled before delivery counts as loss
    const rtoLoss = cancelledLoss;

    // Damaged/lost = we'll track as 0 for now (manual input later)
    const damagedLoss = 0;

    // Top selling products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const netProfit = totalRevenue - totalCostOfGoods - rtoLoss - damagedLoss;

    res.json({
      overview: {
        totalRevenue,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        cancelledLoss,
        rtoLoss,
        damagedLoss,
        totalCostOfGoods,
        netProfit,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        successRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0,
      },
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /revenue/products — admin product cost management
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { data: products } = await supabase
      .from('delivery_products')
      .select('id, name, sale_price, cost_price, stock_qty, image_url')
      .order('name');

    const result = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      salePrice: p.sale_price || 0,
      costPrice: p.cost_price || 0,
      margin: (p.sale_price || 0) - (p.cost_price || 0),
      marginPercent: p.sale_price > 0 ? Math.round(((p.sale_price - (p.cost_price || 0)) / p.sale_price) * 100) : 0,
      stockQty: p.stock_qty || 0,
      imageUrl: p.image_url,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /revenue/products/:id — admin update cost price
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const { costPrice, salePrice } = req.body;
    const updates = {};
    if (costPrice !== undefined) updates.cost_price = Number(costPrice) || 0;
    if (salePrice !== undefined) updates.sale_price = Number(salePrice) || 0;

    const { data, error } = await supabase
      .from('delivery_products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
