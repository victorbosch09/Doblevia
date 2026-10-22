// ═══════════ CONFIG ═══════════
const STORE_KEY='dv3_users';
const PASS=70;
const INTERVALS=[0,1,3,7,14,30];
const COLORS=['#5b9cf6','#a78bfa','#f6a94e','#4cd68a','#f6614e','#f6d44e','#38bdf8','#fb7185'];
const SB_URL='https://ryuigxgpljlgfsvkxyzl.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dWlneGdwbGpsZ2Zzdmt4eXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MzkxNjAsImV4cCI6MjEwODIxNTE2MH0.WpZGD3qSAxc1G3RrhwC88P1NQ5Dyy5q-0GhfOKdmSq0';
let sb=null;

let STORE={users:{},lastUser:null}, U=null, P=null, CUR='home', HIST=[];

// ═══════════ HELPERS ═══════════
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>String(s).replace(/<[^>]+>/g,'');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const dkey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const initials=n=>n.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
function toast(msg,ms=2200){const t=$('toast');t.innerHTML=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),ms);}
function ring(pct,size=64,stroke=7,color='var(--acc)',inner=''){
  const r=(size-stroke)/2,c=2*Math.PI*r,off=c*(1-Math.min(1,Math.max(0,pct)));
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--s3)" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .6s"/></svg><div class="rv">${inner}</div></div>`;
}
function confetti(){
  const box=document.createElement('div');box.className='confetti';
  const cols=['#5b9cf6','#f6a94e','#4cd68a','#ffc83d','#a78bfa','#f6614e'];
  for(let i=0;i<70;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%cols.length];p.style.animationDuration=(1.6+Math.random()*1.6)+'s';p.style.animationDelay=Math.random()*.4+'s';box.appendChild(p);}
  document.body.appendChild(box);setTimeout(()=>box.remove(),3600);
}

// ═══════════ STORAGE ═══════════
function loadLocal(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null');}catch(e){return null;}}
let syncT=null;
function save(){
  if(U&&U.p)U.p.ts=Date.now();
  try{localStorage.setItem(STORE_KEY,JSON.stringify(STORE));}catch(e){}
  if(sb&&U){clearTimeout(syncT);const u=U;syncT=setTimeout(()=>sbSave(u).catch(()=>{}),800);}
}
async function sbLoad(){
  if(!sb)return null;
  const{data,error}=await sb.from('dv_users').select('id,name,pin,color,data');
  if(error)return null;
  const users={};(data||[]).forEach(r=>{users[r.id]={id:r.id,name:r.name,pin:r.pin,color:r.color,...(r.data||{})};});
  return users;
}
async function sbSave(u){
  const{id,name,pin,color,...rest}=u;
  await sb.from('dv_users').upsert({id,name,pin,color,data:rest,updated_at:new Date().toISOString()},{onConflict:'id'});
}
function initProgress(u){
  if(!u.p) u.p={};
  const d={career:'a',xp:0,days:{},streak:0,last:null,goal:30,t:{},fin:{},c:{},mist:{},hist:[],theme:'dark'};
  for(const k in d) if(u.p[k]===undefined) u.p[k]=d[k];
  delete u.careers; delete u.tasks; delete u.stats;
  return u;
}

// ═══════════ XP / STREAK ═══════════
function level(xp){return Math.floor(Math.sqrt(xp/40))+1;}
function lvlRange(l){return[40*(l-1)**2,40*l**2];}
function todayXP(){return P.days[dkey()]||0;}
function addXP(n){
  if(n<=0)return;
  const before=todayXP(), lvBefore=level(P.xp);
  P.xp+=n; P.days[dkey()]=before+n;
  touchStreak();
  if(before<P.goal&&before+n>=P.goal){setTimeout(()=>{toast('🎯 ¡Meta diaria cumplida!');confetti();},600);}
  if(level(P.xp)>lvBefore) setTimeout(()=>toast('⭐ ¡Subiste al nivel '+level(P.xp)+'!'),1400);
  save(); renderTop();
}
function touchStreak(){
  const t=dkey(); if(P.last===t)return;
  const y=dkey(new Date(Date.now()-864e5));
  P.streak=(P.last===y)?P.streak+1:1; P.last=t;
}
function liveStreak(){const t=dkey(),y=dkey(new Date(Date.now()-864e5));return(P.last===t||P.last===y)?P.streak:0;}

// ═══════════ PROGRESS QUERIES ═══════════
const TP=tid=>P.t[tid]||(P.t[tid]={l:0,ls:0,pr:0,ex:0,exN:0});
function stars(tid){const p=P.t[tid]||{};return (p.l?1:0)+((p.pr||0)>=PASS?1:0)+((p.ex||0)>=PASS?1:0);}
function passed(tid){return (P.t[tid]?.ex||0)>=PASS;}
function unlocked(t){if(t.idx===0)return true;const prev=DV.subject(t.career,t.sid).topics[t.idx-1];return passed(prev.id)||passed(t.id)||!!P.t[t.id]?.l;}
function subjStats(c,sid){
  const s=DV.subject(c,sid),n=s.topics.length;
  let st=0,pass=0,ls=0,exSum=0,exN=0;
  s.topics.forEach(t=>{st+=stars(t.id);if(passed(t.id))pass++;if(P.t[t.id]?.l)ls++;if(P.t[t.id]?.exN){exSum+=P.t[t.id].ex;exN++;}});
  return{n,stars:st,max:n*3,pass,ls,pct:n?Math.round(st/(n*3)*100):0,avg:exN?Math.round(exSum/exN):null};
}
function careerStats(c){
  let n=0,st=0,max=0,pass=0;
  DV.careers[c].subjects.forEach(s=>{const x=subjStats(c,s.id);n+=x.n;st+=x.stars;max+=x.max;pass+=x.pass;});
  return{n,pct:max?Math.round(st/max*100):0,pass};
}
function cardState(id){return P.c[id]||{b:0,n:0};}
function dueCards(c){
  const now=Date.now(),out=[];
  DV.careers[c].subjects.forEach(s=>s.topics.forEach(t=>{if(!P.t[t.id]?.l)return;t.cards.forEach(k=>{const st=cardState(k.id);if(!st.n||st.n<=now)out.push(k);});}));
  return out;
}
function nextStep(c){
  for(const s of DV.careers[c].subjects){
    for(const t of s.topics){
      if(!unlocked(t))break;
      if(passed(t.id))continue;
      const p=P.t[t.id]||{};
      const step=!p.l?'lesson':(p.pr||0)<PASS?'practice':'exam';
      return{t,s,step};
    }
  }
  return null;
}

// ═══════════ LOGIN ═══════════
let selUser=null,pinBuf='';
function showLogin(){
  $('app').classList.remove('on');$('login').classList.add('on');
  loginStep('pick');
}
function loginStep(s){
  ['pick','pin','new'].forEach(k=>$('lp-'+k).style.display=k===s?'':'none');
  if(s==='pick')renderUsers();
  if(s==='new'){$('na-name').value='';$('na-pin').value='';$('na-err').textContent='';renderSwatches();setTimeout(()=>$('na-name').focus(),50);}
}
function renderUsers(){
  const us=Object.values(STORE.users);
  $('lp-sub').textContent=us.length?'¿Quién estudia hoy?':'Crea tu cuenta para empezar';
  $('user-grid').innerHTML=us.map(u=>`<button class="ubtn" onclick="pickUser('${u.id}')"><div class="avatar" style="background:${esc(u.color)}">${esc(initials(u.name))}</div>${esc(u.name.split(' ')[0])}</button>`).join('')+
    `<button class="ubtn add" onclick="loginStep('new')"><div class="avatar" style="background:var(--s3);color:var(--tx2)">+</div>Nueva cuenta</button>`;
}
function pickUser(id){selUser=id;pinBuf='';const u=STORE.users[id];$('lp-pin-av').innerHTML=`<div class="avatar" style="background:${esc(u.color)};margin:0 auto">${esc(initials(u.name))}</div>`;$('lp-pin-name').textContent='Hola, '+u.name.split(' ')[0];$('pin-err').textContent='';dots();loginStep('pin');}
function pinKey(k){if(pinBuf.length>=4)return;pinBuf+=k;dots();if(pinBuf.length===4)setTimeout(checkPin,120);}
function pinBack(){pinBuf=pinBuf.slice(0,-1);dots();}
function dots(){for(let i=0;i<4;i++)$('pd'+i).classList.toggle('on',i<pinBuf.length);}
function checkPin(){
  if(STORE.users[selUser].pin===pinBuf){enter(selUser);return;}
  $('pin-err').textContent='PIN incorrecto';const d=$('pin-dots');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');pinBuf='';dots();
}
let selColor=COLORS[0];
function renderSwatches(){$('swatches').innerHTML=COLORS.map(c=>`<div class="sw${c===selColor?' on':''}" style="background:${c}" onclick="selColor='${c}';renderSwatches()"></div>`).join('');}
async function createAccount(){
  const name=$('na-name').value.trim(),pin=$('na-pin').value.trim();
  if(!name){$('na-err').textContent='Escribe tu nombre';return;}
  if(!/^\d{4}$/.test(pin)){$('na-err').textContent='El PIN debe tener 4 números';return;}
  const u=initProgress({id:'u_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,pin,color:selColor});
  STORE.users[u.id]=u;U=u;save();
  if(sb)sbSave(u).catch(()=>{});
  enter(u.id,true);
}
function enter(id,isNew){
  U=initProgress(STORE.users[id]);P=U.p;STORE.lastUser=id;save();
  $('login').classList.remove('on');$('app').classList.add('on');
  applyTheme();renderSide();renderTop();HIST=[];go('home');
  if(isNew)setTimeout(()=>toast('👋 ¡Bienvenido, '+esc(U.name.split(' ')[0])+'! Empieza por tu primera lección.',3200),300);
}
function logout(){STORE.lastUser=null;U=null;P=null;save();stopPomo();showLogin();}

// ═══════════ NAV ═══════════
const NAV=[['home','🏠','Aprender'],['review','🔁','Repaso'],['glossary','📘','Glosario'],['progress','📊','Progreso'],['profile','👤','Perfil']];
const IMMERSIVE=['lesson','quiz','cards','result'];
function go(name,arg,noHist){
  if(!noHist&&CUR!==name&&!IMMERSIVE.includes(CUR))HIST.push(CUR);
  CUR=name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('s-'+name).classList.add('active');
  const navKey=['subject'].includes(name)?'home':name;
  document.querySelectorAll('[data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===navKey));
  const imm=IMMERSIVE.includes(name);
  $('topbar').style.display=imm?'none':'';
  document.body.classList.toggle('immersive',imm);
  ({home:renderHome,subject:()=>renderSubject(arg),review:renderReview,glossary:renderGlossary,progress:renderProgress,profile:renderProfile})[name]?.();
  window.scrollTo(0,0);
}
function back(){go(HIST.pop()||'home',SUBJ,true);}
function renderSide(){
  const items=NAV.map(([k,i,l])=>`<div class="nav-item" data-nav="${k}" onclick="go('${k}')"><span class="ni">${i}</span>${l}</div>`).join('');
  $('side-nav').innerHTML=items;
  $('mob-nav').innerHTML=NAV.map(([k,i,l])=>`<div class="mn" data-nav="${k}" onclick="go('${k}')"><span class="ni">${i}</span>${l}</div>`).join('');
  $('sb-user').innerHTML=`<div class="avatar sm" style="background:${esc(U.color)}">${esc(initials(U.name))}</div><div><div class="fw7 f13">${esc(U.name)}</div><div class="f12 tx2">Nivel ${level(P.xp)}</div></div>`;
}
function renderTop(){
  if(!P)return;
  const g=Math.min(1,todayXP()/P.goal);
  $('tb-career').innerHTML=`${DV.careers[P.career].emoji} <span class="hide-m">${DV.careers[P.career].short}</span>`;
  $('tb-streak').innerHTML='🔥 '+liveStreak();
  $('tb-xp').innerHTML='⚡ '+P.xp;
  $('tb-lvl').innerHTML='⭐ Nv '+level(P.xp);
  $('tb-goal').innerHTML=ring(g,26,4,g>=1?'var(--ok)':'var(--gold)')+`<span class="hide-m">${todayXP()}/${P.goal}</span>`;
  document.documentElement.dataset.career=P.career;
  const lv=document.querySelector('#sb-user .f12');if(lv)lv.textContent='Nivel '+level(P.xp);
}
function setCareer(c){P.career=c;save();renderTop();renderHome();}
function applyTheme(){document.documentElement.dataset.theme=P.theme||'dark';}

// ═══════════ HOME ═══════════
function greet(){const h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
function renderHome(){
  const c=P.career,car=DV.careers[c],cs=careerStats(c),nx=nextStep(c),due=dueCards(c).length,mist=Object.keys(P.mist).filter(q=>DV.Q[q]?.tid&&DV.T[DV.Q[q].tid].career===c).length;
  const stepTxt={lesson:'📖 Lección',practice:'✏️ Práctica',exam:'🎯 Examen'};
  const tg=todayXP(),g=Math.min(1,tg/P.goal);
  $('s-home').innerHTML=`
  <div class="mb16"><h1>${greet()}, ${esc(U.name.split(' ')[0])}</h1><div class="tx2 f14 mt4">${tg>=P.goal?'Meta de hoy cumplida. Cada repaso extra cuenta.':'Te faltan <b>'+(P.goal-tg)+' XP</b> para tu meta de hoy.'}</div></div>
  <div class="career-tabs">${['a','b'].map(k=>`<button class="ctab${k===c?' on-'+k:''}" onclick="setCareer('${k}')">${DV.careers[k].emoji} ${DV.careers[k].short}<small>${DV.careers[k].year} · ${careerStats(k).pct}%</small></button>`).join('')}</div>
  <div class="hero">
    ${nx?`<div class="continue-card" onclick="openStep('${nx.t.id}','${nx.step}')">
      <div class="cc-lbl">Continuar · ${esc(nx.s.name)}</div>
      <div class="cc-title">${esc(nx.t.title)}</div>
      <div class="cc-sub">${nx.t.mod} · Siguiente: ${stepTxt[nx.step]}</div>
      <div class="cc-go">${nx.step==='lesson'?'Empezar a aprender':nx.step==='practice'?'Practicar':'Presentar examen'} →</div>
      <div class="cc-emoji">${nx.t.emoji}</div></div>`
    :`<div class="continue-card" onclick="go('review')"><div class="cc-lbl">Todo al día</div><div class="cc-title">${cs.n?'¡Completaste todos los temas disponibles!':'Aún no hay temas cargados en esta carrera'}</div><div class="cc-sub">${cs.n?'Mantén lo aprendido con repasos espaciados.':'Se añadirán cuando subas los resúmenes.'}</div>${cs.n?'<div class="cc-go">Ir a repaso →</div>':''}<div class="cc-emoji">🏆</div></div>`}
    <div class="card goal-card">
      ${ring(g,88,9,g>=1?'var(--ok)':'var(--gold)',`${tg}<small>/${P.goal} XP</small>`)}
      <div class="col" style="gap:8px;flex:1">
        <div class="row f13"><span>🔥</span><b>${liveStreak()} días</b><span class="tx2">de racha</span></div>
        <div class="row f13"><span>🔁</span><b>${due}</b><span class="tx2">tarjetas para repasar</span></div>
        <div class="row f13"><span>❗</span><b>${mist}</b><span class="tx2">errores por corregir</span></div>
        ${due||mist?`<button class="btn btn-g btn-sm mt4" onclick="go('review')">Repasar ahora</button>`:''}
      </div>
    </div>
  </div>
  <div class="row mb16" style="justify-content:space-between"><h2 style="margin:0">Materias · ${esc(car.name)}</h2><span class="chip acc">${cs.pct}% dominado</span></div>
  <div class="subj-grid">${car.subjects.map(s=>{const x=subjStats(c,s.id);return`
    <div class="subj${x.n?'':' locked'}" onclick="openSubject('${s.id}')">
      <div class="subj-top"><div class="subj-emoji">${s.emoji}</div><div class="grow"><div class="subj-name">${esc(s.name)}</div>
      <div class="f12 tx2">${x.n?`${x.pass}/${x.n} temas aprobados · ⭐ ${x.stars}/${x.max}`:'Contenido próximamente'}</div></div></div>
      ${x.n?`<div class="bar thin mt12"><i style="width:${x.pct}%"></i></div>`:''}
    </div>`;}).join('')}</div>`;
}

// ═══════════ SUBJECT PATH ═══════════
let SUBJ=null;
function openSubject(sid){SUBJ=sid;go('subject',sid);}
function renderSubject(sid){
  sid=sid||SUBJ;SUBJ=sid;
  const c=P.career,s=DV.subject(c,sid),x=subjStats(c,sid),nx=nextStep(c);
  const offs=[0,60,90,60,0,-60,-90,-60];
  let html=`<button class="btn-link mb8" onclick="go('home')">← Materias</button>
  <div class="subj-header"><div class="se">${s.emoji}</div><div class="grow"><div style="font-size:12px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.08em">${DV.careers[c].short}</div><div style="font-family:var(--fd);font-weight:800;font-size:19px;line-height:1.25">${esc(s.name)}</div></div>${x.n?ring(x.pct/100,58,6,'#fff',`<span style="font-size:13px">${x.pct}%</span>`):''}</div>`;
  if(!x.n){
    $('s-subject').innerHTML=html+`<div class="empty mt24"><div class="big">📭</div><b>Aún no hay módulos cargados</b><div class="f13 mt8">Cuando compartas los resúmenes de esta materia, aparecerán aquí sus lecciones, prácticas y exámenes.</div></div>`;return;
  }
  html+='<div class="path">';let lastMod='';
  s.topics.forEach((t,i)=>{
    if(t.mod!==lastMod){lastMod=t.mod;html+=`<div class="unit-banner"><span class="chip acc">${t.mod}</span></div>`;}
    const un=unlocked(t),dn=passed(t.id),cur=nx&&nx.t.id===t.id,st=stars(t.id);
    html+=`<div class="node-wrap" style="transform:translateX(${offs[i%8]}px)">
      ${cur?'<div class="start-bubble">EMPEZAR</div>':''}
      <button class="node ${dn?'done':un?'open':'locked'}${cur?' current':''}" onclick="openSheet('${t.id}')" aria-label="${esc(t.title)}">${un||dn?t.emoji:'🔒'}</button>
      <div class="node-stars">${[0,1,2].map(k=>`<span class="s${k<st?' on':''}">★</span>`).join('')}</div>
      <div class="node-label">${esc(t.title)}</div></div>`;
  });
  const allPass=x.pass===x.n,fb=P.fin[sid];
  html+=`<div class="node-wrap" style="margin-top:20px">
    <button class="node trophy ${fb>=PASS?'done':allPass?'open':'locked'}" onclick="openFinal('${sid}')">${fb>=PASS?'🏆':allPass?'🎓':'🔒'}</button>
    <div class="node-label"><b>Examen final de la materia</b><br>${fb!=null?'Mejor nota: '+fb+'%':allPass?'¡Desbloqueado!':'Aprueba todos los temas'}</div></div></div>`;
  $('s-subject').innerHTML=html;
}

// ═══════════ TOPIC SHEET ═══════════
function openSheet(tid){
  const t=DV.T[tid],p=P.t[tid]||{},un=unlocked(t);
  const rec=!p.l?'lesson':(p.pr||0)<PASS?'practice':!passed(tid)?'exam':'cards';
  const due=t.cards.filter(k=>{const s=cardState(k.id);return !s.n||s.n<=Date.now();}).length;
  const step=(k,icon,title,desc,right,done)=>`<button class="step${done?' done':''}${rec===k&&un?' rec':''}" onclick="closeSheet();openStep('${tid}','${k}')"><div class="si">${icon}</div><div><div class="st">${title}</div><div class="sd">${desc}</div></div><div class="sr">${right}</div></button>`;
  $('sheet').innerHTML=`
    <div class="row"><div style="font-size:40px">${t.emoji}</div><div class="grow"><div class="label">${t.mod} · ${esc(DV.subject(t.career,t.sid).name)}</div><h2 style="margin:2px 0 0">${esc(t.title)}</h2></div><button class="xbtn" onclick="closeSheet()">✕</button></div>
    ${!un?`<div class="callout tip mt16"><span class="ci">🔒</span><div>Este tema se desbloquea al aprobar el anterior. <b>¿Ya lo dominas?</b> Presenta el examen directamente para saltarlo, o lee la lección para desbloquearlo.</div></div>`:''}
    <div class="step-list">
      ${step('lesson','📖','1 · Lección','Aprende el tema paso a paso · '+t.sections.length+' partes',p.l?'<span class="chip ok">✓ Leída</span>':'+10 XP',p.l)}
      ${step('practice','✏️','2 · Práctica','Ejercicios con retroalimentación inmediata',p.pr?`<span class="chip ${p.pr>=PASS?'ok':'err'}">${p.pr}%</span>`:'+15 XP',(p.pr||0)>=PASS)}
      ${step('cards','🃏','Tarjetas de memoria','Repaso espaciado · '+t.cards.length+' tarjetas',p.l?(due?`<span class="chip acc">${due} pend.</span>`:'<span class="chip ok">Al día</span>'):'',false)}
      ${step('exam','🎯','3 · Examen','Valida lo aprendido · aprobar con '+PASS+'%',p.exN?`<span class="chip ${passed(tid)?'ok':'err'}">${p.ex}%</span>`:'+30 XP',passed(tid))}
    </div>
    ${p.exN?`<div class="f12 tx2 center mt12">${p.exN} intento${p.exN>1?'s':''} de examen · mejor nota ${p.ex}%</div>`:''}`;
  $('sheet-back').classList.add('on');
}
function closeSheet(){$('sheet-back').classList.remove('on');}
function openStep(tid,step){
  if(step==='lesson')startLesson(tid);
  else if(step==='practice')startQuiz('practice',tid);
  else if(step==='exam')startQuiz('exam',tid);
  else if(step==='cards')startCards(DV.T[tid].cards,'Tarjetas · '+DV.T[tid].title,true);
}
function openFinal(sid){
  const x=subjStats(P.career,sid);
  if(x.pass<x.n){toast('🔒 Aprueba los '+x.n+' temas para desbloquear el examen final');return;}
  startQuiz('final',sid);
}

// ═══════════ CLOUD SYNC (newest wins) ═══════════
function sbReady(){
  if(sb||!window.supabase||!STORE)return;
  try{sb=supabase.createClient(SB_URL,SB_KEY);}catch(e){return;}
  sbLoad().then(remote=>{
    if(!remote)return;
    let curChanged=false;
    for(const id in remote){
      const loc=STORE.users[id],r=remote[id];
      if(loc&&(loc.p?.ts||0)>=(r.p?.ts||0))continue;
      STORE.users[id]=r;
      if(U&&id===U.id){U=initProgress(r);P=U.p;curChanged=true;}
    }
    for(const id in STORE.users)if(!remote[id]&&STORE.users[id].p)sbSave(STORE.users[id]).catch(()=>{});
    try{localStorage.setItem(STORE_KEY,JSON.stringify(STORE));}catch(e){}
    if(curChanged&&!IMMERSIVE.includes(CUR)){applyTheme();renderSide();renderTop();go(CUR,SUBJ,true);toast('☁️ Progreso sincronizado');}
    if($('login').classList.contains('on')&&$('lp-pick').style.display!=='none')renderUsers();
  }).catch(()=>{});
}

// ═══════════ BOOT ═══════════
document.addEventListener('DOMContentLoaded',()=>{
  STORE=loadLocal()||{users:{},lastUser:null};
  if(!STORE.users)STORE.users={};
  const last=STORE.lastUser;
  if(last&&STORE.users[last])enter(last);else showLogin();
  if(window.supabase)sbReady();
  $('sheet-back').addEventListener('click',e=>{if(e.target.id==='sheet-back')closeSheet();});
});
