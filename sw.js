const CACHE = 'colormatch-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/style.css',
  '/src/settings.js',
  '/src/sfx.js',
  '/src/color.js',
  '/src/phrases.js',
  '/src/sliders.js',
  '/src/difficulty.js',
  '/src/game.js',
  '/src/training.js',
  '/src/summary.js',
  '/src/records.js',
  '/src/ui.js',
  '/img/logo.png',
  '/img/arrow.png',
  '/img/close.png',
  '/img/dark.png',
  '/img/help.png',
  '/img/mode.png',
  '/img/records.png',
  '/img/submit.png',
  '/img/training.png',
  '/img/volume.png',
  '/img/arrow-left.png',
  '/img/arrow-right.png',
  '/img/despit.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});