self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'ORDER_STATUS') return;
  const title = typeof data.title === 'string' ? data.title : 'Nouveau statut';
  const body = typeof data.body === 'string' ? data.body : '';
  if (self.registration && 'showNotification' in self.registration) {
    self.registration.showNotification(title, { body, tag: 'order-status' }).catch(() => {});
  }
});
