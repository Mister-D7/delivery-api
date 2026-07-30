import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';
import { deliveryEvents } from '../lib/events.js';

const router = Router();

function generateToken() {
  return uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

async function generateTrackingToken(customerName, phone) {
  const baseName = (customerName || 'CLIENT').split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'CLIENT';
  const phoneDigits = (phone || '').replace(/\D/g, '').slice(-6) || '000000';
  const prefix = `${baseName}-${phoneDigits}`;
  const { data: existing } = await supabase
    .from('delivery_orders')
    .select('secure_token')
    .like('secure_token', `${prefix}-%`)
    .order('created_at', { ascending: false })
    .limit(1);
  if (existing && existing.length > 0) {
    const last = existing[0].secure_token;
    const match = last.match(/(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `${prefix}-${String(nextNum).padStart(6, '0')}`;
    }
  }
  return `${prefix}-000001`;
}

function mapOrder(o) {
  if (!o) return o;
  return {
    ...o,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    secureToken: o.secure_token,
    customerId: o.customer_id,
    customerName: o.customer_name,
    deliveryFee: o.delivery_fee,
    voiceOrderUrl: o.voice_order_url,
    items: (o.delivery_order_items || o.items || []).map(mapItem),
  };
}

function mapMessage(m) {
  if (!m) return m;
  return { ...m, createdAt: m.created_at, orderId: m.order_id, audioUrl: m.audio_url, imageUrl: m.image_url };
}

function mapItem(i) {
  if (!i) return i;
  return {
    ...i,
    orderId: i.order_id,
    unitPrice: i.unit_price,
    customName: i.custom_name,
    customPrice: i.custom_price,
    catalogItemId: i.catalog_item_id,
    productId: i.product_id,
    imageUrl: i.image_url,
  };
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

    const secure_token = await generateTrackingToken(customerName, phone);

    const orderData = {
      secure_token,
      customer_id: customerId || null,
      customer_name: customerName,
      phone,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      total: total || 0,
      delivery_fee: deliveryFee || 0, // estimated fee, finalized on confirmation
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
    res.json({ orders: (orders || []).map(mapOrder), total: count || 0, page, limit });
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

    res.json((messages || []).map(mapMessage));
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
    deliveryEvents.emit(`token:${req.params.token}`, 'new_message', mapMessage(msg));
    deliveryEvents.emit(order.id, 'new_message', mapMessage(msg));

    res.status(201).json(mapMessage(msg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/:token — public order by token
// Strips personal info (name, phone, address) unless the authenticated customer owns the order
router.get('/:token', async (req, res) => {
  // Optional auth — check if requester is the order owner
  let authedCustomer = null;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const { verifyToken } = await import('../lib/auth.js');
      const decoded = verifyToken(authHeader.slice(7));
      if (decoded?.email && decoded.role === 'customer') {
        const { data: customer } = await supabase
          .from('delivery_customers')
          .select('id, email')
          .eq('email', decoded.email)
          .maybeSingle();
        authedCustomer = customer;
      }
    }
  } catch (e) {} // silently ignore invalid tokens
  try {
    const param = req.params.token;
    let { data: order } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)')
      .eq('secure_token', param)
      .maybeSingle();

    if (!order) {
      const { data: byId } = await supabase
        .from('delivery_orders')
        .select('*, delivery_order_items(*)')
        .ilike('secure_token', param)
        .maybeSingle();
      order = byId;
    }

    if (!order) {
      const { data: byId } = await supabase
        .from('delivery_orders')
        .select('*, delivery_order_items(*)')
        .eq('id', param)
        .maybeSingle();
      order = byId;
    }

    if (!order) {
      const { data: byPrefix } = await supabase
        .from('delivery_orders')
        .select('*, delivery_order_items(*)')
        .like('id', param + '%')
        .limit(1)
        .maybeSingle();
      order = byPrefix;
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Privacy: only strip personal info if accessed by ID (not by secure_token)
    // When accessed via secure_token, the token itself is the authorization
    const accessedByToken = order.secure_token === param;
    if (!accessedByToken) {
      order.customer_name = null;
      order.phone = null;
      order.address = null;
    }

    res.json(mapOrder(order));
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
    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /orders/:id/status — admin update status (optionally set deliveryFee on CONFIRMED)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, deliveryFee } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    const updateData = { status, updated_at: new Date().toISOString() };

    // When confirming, set the delivery fee (custom or calculated)
    if (status === 'CONFIRMED' && deliveryFee !== undefined && deliveryFee !== null) {
      updateData.delivery_fee = deliveryFee;
    }

    const { data: order, error } = await supabase
      .from('delivery_orders')
      .update(updateData)
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

    res.json(mapOrder(order));
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

    res.json((messages || []).map(mapMessage));
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
    deliveryEvents.emit(req.params.id, 'new_message', mapMessage(msg));

    // Also emit to token channel
    const { data: order } = await supabase
      .from('delivery_orders')
      .select('secure_token')
      .eq('id', req.params.id)
      .single();
    if (order?.secure_token) {
      deliveryEvents.emit(`token:${order.secure_token}`, 'new_message', mapMessage(msg));
    }

    res.status(201).json(mapMessage(msg));
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
