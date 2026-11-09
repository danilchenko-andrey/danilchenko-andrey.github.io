export const names={caramello:'Caramello',vanilla:'Vaniglia Decaffeinato',flatwhite:'Flat white'};
export const defaults={half:5,bed:'23:00',target:20,caramello:60,vanilla:3,flatwhite:130};
// Add new presets without rewriting historical cup doses or existing preferences.
// Both the original export format and the extended format remain valid.
export function normalizeState(x){
 const s=x?.settings;
 const dose=v=>Number.isFinite(v)&&v>=0&&v<=500;
 if(!s||!Number.isFinite(s.half)||s.half<2||s.half>12||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.bed)||![s.target,s.caramello,s.vanilla].every(dose)||(s.flatwhite!==undefined&&!dose(s.flatwhite))||!Array.isArray(x.entries)||x.entries.length>=100000)return null;
 if(!x.entries.every(e=>e&&typeof e.id==='string'&&Object.hasOwn(names,e.type)&&Number.isFinite(e.at)&&e.at>0&&e.at<4102444800000&&dose(e.dose)))return null;
 return {...x,settings:{...defaults,...s},entries:x.entries};
}
