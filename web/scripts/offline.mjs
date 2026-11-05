import {readdir,readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../internal/webui/dist/',import.meta.url);
let html=await readFile(new URL('index.html',root),'utf8');
const script=html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
const css=html.match(/<link[^>]*href="([^\"]+\.css)"[^>]*>/)?.[1];
if(!script||!css)throw Error('Expected a single JS bundle and CSS file');
const js=await readFile(new URL(script,root),'utf8');
if(/^import\s/m.test(js))throw Error('Portable app has external imports');
let portable=html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,()=>'<script type="module">'+js.replace(/<\/script/gi,'<\\/script')+'</script>').replace(/<link[^>]*href="[^\"]+\.css"[^>]*>/,()=>'<style></style>');
const styles=await readFile(new URL(css,root),'utf8');portable=portable.replace('<style></style>',()=>'<style>'+styles+'</style>');
portable=portable.replace(/<link[^>]*rel="(?:manifest|icon)"[^>]*>/g,'');
await writeFile(new URL('portable.html',root),portable);
const files=[];
async function walk(prefix=''){for(const name of await readdir(new URL(prefix,root))){const path=prefix+name,info=await stat(new URL(path,root));if(info.isDirectory())await walk(path+'/');else if(!['sw.js','offline-manifest.json'].includes(path)){const bytes=await readFile(new URL(path,root));files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})}}}
await walk();const total=files.reduce((n,f)=>n+f.bytes,0);if(total>20*1024*1024)throw Error('Offline app exceeds 20 MiB budget');
const version=createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
await writeFile(new URL('offline-manifest.json',root),JSON.stringify({version,bytes:total,files},null,2));
await writeFile(new URL('sw.js',root),`
const FILES=${JSON.stringify(files)},CACHE='my-survival-'+${JSON.stringify(version)},SCOPE=new URL(self.registration.scope),URLS=FILES.map(f=>new URL(f.path,SCOPE).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);try{for(const f of FILES){const u=new URL(f.path,SCOPE).href,r=await fetch(u,{cache:'reload',credentials:'omit'});if(!r.ok||r.redirected)throw Error('Offline asset unavailable');const b=await r.clone().arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256)throw Error('Offline integrity check failed');await c.put(u,r)}}catch(e){await caches.delete(CACHE);throw e}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('my-survival-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==SCOPE.origin)return;const target=u.pathname===SCOPE.pathname?new URL('index.html',SCOPE).href:u.origin+u.pathname;if(!URLS.includes(target))return;event.respondWith((async()=>{const hit=await(await caches.open(CACHE)).match(target);return hit||fetch(event.request)})())});
self.addEventListener('message',event=>{if(event.data?.type!=='VERIFY'||!event.ports[0])return;event.waitUntil((async()=>{const c=await caches.open(CACHE);let ready=true;for(const f of FILES){const r=await c.match(new URL(f.path,SCOPE).href);if(!r){ready=false;break}const b=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256){ready=false;break}}event.ports[0].postMessage({ready,count:FILES.length,bytes:${total}})})())});
`);
await mkdir(new URL('../../dist/',import.meta.url),{recursive:true});await writeFile(new URL('../../dist/My-Survival-offline.html',import.meta.url),portable);
console.log('Offline payload: '+total+' bytes; portable: '+Buffer.byteLength(portable)+' bytes; version '+version);
