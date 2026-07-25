import { useEffect, useRef } from 'react';
import { apiBaseURL } from '../services/api';

export function useOrderSSE(
  orderId: string | null,
  secureToken: string | null,
  onStatusChange?: (status: string) => void,
  onNewMessage?: (message: any) => void,
) {
  const onStatusRef = useRef(onStatusChange);
  const onMessageRef = useRef(onNewMessage);
  onStatusRef.current = onStatusChange;
  onMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!orderId && !secureToken) return;

    const base = apiBaseURL;
    let url: string;

    if (secureToken) {
      url = `${base}/orders/token/${secureToken}/events`;
    } else {
      const adminToken = localStorage.getItem('delivery_token') || '';
      url = `${base}/orders/${orderId}/events?token=${encodeURIComponent(adminToken)}`;
    }

    const es = new EventSource(url);

    es.addEventListener('status_changed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onStatusRef.current?.(data.status);
      } catch {}
    });

    es.addEventListener('new_message', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onMessageRef.current?.(data);
      } catch {}
    });

    return () => es.close();
  }, [orderId, secureToken]);
}
