/* World English – shared app logic */
(function(){
const LS={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const C=window.CHAPTERS||{};
const ids=Object.keys(C).map(Number).sort((a,b)=>a-b);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const scores=()=>LS.get('we_scores',{});
const setScore=(id,s,t)=>{const o=scores();const prev=o[id]||{best:0,total:t,tries:0};o[id]={best:Math.max(prev.best,s),last:s,total:t,tries:(prev.tries||0)+1};LS.set('we_scores',o)};

/* ---------- Speech ---------- */
const TTS={voices:[],accent:LS.get('we_accent','en-US'),rate:LS.get('we_rate',0.9),cur:null,
 load(){if(!('speechSynthesis'in window))return;this.voices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang))},
 pick(){const want=this.accent.toLowerCase().replace('_','-');
  const pool=this.voices.filter(v=>v.lang.toLowerCase().replace('_','-')===want);
  const rank=v=>(/natural|neural|premium|enhanced|google|samantha|daniel|serena|ava|aria|jenny|libby|sonia/i.test(v.name)?0:1);
  const list=(pool.length?pool:this.voices).slice().sort((a,b)=>rank(a)-rank(b));return list[0]||null},
 stop(){if('speechSynthesis'in window)speechSynthesis.cancel();this.cur=null;$$('.sent.playing').forEach(e=>e.classList.remove('playing'))},
 say(text,done,el){
  if(!('speechSynthesis'in window)){alert('이 브라우저는 음성 재생을 지원하지 않습니다. Chrome, Edge, Safari 최신 버전을 사용해 주세요.');return}
  this.stop();const u=new SpeechSynthesisUtterance(text);const v=this.pick();if(v){u.voice=v;u.lang=v.lang}else u.lang=this.accent;
  u.rate=this.rate;if(el)el.classList.add('playing');
  u.onend=u.onerror=()=>{if(el)el.classList.remove('playing');done&&done()};speechSynthesis.speak(u)}};
if('speechSynthesis'in window){TTS.load();speechSynthesis.onvoiceschanged=()=>TTS.load()}
window.TTS=TTS;

function voiceBar(){
  return `<div class="voice" title="발음 설정"><span class="lab">🔊</span>
  <select id="acc"><option value="en-US">미국 발음</option><option value="en-GB">영국 발음</option></select>
  <select id="spd"><option value="0.7">느리게</option><option value="0.9">보통</option><option value="1.1">빠르게</option></select></div>`}
function initVoice(){
  const a=$('#acc'),s=$('#spd');if(!a)return;a.value=TTS.accent;s.value=String(TTS.rate);
  a.onchange=()=>{TTS.accent=a.value;LS.set('we_accent',a.value)};
  s.onchange=()=>{TTS.rate=parseFloat(s.value);LS.set('we_rate',TTS.rate)};}

/* ---------- Home ---------- */
function home(){
  const sc=scores();const done=ids.filter(i=>sc[i]).length;
  const avg=done?Math.round(ids.filter(i=>sc[i]).reduce((a,i)=>a+sc[i].best/sc[i].total*100,0)/done):0;
  $('#stats').innerHTML=`<div class="stat"><b>${ids.length}</b><span>전체 단원</span></div><div class="stat"><b>${done}</b><span>퀴즈 완료</span></div><div class="stat"><b>${avg}%</b><span>평균 최고 점수</span></div>`;
  const parts={};ids.forEach(i=>{const c=C[i];(parts[c.part]=parts[c.part]||{t:c.partTitle,e:c.partEn,l:[]}).l.push(c)});
  $('#lessons').innerHTML=Object.keys(parts).sort((a,b)=>a-b).map(p=>{const P=parts[p];
   return `<div class="part"><h2>${p>0?'Part '+p+' · ':''}${esc(P.t)} <em>${esc(P.e)}</em></h2><div class="bar"></div></div><div class="grid">`+
   P.l.map(c=>{const s=sc[c.id];const th=c.images&&c.images[0]?`<div class="thumb" style="background-image:url('${c.images[0].file}')"></div>`:'';
    return `<a class="card" href="chapter.html?n=${c.id}">${th}<span class="no">${c.id===0?'PROLOGUE':'LESSON '+String(c.id).padStart(2,'0')}</span><h3>${esc(c.title)}</h3><span class="en">${esc(c.en)}</span>
    <span class="meta"><span>${esc(c.period)} · p.${esc(c.pages)}</span>${s?`<span class="badge done">최고 ${s.best}/${s.total}</span>`:'<span class="badge">미완료</span>'}</span></a>`}).join('')+`</div>`}).join('');
  $('#vb').innerHTML=voiceBar();initVoice();
  $('#reset').onclick=()=>{if(confirm('이 기기에 저장된 모든 점수를 삭제할까요?')){LS.set('we_scores',{});home()}};
}

/* ---------- Chapter ---------- */
function chapter(){
  const n=parseInt(new URLSearchParams(location.search).get('n')||'1',10);const c=C[n];
  if(!c){$('#app').innerHTML='<p>단원을 찾을 수 없습니다. <a href="index.html">메인으로</a></p>';return}
  document.title=`${c.id===0?'Prologue':'Lesson '+c.id} · ${c.title} | World English`;
  $('#vb').innerHTML=voiceBar();initVoice();
  const idx=ids.indexOf(n),prev=C[ids[idx-1]],next=C[ids[idx+1]];
  const spk=t=>`<button class="spk" data-say="${esc(t)}" aria-label="듣기">🔊</button>`;
  const gal=c.images&&c.images.length?`<section class="blk" id="img"><h2>교재 자료 사진</h2><div class="gallery">${c.images.map((m,i)=>`<figure data-i="${i}"><img loading="lazy" src="${m.file}" alt="${esc(m.cap)}"><figcaption>교재 p.${m.page} · ${esc(m.cap)}</figcaption></figure>`).join('')}</div><p class="note-c">※ 학습용으로 교재 일부 페이지만 발췌했습니다. 전체 내용은 교재를 참고하세요.</p></section>`:'';
  $('#app').innerHTML=`
  <div class="ch-hero"><div class="crumb"><a href="index.html">메인</a> › ${c.part>0?'Part '+c.part+' '+esc(c.partTitle):'서문'}</div>
   <h1>${c.id===0?'':String(c.id)+'. '}${esc(c.title)}</h1><div class="en">${esc(c.en)}</div>
   <div class="chips"><span class="chip">🕰 ${esc(c.period)}</span><span class="chip">📖 교재 p.${esc(c.pages)}</span><span class="chip">📝 퀴즈 ${c.quiz.length}문항</span></div></div>
  <nav class="sub"><div class="wrap"><a href="#sum">개요</a><a href="#read">읽기·듣기</a><a href="#vocab">핵심 단어</a><a href="#ex">예문</a>${c.images&&c.images.length?'<a href="#img">자료 사진</a>':''}<a href="#quiz">연습문제</a></div></nav>
  <section class="blk" id="sum"><h2>단원 개요</h2><div class="panel"><p>${esc(c.intro)}</p><ul class="kp">${c.keyPoints.map(k=>`<li>${esc(k)}</li>`).join('')}</ul>
   <div class="tl">${c.timeline.map(t=>`<div class="ev"><b>${esc(t.y)}</b><span>${esc(t.t)}</span></div>`).join('')}</div></div></section>
  <section class="blk" id="read"><h2>읽기 · 듣기 — ${esc(c.reading.title)}</h2>
   <div class="tools"><button class="btn" id="playall">▶ 전체 듣기</button><button class="btn ghost" id="stopall">■ 정지</button><button class="btn ghost" id="toggleko">한글 해석 숨기기</button></div>
   <div class="read">${c.reading.sentences.map((s,i)=>`<div class="sent" data-i="${i}">${spk(s.en)}<div class="t"><div class="e">${esc(s.en)}</div><div class="k">${esc(s.ko)}</div></div></div>`).join('')}</div></section>
  <section class="blk" id="vocab"><h2>핵심 단어</h2><div class="vgrid">${c.vocab.map(v=>`<div class="vc"><div class="w">${esc(v.w)}${spk(v.w)}</div><div class="ph">${esc(v.ph)}</div><div class="ko">${esc(v.ko)}</div><div class="note">${esc(v.note)}</div><div class="ex" data-say="${esc(v.ex)}">🔊 ${esc(v.ex)}</div></div>`).join('')}</div></section>
  <section class="blk" id="ex"><h2>예문 따라 말하기</h2><div class="read">${c.examples.map(s=>`<div class="sent">${spk(s.en)}<div class="t"><div class="e">${esc(s.en)}</div><div class="k">${esc(s.ko)}</div></div></div>`).join('')}</div></section>
  ${gal}
  <section class="blk" id="quiz"><h2>연습문제</h2><div id="quizbox"></div></section>
  <div class="pager">${prev?`<a href="chapter.html?n=${prev.id}"><small>← 이전 단원</small><b>${esc(prev.title)}</b></a>`:'<span></span>'}${next?`<a class="nx" href="chapter.html?n=${next.id}"><small>다음 단원 →</small><b>${esc(next.title)}</b></a>`:'<a class="nx" href="index.html"><small>마지막 단원</small><b>메인으로</b></a>'}</div>
  <div class="lb" id="lb"><button aria-label="닫기">×</button><img alt=""><p></p></div>`;
  // speech
  document.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){TTS.say(b.dataset.say,null,b.closest('.sent'))}});
  $('#playall').onclick=()=>{const els=$$('#read .sent');let i=0;const go=()=>{if(i>=els.length){return}const el=els[i++];TTS.say(c.reading.sentences[i-1].en,go,el)};go()};
  $('#stopall').onclick=()=>TTS.stop();
  let hid=false;$('#toggleko').onclick=e=>{hid=!hid;$$('#read .sent').forEach(s=>s.classList.toggle('hide-ko',hid));e.target.textContent=hid?'한글 해석 보기':'한글 해석 숨기기'};
  // lightbox
  const lb=$('#lb');$$('.gallery figure').forEach(f=>f.onclick=()=>{const m=c.images[f.dataset.i];$('img',lb).src=m.file;$('p',lb).textContent=`교재 p.${m.page} · ${m.cap}`;lb.classList.add('on')});
  lb.onclick=()=>lb.classList.remove('on');document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on')});
  // scrollspy
  const links=$$('nav.sub a');const obs=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id))}),{rootMargin:'-40% 0px -55% 0px'});$$('section.blk').forEach(s=>obs.observe(s));
  quiz(c);
}

/* ---------- Quiz ---------- */
const norm=s=>String(s).toLowerCase().trim().replace(/[.,!?;:'"’]/g,'').replace(/\s+/g,' ');
function quiz(c,only){
  const box=$('#quizbox');const Q=only?only.map(i=>c.quiz[i]):c.quiz;const map=only||c.quiz.map((_,i)=>i);
  box.innerHTML=`<div class="qprog"><i id="qp"></i></div><form id="qf">`+Q.map((q,i)=>{
    let body='';
    if(q.type==='mc')body=`<div class="opts">${q.opts.map((o,j)=>`<label class="opt"><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join('')}</div>`;
    else if(q.type==='tf')body=`<div class="opts"><label class="opt"><input type="radio" name="q${i}" value="true"><span>True (맞다)</span></label><label class="opt"><input type="radio" name="q${i}" value="false"><span>False (틀리다)</span></label></div>`;
    else body=`<div class="fill"><input type="text" name="q${i}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="정답을 영어로 입력"></div>`;
    return `<div class="q" id="q${i}"><div class="qh"><span class="n">${i+1}</span><div class="qt">${esc(q.q)}<div class="qk">${esc(q.qk)}</div></div></div>${body}<div class="fb" hidden></div></div>`}).join('')+
   `<div class="tools"><button type="submit" class="btn">채점하기</button><button type="button" class="btn ghost" id="rs">초기화</button></div></form><div id="res"></div>`;
  const form=$('#qf');
  const upd=()=>{let a=0;Q.forEach((q,i)=>{const v=form.elements['q'+i];const val=v.length!==undefined&&v.type===undefined?(form.querySelector(`[name=q${i}]:checked`)||{}).value:v.value;if(val!==undefined&&String(val).trim()!=='')a++});$('#qp').style.width=a/Q.length*100+'%'};
  form.addEventListener('input',upd);form.addEventListener('change',upd);
  $('#rs').onclick=()=>quiz(c,only);
  form.onsubmit=e=>{e.preventDefault();let score=0;const wrong=[];
   Q.forEach((q,i)=>{const el=$('#q'+i);let ok=false,given;
    if(q.type==='fill'){given=form.elements['q'+i].value;ok=q.a.some(a=>norm(a)===norm(given))}
    else{const ch=form.querySelector(`[name=q${i}]:checked`);given=ch?ch.value:null;ok=given!==null&&(q.type==='mc'?+given===q.a:(given==='true')===q.a)}
    el.classList.remove('ok','bad');el.classList.add(ok?'ok':'bad');if(ok)score++;else wrong.push(map[only?i:i]);
    if(q.type==='mc'){$$('.opt',el).forEach((o,j)=>{o.classList.remove('right','wrong');if(j===q.a)o.classList.add('right');else if(given!==null&&+given===j)o.classList.add('wrong')})}
    if(q.type==='tf'){$$('.opt',el).forEach(o=>{const v=$('input',o).value==='true';o.classList.remove('right','wrong');if(v===q.a)o.classList.add('right');else if(given!==null&&(given==='true')===v)o.classList.add('wrong')})}
    const ans=q.type==='mc'?q.opts[q.a]:q.type==='tf'?(q.a?'True':'False'):q.a[0];
    const fb=$('.fb',el);fb.hidden=false;fb.innerHTML=`<span class="v">${ok?'✔ 정답!':'✘ 오답'}</span>${ok?'':` 정답: <b>${esc(ans)}</b>`}<br>${esc(q.ex)}`});
   if(!only)setScore(c.id,score,Q.length);
   const pct=Math.round(score/Q.length*100);const msg=pct===100?'완벽해요! 🎉':pct>=80?'훌륭해요!':pct>=60?'좋아요, 조금만 더!':'해설을 읽고 다시 도전해 보세요.';
   const sc=scores()[c.id];
   $('#res').innerHTML=`<div class="result"><div class="sc">${score} / ${Q.length}</div><div>${pct}점 · ${msg}</div>${sc&&!only?`<div class="msg">내 최고 점수: ${sc.best}/${sc.total} · 도전 ${sc.tries}회</div>`:''}
    <div class="tools" style="justify-content:center;margin-top:12px">${wrong.length?'<button class="btn" id="rw">틀린 문제만 다시 풀기</button>':''}<button class="btn ghost" id="ra">전체 다시 풀기</button></div></div>`;
   $('#qp').style.width='100%';
   const rw=$('#rw');if(rw)rw.onclick=()=>{quiz(c,wrong);$('#quiz').scrollIntoView()};$('#ra').onclick=()=>{quiz(c);$('#quiz').scrollIntoView()};
   $('#res').scrollIntoView({behavior:'smooth',block:'center'});
  };
}
window.WE={home,chapter};
})();
