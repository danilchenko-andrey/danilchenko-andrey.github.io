export const HOUR=3600000;
const rates=new Map();
export function absorption(half,peak=.75){const key=half+":"+peak;if(rates.has(key))return rates.get(key);const ke=Math.LN2/half;let low=ke*1.00001,high=100;for(let i=0;i<80;i++){const k=(low+high)/2;const t=Math.log(k/ke)/(k-ke);if(t>peak)low=k;else high=k;}const result=(low+high)/2;rates.set(key,result);return result;}
export function remaining(dose,hours,half=5){if(hours<=0)return 0;const ke=Math.LN2/half,ka=absorption(half);return dose*ka/(ka-ke)*(Math.exp(-ke*hours)-Math.exp(-ka*hours));}
export function total(entries,at,half){return entries.reduce((s,e)=>s+remaining(e.dose,(at-e.at)/HOUR,half),0);}
export function localDate(t=Date.now()){const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function clock(t){return new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});}
