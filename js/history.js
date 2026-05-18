// ─── ИСТОРИЯ ТРЕНИРОВОК ──────────────────────────────────────

function renderHistory(){
  var el=document.getElementById('history-list');
  var wo=S.workouts||[];
  if(wo.length===0){
    el.innerHTML='<div style="color:var(--text2);font-size:13px;font-weight:500;padding:24px 0">Тренировок пока нет</div>';
    return;
  }
  el.innerHTML=wo.map(function(w,wi){
    var v=w.volume?(Math.round(w.volume)+' кг'):'—';
    var exs=(w.exercises||[]).map(function(e){return '<span class="hist-ex">'+e+'</span>';}).join(' · ');
    return '<div class="hist-item"><div class="hist-row"><div><div class="hist-name">'+w.name+'</div><div class="hist-date">'+w.date+'</div></div><div style="display:flex;align-items:center;gap:10px"><div class="hist-vol">'+v+'</div><button onclick="deleteWorkout('+wi+')" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;padding:0 4px;line-height:1">×</button></div></div><div class="hist-exs" style="margin-top:8px">'+exs+'</div></div>';
  }).join('');
}

// ─── ПРОГРЕСС ────────────────────────────────────────────────

function renderProgress(){
  var el=document.getElementById('progress-content');
  var wo=S.workouts||[];
  if(wo.length===0){
    el.innerHTML='<div style="color:var(--text2);font-size:13px;font-weight:500;padding:24px 0">Завершённых тренировок пока нет</div>';
    return;
  }
  var exMap={};
  wo.forEach(function(w){
    (w.exercises||[]).forEach(function(eName){
      if(!exMap[eName])exMap[eName]=[];
      exMap[eName].push({date:w.date,vol:w.volume||0});
    });
  });
  var html='';
  Object.keys(exMap).slice(0,5).forEach(function(name){
    var entries=exMap[name].slice(0,6).reverse();
    var maxVol=Math.max.apply(null,entries.map(function(e){return e.vol;}));
    var bars=entries.map(function(e,i){
      var h=maxVol>0?Math.round(e.vol/maxVol*100):10;
      var isCurr=i===entries.length-1;
      return '<div class="mc-bar'+(isCurr?' current':'')+'" style="height:'+h+'%" title="'+e.date+'"></div>';
    }).join('');
    html+='<div class="prog-exercise"><div class="prog-ex-name">'+name+'</div><div class="mini-chart">'+bars+'</div></div>';
  });
  el.innerHTML=html||'<div style="color:var(--text2);font-size:13px;">Данные появятся после тренировок</div>';
}

// ─── ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ────────────────────────────────────

function switchTab(tab){
  ['hist','prog','nut'].forEach(function(t){
    var btn=document.getElementById('tab-'+t);
    var cont=document.getElementById('tab-'+t+'-content');
    var isActive=t===tab;
    if(btn){btn.style.background=isActive?'var(--bg4)':'transparent';btn.style.color=isActive?'var(--text)':'var(--text2)';}
    if(cont)cont.style.display=isActive?'':'none';
  });
}
