export type Supply={id:string;name:string;category:string;quantity:number;unit:string;expires:string;location:string};
export type Contact={id:string;name:string;phone:string;note:string};
export type Entry={id:string;at:string;text:string};
export type Plan={schema:1;people:number;days:number;extraWater:number;meeting:string;backupMeeting:string;route:string;radio:string;medical:string;pet:string;notes:string;supplies:Supply[];contacts:Contact[];journal:Entry[];checks:string[];bookmarks:string[];outage:string};
export const emptyPlan=():Plan=>({schema:1,people:1,days:3,extraWater:0,meeting:'',backupMeeting:'',route:'',radio:'',medical:'',pet:'',notes:'',supplies:[],contacts:[],journal:[],checks:[],bookmarks:[],outage:''});
export function validatePlan(x:any):Plan{
 if(!x||typeof x!=='object'||Array.isArray(x)||x.schema!==1)throw Error('Unsupported plan format. Your current plan has not changed.');
 const p=emptyPlan();
 const str=(s:any,max=6000)=>{if(typeof s!=='string'||s.length>max)throw Error('Plan contains invalid text.');return s};
 const num=(n:any,min:number,max:number)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error('Plan contains an invalid quantity.');return n};
 const arr=(v:any,max=500)=>{if(!Array.isArray(v)||v.length>max)throw Error('Plan contains too many entries.');return v};
 p.people=num(x.people,1,100);p.days=num(x.days,1,365);p.extraWater=num(x.extraWater,0,100000);
 if(!Number.isInteger(p.people)||!Number.isInteger(p.days))throw Error('People and days must be whole numbers.');
 for(const k of ['meeting','backupMeeting','route','radio','medical','pet','notes','outage'] as const)p[k]=str(x[k]);
 if(p.outage&&!Number.isFinite(Date.parse(p.outage)))throw Error('Invalid outage time.');
 p.supplies=arr(x.supplies).map(v=>({id:str(v.id,100),name:str(v.name,200),category:str(v.category,50),quantity:num(v.quantity,0,1000000),unit:str(v.unit,30),expires:str(v.expires,10),location:str(v.location,200)}));
 if(p.supplies.some(s=>s.expires&&(!/^\d{4}-\d{2}-\d{2}$/.test(s.expires)||!Number.isFinite(Date.parse(s.expires+'T00:00:00Z'))||new Date(s.expires+'T00:00:00Z').toISOString().slice(0,10)!==s.expires)))throw Error('Invalid expiry date.');
 p.contacts=arr(x.contacts,100).map(v=>({id:str(v.id,100),name:str(v.name,200),phone:str(v.phone,100),note:str(v.note,1000)}));
 p.journal=arr(x.journal,500).map(v=>({id:str(v.id,100),at:str(v.at,50),text:str(v.text,4000)}));
 p.checks=arr(x.checks,100).map(v=>str(v,100));p.bookmarks=arr(x.bookmarks,100).map(v=>str(v,100));
 if(new TextEncoder().encode(JSON.stringify(p)).length>650000)throw Error('This plan is too large. Export a backup, then shorten or remove older notes.');
 return p;
}
export function waterSummary(p:Plan,now=new Date()){
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const required=p.people*p.days*3+p.extraWater;
 const stored=p.supplies.filter(s=>s.category==='Water'&&s.unit==='litres'&&(!s.expires||s.expires>=today)).reduce((n,s)=>n+s.quantity,0);
 return {required,stored,short:Math.max(0,required-stored),days:Math.floor(stored/(p.people*3)*10)/10};
}
export function expiry(expires:string,now=new Date()){
 if(!expires)return 'No date recorded';
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const diff=Math.ceil((new Date(expires+'T00:00:00').getTime()-today.getTime())/86400000);
 return diff<0?'Past date · review':diff===0?'Date is today':diff<=30?`Due in ${diff} days`:`Check by ${expires}`;
}
export function powerHours(wh:number,watts:number,efficiency:number){return wh>=0&&watts>0&&efficiency>0&&efficiency<=100?wh*(efficiency/100)/watts:null}
