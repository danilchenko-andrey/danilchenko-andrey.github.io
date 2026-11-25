const NAME='ml-recall-20261125-learn1';
const SCOPE=self.registration.scope;
const ASSETS=['./','./index.html','./style.css?v=learn1','./app.js?v=learn1','./learn.js?v=learn1','./lessons.js','./scheduler.js','./cards.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
const paths=new Set(ASSETS.map(path=>new URL(path,SCOPE).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ml-recall-')&&k!==NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||!request.url.startsWith(SCOPE))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.open(NAME).then(cache=>cache.match('./index.html'))));
  }else if(paths.has(request.url)){
    event.respondWith(caches.open(NAME).then(cache=>cache.match(request)).then(saved=>saved||fetch(request)));
  }
});
