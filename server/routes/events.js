import { Router } from 'express';
import { deliveryEvents } from '../lib/events.js';

const router = Router();

// GET /events/admin — SSE for admin dashboard
router.get('/admin', async (req, res) => {
  deliveryEvents.setupSSE(res);
  const unsub = deliveryEvents.subscribe('admin:orders', res);
  res.write(`event: connected\ndata: {"channel":"admin:orders"}\n\n`);
  req.on('close', unsub);
});

export default router;
