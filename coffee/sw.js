// Scope all storage and interception to this app, never the rest of GitHub Pages.
const PREFIX='coffee-pwa-'+new URL(self.registration.scope).pathname;
const CACHE=PREFIX+'v3';
const ASSETS=['./','./index.html','./style.css','./app.js','./model.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon.svg'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!ASSETS.includes(event.request.url))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request);
      if(response.ok&&!response.redirected&&response.type==='basic'){
        const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());
      }
      if(response.ok)return response;
      return await caches.match(event.request)||response;
    }catch(error){
      const cached=await caches.match(event.request);
      if(cached)return cached;
      throw error;
    }
  })());
});
