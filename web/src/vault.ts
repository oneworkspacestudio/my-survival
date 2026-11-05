import {validatePlan,type Plan} from './plan';
export type Envelope={format:'my-survival-v1';iterations:310000;salt:string;iv:string;ciphertext:string};
export const vaultKey='my-survival-vault-v1';
const encoder=new TextEncoder();
function b64(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function bytes(s:string){return Uint8Array.from(atob(s),x=>x.charCodeAt(0))}
export function validateEnvelope(x:any):Envelope{
 if(!x||x.format!=='my-survival-v1'||x.iterations!==310000||typeof x.salt!=='string'||typeof x.iv!=='string'||typeof x.ciphertext!=='string'||x.ciphertext.length>900000)throw Error('Not a supported encrypted My Survival backup.');
 try{if(bytes(x.salt).length!==16||bytes(x.iv).length!==12||bytes(x.ciphertext).length<16)throw Error()}catch{throw Error('The backup is damaged.');}
 return {format:x.format,iterations:x.iterations,salt:x.salt,iv:x.iv,ciphertext:x.ciphertext};
}
async function key(password:string,salt:Uint8Array){
 if(!crypto.subtle)throw Error('Encryption needs a secure browser context. Use localhost, HTTPS, or a supported browser to open the portable file.');
 const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:310000,salt: salt as BufferSource},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function seal(p:Plan,password:string):Promise<Envelope>{
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt),encoder.encode(JSON.stringify(validatePlan(p))));
 return {format:'my-survival-v1',iterations:310000,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}
export async function unseal(raw:any,password:string):Promise<Plan>{
 const e=validateEnvelope(raw);let clear:ArrayBuffer;
 try{clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(e.iv)},await key(password,bytes(e.salt)),bytes(e.ciphertext));}
 catch{throw Error('Cannot unlock: check the passphrase and that this is the right backup.');}
 return validatePlan(JSON.parse(new TextDecoder().decode(clear)));
}
