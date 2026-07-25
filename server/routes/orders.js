import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';
import { deliveryEvents } from '../lib/events.js';

const router = Router();

function generateToken() {
  return uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

// POST /orders — create order (public) with stock deduction
router.post('/', async (req, res) => {
  try {
    const { items, total, customerName, phone, address, latitude, longitude, customerId, deliveryFee, voiceOrderUrl } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items' });
    if (!customerName || !phone || !address) return res.status(400).json({ error: 'Customer info required' });

    // Stock validation + deduction for catalog items
    const itemsWithCatalogId = items.filter(i => i.catalogItemId);
    if (itemsWithCatalogId.length > 0) {
      const { data: catalogItems } = await supabase
        .from('delivery_products')
        .select('id, name, stock_qty')
        .in('id', itemsWithCatalogId.map(i => i.catalogItemId));

      if (catalogItems) {
        const stockMap = new Map(catalogItems.map(c => [c.id, c]));
        for (const item of itemsWithCatalogId) {
          const product = stockMap.get(item.catalogItemId);
          const available = product?.stock_qty ?? 0;
          if (item.quantity > available) {
            return res.status(400).json({
              error: `Stock insuffisant pour "${product?.name || item.catalogItemId}" — ${available} disponible(s)`,
            });
          }
        }

        // Deduct stock via individual updates
        for (const item of itemsWithCatalogId) {
          const product = stockMap.get(item.catalogItemId);
          if (product) {
            await supabase
              .from('delivery_products')
              .update({ stock_qty: product.stock_qty - item.quantity })
              .eq('id', item.catalogItemId);
          }
        }
      }
    }

    const secure_token = generateToken();

    const orderData = {
      secure_token,
      customer_id: customerId || null,
      customer_name: customerName,
      phone,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      total: total || 0,
      delivery_fee: deliveryFee || 0,
      status: 'PENDING',
    };

    let order;
    // Try insert — may fail if voice_order_url column doesn't exist yet
    if (voiceOrderUrl) orderData.voice_order_url = voiceOrderUrl;
    let { data, error: insertErr } = await supabase
      .from('delivery_orders')
      .insert(orderData)
      .select()
      .single();

    if (insertErr?.message?.includes('voice_order_url')) {
      delete orderData.voice_order_url;
      ({ data, error: insertErr } = await supabase
        .from('delivery_orders')
        .insert(orderData)
        .select()
        .single());
    }
    if (insertErr) throw insertErr;
    order = data;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId || item.erpProductId || null,
      catalog_item_id: item.catalogItemId || null,
      name: item.customName || item.name || 'Item',
      quantity: item.quantity || 1,
      unit_price: Number(item.unitPrice) || 0,
      image_url: item.imageUrl || null,
      custom_name: item.customName || null,
      custom_price: item.customPrice || null,
    }));

    const { error: itemsError } = await supabase.from('delivery_order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    await supabase.from('delivery_order_status_history').insert({
      order_id: order.id,
      status: 'PENDING',
      note: 'Order placed',
    });

    // Emit to admin channel
    deliveryEvents.emit('admin:orders', 'new_order', {
      orderId: order.id,
      secureToken: secure_token,
      customerName: order.customer_name,
      phone: order.phone,
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
    });

    res.status(201).json({ id: order.id, secureToken: secure_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders — admin list with pagination
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const statusFilter = req.query.status || null;

    let query = supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)', { count: 'exact' });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: orders, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    res.json({ orders: orders || [], total: count || 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/token/:token/events — SSE customer
router.get('/token/:token/events', async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('id')
      .eq('secure_token', req.params.token)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    deliveryEvents.setupSSE(res);
    const unsub = deliveryEvents.subscribe(`token:${req.params.token}`, res);
    res.write(`event: connected\ndata: {"token":"${req.params.token}"}\n\n`);
    req.on('close', unsub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/token/:token/messages — customer messages
router.get('/token/:token/messages', async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('id')
      .eq('secure_token', req.params.token)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { data: messages } = await supabase
      .from('delivery_order_messages')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    res.json(messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /orders/token/:token/messages — customer send message with media
router.post('/token/:token/messages', async (req, res) => {
  try {
    const { text, sender, audioUrl, imageUrl } = req.body;
    if (!text && !audioUrl && !imageUrl) return res.status(400).json({ error: 'Content required' });

    const { data: order } = await supabase
      .from('delivery_orders')
      .select('id')
      .eq('secure_token', req.params.token)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { data: msg, error } = await supabase
      .from('delivery_order_messages')
      .insert({
        order_id: order.id,
        text: text || null,
        sender: sender || 'customer',
        audio_url: audioUrl || null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Emit to order channel + admin channel
    deliveryEvents.emit(`token:${req.params.token}`, 'new_message', msg);
    deliveryEvents.emit(order.id, 'new_message', msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:token — public order by token
router.get('/:token', async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)')
      .eq('secure_token', req.params.token)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /order/:id — admin, get order by ID
router.get('/order/:id', adminAuth, async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /orders/:id/status — admin update status
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    const { data: order, error } = await supabase
      .from('delivery_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('delivery_order_status_history').insert({
      order_id: req.params.id,
      status,
    });

    const payload = { orderId: order.id, status: order.status, updatedAt: order.updated_at };
    deliveryEvents.emit(req.params.id, 'status_changed', payload);
    deliveryEvents.emit('admin:orders', 'status_changed', payload);
    if (order.secure_token) deliveryEvents.emit(`token:${order.secure_token}`, 'status_changed', payload);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:id/messages — admin messages
router.get('/:id/messages', adminAuth, async (req, res) => {
  try {
    const { data: messages } = await supabase
      .from('delivery_order_messages')
      .select('*')
      .eq('order_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json(messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /orders/:id/messages — admin send message with media
router.post('/:id/messages', adminAuth, async (req, res) => {
  try {
    const { text, sender, audioUrl, imageUrl } = req.body;
    if (!text && !audioUrl && !imageUrl) return res.status(400).json({ error: 'Content required' });

    const { data: msg, error } = await supabase
      .from('delivery_order_messages')
      .insert({
        order_id: req.params.id,
        text: text || null,
        sender: sender || 'admin',
        audio_url: audioUrl || null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Emit to order channel
    deliveryEvents.emit(req.params.id, 'new_message', msg);

    // Also emit to token channel
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('secure_token')
      .eq('id', req.params.id)
      .single();
    if (order?.secure_token) {
      deliveryEvents.emit(`token:${order.secure_token}`, 'new_message', msg);
    }

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:id/events?token=... — SSE admin per-order
router.get('/:id/events', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token required' });

  deliveryEvents.setupSSE(res);
  const unsub = deliveryEvents.subscribe(req.params.id, res);
  res.write(`event: connected\ndata: {"orderId":"${req.params.id}"}\n\n`);
  req.on('close', unsub);
});

export default router;
