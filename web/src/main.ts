import React from 'react';
import {createRoot} from 'react-dom/client';
import {Survival as Screen} from './generated/App';
import {UI} from './components/ui';
import {guides,categories,kitItems,reviewed} from './content';
import {emptyPlan,validatePlan,waterSummary,expiry,powerHours,type Plan} from './plan';
import {seal,unseal,validateEnvelope,vaultKey,type Envelope} from './vault';
import './style.css';
const E=React.createElement;
const base=new URL('./',location.href);
const id=()=>crypto.randomUUID();
function download(name:string,text:string,type='application/json'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function stored(){try{return localStorage.getItem(vaultKey)}catch{return null}}
const startStored=stored();
function App(){
 const [plan,setPlan]=React.useState<Plan>(emptyPlan),[locked,setLocked]=React.useState(!!startStored),[persistent,setPersistent]=React.useState(!!startStored);
 const planRef=React.useRef(plan),pass=React.useRef(''),queue=React.useRef(Promise.resolve()),revision=React.useRef(0),lastActivity=React.useRef(Date.now());
 const [route,setRoute]=React.useState(location.hash.slice(1)||'home'),[notice,setNotice]=React.useState(''),[error,setError]=React.useState('');
 const [fields,setFields]=React.useState<any>({...emptyPlan(),query:'',category:'All topics',supplyCategory:'Water',supplyUnit:'litres',supplyQuantity:'1',wh:'100',watts:'10',efficiency:'80'});
 const [saveStatus,setSaveStatus]=React.useState(startStored?'Encrypted plan locked':'Session only · not saved'),[pending,setPending]=React.useState<Plan|null>(null),[onlyFavorites,setOnlyFavorites]=React.useState(false);
 const [offline,setOffline]=React.useState(location.protocol==='file:'?'Portable offline file':'Offline copy not checked'),[offlineDetail,setOfflineDetail]=React.useState('Check that the complete app is stored before relying on it without internet.'),[theme,setTheme]=React.useState('light');
 const [geo,setGeo]=React.useState('No location requested.'),[tick,setTick]=React.useState(Date.now()),[connected,setConnected]=React.useState(navigator.onLine);
 const [dirty,setDirty]=React.useState(false);const busy=React.useRef(false);
 const setField=(name:string,value:any)=>{setFields((f:any)=>({...f,[name]:value}));if(['meeting','backupMeeting','route','radio','medical','pet','notes'].includes(name))setDirty(true)};
 function syncFields(p:Plan){setFields({...p,query:'',category:'All topics',supplyCategory:'Water',supplyUnit:'litres',supplyQuantity:'1',wh:'100',watts:'10',efficiency:'80',password:'',passwordConfirm:'',importFile:undefined});setDirty(false)}
 function commit(p:Plan,pw=pass.current,keep=persistent){
  if(locked)throw Error('Unlock your plan first.');
  const valid=validatePlan(p);planRef.current=valid;setPlan(valid);const rev=++revision.current;
  if(!keep){setSaveStatus('Session only · not saved');return Promise.resolve()}
  setSaveStatus('Saving encrypted copy…');
  const job=queue.current.catch(()=>{}).then(async()=>{const encrypted=await seal(valid,pw);localStorage.setItem(vaultKey,JSON.stringify(encrypted));if(rev===revision.current)setSaveStatus('Saved encrypted on this browser')});
  queue.current=job;job.catch(()=>{setSaveStatus('Not saved · export a backup');setError('Could not save this change. Your in-memory plan is still open. Export a backup before closing.')});return job;
 }
 async function lock(saveDrafts=false){
  if(dirty){if(!saveDrafts)throw Error('Save your plan changes before locking.');const next={...planRef.current};for(const k of ['meeting','backupMeeting','route','radio','medical','pet','notes'] as const)next[k]=fields[k]||'';await commit(next);setDirty(false)}
  await queue.current;pass.current='';planRef.current=emptyPlan();setPlan(emptyPlan());syncFields(emptyPlan());setLocked(true);setPending(null);setSaveStatus('Encrypted plan locked')
 }
 async function checkOffline(){
  if(location.protocol==='file:'){setOffline('Portable offline file');setOfflineDetail('This single file includes the full app and handbook. Keep the file and a separate encrypted plan export. Browser storage for local files varies by browser.');return}
  if(!('serviceWorker' in navigator)||!window.isSecureContext)throw Error('Offline installation needs HTTPS or localhost in a supported browser. Use the portable file instead.');
  const registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname});await navigator.serviceWorker.ready;
  const worker=registration.active||navigator.serviceWorker.controller;if(!worker)throw Error('Offline installation is still in progress. Try again shortly.');
  const report:any=await new Promise((resolve,reject)=>{const ch=new MessageChannel();const timer=setTimeout(()=>reject(Error('Offline verification timed out. Retry while connected.')),15000);ch.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)};worker.postMessage({type:'VERIFY'},[ch.port2])});
  if(!report.ready)throw Error('The offline copy is incomplete. Reconnect and reload to repair it.');
  let persisted=false;try{persisted=await navigator.storage?.persist?.()||false}catch{}
  setOffline('Offline ready');setOfflineDetail(`Verified ${report.count} app files (${(report.bytes/1024/1024).toFixed(2)} MB). ${persisted?'Browser persistent storage granted.':'Browser may clear cached storage.'} Test opening again in airplane mode.`);
 }
 async function server(method:string,body?:Envelope){
  if(location.protocol==='file:')throw Error('Workspace backup is available from the managed HTTPS app. Use a file export here.');
  const auth=await fetch(new URL('api/me',base),{cache:'no-store'});if(!auth.ok)throw Error('Sign in to Workspace backup first. Your local plan stays available.');const me=await auth.json();
  const response=await fetch(new URL('api/vault',base),{method,cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':me.csrf,'X-Workspace-Expected-Account':me.user.id},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw Error(response.status===404?'No Workspace backup is stored for this account.':'Workspace backup failed. Your local plan is unchanged.');return response.json();
 }
 async function action(name:string,value?:string){
  if(name==='guide'){location.hash='guide/'+value;return}
  if(busy.current)return;busy.current=true;setError('');setNotice('');
  try{
   const p=planRef.current;
   const needOpen=()=>{if(locked)throw Error('Unlock your saved plan first.')};
   const chosenPassword=()=>{const pw=pass.current||fields.password||'';if(pw.length<12)throw Error('Use a passphrase with at least 12 characters.');return pw};
   switch(name){
    case 'theme':setTheme(t=>t==='light'?'dark':'light');break;
    case 'favorites':setOnlyFavorites(v=>!v);break;
    case 'bookmark':{needOpen();const g=route.split('/')[1];await commit({...p,bookmarks:p.bookmarks.includes(g)?p.bookmarks.filter(x=>x!==g):[...p.bookmarks,g]});break}
    case 'check':needOpen();await commit({...p,checks:p.checks.includes(value!)?p.checks.filter(x=>x!==value):[...p.checks,value!]});break;
    case 'saveHousehold':needOpen();await commit({...p,people:Number(fields.people),days:Number(fields.days),extraWater:Number(fields.extraWater)});setNotice('Household water plan updated.');break;
    case 'addSupply':{
     needOpen();if(!fields.supplyName?.trim())throw Error('Enter an item name.');if(fields.supplyQuantity===''||Number(fields.supplyQuantity)<=0)throw Error('Enter a quantity greater than zero.');
     await commit({...p,supplies:[...p.supplies,{id:id(),name:fields.supplyName.trim(),category:fields.supplyCategory,quantity:Number(fields.supplyQuantity),unit:fields.supplyUnit,expires:fields.supplyExpires||'',location:fields.supplyLocation||''}]});setFields((f:any)=>({...f,supplyName:'',supplyExpires:'',supplyLocation:''}));setNotice('Supply added.');break}
    case 'deleteSupply':needOpen();if(confirm('Remove this inventory entry?'))await commit({...p,supplies:p.supplies.filter(x=>x.id!==value)});break;
    case 'savePlan':{needOpen();const next={...p};for(const k of ['meeting','backupMeeting','route','radio','medical','pet','notes'] as const)next[k]=fields[k]||'';await commit(next);setDirty(false);setNotice(persistent?'Plan saved encrypted.':'Plan updated for this session. Enable encrypted saving or export before closing.');break}
    case 'addContact':needOpen();if(!fields.contactName?.trim()||!fields.contactPhone?.trim())throw Error('Enter a contact name and phone number.');await commit({...p,contacts:[...p.contacts,{id:id(),name:fields.contactName.trim(),phone:fields.contactPhone.trim(),note:fields.contactNote||''}]});setFields((f:any)=>({...f,contactName:'',contactPhone:'',contactNote:''}));break;
    case 'deleteContact':needOpen();if(confirm('Remove this contact?'))await commit({...p,contacts:p.contacts.filter(x=>x.id!==value)});break;
    case 'startOutage':needOpen();if(p.outage)throw Error('An outage is already recorded. Record restoration before starting another.');await commit({...p,outage:new Date().toISOString()});break;
    case 'endOutage':needOpen();if(!p.outage)throw Error('No active power cut is recorded.');await commit({...p,outage:'',journal:[{id:id(),at:new Date().toISOString(),text:'Power restored. Outage began '+new Date(p.outage).toLocaleString()+'.'},...p.journal].slice(0,500)});break;
    case 'addJournal':needOpen();if(!fields.journalText?.trim())throw Error('Write a note first.');await commit({...p,journal:[{id:id(),at:new Date().toISOString(),text:fields.journalText.trim()},...p.journal].slice(0,500)});setField('journalText','');break;
    case 'deleteJournal':needOpen();if(confirm('Delete this note?'))await commit({...p,journal:p.journal.filter(x=>x.id!==value)});break;
    case 'locate':{if(!navigator.geolocation)throw Error('This browser does not provide location.');setGeo('Requesting a location…');navigator.geolocation.getCurrentPosition(pos=>setGeo(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} · accuracy ±${Math.round(pos.coords.accuracy)} m · ${new Date(pos.timestamp).toLocaleTimeString()}`),()=>setGeo('Location unavailable or permission denied. Use a known address or landmark; do not rely on a previous fix.'),{enableHighAccuracy:false,timeout:15000,maximumAge:0});break}
    case 'enableVault':{
     needOpen();const pw=chosenPassword();if(pw!==fields.passwordConfirm)throw Error('The two passphrases do not match.');const encrypted=await seal(p,pw);localStorage.setItem(vaultKey,JSON.stringify(encrypted));pass.current=pw;setPersistent(true);setSaveStatus('Saved encrypted on this browser');setFields((f:any)=>({...f,password:'',passwordConfirm:''}));setNotice('Encrypted saving enabled. Export a separate backup too.');break}
    case 'unlock':{
     const raw=stored();if(!raw)throw Error('Saved data is missing from this browser. Import your backup.');const pw=fields.password||'';const next=await unseal(JSON.parse(raw),pw);pass.current=pw;planRef.current=next;setPlan(next);syncFields(next);setLocked(false);setSaveStatus('Saved encrypted on this browser');break}
    case 'lock':await lock();break;
    case 'export':needOpen();if(dirty)throw Error('Save your plan changes before exporting.');download('my-survival-encrypted-backup.json',JSON.stringify(await seal(p,chosenPassword())));setNotice('Encrypted backup downloaded. Keep its passphrase separately.');break;
    case 'import':{
     const file=fields.importFile as File;if(!file||file.size>1024*1024)throw Error('Choose an encrypted backup under 1 MB.');const next=await unseal(JSON.parse(await file.text()),fields.password||pass.current);setPending(next);break}
    case 'confirmImport':{
     if(!pending)break;if(dirty&&!confirm('Replace your unsaved plan edits too?'))break;
     const pw=fields.password||pass.current;if(pw.length<12)throw Error('Enter the backup passphrase.');const encrypted=await seal(pending,pw);
     await queue.current;localStorage.setItem(vaultKey,JSON.stringify(encrypted));pass.current=pw;setPersistent(true);setLocked(false);planRef.current=pending;setPlan(pending);syncFields(pending);setPending(null);setSaveStatus('Saved encrypted on this browser');setNotice('Backup restored.');break}
    case 'cancelImport':setPending(null);break;
    case 'offline':await checkOffline();break;
    case 'downloadPortable':{
     if(location.protocol==='file:'){setNotice('This is already the portable app. Copy the HTML file to another device or USB drive.');break}
     const r=await fetch(new URL('portable.html',base));if(!r.ok)throw Error('Portable download unavailable. Reconnect and retry.');download('My-Survival-offline.html',await r.text(),'text/html');break}
    case 'printGuide':window.print();break;
    case 'printPlan':needOpen();if(dirty)throw Error('Save your plan changes before printing.');document.body.dataset.print='plan';setTimeout(()=>{window.print();delete document.body.dataset.print},0);break;
    case 'serverSave':needOpen();if(dirty)throw Error('Save plan changes first.');await server('PUT',await seal(p,chosenPassword()));setNotice('Encrypted copy saved to your Workspace account.');break;
    case 'serverLoad':{const raw=validateEnvelope(await server('GET'));setPending(await unseal(raw,fields.password||pass.current));break}
   }
  }catch(e){setError(e instanceof Error?e.message:'The action failed. Your saved data has not been replaced.');}finally{busy.current=false}
 }
 React.useEffect(()=>{const hash=()=>{setRoute(location.hash.slice(1)||'home');setError('');setNotice('');setTimeout(()=>{document.querySelector('main')?.scrollTo(0,0);(document.querySelector('h1') as HTMLElement)?.focus()},0)};window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash)},[]);
 React.useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
 // Optional online shared picker. It is not part of the offline dependency set;
 // the header link remains a working hub fallback when this enhancement fails.
 React.useEffect(()=>{if(location.protocol==='file:'||base.pathname!=='/survival/'||!navigator.onLine)return;const script=document.createElement('script');script.src='/_workspace/navigation.js';script.defer=true;document.body.append(script);return()=>script.remove()},[]);
 React.useEffect(()=>{const online=()=>setConnected(navigator.onLine);window.addEventListener('online',online);window.addEventListener('offline',online);const timer=setInterval(()=>setTick(Date.now()),30000);return()=>{clearInterval(timer);window.removeEventListener('online',online);window.removeEventListener('offline',online)}},[]);
 React.useEffect(()=>{if(location.protocol!=='file:'&&'serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname}).catch(()=>{});},[]);
 React.useEffect(()=>{const touch=()=>{lastActivity.current=Date.now()};window.addEventListener('pointerdown',touch);window.addEventListener('keydown',touch);const timer=setInterval(()=>{if(persistent&&!locked&&Date.now()-lastActivity.current>600000){lock(true).catch(()=>{})}},30000);return()=>{clearInterval(timer);window.removeEventListener('pointerdown',touch);window.removeEventListener('keydown',touch)}},[persistent,locked,dirty]);
 React.useEffect(()=>{const before=(e:BeforeUnloadEvent)=>{if(dirty||(!persistent&&!locked&&(plan.supplies.length||plan.contacts.length||plan.notes||plan.journal.length||plan.checks.length))||saveStatus.startsWith('Saving')||saveStatus.startsWith('Not saved')){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before)},[dirty,persistent,locked,plan,saveStatus]);
 const water=waterSummary(plan),guide=guides.find(x=>route==='guide/'+x.id),q=String(fields.query||'').trim().toLowerCase();
 const results=guides.filter(g=>(fields.category==='All topics'||g.category===fields.category)&&(!onlyFavorites||plan.bookmarks.includes(g.id))&&(!q||[g.title,g.summary,g.category,g.tags,...g.steps].join(' ').toLowerCase().includes(q)));
 const runtime=powerHours(Number(fields.wh),Number(fields.watts),Number(fields.efficiency));
 const data:any={route,home:route==='home'||(!guide&&!['handbook','supplies','plan','tools','settings'].includes(route)),handbook:route==='handbook',article:!!guide,supplies:route==='supplies',planPage:route==='plan',tools:route==='tools',settings:route==='settings',guide:guide||guides[0],steps:guide?.steps.map((text,i)=>({number:String(i+1).padStart(2,'0'),text})),reviewed,notice,error,workspace:location.protocol==='file:'?'#home':'/',themeIcon:theme==='light'?'Moon':'Sun',offlineLabel:offline==='Offline ready'?(connected?'Offline ready':'Offline ready · no network'):offline,offlineDetail,locked,persistent,saveStatus:dirty?'Unsaved plan edits':saveStatus,planState:locked?'Unlock your plan to see your household supplies.':saveStatus,
 waterStored:locked?'—':`${water.stored} L`,waterTarget:locked?'—':`${water.required} L`,waterShort:`${water.short} L`,kitProgress:locked?'—':`${plan.checks.length} / ${kitItems.length}`,checklist:kitItems.map(k=>({...k,checked:plan.checks.includes(k.id)})),results,resultCount:`${results.length} of ${guides.length} guides`,noResults:!results.length,categories,onlyFavorites,
 quick:[{id:'power',label:'Power cut',detail:'Light, warmth & essentials',icon:'Zap'},{id:'cpr',label:'Adult collapse',detail:'Not breathing normally',icon:'HeartPulse'},{id:'water',label:'Unsafe water',detail:'Drinking & food safety',icon:'Droplets'},{id:'shelter',label:'Conflict nearby',detail:'Sheltering & civilian safety',icon:'Shield'}],
 isBookmarked:!!guide&&plan.bookmarks.includes(guide.id),bookmarkLabel:guide&&plan.bookmarks.includes(guide.id)?'Saved':'Save guide',supplyCategories:['Water','Food','Medicine','Power','Hygiene','Equipment','Other'],units:['litres','items','packs','kg','Wh','doses'],noSupplies:!plan.supplies.length,
 inventory:plan.supplies.map(s=>({...s,icon:s.category==='Water'?'Droplets':s.category==='Food'?'Utensils':'Backpack',detail:`${s.quantity} ${s.unit} · ${s.category}${s.location?' · '+s.location:''}`,expiry:expiry(s.expires),removeLabel:'Remove '+s.name})),contacts:plan.contacts.map(c=>({...c,tel:'tel:'+c.phone.replace(/[^+\d]/g,''),removeLabel:'Remove '+c.name})),journal:plan.journal.map(j=>({...j,when:new Date(j.at).toLocaleString()})),outageElapsed:plan.outage?`${Math.max(0,Math.floor((tick-Date.parse(plan.outage))/60000))} min`:'No active outage',outageStarted:plan.outage?'Started '+new Date(plan.outage).toLocaleString():'Record the start when you notice the power cut.',runtime:runtime===null?'Enter valid values':`About ${runtime.toFixed(1)} hours`,location:geo,pendingImport:!!pending,importSummary:pending?`Preview: ${pending.people} people, ${pending.supplies.length} supplies, ${pending.contacts.length} contacts, ${pending.journal.length} notes. Confirming replaces the current plan on this browser.`:'',loginURL:new URL('auth/login',base).href};
 const print=E('section',{className:'print-plan'},E('h1',{},'My Survival · household plan'),E('p',{},'Printed '+new Date().toLocaleString()+' · Keep this personal information secure.'),E('p',{},'UK immediate danger: 999 / 112. GB power cuts: 105. NI: 03457 643 643.'),E('p',{},`${plan.people} people · ${plan.days} days · ${water.required} L water planned, ${water.stored} L recorded.`),...(['meeting','backupMeeting','route','radio','medical','pet','notes'] as const).map(k=>E('section',{key:k},E('h2',{},({meeting:'Meeting point',backupMeeting:'Backup meeting point',route:'Routes and assistance',radio:'Radio',medical:'Medical needs',pet:'Children, pets and accessibility',notes:'Notes'})[k]),E('p',{},plan[k]||'Not recorded'))),E('h2',{},'Contacts'),...plan.contacts.map(c=>E('p',{key:c.id},`${c.name}: ${c.phone} — ${c.note}`)),E('h2',{},'Supplies'),...plan.supplies.map(s=>E('p',{key:s.id},`${s.name}: ${s.quantity} ${s.unit}; ${s.location}; ${s.expires||'date not recorded'}`)),E('h2',{},'Go-bag checks'),...kitItems.map(k=>E('p',{key:k.id},`${plan.checks.includes(k.id)?'✓':'□'} ${k.title}: ${k.detail}`)));
 return E(React.Fragment,{},E(UI.Provider,{value:{fields,setField,action,route}},E(Screen,{data,onAction:action})),print);
}
createRoot(document.getElementById('root')!).render(E(App));
