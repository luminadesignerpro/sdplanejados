// Service Worker PWA para sdmoveisprojetados - v22.0 (barreira-solida-plano-corte)
const CACHE_NAME = 'sdmoveisprojetados-v22.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim()).then(() => {
      // Notifica todas as abas abertas para recarregar e pegar o HTML novo
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHtml = event.request.mode === 'navigate' ||
                 (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname === '/cliente' ||
                 url.pathname === '/funcionario';

  if (isHtml) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          fetch(event.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(event.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
  }
});

// ══════════════════════════════════════════════════
// ALARME: Recebe mensagem da página e dispara notificação nativa
// (aparece na tela bloqueada do Android)
// ══════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.tipo === 'DISPARAR_ALARME_NOTIFICACAO') {
    const dados = event.data;
    const cliente = dados.cliente || 'Agendamento';
    const tipo = dados.tipo_atendimento || 'Visita';
    const hora = dados.hora || '';
    const local = dados.local || '';
    const diffMin = dados.diff_minutos;

    let bodyText = tipo;
    if (hora) bodyText += ' - ' + hora;
    if (diffMin <= 0) {
      bodyText += '\nE AGORA no horário!';
    } else if (diffMin < 60) {
      bodyText += '\nFaltam ' + diffMin + ' minuto(s)!';
    } else {
      bodyText += '\nFalta aprox. ' + Math.round(diffMin / 60) + ' hora(s)!';
    }
    if (local) bodyText += '\n' + local;

    // Vibração forte + notificação de alta prioridade na tela bloqueada
    const opcoes = {
      body: bodyText,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'alarme-agenda-sdmoveis',
      renotify: true,
      requireInteraction: true,        // Fica na tela até o usuário agir
      vibrate: [500, 200, 500, 200, 1000, 300, 1000, 300, 2000],
      silent: false,
      data: { url: '/?alarme=1&cliente=' + encodeURIComponent(cliente), cliente, tipo },
      actions: [
        { action: 'abrir', title: 'Ver Alarme' },
        { action: 'soneca', title: 'Soneca 5min' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('⏰ ALARME: ' + cliente.toUpperCase(), opcoes)
    );
    return;
  }

  if (event.data.tipo === 'AGENDAR_NOTIFICACAO_FUTURA') {
    // Agenda um setTimeout interno no SW para disparar notificação no momento exato
    const dados = event.data;
    const delayMs = dados.delay_ms;
    if (!delayMs || delayMs <= 0) return;

    setTimeout(() => {
      const cliente = dados.cliente || 'Agendamento';
      const tipo = dados.tipo_atendimento || 'Visita';
      const hora = dados.hora || '';
      const local = dados.local || '';

      const bodyText = [tipo, hora ? 'Hora: ' + hora : '', local].filter(Boolean).join('\n');

      self.registration.showNotification('⏰ ALARME: ' + cliente.toUpperCase(), {
        body: bodyText || 'Hora do seu agendamento!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'alarme-agenda-sdmoveis-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 1000, 300, 1000, 300, 2000],
        silent: false,
        data: { url: '/?alarme=1&cliente=' + encodeURIComponent(cliente), cliente, tipo },
        actions: [
          { action: 'abrir', title: 'Ver Alarme' },
          { action: 'soneca', title: 'Soneca 5min' }
        ]
      }).catch(() => {});
    }, delayMs);
  }
});

// ══════════════════════════════════════════════════
// Ao clicar na notificação: abre/foca o app
// ══════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  if (event.action === 'soneca') {
    // Soneca: dispara nova notificação em 5 minutos
    const cliente = data.cliente || 'Agendamento';
    const tipo = data.tipo || 'Visita';
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(() => {
          self.registration.showNotification('⏰ SONECA: ' + cliente.toUpperCase(), {
            body: tipo + '\nSoneca de 5 minutos!',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'alarme-agenda-soneca',
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 1000],
            silent: false,
            data: { url: targetUrl, cliente, tipo }
          }).catch(() => {});
          resolve();
        }, 5 * 60 * 1000);
      })
    );
    return;
  }

  // Ação padrão: abrir/focar o app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem o app aberto, foca e envia mensagem para mostrar o alarme
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.postMessage({ tipo: 'MOSTRAR_ALARME_NOTIFICACAO', cliente: data.cliente, tipo_atendimento: data.tipo });
          return client.focus();
        }
      }
      // Se não tem, abre o app
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Notificação fechada sem interação (apenas log)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada sem ação:', event.notification.tag);
});
