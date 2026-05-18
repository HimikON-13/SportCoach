// ─── ГЛАВНАЯ СТРАНИЦА ────────────────────────────────────────

function updateHome(){
  var wo=S.workouts||[];
  var filtered=typeof filterWoByPeriod==='function'?filterWoByPeriod(wo):wo;
  var vol=filtered.reduce(function(a,w){return a+(w.volume||0);},0);
  document.getElementById('ring-val').textContent=Math.round(vol);
  var pct=Math.min(vol/10000,1);
  var circ=2*Math.PI*95;
  document.getElementById('ring-fill').style.strokeDasharray=circ;
  document.getElementById('ring-fill').style.strokeDashoffset=circ*(1-pct);

  var totalSets=wo.reduce(function(a,w){return a+(w.totalSets||0);},0);
  var totalEq=(S.equipment||[]).length;
  (S.gyms||[]).forEach(function(g){totalEq+=(g.equipment||[]).length;});
  document.getElementById('hs-wo').textContent=wo.length;
  document.getElementById('hs-sets').textContent=totalSets;
  document.getElementById('hs-eq').textContent=totalEq;

  var el=document.getElementById('activity-feed');
  if(wo.length===0){
    el.innerHTML='<div style="color:var(--text2);font-size:13px;font-weight:500;padding:20px 0">Тренировок пока нет. Начни первую!</div>';
    return;
  }
  el.innerHTML=wo.slice(0,5).map(function(w){
    var v=w.volume?(Math.round(w.volume)+' кг'):'—';
    return '<div class="af-item"><div class="af-left"><div class="af-name">'+w.name+'</div><div class="af-date">'+w.date+'</div></div><div style="text-align:right"><div class="af-vol">'+v+'</div><div class="af-vol-unit">объём</div></div></div>';
  }).join('');
}

// ─── ТИПЫ ТРЕНИРОВКИ + ЧИПЫ ──────────────────────────────────

function buildWTypeGrid(){
  var el=document.getElementById('wtype-grid');el.innerHTML='';
  WTYPES.forEach(function(t){
    var d=document.createElement('div');
    d.className='wt-btn'+(S.selectedWType===t.v?' on':'');
    d.innerHTML='<div class="wt-btn-name">'+t.v+'</div><div class="wt-btn-desc">'+t.d+'</div>';
    d.onclick=function(){
      S.selectedWType=t.v;
      document.querySelectorAll('.wt-btn').forEach(function(b){b.classList.remove('on');});
      d.classList.add('on');
      setChips('muscle-chips','selMuscles',MUSCLE_MAP[t.v]||[]);
    };
    el.appendChild(d);
  });
}

function makeChips(cid,arr,sk,cwid){
  var el=document.getElementById(cid);if(!el)return;
  el.innerHTML='';if(!S[sk])S[sk]=[];
  arr.forEach(function(m){
    var c=document.createElement('div');
    c.className='chip'+(S[sk].indexOf(m)>=0?' on':'');
    c.textContent=m;
    c.onclick=function(){
      c.classList.toggle('on');
      S[sk]=[];
      el.querySelectorAll('.chip.on').forEach(function(x){S[sk].push(x.textContent);});
      if(cwid){var w=document.getElementById(cwid);if(w)w.style.display=S[sk].indexOf('Другое')>=0?'':'none';}
    };
    el.appendChild(c);
  });
}

function setChips(cid,sk,vals){
  S[sk]=vals.slice();
  var el=document.getElementById(cid);if(!el)return;
  el.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('on',vals.indexOf(c.textContent)>=0);});
}

// ─── ФИЛЬТР ПЕРИОДА ──────────────────────────────────────────

var currentPeriod='day';
var calFrom=null,calTo=null;

function setPeriod(p){
  currentPeriod=p;calFrom=null;calTo=null;
  ['day','week','month','all'].forEach(function(t){
    var btn=document.getElementById('pb-'+t);
    if(btn)btn.classList.toggle('on',t===p);
  });
  var labels={day:'Объём за день',week:'Объём за неделю',month:'Объём за месяц',all:'Объём за всё время'};
  var lbl=document.getElementById('ring-label');
  if(lbl)lbl.textContent=labels[p]||'';
  updateHome();
}

function filterWoByPeriod(wo){
  var now=new Date();now.setHours(23,59,59,999);
  if(currentPeriod==='custom'&&calFrom&&calTo){
    var f=new Date(calFrom);var t=new Date(calTo);t.setHours(23,59,59,999);
    return wo.filter(function(w){var d=new Date(w.rawDate||w.date);return d>=f&&d<=t;});
  }
  if(currentPeriod==='all')return wo;
  var msAgo={day:86400000,week:7*86400000,month:30*86400000}[currentPeriod]||86400000;
  var from=new Date(now-msAgo);
  return wo.filter(function(w){var d=new Date(w.rawDate||w.date);return d>=from&&d<=now;});
}

// ─── ПОДСКАЗКА ПО ТРЕНАЖЁРАМ ─────────────────────────────────

var updateEqHint=function(){
  var eq=getEqForWorkout?getEqForWorkout():(S.equipment||[]);
  var h=document.getElementById('eq-hint');if(!h)return;
  if(eq.length===0)h.textContent='Добавь тренажёры в зал или выбери зал выше';
  else h.textContent=eq.slice(0,3).map(function(e){return e.name;}).join(', ')+(eq.length>3?' +'+(eq.length-3):'');
};
