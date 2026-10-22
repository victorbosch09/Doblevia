// ═══════════ LESSON ═══════════
let LS=null;
function startLesson(tid,at){
  const t=DV.T[tid];
  const steps=[{k:'intro'},...t.sections.map(s=>({k:'sec',s})),{k:'sum'}];
  let i=at??0;
  const p=P.t[tid];
  if(at==null&&p&&!p.l&&p.ls>0&&p.ls<steps.length)i=p.ls;
  LS={tid,steps,i};
  go('lesson');renderLesson();
  if(i>0)toast('📍 Retomando donde lo dejaste');
}
function renderLesson(){
  stopSpeak();
  const t=DV.T[LS.tid],st=LS.steps[LS.i],n=LS.steps.length,last=LS.i===n-1;
  let body='';
  if(st.k==='intro'){
    body=`<div class="lstep-n">${t.mod} · ${esc(DV.subject(t.career,t.sid).name)}</div>
    <h2>${t.emoji} ${esc(t.title)}</h2>
    <div class="lbody"><p>En esta lección vas a aprender a:</p><ul class="goals" style="margin:0">${t.goals.map(g=>`<li>🎯 <span>${g}</span></li>`).join('')}</ul>
    <p class="tx2 f14 mt16">⏱ ${Math.max(3,t.sections.length*2)} min aprox · ${t.sections.length} partes · luego practicarás y presentarás el examen.</p></div>`;
  }else if(st.k==='sec'){
    const s=st.s;
    body=`<div class="lstep-n">Parte ${LS.i} de ${n-2}</div><h2>${s.h}</h2><div class="lbody">${s.b}</div>
    ${s.ex?`<div class="callout ex"><span class="ci">📌</span><div><b>Ejemplo:</b> ${s.ex}</div></div>`:''}
    ${s.tip?`<div class="callout tip"><span class="ci">💡</span><div>${s.tip}</div></div>`:''}
    ${s.mem?`<div class="callout mem"><span class="ci">🧠</span><div><b>Truco para recordar:</b> ${s.mem}</div></div>`:''}
    ${checkQ(t,LS.i)}`;
  }else{
    body=`<div class="lstep-n">Resumen</div><h2>Conceptos clave</h2>
    <div class="terms">${t.terms.map(([a,b])=>`<div class="term"><b>${a}</b>${b}</div>`).join('')}</div>
    <div class="callout ex mt16"><span class="ci">🚀</span><div>¡Lección completada! Ahora consolida lo aprendido con la <b>práctica</b>: ejercicios con explicación de cada respuesta.</div></div>`;
  }
  $('s-lesson').innerHTML=`
  <div class="lhead"><button class="xbtn" onclick="exitImmersive()" title="Salir (Esc)">✕</button>
    <div class="lprog"><i style="width:${(LS.i+1)/n*100}%"></i></div>
    <button class="xbtn" onclick="toggleSpeak()" title="Escuchar">🔊</button></div>
  <div class="lcard" id="lcard">${body}</div>
  <div class="lnav">
    <button class="btn btn-g" onclick="lessonNav(-1)" ${LS.i===0?'disabled':''}>← Anterior</button>
    ${last?`<button class="btn btn-ok" onclick="finishLesson(true)">Practicar ✏️</button>`:`<button class="btn btn-p" onclick="lessonNav(1)">${LS.i===0?'Empezar':'Siguiente'} →</button>`}
  </div>
  ${last?`<div class="center mt12"><button class="btn-link" onclick="finishLesson(false)">Terminar sin practicar</button></div>`:''}
  <div class="center f12 tx3 mt16 hide-m"><span class="kbd">←</span> <span class="kbd">→</span> navegar · <span class="kbd">Esc</span> salir</div>`;
}
function checkQ(t,i){
  const q=t.quiz.filter(x=>x.t==='tf')[i-1];
  if(!q)return'';
  return`<div class="check-q"><div class="label mb8">✋ Comprueba tu comprensión</div><div class="f14 mb8">${q.q}</div>
  <div class="row"><button class="btn btn-g btn-sm" onclick="ckAns(this,${q.a===true},'${q.id}')">Verdadero</button><button class="btn btn-g btn-sm" onclick="ckAns(this,${q.a===false},'${q.id}')">Falso</button></div><div class="f13 mt8" id="ck-fb"></div></div>`;
}
function ckAns(btn,ok,qid){
  const fb=$('ck-fb');btn.parentElement.querySelectorAll('button').forEach(b=>b.disabled=true);
  btn.classList.remove('btn-g');btn.classList.add(ok?'btn-ok':'btn-err');
  fb.innerHTML=(ok?'<b style="color:var(--ok)">¡Correcto!</b> ':'<b style="color:var(--err)">No exactamente.</b> ')+DV.Q[qid].e;
}
function lessonNav(d){
  LS.i=Math.max(0,Math.min(LS.steps.length-1,LS.i+d));
  const p=TP(LS.tid);if(!p.l)p.ls=Math.max(p.ls||0,LS.i);save();
  renderLesson();window.scrollTo(0,0);
}
function finishLesson(practice){
  stopSpeak();
  const p=TP(LS.tid),first=!p.l;p.l=1;p.ls=0;
  P.hist.unshift({d:Date.now(),k:'lesson',id:LS.tid});
  addXP(first?10:2);
  if(first)toast('📖 Lección completada · +10 XP');
  if(practice)startQuiz('practice',LS.tid);else{go('subject',DV.T[LS.tid].sid,true);}
}

// ═══════════ SPEECH ═══════════
function toggleSpeak(){
  if(!('speechSynthesis' in window)){toast('Tu navegador no soporta lectura en voz alta');return;}
  if(speechSynthesis.speaking){stopSpeak();return;}
  const u=new SpeechSynthesisUtterance(strip($('lcard').innerHTML.replace(/<\/(p|li|h2|div)>/g,'. ')));
  u.lang='es-ES';u.rate=1;speechSynthesis.speak(u);
}
function stopSpeak(){try{speechSynthesis.cancel();}catch(e){}}

// ═══════════ QUIZ BUILDERS ═══════════
function mkItem(q){
  if(q.t==='tf')return{src:q.id,t:'tf',q:q.q,opts:[{txt:'Verdadero',ok:q.a===true},{txt:'Falso',ok:q.a===false}],e:q.e};
  return{src:q.id,t:'mc',q:q.q,opts:shuffle(q.o.map((txt,i)=>({txt,ok:i===0}))),e:q.e};
}
function termItem(t,pool){
  const [term,def]=t.terms[Math.floor(Math.random()*t.terms.length)];
  const others=shuffle(pool.filter(x=>x[0]!==term)).slice(0,3);
  if(Math.random()<.5)return{t:'mc',kind:'Concepto',q:`¿Qué concepto se define así?<br><span style="font-weight:500;font-size:.85em">"${def}"</span>`,opts:shuffle([{txt:term,ok:true},...others.map(o=>({txt:o[0],ok:false}))]),e:`<b>${term}</b>: ${def}`};
  return{t:'mc',kind:'Definición',q:`¿Cuál es la definición correcta de <b>${term}</b>?`,opts:shuffle([{txt:def,ok:true},...others.map(o=>({txt:o[1],ok:false}))]),e:`<b>${term}</b>: ${def}`};
}
function matchItem(terms){const pairs=shuffle(terms).slice(0,4);return{t:'match',pairs,q:'Une cada concepto con su definición'};}
function subjTermPool(c,sid){return DV.subject(c,sid).topics.flatMap(t=>t.terms);}

let QZ=null;
function startQuiz(mode,id){
  let items=[],title='',fb=true;
  if(mode==='practice'){
    const t=DV.T[id],pool=subjTermPool(t.career,t.sid);
    items=shuffle(t.quiz).slice(0,7).map(mkItem);
    items.splice(3,0,termItem(t,pool));
    if(t.terms.length>=4)items.splice(6,0,matchItem(t.terms));
    title='Práctica · '+t.title;
  }else if(mode==='exam'){
    const t=DV.T[id],pool=subjTermPool(t.career,t.sid);
    items=[...t.quiz.map(mkItem),termItem(t,pool),termItem(t,pool)];
    items=shuffle(items);fb=false;title='Examen · '+t.title;
  }else if(mode==='final'){
    const s=DV.subject(P.career,id),pool=subjTermPool(P.career,id);
    s.topics.forEach(t=>{shuffle(t.quiz).slice(0,2).forEach(q=>items.push(mkItem(q)));items.push(termItem(t,pool));});
    items=shuffle(items).slice(0,20);fb=false;title='Examen final · '+s.name;
  }else if(mode==='mistakes'){
    items=shuffle(Object.keys(P.mist).filter(q=>DV.Q[q]&&DV.T[DV.Q[q].tid].career===P.career)).slice(0,12).map(q=>mkItem(DV.Q[q]));
    title='Corrige tus errores';
  }else if(mode==='mixed'){
    const ts=DV.careers[P.career].subjects.flatMap(s=>s.topics).filter(t=>P.t[t.id]?.l);
    ts.forEach(t=>shuffle(t.quiz).slice(0,2).forEach(q=>items.push(mkItem(q))));
    items=shuffle(items).slice(0,12);title='Práctica mixta';
  }
  if(!items.length){toast('No hay preguntas disponibles todavía');return;}
  QZ={mode,id,title,fb,items,i:0,base:items.length,correct:0,combo:0,maxCombo:0,log:[],start:Date.now(),sel:null,checked:false,retried:new Set(),match:null};
  go('quiz');renderQ();
  clearInterval(QZ._tm);QZ._tm=setInterval(()=>{const el=$('qtimer');if(!el||!QZ)return;const s=Math.floor((Date.now()-QZ.start)/1000);el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');},1000);
}
const TYPE_LBL={mc:'Selección múltiple',tf:'Verdadero o falso',match:'Relaciona'};
function renderQ(){
  const it=QZ.items[QZ.i];QZ.sel=null;QZ.checked=false;
  const pct=QZ.i/QZ.items.length*100;
  let body='';
  if(it.t==='match'){
    const L=it.pairs.map((p,i)=>({i,txt:p[0]})),R=shuffle(it.pairs.map((p,i)=>({i,txt:p[1]})));
    QZ.match={L:null,done:0,errs:0};
    body=`<div class="match"><div class="col" style="gap:10px">${L.map(x=>`<button class="opt" data-side="L" data-i="${x.i}" onclick="mPick(this)"><b style="font-family:var(--fd)">${x.txt}</b></button>`).join('')}</div>
    <div class="col" style="gap:10px">${R.map(x=>`<button class="opt" data-side="R" data-i="${x.i}" onclick="mPick(this)">${x.txt}</button>`).join('')}</div></div>`;
  }else if(it.t==='tf'){
    body=`<div class="tf-row">${it.opts.map((o,k)=>`<button class="opt" data-k="${k}" onclick="qSel(${k})">${k?'✗':'✓'} ${o.txt}</button>`).join('')}</div>`;
  }else{
    body=`<div class="opts">${it.opts.map((o,k)=>`<button class="opt" data-k="${k}" onclick="qSel(${k})"><span class="k">${k+1}</span><span>${o.txt}</span></button>`).join('')}</div>`;
  }
  $('s-quiz').innerHTML=`
  <div class="lhead"><button class="xbtn" onclick="exitImmersive()">✕</button><div class="lprog"><i style="width:${pct}%"></i></div>
  ${QZ.combo>=3?`<span class="combo">🔥 ${QZ.combo}</span>`:''}<span class="timer" id="qtimer"></span></div>
  <div class="row mb8"><span class="qtype">${it.kind||TYPE_LBL[it.t]}</span>${QZ.retried.has(QZ.i)?'<span class="chip err">Repaso de error</span>':''}<span class="grow"></span><span class="f12 tx3">${QZ.title}</span></div>
  <div class="qtext">${it.q}</div>${body}
  <div class="qfoot" id="qfoot">${it.t==='match'?'<div class="fb tx2 f13">Toca un concepto y luego su definición</div>':`<div class="fb"></div><button class="btn btn-p" id="qcheck" onclick="qCheck()" disabled>${QZ.fb?'Comprobar':'Siguiente'}</button>`}</div>`;
}
function qSel(k){
  if(QZ.checked)return;QZ.sel=k;
  document.querySelectorAll('#s-quiz .opt').forEach(b=>b.classList.toggle('sel',+b.dataset.k===k));
  $('qcheck').disabled=false;
}
function qCheck(){
  if(QZ.checked){qNext();return;}
  if(QZ.sel==null)return;
  const it=QZ.items[QZ.i],ok=it.opts[QZ.sel].ok;
  record(it,ok,it.opts[QZ.sel].txt);
  if(!QZ.fb){QZ.checked=true;qNext();return;}
  QZ.checked=true;
  document.querySelectorAll('#s-quiz .opt').forEach(b=>{b.disabled=true;const o=it.opts[+b.dataset.k];b.classList.remove('sel');if(o.ok)b.classList.add('right');else if(+b.dataset.k===QZ.sel)b.classList.add('wrong');});
  showFb(ok,ok?'':'Respuesta correcta: <b>'+it.opts.find(o=>o.ok).txt+'</b><br>',it.e);
}
function showFb(ok,pre,e){
  const praise=['¡Excelente!','¡Muy bien!','¡Correcto!','¡Así se hace!','¡Perfecto!'];
  const f=$('qfoot');f.className='qfoot '+(ok?'good':'bad');
  f.innerHTML=`<div class="fb"><div class="fb-t">${ok?'✓ '+praise[Math.floor(Math.random()*praise.length)]:'✗ No exactamente'}</div><div class="fb-e">${pre||''}${e||''}</div></div><button class="btn ${ok?'btn-ok':'btn-err'}" id="qcheck" onclick="qNext()">Continuar</button>`;
  QZ.checked=true;
}
function record(it,ok,chosen){
  const retry=QZ.retried.has(QZ.i);
  if(!retry){QZ.log.push({it,ok,chosen});if(ok)QZ.correct++;}
  if(ok){QZ.combo++;QZ.maxCombo=Math.max(QZ.maxCombo,QZ.combo);if(QZ.mode==='mistakes'&&it.src)delete P.mist[it.src];}
  else{QZ.combo=0;if(it.src)P.mist[it.src]=(P.mist[it.src]||0)+1;
    if(QZ.fb&&!retry&&it.t!=='match'){QZ.items.push(it.t==='mc'?{...it,opts:shuffle(it.opts)}:it);QZ.retried.add(QZ.items.length-1);}}
}
function mPick(b){
  if(b.classList.contains('gone'))return;
  const m=QZ.match,side=b.dataset.side;
  if(side==='L'){document.querySelectorAll('#s-quiz .opt[data-side=L]').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');m.L=b;return;}
  if(!m.L){b.classList.add('bad');setTimeout(()=>b.classList.remove('bad'),300);return;}
  if(m.L.dataset.i===b.dataset.i){
    [m.L,b].forEach(x=>{x.classList.remove('sel');x.classList.add('right');setTimeout(()=>x.classList.add('gone'),250);});
    m.L=null;m.done++;
    if(m.done===QZ.items[QZ.i].pairs.length){
      const ok=m.errs===0;record(QZ.items[QZ.i],ok,ok?'':'con '+m.errs+' errores');
      setTimeout(()=>showFb(ok,'',ok?'Relacionaste todos los conceptos sin errores.':'Completaste la relación con '+m.errs+' error(es). Repasa estos conceptos en el glosario.'),300);
    }
  }else{m.errs++;b.classList.add('bad');m.L.classList.add('bad');const l=m.L;setTimeout(()=>{b.classList.remove('bad');l.classList.remove('bad');},350);}
}
function qNext(){
  QZ.i++;save();
  if(QZ.i>=QZ.items.length){finishQuiz();return;}
  renderQ();window.scrollTo(0,0);
}

// ═══════════ RESULT ═══════════
function finishQuiz(){
  clearInterval(QZ._tm);
  const q=QZ,total=q.log.length,score=total?Math.round(q.correct/total*100):0,secs=Math.round((Date.now()-q.start)/1000);
  let xp=0,headline='',big='',sub='',passedNow=false,firstPass=false;
  if(q.mode==='practice'){
    const p=TP(q.id);p.pr=Math.max(p.pr||0,score);xp=10+q.correct;
    big=score>=PASS?'💪':'📚';headline=score>=PASS?'¡Práctica superada!':'Sigue practicando';
    sub=score>=PASS?'Estás listo para el examen del tema.':'Necesitas '+PASS+'% para marcar la práctica como superada. Repasar la lección ayuda.';
  }else if(q.mode==='exam'){
    const p=TP(q.id),was=passed(q.id);p.ex=Math.max(p.ex||0,score);p.exN=(p.exN||0)+1;
    if(score>=PASS&&!p.l)p.l=1;
    passedNow=score>=PASS;firstPass=passedNow&&!was;xp=passedNow?(firstPass?30:10):5;
    big=passedNow?(score===100?'👑':'🎓'):'📖';headline=passedNow?(score===100?'¡Examen perfecto!':'¡Examen aprobado!'):'Aún no aprobado';
    sub=passedNow?(firstPass?'Desbloqueaste el siguiente tema.':'Mejoraste tu dominio del tema.'):'Necesitas '+PASS+'% para aprobar. Revisa tus errores abajo y vuelve a intentarlo.';
  }else if(q.mode==='final'){
    const was=P.fin[q.id]||0;P.fin[q.id]=Math.max(was,score);passedNow=score>=PASS;firstPass=passedNow&&was<PASS;xp=passedNow?(firstPass?100:20):10;
    big=passedNow?'🏆':'📖';headline=passedNow?'¡Materia dominada!':'Casi lo logras';
    sub=passedNow?'Aprobaste el examen final de la materia.':'Repasa los temas con más errores y vuelve a intentarlo.';
  }else{
    xp=5+q.correct;big=score>=PASS?'✨':'🔁';headline=q.mode==='mistakes'?'Errores repasados':'Práctica mixta completada';sub=q.mode==='mistakes'?'Las preguntas que respondiste bien salen de tu lista de errores.':'Mezclar temas fortalece la memoria a largo plazo.';
  }
  if(q.maxCombo>=5)xp+=5;
  P.hist.unshift({d:Date.now(),k:q.mode,id:q.id,s:score});P.hist=P.hist.slice(0,200);
  addXP(xp);save();
  if(passedNow||score>=90)confetti();
  const showAll=q.mode==='exam'||q.mode==='final';
  const rev=q.log.filter(l=>showAll||!l.ok);
  const nextTopic=q.mode==='exam'&&passedNow?DV.subject(DV.T[q.id].career,DV.T[q.id].sid).topics[DV.T[q.id].idx+1]:null;
  $('s-result').innerHTML=`<div class="result">
    <div class="big">${big}</div><h1>${headline}</h1><div class="tx2">${sub}</div>
    <div class="res-stats">
      <div class="res-stat gold"><div class="rh">XP ganado</div><div class="rb">⚡ ${xp}</div></div>
      <div class="res-stat ${score>=PASS?'okc':'bl'}"><div class="rh">Nota</div><div class="rb">${score}%</div></div>
      <div class="res-stat bl"><div class="rh">Tiempo</div><div class="rb">${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}</div></div>
      ${q.maxCombo>=3?`<div class="res-stat gold"><div class="rh">Racha</div><div class="rb">🔥 ${q.maxCombo}</div></div>`:''}
    </div>
    <div class="row wrap" style="justify-content:center;gap:10px">
      ${q.mode==='practice'&&score>=PASS?`<button class="btn btn-ok" onclick="startQuiz('exam','${q.id}')">Presentar examen 🎯</button>`:''}
      ${nextTopic?`<button class="btn btn-ok" onclick="startLesson('${nextTopic.id}')">Siguiente tema →</button>`:''}
      ${q.mode==='exam'&&!passedNow?`<button class="btn btn-p" onclick="startLesson('${q.id}',1)">Repasar lección 📖</button>`:''}
      <button class="btn btn-g" onclick="startQuiz('${q.mode}','${q.id||''}')">Repetir</button>
      <button class="btn btn-g" onclick="exitImmersive()">Volver</button>
    </div>
    ${rev.length?`<h2 class="mt32" style="text-align:left">${showAll?'Revisión del examen':'Para repasar'}</h2>${rev.map(l=>`
      <div class="review-item ${l.ok?'ok':'no'}"><div class="rq">${l.ok?'✓':'✗'} ${l.it.q}</div>
      ${l.it.t!=='match'?`<div class="ra">${l.ok?'':`Tu respuesta: <span style="color:var(--err)">${l.chosen}</span><br>`}Correcta: <b style="color:var(--ok)">${l.it.opts.find(o=>o.ok).txt}</b></div>`:''}
      ${l.it.e?`<div class="re">💡 ${l.it.e}</div>`:''}</div>`).join('')}`:''}
  </div>`;
  QZ=null;go('result');
}
function exitImmersive(){
  stopSpeak();if(QZ){clearInterval(QZ._tm);QZ=null;}CARDS=null;
  go(HIST.pop()||'home',SUBJ,true);
}

// ═══════════ FLASHCARDS ═══════════
let CARDS=null;
function startCards(list,title,all){
  if(!list.length){toast('No hay tarjetas para repasar ahora mismo 🎉');return;}
  CARDS={deck:all?list:shuffle(list),i:0,title,flipped:false,rated:{},ok:0};
  go('cards');renderCard();
}
function renderCard(){
  const C=CARDS;
  if(C.i>=C.deck.length){
    const n=Object.keys(C.rated).length;
    $('s-cards').innerHTML=`<div class="result"><div class="big">🃏</div><h1>¡Mazo completado!</h1><div class="tx2">Repasaste ${n} tarjeta${n!==1?'s':''} · ${C.ok} recordadas bien</div>
    <div class="row wrap mt24" style="justify-content:center;gap:10px"><button class="btn btn-g" onclick="CARDS.i=0;renderCard()">Ver de nuevo</button><button class="btn btn-p" onclick="exitImmersive()">Terminar</button></div></div>`;return;
  }
  const k=C.deck[C.i],st=cardState(k.id),t=DV.T[k.tid];
  C.flipped=false;
  $('s-cards').innerHTML=`
  <div class="lhead"><button class="xbtn" onclick="exitImmersive()">✕</button><div class="lprog"><i style="width:${C.i/C.deck.length*100}%"></i></div><span class="timer">${C.i+1}/${C.deck.length}</span></div>
  <div class="f12 tx3 mb8">${esc(C.title)}</div>
  <div class="flip-scene" onclick="flipCard()"><div class="flip" id="flip">
    <div class="face"><div class="ft"><span>Pregunta</span><span>${t.emoji} ${esc(t.title)}</span></div><div class="fq">${k.q}</div>
      <div class="pips">${[1,2,3,4,5].map(b=>`<i class="${b<=st.b?'on':''}"></i>`).join('')}<span class="f12 tx3" style="margin-left:6px">${st.b?'Caja '+st.b:'Nueva'}</span></div></div>
    <div class="face back"><div class="ft"><span>Respuesta</span><span>${C.rated[k.id]!=null?'✓ calificada':''}</span></div><div class="fa">${k.a}</div></div>
  </div></div>
  <div id="card-act">${flipHint()}</div>
  <div class="row mt16" style="justify-content:space-between"><button class="btn-link" onclick="cardNav(-1)" ${C.i===0?'disabled style="opacity:.3"':''}>← Anterior</button><span class="f12 tx3 hide-m"><span class="kbd">Espacio</span> girar · <span class="kbd">1-4</span> calificar · <span class="kbd">←→</span> mover</span><button class="btn-link" onclick="cardNav(1)">Saltar →</button></div>`;
}
function flipHint(){return`<button class="btn btn-p btn-block" onclick="flipCard()">Mostrar respuesta</button>`;}
function flipCard(){
  const C=CARDS;C.flipped=!C.flipped;$('flip').classList.toggle('on',C.flipped);
  $('card-act').innerHTML=C.flipped?`<div class="label center mb8">¿Qué tan bien la recordabas?</div><div class="rate-row">
    <button class="rate r0" onclick="rateCard(0)"><b>No sabía</b><small>1 · hoy</small></button>
    <button class="rate r1" onclick="rateCard(1)"><b>Difícil</b><small>2 · 1 día</small></button>
    <button class="rate r2" onclick="rateCard(2)"><b>Bien</b><small>3 · sube caja</small></button>
    <button class="rate r3" onclick="rateCard(3)"><b>Fácil</b><small>4 · 30 días</small></button></div>`:flipHint();
}
function rateCard(r){
  const C=CARDS,k=C.deck[C.i],st={...cardState(k.id)};
  let b=st.b||1;b=r===0?1:r===1?Math.max(1,b-1):r===2?Math.min(5,b+1):5;
  const d=new Date();d.setDate(d.getDate()+(r===0?0:INTERVALS[b]));if(r===0)d.setMinutes(d.getMinutes()+10);
  P.c[k.id]={b,n:d.getTime()};
  if(C.rated[k.id]==null){if(r>=2)C.ok++;addXP(1);}
  C.rated[k.id]=r;C.i++;save();renderCard();
}
function cardNav(d){CARDS.i=Math.max(0,Math.min(CARDS.deck.length,CARDS.i+d));renderCard();}

// ═══════════ REVIEW ═══════════
function renderReview(){
  const c=P.career,due=dueCards(c),mist=Object.keys(P.mist).filter(q=>DV.Q[q]&&DV.T[DV.Q[q].tid].career===c),
    learned=DV.careers[c].subjects.flatMap(s=>s.topics).filter(t=>P.t[t.id]?.l);
  $('s-review').innerHTML=`<h1>Repaso</h1><div class="tx2 f14 mt4 mb24">La repetición espaciada fija lo aprendido en la memoria a largo plazo.</div>
  <div class="grid3 mb24">
    <div class="card"><div style="font-size:30px">🃏</div><h3 class="mt8">Tarjetas pendientes</h3><div class="f13 tx2 mb16">${due.length} tarjeta${due.length!==1?'s':''} listas según tu curva de olvido</div><button class="btn btn-p btn-sm btn-block" ${due.length?'':'disabled'} onclick="startCards(dueCards(P.career),'Repaso del día')">Repasar</button></div>
    <div class="card"><div style="font-size:30px">❗</div><h3 class="mt8">Mis errores</h3><div class="f13 tx2 mb16">${mist.length} pregunta${mist.length!==1?'s':''} que fallaste antes</div><button class="btn btn-p btn-sm btn-block" ${mist.length?'':'disabled'} onclick="startQuiz('mistakes')">Corregir</button></div>
    <div class="card"><div style="font-size:30px">🔀</div><h3 class="mt8">Práctica mixta</h3><div class="f13 tx2 mb16">Preguntas variadas de todo lo que has estudiado</div><button class="btn btn-p btn-sm btn-block" ${learned.length?'':'disabled'} onclick="startQuiz('mixed')">Mezclar</button></div>
  </div>
  <h2>Volver a cualquier tema</h2>
  ${learned.length?learned.map(t=>`<div class="li"><div class="lic">${t.emoji}</div><div class="grow"><div class="fw7 f14">${esc(t.title)}</div><div class="f12 tx2">${esc(DV.subject(c,t.sid).name)} · ${t.mod} · ⭐ ${stars(t.id)}/3</div></div>
    <div class="row" style="gap:6px"><button class="btn btn-g btn-sm" onclick="startLesson('${t.id}',0)" title="Releer">📖</button><button class="btn btn-g btn-sm" onclick="startCards(DV.T['${t.id}'].cards,'Tarjetas · '+DV.T['${t.id}'].title,true)" title="Tarjetas">🃏</button><button class="btn btn-g btn-sm" onclick="startQuiz('practice','${t.id}')" title="Practicar">✏️</button></div></div>`).join('')
  :'<div class="empty"><div class="big">🌱</div>Cuando completes tu primera lección, aquí podrás repasarla cuantas veces quieras.</div>'}`;
}

// ═══════════ GLOSSARY ═══════════
function renderGlossary(){
  $('s-glossary').innerHTML=`<h1>Glosario</h1><div class="tx2 f14 mt4 mb16">Todos los conceptos clave de ${esc(DV.careers[P.career].name)}.</div>
  <input class="input mb24" id="gl-q" placeholder="🔍 Buscar concepto…" oninput="drawGlossary()"><div id="gl-list"></div>`;
  drawGlossary();
}
function drawGlossary(){
  const q=($('gl-q')?.value||'').trim().toLowerCase();
  const hl=s=>q?s.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>'):s;
  let html='',n=0;
  DV.careers[P.career].subjects.forEach(s=>{
    const items=s.topics.flatMap(t=>t.terms.map(x=>({x,t}))).filter(({x})=>!q||(x[0]+' '+x[1]).toLowerCase().includes(q));
    if(!items.length)return;n+=items.length;
    html+=`<h2 class="mt16">${s.emoji} ${esc(s.name)}</h2>`+items.sort((a,b)=>a.x[0].localeCompare(b.x[0])).map(({x,t})=>`<div class="gl-term"><b>${hl(x[0])}</b> — ${hl(x[1])}<div class="src">${t.mod} · ${esc(t.title)}</div></div>`).join('');
  });
  $('gl-list').innerHTML=n?html:'<div class="empty">No se encontraron conceptos.</div>';
}

// ═══════════ PROGRESS ═══════════
function renderProgress(){
  const c=P.career,lv=level(P.xp),[a,b]=lvlRange(lv),all=DV.careers[c].subjects.flatMap(s=>s.topics);
  const ls=all.filter(t=>P.t[t.id]?.l).length,ps=all.filter(t=>passed(t.id)).length;
  const exs=all.filter(t=>P.t[t.id]?.exN).map(t=>P.t[t.id].ex),avg=exs.length?Math.round(exs.reduce((x,y)=>x+y,0)/exs.length):0;
  const mastered=Object.values(P.c).filter(s=>s.b>=5).length;
  const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5);return{k:dkey(d),l:'DLMXJVS'[d.getDay()],v:P.days[dkey(d)]||0};});
  const mx=Math.max(P.goal,...days.map(d=>d.v));
  const names={lesson:'📖 Lección',practice:'✏️ Práctica',exam:'🎯 Examen',final:'🏆 Final',mistakes:'❗ Errores',mixed:'🔀 Mixta'};
  $('s-progress').innerHTML=`<h1>Tu progreso</h1><div class="tx2 f14 mt4 mb24">${esc(DV.careers[c].name)} · ${DV.careers[c].year}</div>
  <div class="card mb16 row" style="gap:18px">${ring((P.xp-a)/(b-a),84,9,'var(--purple)',`${lv}<small>nivel</small>`)}<div class="grow"><div class="fw7">Nivel ${lv}</div><div class="f13 tx2 mb8">${P.xp} XP · faltan ${b-P.xp} XP para el nivel ${lv+1}</div><div class="bar"><i style="width:${(P.xp-a)/(b-a)*100}%;background:var(--purple)"></i></div></div></div>
  <div class="stats">
    <div class="stat"><div class="n">🔥 ${liveStreak()}</div><div class="l">Días de racha</div></div>
    <div class="stat"><div class="n">${ls}/${all.length}</div><div class="l">Lecciones leídas</div></div>
    <div class="stat"><div class="n" style="color:var(--ok)">${ps}/${all.length}</div><div class="l">Exámenes aprobados</div></div>
    <div class="stat"><div class="n">${exs.length?avg+'%':'—'}</div><div class="l">Nota media (mejores)</div></div>
    <div class="stat"><div class="n">${mastered}</div><div class="l">Tarjetas dominadas</div></div>
  </div>
  <div class="card mb16"><h3>Últimos 7 días</h3><div class="week">${days.map(d=>`<div class="d${d.k===dkey()?' today':''}"><span class="f12 fw7">${d.v||''}</span><i style="height:${d.v/mx*100}%"></i><span>${d.l}</span></div>`).join('')}</div></div>
  <div class="card mb16"><h3 class="mb16">Por materia</h3>${DV.careers[c].subjects.filter(s=>s.topics.length).map(s=>{const x=subjStats(c,s.id);return`
    <div class="mb16"><div class="row f14 mb8"><span>${s.emoji}</span><b class="grow">${esc(s.name)}</b><span class="f12 tx2">${x.pass}/${x.n} aprobados${x.avg!=null?' · media '+x.avg+'%':''}${P.fin[s.id]!=null?' · final '+P.fin[s.id]+'%':''}</span></div><div class="bar ${x.pass===x.n?'ok':''}"><i style="width:${x.pct}%"></i></div></div>`;}).join('')||'<div class="tx2 f13">Sin materias con contenido.</div>'}</div>
  <div class="card"><h3 class="mb8">Historial reciente</h3>${P.hist.slice(0,15).map(h=>{const t=DV.T[h.id],s=t?null:DV.subject(c,h.id);return`<div class="hist-row"><span style="min-width:105px">${names[h.k]||h.k}</span><span class="grow tx2">${t?esc(t.title):s?esc(s.name):'Repaso'}</span>${h.s!=null?`<span class="chip ${h.s>=PASS?'ok':'err'}">${h.s}%</span>`:''}<span class="f12 tx3">${new Date(h.d).toLocaleDateString('es',{day:'numeric',month:'short'})}</span></div>`;}).join('')||'<div class="tx2 f13">Aún no hay actividad.</div>'}</div>`;
}

// ═══════════ PROFILE ═══════════
function renderProfile(){
  $('s-profile').innerHTML=`<h1>Perfil</h1>
  <div class="card mt16 row" style="gap:16px"><div class="avatar" style="width:64px;height:64px;font-size:24px;background:${esc(U.color)}">${esc(initials(U.name))}</div><div class="grow"><div class="fw7" style="font-size:18px">${esc(U.name)}</div><div class="f13 tx2">Nivel ${level(P.xp)} · ${P.xp} XP · ${sb?'☁️ Sincronizado en la nube':'💾 Guardado local'}</div></div></div>
  <div class="card mt16"><h3>Meta diaria</h3><div class="f13 tx2 mb16">¿Cuánto quieres estudiar cada día?</div><div class="grid2">${[[10,'Casual','~5 min'],[30,'Regular','~15 min'],[50,'Serio','~25 min'],[80,'Intenso','~40 min']].map(([v,l,d])=>`<button class="step${P.goal===v?' rec':''}" onclick="P.goal=${v};save();renderTop();renderProfile()"><div><div class="st">${l}</div><div class="sd">${v} XP · ${d}</div></div></button>`).join('')}</div></div>
  <div class="card mt16"><h3 class="mb16">Preferencias</h3>
    <div class="row mb16"><span class="grow">Tema ${P.theme==='light'?'claro':'oscuro'}</span><button class="btn btn-g btn-sm" onclick="P.theme=P.theme==='light'?'dark':'light';save();applyTheme();renderProfile()">${P.theme==='light'?'🌙 Oscuro':'☀️ Claro'}</button></div>
    <div class="row"><span class="grow">Temporizador Pomodoro</span><button class="btn btn-g btn-sm" onclick="togglePomo()">⏱ Abrir</button></div></div>
  <div class="card mt16"><h3 class="mb8">Atajos de teclado</h3><div class="f13 tx2 col" style="gap:6px">
    <div><span class="kbd">1</span>–<span class="kbd">4</span> elegir respuesta · <span class="kbd">Enter</span> comprobar / continuar</div>
    <div><span class="kbd">Espacio</span> girar tarjeta · <span class="kbd">←</span><span class="kbd">→</span> navegar lecciones y tarjetas</div>
    <div><span class="kbd">Esc</span> salir de una actividad</div></div></div>
  <div class="row wrap mt24" style="gap:10px"><button class="btn btn-g" onclick="logout()">Cambiar de cuenta</button><button class="btn btn-err btn-sm" onclick="resetProgress()">Reiniciar progreso</button></div>`;
}
function resetProgress(){if(!confirm('¿Borrar TODO tu progreso? Esta acción no se puede deshacer.'))return;U.p=null;initProgress(U);P=U.p;save();renderTop();go('home');toast('Progreso reiniciado');}

// ═══════════ POMODORO ═══════════
const PM={mode:'focus',left:25*60,run:false,h:null,len:{focus:25*60,short:5*60,long:15*60}};
function togglePomo(){$('pomo').classList.toggle('on');drawPomo();}
function setPomo(m){PM.mode=m;PM.left=PM.len[m];stopPomo();drawPomo();}
function playPomo(){
  if(PM.run){stopPomo();drawPomo();return;}
  PM.run=true;const end=Date.now()+PM.left*1000;
  PM.h=setInterval(()=>{PM.left=Math.max(0,Math.round((end-Date.now())/1000));drawPomo();if(!PM.left)donePomo();},500);drawPomo();
}
function stopPomo(){clearInterval(PM.h);PM.run=false;}
function donePomo(){
  stopPomo();beep();
  if(PM.mode==='focus'){addXP(5);toast('🍅 ¡Bloque de enfoque completado! +5 XP · Toma un descanso',3500);setPomo('short');}
  else{toast('⏰ Descanso terminado. ¡A seguir!',3000);setPomo('focus');}
}
function drawPomo(){
  const t=Math.floor(PM.left/60)+':'+String(PM.left%60).padStart(2,'0');
  $('pomo-t').textContent=t;$('pomo-play').textContent=PM.run?'⏸ Pausa':'▶ Iniciar';
  document.querySelectorAll('#pomo .pomo-mode button').forEach(b=>b.classList.toggle('on',b.dataset.m===PM.mode));
  $('tb-pomo').innerHTML=PM.run?'⏱ '+t:'⏱';
}
function beep(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+1.2);o.start();o.stop(a.currentTime+1.2);}catch(e){}}

// ═══════════ KEYBOARD ═══════════
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;
  if(e.key==='Escape'){if($('sheet-back').classList.contains('on'))closeSheet();else if(IMMERSIVE.includes(CUR)&&CUR!=='result')exitImmersive();return;}
  if(CUR==='lesson'&&LS){if(e.key==='ArrowRight'){LS.i<LS.steps.length-1?lessonNav(1):finishLesson(true);}if(e.key==='ArrowLeft')lessonNav(-1);}
  else if(CUR==='quiz'&&QZ){
    const it=QZ.items[QZ.i];
    if(e.key==='Enter'){e.preventDefault();const b=$('qcheck');if(b&&!b.disabled)b.click();}
    else if(/^[1-4]$/.test(e.key)&&!QZ.checked&&it.t!=='match'&&+e.key<=it.opts.length)qSel(+e.key-1);
  }else if(CUR==='cards'&&CARDS&&CARDS.i<CARDS.deck.length){
    if(e.code==='Space'){e.preventDefault();flipCard();}
    else if(CARDS.flipped&&/^[1-4]$/.test(e.key))rateCard(+e.key-1);
    else if(e.key==='ArrowLeft')cardNav(-1);else if(e.key==='ArrowRight')cardNav(1);
  }
});
