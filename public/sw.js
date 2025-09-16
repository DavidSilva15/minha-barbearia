/* Public/sw.js */
// Recebe push do servidor e mostra notificação
self.addEventListener('push', (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch { }
    const title = data.title || 'Nova atualização';
    const body = data.body || '';
    const icon = data.icon || '/img/logo.png';
    const tag = data.tag || 'barbearia';

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag,
            data: data.clickUrl ? { clickUrl: data.clickUrl } : {}
        })
    );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.clickUrl) || '/admin';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
