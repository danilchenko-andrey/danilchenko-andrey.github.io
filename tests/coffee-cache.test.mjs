import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../coffee/',import.meta.url);
const source=await readFile(new URL('sw.js',root),'utf8');
const scope='https://example.com/coffee/';
const version='20261110-en2';
const prefix='coffee-pwa-/coffee/';
function harness(){
 const listeners={},stores=new Map([[prefix+'v5',new Map([[scope+'app.js','OLD RUSSIAN SCRIPT']])],['another-app',new Map()]]);
 const requests=[],installRequests=[];let offline=false,claimed=false;
 const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{
  if(!stores.has(key))stores.set(key,new Map());const files=stores.get(key);
  return{addAll:async rs=>{installRequests.push(...rs);for(const r of rs)files.set(r.url,'CURRENT '+r.url);},match:async r=>files.get(typeof r==='string'?r:r.url),put:async(r,v)=>files.set(r.url,v)};
 }};
 vm.runInNewContext(source,{URL,Request,caches,self:{registration:{scope},skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true;}},addEventListener:(type,fn)=>listeners[type]=fn},fetch:async request=>{requests.push(request);if(offline)throw Error('offline');return {ok:true,type:'basic',redirected:false,clone:()=>({}),url:request.url};}});
 return {stores,requests,installRequests,offline:()=>{offline=true;},claimed:()=>claimed,run:async type=>{let done;listeners[type]({waitUntil:p=>done=p});await done;},fetch:async(url,mode='cors')=>{let result;const request=new Request(url);Object.defineProperty(request,'mode',{value:mode});listeners.fetch({request,respondWith:p=>result=p});return result;}};
}
test('release URLs bypass the old unversioned cache and pin all module imports',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8'),app=await readFile(new URL('app.js',root),'utf8');
 for(const file of ['app.js','style.css','manifest.webmanifest'])assert.ok(html.includes(file+'?v='+version));
 for(const file of ['model.js','state.js'])assert.ok(app.includes(file+'?v='+version));
 const h=harness();await h.run('install');
 assert.ok(h.installRequests.every(r=>r.cache==='reload'));
 assert.match(await h.fetch(scope+'app.js?v='+version),/^CURRENT /);
 assert.equal(h.requests.length,0);
 assert.equal(h.stores.get(prefix+'v5').get(scope+'app.js'),'OLD RUSSIAN SCRIPT');
});
test('activation removes only this app cache; offline navigation uses a matching release',async()=>{
 const h=harness();await h.run('install');await h.run('activate');
 assert.equal(h.stores.has(prefix+'v5'),false);assert.ok(h.stores.has('another-app'));assert.ok(h.claimed());
 await h.fetch(scope,'navigate');assert.equal(h.requests.at(-1).cache,'no-cache');h.offline();assert.equal(await h.fetch(scope,'navigate'),'CURRENT '+scope);
});
test('all shipped app text is English and user storage identity is unchanged',async()=>{
 for(const file of ['index.html','app.js','model.js','state.js','manifest.webmanifest'])assert.doesNotMatch(await readFile(new URL(file,root),'utf8'),/[\u0400-\u04ff]/);
 const app=await readFile(new URL('app.js',root),'utf8');
 assert.ok(app.includes("KEY='coffee-rhythm-v1'"));
 assert.ok(app.includes("'Bedtime estimate'"));assert.ok(app.includes("'Below your reference'"));
 assert.ok(app.includes("toLocaleDateString('en-GB'"));assert.ok(app.includes("'BEDTIME '"));
 assert.doesNotMatch(source.replace(/^\s*\/\/.*$/gm,''),/localStorage|indexedDB/); // worker must not touch user records
});
