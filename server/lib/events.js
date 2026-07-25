class DeliveryEventBus {
  constructor() {
    this.listeners = new Map();
    this.nextId = 1;
  }

  subscribe(channel, res) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Map());
    }
    const id = String(this.nextId++);
    this.listeners.get(channel).set(id, res);

    return () => {
      this.listeners.get(channel)?.delete(id);
      if (this.listeners.get(channel)?.size === 0) {
        this.listeners.delete(channel);
      }
    };
  }

  emit(channel, event, data) {
    const subs = this.listeners.get(channel);
    if (!subs || subs.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, res] of subs) {
      try {
        res.write(payload);
      } catch {
        subs.delete(id);
      }
    }
  }

  setupSSE(res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
    }, 30000);

    res.on('close', () => clearInterval(heartbeat));
  }
}

export const deliveryEvents = new DeliveryEventBus();
