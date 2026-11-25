import {lessons} from './lessons.js';

export const byLesson=new Map(lessons.map(l=>[l.id,l]));
export const lessonLength=l=>l.steps.length+1+l.quiz.length;
export const coldProgress=()=>({step:0,done:false});
export const suggested=(progress)=>lessons.find(l=>progress[l.id]?.step&&!progress[l.id].done)??lessons.find(l=>!progress[l.id]?.done)??null;

export function createLearningView({esc,button,desc,cap}){
  const path=(progress)=>{
    const n=lessons.filter(l=>progress[l.id]?.done).length;
    const next=suggested(progress);
    const rows=lessons.map((l,i)=>{
      const p=progress[l.id], finished=p?.done;
      const group=i===0?'Classical ML':l.id==='bayes-and-likelihood'?'Probability and experiments':l.id==='backprop-and-sgd'?'Deep learning and transformers':null;
      const divider=group?'<h2 class="path-label">'+group+'</h2>':'';
      const tone=finished?' done':l.id===next?.id?' next':'';
      const status=finished?'Complete':p?.step?'In progress':l.id===next?.id?'Up next':'2–4 min';
      return divider+'<button type="button" class="lesson-link'+tone+'" data-action="open-lesson" data-id="'+esc(l.id)+'"><span class="badge" aria-hidden="true">'+(finished?'✓':String(i+1).padStart(2,'0'))+'</span><span><strong>'+esc(l.title)+'</strong><small>'+esc(l.description)+'</small></span><span class="lesson-status">'+status+'</span></button>';
    }).join('');
    return desc('ML foundations','Learning path','Review the idea, see it in action, then check what you remember.')+
      '<div class="surface path-total"><span><strong>'+n+' / '+lessons.length+'</strong> lessons complete</span><progress class="meter" max="'+lessons.length+'" value="'+n+'" aria-label="Lessons complete"></progress></div>'+
      '<div class="lesson-list">'+rows+'</div>'+
      '<section class="section surface"><h2>Where the path comes from</h2><p class="goal-line muted">The classical ML sequence is based on Evgeny Sokolov’s HSE course; later lessons add statistics, neural networks and transformers. Lessons are written in English, with optional English readings for a deeper refresher.</p><a class="source-link" href="https://www.statlearning.com/">An Introduction to Statistical Learning with Applications in Python</a><a class="source-link" href="https://see.stanford.edu/Course/CS229">Stanford CS229 · public course materials</a><a class="source-link" href="https://d2l.ai/">Dive into Deep Learning</a><a class="source-link" href="https://github.com/esokolov/ml-course-hse">HSE course outline (original in Russian)</a></section>';
  };
  const lesson=(l,p,selection)=>{
    const n=lessonLength(l), i=p.step, example=l.steps.length;
    const heading='<div class="study-top"><button class="plain" type="button" data-action="learn-path">← Learning path</button><p class="small muted session-meta">'+(p.done?'Lesson complete':(i+1)+' / '+n)+'</p></div>'+
      '<progress class="meter" value="'+(p.done?n:i+1)+'" max="'+n+'" aria-label="Lesson progress"></progress>';
    if(p.done){
      return heading+'<section class="stack surface card lesson-card"><p class="kicker">Concept checked</p><h1 class="question">'+esc(l.title)+'</h1><p class="muted">Now try explaining the idea without looking. The follow-up is optional if you want a second challenge.</p><div class="lesson-buttons">'+button('Try interview cards','lesson-cards','primary block')+button('Next lesson','learn-next-unit','secondary block')+'</div></section>'+
      '<div class="toolbar">'+button('Repeat lesson','repeat-lesson')+'</div>'+sourceList(l);
    }
    const back=i>0?'<button type="button" class="plain" data-action="lesson-back">← Previous step</button>':'';
    let body;
    if(i<=example){
      const s=i===example?l.example:l.steps[i], label=i===example?'Worked example':'Concept';
      body='<p class="kicker">'+label+'</p><p class="small muted">'+esc(l.title)+'</p>'+
       '<h1 class="question" id="lesson-heading" tabindex="-1">'+esc(s.heading)+'</h1><p class="lesson-copy">'+esc(s.text)+'</p>'+
       (i===0?'<p class="lesson-why"><strong>Why it matters</strong><br>'+esc(l.why)+'</p>':'')+
       '<div class="lesson-buttons">'+button(i===example?'Try a quick check':'Continue','lesson-forward','primary block')+'</div>';
    }else{
      const q=l.quiz[i-example-1], won=selection===q.answer, tried=selection!==null;
      body='<p class="kicker">Quick check '+(i-example)+' / '+l.quiz.length+'</p><h1 class="question" id="lesson-heading" tabindex="-1">'+esc(q.question)+'</h1>'+
        '<div class="option-list">'+q.options.map((o,j)=>'<button type="button" class="option'+(j===selection?(won?' correct':' wrong'):'')+'" data-action="lesson-pick" data-id="'+j+'"'+(won?' disabled':'')+' aria-pressed="'+(j===selection)+'"><span aria-hidden="true">'+String.fromCharCode(65+j)+'</span>'+esc(o)+'</button>').join('')+'</div>'+
        (tried?'<div role="status" class="lesson-feedback '+(won?'right':'retry')+'"><strong>'+(won?'That’s right.':'Not quite. Try another answer.')+'</strong><p>'+esc(q.explanation)+'</p></div>':'')+
        (won?'<div class="lesson-buttons">'+button(i===n-1?'Finish lesson':'Continue','lesson-forward','primary block')+'</div>':'');
    }
    return heading+'<section class="stack surface card lesson-card">'+body+'</section><div class="toolbar">'+back+'</div>'+sourceList(l);
  };
  function sourceList(l){return '<details class="surface section"><summary class="small">Further reading in English</summary>'+l.sources.map(s=>'<a class="source-link" target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.title)+'</a>').join('')+'</details>';}
  return {path,lesson};
}
