// Small, transparent scheduler. This is not Anki's FSRS algorithm.
export const MINUTE = 60_000, DAY = 86_400_000;
export const ratings = ['Again','Hard','Good','Easy'];
export function review(prev, rating, now=Date.now()) {
  const old = prev ?? {reviews:0, interval:0, lapses:0};
  const interval = old.interval || 0;
  let next = 0, wait = 0;
  if (rating === 0) { wait=10*MINUTE; }
  else if (rating === 1) { next=interval?Math.max(1,Math.ceil(interval*1.2)):0; wait=next?next*DAY:30*MINUTE; }
  else if (rating === 2) { next=interval?Math.max(interval+1,Math.round(interval*2)):1; wait=next*DAY; }
  else if (rating === 3) { next=interval?Math.max(interval+2,Math.round(interval*3)):4; wait=next*DAY; }
  else throw new RangeError('Invalid rating');
  if (next>365) {next=365;wait=next*DAY;}
  return {reviews:old.reviews+1,interval:next,lapses:old.lapses+Number(rating===0),due:now+wait,last:now};
}
export function duration(ms) {
  if(ms>=DAY)return Math.round(ms/DAY)+'d';
  if(ms>=60*MINUTE)return Math.round(ms/(60*MINUTE))+'h';
  return Math.max(1,Math.ceil(ms/MINUTE))+' min';
}
export function dayKey(date=new Date()) {
  return [date.getFullYear(),date.getMonth()+1,date.getDate()].map((v,i)=>i?String(v).padStart(2,'0'):String(v)).join('-');
}
export function queue(deck, progress, { now=Date.now(), fresh=8, limit=25, preview=false, topic=null }={}) {
  const available=topic?deck.filter(c=>c.topic===topic):deck;
  const due=[], unseen=[], later=[];
  for(const card of available){
    const p=progress[card.id];
    if(!p)unseen.push(card);
    else if(p.due<=now)due.push(card);
    else later.push(card);
  }
  due.sort((a,b)=>progress[a.id].due-progress[b.id].due);
  const groups=new Map();
  for(const c of unseen){
    if(!groups.has(c.topic))groups.set(c.topic,[]);
    groups.get(c.topic).push(c);
  }
  const mix=[];
  while(groups.size)for(const [id, group] of groups){
    mix.push(group.shift());
    if(!group.length)groups.delete(id);
  }
  return (preview?[...due,...mix,...later]:[...due,...mix.slice(0,fresh)]).slice(0,limit);
}
