// Service worker do "Meu Plano" — deixa o app funcionar offline.
// Ao publicar mudanças, incremente a versão do cache abaixo.
const CACHE = 'meu-plano-v4';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  // Navegação (abrir a página): tenta rede primeiro, cai no cache se offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }

  // Demais arquivos: cache primeiro, atualizando em segundo plano.
  e.respondWith(
    caches.match(req).then(function(cached){
      var net = fetch(req).then(function(res){
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || net;
    })
  );
});
