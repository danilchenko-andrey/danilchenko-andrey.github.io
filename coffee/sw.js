// Keep every release's scripts and styles separate from older browser caches.
// This cache contains application files only. User history stays in localStorage.
const RELEASE='20261110-en2';
const SCOPE=self.registration.scope;
const PREFIX='coffee-pwa-'+new URL(SCOPE).pathname;
const CACHE=PREFIX+RELEASE;
const page=new URL('./',SCOPE).href;
const assets=['style.css','app.js','model.js','state.js','manifest.webmanifest']
  .map(file=>new URL('./'+file+'?v='+RELEASE,SCOPE).href);
const icons=['icon-192.png','icon-512.png','icon.svg'].map(file=>new URL('./'+file,SCOPE).href);
const ASSETS=[page,new URL('./index.html',SCOPE).href,...assets,...icons];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // addAll is atomic; reload bypasses stale HTTP-cache responses during install.
  await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(SCOPE);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const isPage=request.mode==='navigate'&&(url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html');
  if(!isPage&&!ASSETS.includes(request.url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(!isPage){
      // Versioned imports always use their exact URL; never match an older version.
      const cached=await cache.match(request);
      if(cached)return cached;
      const response=await fetch(new Request(request,{cache:'reload'}));
      if(response.ok&&!response.redirected&&response.type==='basic')await cache.put(request,response.clone());
      return response;
    }
    try{
      // Revalidate the entry page so a newer release can name its own asset URLs.
      const response=await fetch(new Request(request,{cache:'no-cache'}));
      if(response.ok)return response;
      return await cache.match(page)||response;
    }catch(error){
      const cached=await cache.match(page);
      if(cached)return cached;
      throw error;
    }
  })());
});
