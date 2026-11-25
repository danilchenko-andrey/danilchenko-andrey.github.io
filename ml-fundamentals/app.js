import {cards,topics} from './cards.js';
import {ratings,review,duration,dayKey,queue} from './scheduler.js';

import {byLesson, lessonLength, coldProgress, suggested, createLearningView} from './learn.js?v=learn1';

const app=document.querySelector('#app'), file=document.querySelector('#restore'), toast=document.querySelector('#toast');
const tabs=[...document.querySelectorAll('[data-tab]')];
const KEY='ml-recall:v1';
const clean=()=>({version:1,progress:{},custom:[],days:{},lessons:{}});
let saved=true,state=clean();
try{const raw=localStorage.getItem(KEY);if(raw)state=validated(JSON.parse(raw));}catch{saved=false;}
let session=null,tab='today',topic=null,filter='',adding=false,timer,lessonId=null,selection=null;
const topicsById=new Map(topics.map(t=>[t.id,t]));
const deck=()=>[...cards,...state.custom];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const elapsed=(x)=>duration(x-Date.now());
const desc=(label,ttl,subtitle)=>'<div class="intro"><p class="kicker">'+label+'</p><h1>'+ttl+'</h1><p>'+subtitle+'</p></div>';
const button=(label,action,type='ghost')=>'<button type="button" class="button '+type+'" data-action="'+action+'">'+label+'</button>';
const cap=(id)=>topicsById.get(id)?.title??'Mixed practice';
const learnView=createLearningView({esc,button,desc,cap});
const daily=()=>state.days[dayKey()]??{new:0,ratings:0};
const pendingNew=()=>Math.max(0,8-daily().new);
const stat=(value,label)=>'<div class="metric"><strong>'+value+'</strong><span>'+label+'</span></div>';
const listFilter=()=>deck().filter(c=>(!topic||c.topic===topic) && (!filter || (c.q+' '+c.a).toLowerCase().includes(filter.toLowerCase())));
const queueNow=(topic=null)=>queue(deck(),state.progress,{fresh:topic?8:pendingNew(),topic});
function canAdd(text,max){return typeof text==='string'&&text.trim()&&text.length<=max;}
function validated(data){
  if(!data||data.version!==1||!Array.isArray(data.custom)||!data.progress||!data.days)throw Error('Invalid backup format');
  const out=clean(), ids=new Set(cards.map(c=>c.id));
  for(const c of data.custom.slice(0,500)){
    if(!c||!/^own-[a-z0-9-]+$/.test(c.id)||ids.has(c.id)||!topics.some(t=>t.id===c.topic)||!canAdd(c.q,300)||!canAdd(c.a,1100))continue;
    ids.add(c.id);
    out.custom.push({id:c.id,topic:c.topic,q:c.q,a:c.a,follow:'',check:''});
  }
  const number=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
  for(const [id,p] of Object.entries(data.progress)){
    if(ids.has(id)&&p&&number(p.reviews,100000)&&p.reviews>0&&number(p.interval,365)&&number(p.lapses,p.reviews)&&number(p.due,8640000000000000)&&number(p.last,p.due)){
      out.progress[id]={reviews:p.reviews,interval:p.interval,lapses:p.lapses,due:p.due,last:p.last};
    }
  }
  for(const [day,v] of Object.entries(data.days)){
    if(/^\d{4}-\d\d-\d\d$/.test(day)&&v&&number(v.ratings,100000)&&number(v.new,v.ratings)){out.days[day]={ratings:v.ratings,new:v.new};}
  }
  for(const [id,p] of Object.entries(data.lessons??{})){
    const l=byLesson.get(id);
    if(l&&p&&number(p.step,lessonLength(l)-1)&&typeof p.done==='boolean'){
      out.lessons[id]={step:p.step,done:p.done};
    }
  }
  return out;
}
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state));saved=true;}catch{saved=false;notice('Storage is unavailable. Export a backup to keep your progress.');}
}
function notice(s){toast.textContent=s;toast.hidden=false;clearTimeout(timer);timer=setTimeout(()=>toast.hidden=true,4100);}
function countNow(id=null){const ds=id?deck().filter(c=>c.topic===id):deck(),now=Date.now();return ds.reduce((n,c)=>{const p=state.progress[c.id];n.total++;if(!p)n.fresh++;else{n.seen++;if(p.due<=now)n.due++;if(p.interval>=7)n.familiar++;}return n;},{total:0,fresh:0,seen:0,due:0,familiar:0});}
function nextDue(){
  const future=Object.values(state.progress).map(p=>p.due).filter(d=>d>Date.now());
  return future.length?'<p class="quiet small">Next review in '+elapsed(Math.min(...future))+'.</p>':'';
}
function writableBanner(){return saved?'':'<p class="restore-notice surface small">This device is not saving progress. Use Export backup in Progress.</p>';}
function listTopics(collection=topics){return '<div class="topic-list">'+collection.map((t)=>{
  const a=countNow(t.id), i=topics.indexOf(t)+1;
  return '<button type="button" class="topic" data-action="topic" data-id="'+esc(t.id)+'"><span class="badge" aria-hidden="true">'+String(i).padStart(2,'0')+'</span><span><strong>'+esc(t.title)+'</strong><small>'+esc(t.description)+'</small></span><span class="topic-count" aria-label="'+a.seen+' of '+a.total+' studied">'+a.seen+'/'+a.total+'</span></button>';
}).join('')+'</div>';}
function today(){
 const counts=countNow(), ready=queueNow(), day=daily(), next=suggested(state.lessons);
 const warmup=next?'<section class="hero learn-hero"><p class="kicker">'+(state.lessons[next.id]?.step?'Continue learning':'Start with a lesson')+'</p><h2>'+esc(next.title)+'</h2><p class="muted">'+esc(next.description)+'</p>'+
 button(state.lessons[next.id]?.step?'Resume lesson':'Continue learning','learn-recommended','block')+'</section>':'';
 return desc('Machine learning','Review, then recall.','Warm up with a short lesson before you answer interview questions.')+
 warmup+
 '<section class="'+(next?'section surface':'hero')+'"><p class="kicker">Spaced repetition</p><h2>'+ (ready.length?ready.length+' '+(ready.length===1?'card':'cards')+' ready':'You’re caught up')+'</h2><p class="muted goal-line">'+
 (ready.length?'Already know the basics? Review cards that are due or try a few new ones.':'Nothing scheduled right now. Rehearse a topic while you wait.')+'</p>'+
 '<div class="lesson-buttons">'+(session&&!session.finished?button('Resume card review','resume','primary block'):ready.length?button('Review cards','study','secondary block'):button('Browse topics','go-topics','secondary block'))+'</div></section>'+
 '<div class="tally">'+stat(counts.due,'Due now')+stat(counts.fresh,'Unseen')+stat(day.ratings,'Rated today')+'</div>'+nextDue()+
 '<section class="section"><div class="section-title"><h2>Pick a topic</h2><button type="button" class="plain" data-action="go-topics">View all →</button></div>'+listTopics(topics.slice(0,3))+'</section>'+writableBanner();
}
function activeLesson(){return lessonId&&byLesson.get(lessonId);}
function lessonState(l){return state.lessons[l.id]??coldProgress();}
function openLesson(id){
 if(!byLesson.has(id))return;
 studying=false;tab='learn';lessonId=id;selection=null;render(true);
}
function lessonAction(action,choice){
 const l=activeLesson();if(!l)return;
 const p=lessonState(l), beforeQuiz=l.steps.length+1, q=l.quiz[p.step-beforeQuiz];
 if(action==='lesson-pick'){
   if(!q||p.done||selection===q.answer||!Number.isInteger(choice)||choice<0||choice>=q.options.length)return;
   selection=choice;render();document.querySelector('.lesson-feedback')?.scrollIntoView({block:'nearest'});return;
 }
 let next;
 if(action==='repeat-lesson'){next=coldProgress();}
 else if(action==='lesson-back'&&!p.done&&p.step>0){next={step:p.step-1,done:false};}
 else if(action==='lesson-forward'&&!p.done&&(!q||selection===q.answer)){
   next=p.step===lessonLength(l)-1?{step:p.step,done:true}:{step:p.step+1,done:false};
 }else return;
 state.lessons[l.id]=next;selection=null;persist();render(true);
}
function lessonCards(){
 const l=activeLesson();if(!l)return;
 if(session&&!session.finished&&!session.preview&&!confirm('Pause the current card review and start this rehearsal? The ratings you’ve given are saved.'))return;
 const selected=(l.cards??[]).map(id=>cards.find(c=>c.id===id)).filter(Boolean);
 const items=selected.length?selected:deck().filter(c=>c.topic===l.topic).slice(0,3);
 if(!items.length)return;
 session={items,index:0,reveal:false,finished:false,preview:true,topic:l.topic,answers:[0,0,0,0]};
 studying=true;render(true);
}
function topicsView(){
 if(adding)return addView();
 if(!topic)return desc('The deck','Topics',deck().length+' cards across '+topics.length+' topics.')+listTopics()+ '<div class="toolbar">'+button('Add my own card','add','secondary')+'</div>';
 const t=topicsById.get(topic), a=countNow(topic), selected=listFilter();
 return '<button type="button" class="plain" data-action="go-topics">← All topics</button>'+desc('Topic',esc(t.title),esc(t.description))+
 '<div class="surface"><p><strong>'+a.seen+' of '+a.total+'</strong> cards studied · '+a.due+' due</p><progress class="meter goal-line" value="'+a.seen+'" max="'+Math.max(1,a.total)+'" aria-label="Cards studied"></progress><div class="topic-actions">'+
 (queueNow(topic).length?button('Review due & new','topic-study','primary'):'')+button('Practice all (no schedule changes)','practice','secondary')+'</div></div>'+
 '<div class="section"><div class="section-title"><h2>Browse cards</h2><button type="button" class="plain" data-action="add">+ Add card</button></div>'+
 '<div class="search-form"><input class="search" type="search" id="search" aria-label="Search this topic" value="'+esc(filter)+'" placeholder="Search this topic"></div><div id="listing">'+listing(selected)+'</div></div>';
}
function listing(selected){
 return selected.length?selected.map(c=>'<details class="surface listing"><summary>'+esc(c.q)+'</summary><p>'+esc(c.a)+'</p><p class="small muted">'+(state.progress[c.id]?(state.progress[c.id].due<=Date.now()?'Due now':'Due in '+elapsed(state.progress[c.id].due)):'Unseen')+(c.id.startsWith('own-')?' · Your card':'')+'</p></details>').join(''):'<p class="muted">No matching cards.</p>';
}
function addView(){
 return '<button type="button" class="plain" data-action="cancel-add">← Back to topics</button>'+desc('Build your deck','Add a card','Turn a missed question into one short recall prompt.')+
 '<form id="add-form" class="surface"><label class="field">Topic<select name="topic">'+topics.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===topic?'selected':'')+'>'+esc(t.title)+'</option>').join('')+'</select></label><label class="field">Prompt<textarea name="q" required maxlength="300" placeholder="What would you ask yourself?"></textarea></label><label class="field">Answer<textarea name="a" required maxlength="1100" placeholder="One idea, with the reason or trade-off."></textarea></label><button type="submit" class="button primary block">Save card</button></form>';
}
function progress(){
 const n=countNow(),days=Object.keys(state.days).filter(d=>state.days[d].ratings>0);
 return desc('Your study history','Progress','A card counts as studied after its first rating.')+
 '<div class="surface"><h2>'+Object.values(state.lessons).filter(x=>x.done).length+' / '+byLesson.size+' lessons complete</h2><p class="small muted">Lesson steps are saved as you go.</p></div>'+
 '<div class="surface"><h2>'+n.seen+' of '+n.total+' studied</h2><progress class="meter goal-line" value="'+n.seen+'" max="'+Math.max(1,n.total)+'" aria-label="Overall progress"></progress><p class="small muted">'+n.familiar+' with a review interval of 7+ days · '+days.length+' study '+(days.length===1?'day':'days')+'</p></div>'+
 '<section class="section"><div class="section-title"><h2>By topic</h2></div>'+listTopics()+'</section>'+
 '<section class="section surface"><h2>Backup &amp; restore</h2><p class="muted small goal-line">Lesson progress, card ratings, and personal cards stay in this app on this device. Export before reinstalling or switching devices. Restoring replaces your current data.</p><div class="backup">'+button('Export backup','export','secondary')+button('Restore backup','restore')+'</div></section>'+
 '<section class="section surface instructions"><h2>How to study</h2><ol><li>Say your answer first: give the mechanism, an example, or the trade-off in about 30 seconds.</li><li>Reveal, try the follow-up, then grade what you could recall unaided.</li><li>Pick Again if you missed the key idea, Hard if you struggled, Good if it was solid, or Easy if it was immediate.</li><li>After a mock interview, make a card for a question you missed.</li></ol><p class="small muted">The cards are original. Practice is inspired by Boris Tseytlin’s technical interview guide and his use of spaced repetition. The scheduling rules are simpler than Anki’s.</p><a class="source-link" href="https://btseytlin.github.io/parts/3_interviewing/technical_interview.html">Boris Tseytlin’s interview guide</a><a class="source-link" href="https://t.me/s/boris_again?before=307">Boris Again on spaced repetition</a></section>'+
 '<section class="section surface"><h2>Install on iPhone</h2><p class="goal-line">Open this page in Safari, tap Share, then Add to Home Screen. Leave Open as Web App on if Safari shows it. Open ML Recall from its icon once while online to enable offline use.</p></section>'+writableBanner();
}
function start(preview=false,t=null){
 const items=preview?queue(deck(),state.progress,{preview:true,topic:t,limit:Infinity}):queueNow(t);
 if(!items.length){studying=false;render();notice('No cards are ready.');return;}
 session={items,index:0,reveal:false,finished:false,preview,topic:t,answers:[0,0,0,0]};
 render(true);
}
function renderSession(){
 const s=session,c=s.items[s.index];
 if(s.finished){
  return desc(s.preview?'Rehearsal complete':'Review complete','Nice work.',s.preview?'Practice did not change your review schedule.':'Your review schedule is up to date.')+
  '<div class="surface"><h2>'+s.items.length+' cards '+(s.preview?'practiced':'rated')+'</h2>'+
  (s.preview?'':'<p class="muted">'+s.answers.map((v,i)=>v+' '+ratings[i]).join(' · ')+'</p>')+nextDue()+
  '<div class="toolbar">'+button('Done','end','primary')+'</div></div>'+writableBanner();
 }
 const p=state.progress[c.id], now=Date.now(), type=c.kind==='cloze'||c.q.includes('[…]')?'Fill the blank':'Explain out loud';
 return '<div class="study-top"><button type="button" class="plain" data-action="pause">← '+(s.preview?'Exit practice':'Pause')+'</button><p class="muted small session-meta">'+(s.index+1)+' / '+s.items.length+'</p></div>'+
 '<progress class="meter" aria-label="Session progress" value="'+s.index+'" max="'+s.items.length+'"></progress>'+
 '<div class="stack surface card"><div class="card-top"><span class="pill">'+esc(cap(c.topic))+'</span><span class="small muted">'+(s.preview?'Practice':p?'Review':'New')+'</span></div>'+
 '<h1 class="question" id="prompt" tabindex="-1">'+esc(c.q)+'</h1>'+
 '<p class="muted small">'+type+' · aim for 30 seconds</p>'+
 (s.reveal?'<div class="answer" id="answer" tabindex="-1"><div class="kicker">Answer</div><p>'+esc(c.a)+'</p>'+
 (c.follow?'<details class="follow"><summary>Interviewer follow-up<small>'+esc(c.follow)+'</small></summary><p>'+esc(c.check)+'</p></details>':'')+'</div>':'')+'</div>'+
 '<div class="controls">'+(!s.reveal?button('Show answer','reveal','primary block'):s.preview?button('Next card','advance','primary block'):
 '<div class="ratings">'+ratings.map((label,i)=>'<button type="button" class="button ghost '+label.toLowerCase()+'" data-action="rate" data-id="'+i+'">'+label+'<small>'+duration(review(p,i,now).due-now)+'</small></button>').join('')+'</div><p class="quiet small">Rate the main answer, not the follow-up.</p>')+'</div>';
}
let studying=false;
function render(move=false){
 tabs.forEach(b=>b.toggleAttribute('disabled',studying));
 tabs.forEach(b=>b.dataset.tab===tab?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
 app.innerHTML=studying&&session?renderSession():tab==='today'?today():tab==='learn'?(activeLesson()?learnView.lesson(activeLesson(),lessonState(activeLesson()),selection):learnView.path(state.lessons)):tab==='topics'?topicsView():progress();
 if(move){window.scrollTo(0,0);(document.querySelector('#prompt,#lesson-heading')??app).focus({preventScroll:true});}
}
function navigate(t,id=null){studying=false;tab=t;topic=id;filter='';adding=false;lessonId=null;selection=null;render(true);}
function advance(){
 session.index++;
 session.reveal=false;
 if(session.index>=session.items.length)session.finished=true;
 render(true);
}
function grade(r){
 if(!studying||!session||session.preview||!session.reveal||session.finished)return;
 const c=session.items[session.index],p=state.progress[c.id],d=dayKey(),day=daily();
 state.progress[c.id]=review(p,r);
 state.days[d]={ratings:day.ratings+1,new:day.new+Number(!p)};
 session.answers[r]++;
 persist();advance();
}
function exportBackup(){
 const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='ml-recall-'+dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function reveal(){if(!session||session.finished||session.reveal)return;session.reveal=true;render();document.querySelector('#answer')?.focus({preventScroll:true});}
function startOrResume(preview=false,t=null){
 if(session&&!session.finished&&!session.preview){
   if(!preview&&t===session.topic){studying=true;render(true);return;}
   if(!confirm('Start a different session? Any ratings you’ve already given are saved.'))return;
 }
 studying=true;start(preview,t);
 if(!session){studying=false;render();}
}
app.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 switch(b.dataset.action){
  case 'learn-recommended':{const next=suggested(state.lessons);if(next)openLesson(next.id);break;}
  case 'open-lesson':openLesson(b.dataset.id);break;
  case 'learn-path':navigate('learn');break;
  case 'learn-next-unit':{const ids=[...byLesson.keys()];const next=ids[ids.indexOf(lessonId)+1];if(next)openLesson(next);else navigate('learn');break;}
  case 'lesson-pick':case 'lesson-back':case 'lesson-forward':case 'repeat-lesson':lessonAction(b.dataset.action,Number(b.dataset.id));break;
  case 'lesson-cards':lessonCards();break;
  case 'go-topics':navigate('topics');break;
  case 'topic':navigate('topics',b.dataset.id);break;
  case 'add':adding=true;render(true);break;
  case 'cancel-add':adding=false;render(true);break;
  case 'study':startOrResume();break;
  case 'topic-study':startOrResume(false,topic);break;
  case 'practice':startOrResume(true,topic);break;
  case 'resume':studying=true;render(true);break;
  case 'pause':if(session?.preview)session=null;studying=false;render(true);break;
  case 'end':session=null;studying=false;render(true);break;
  case 'reveal':reveal();break;
  case 'rate':grade(Number(b.dataset.id));break;
  case 'advance':advance();break;
  case 'export':exportBackup();break;
  case 'restore':file.click();break;
 }
});
tabs.forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.tab)));
app.addEventListener('input',e=>{if(e.target.id==='search'){filter=e.target.value.trim();document.querySelector('#listing').innerHTML=listing(listFilter());}});
app.addEventListener('submit',e=>{
 if(e.target.id!=='add-form')return;
 e.preventDefault(); const data=new FormData(e.target), q=data.get('q').trim(),a=data.get('a').trim();
 if(!q||!a){notice('Enter a prompt and an answer.');return;}
 if(state.custom.length>=500){notice('You can add up to 500 personal cards.');return;}
 topic=data.get('topic');
 state.custom.push({id:'own-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+Math.random().toString(36).slice(2)),topic,q,a,follow:'',check:''});
 persist();adding=false;filter='';render(true);if(saved)notice('Card saved.');
});
file.addEventListener('change',async()=>{
 const f=file.files[0];file.value='';if(!f)return;
 try{
   if(f.size>3_000_000)throw Error('Too large');
   const restored=validated(JSON.parse(await f.text()));
   if(!confirm('Replace current progress and personal cards with this backup?'))return;
   state=restored;session=null;persist();navigate('progress');if(saved)notice('Backup restored.');
 }catch{notice('Could not read this ML Recall backup.');}
});
document.addEventListener('keydown',e=>{
 if(!studying||session?.finished||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.target.closest('button,summary,a,input,textarea,select'))return;
 if(!session.reveal&&e.code==='Space'){e.preventDefault();reveal();}
 else if(session.reveal&&!session.preview&&/^[1-4]$/.test(e.key)){e.preventDefault();grade(Number(e.key)-1);}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!studying&&!adding&&tab!=='learn'&&document.activeElement?.id!=='search')render();});
render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
