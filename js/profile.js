// ─── ПРОФИЛЬ ─────────────────────────────────────────────────

function saveProf(){
  S.profile={
    name:document.getElementById('p-name').value,
    weight:document.getElementById('p-weight').value,
    height:document.getElementById('p-height').value,
    goal:document.getElementById('p-goal').value,
    level:document.getElementById('p-level').value,
    photo:(S.profile&&S.profile.photo)||''
  };
  sv();updateProfDisplay();
}

function updateProfDisplay(){
  var p=S.profile||{};
  document.getElementById('pn-disp').textContent=p.name||'Атлет';
  document.getElementById('pg-disp').textContent=p.goal||'';
  document.getElementById('pl-disp').textContent=p.level||'';
}

function onPhoto(input){
  if(!input.files||!input.files[0])return;
  var r=new FileReader();
  r.onload=function(e){
    compressImage(e.target.result,300,300,function(src){
      document.getElementById('prof-img').src=src;
      document.getElementById('prof-img').style.display='';
      document.getElementById('prof-svg').style.display='none';
      if(!S.profile)S.profile={};S.profile.photo=src;sv();
    });
  };
  r.readAsDataURL(input.files[0]);
}

function loadMeasureInputs(){
  var m=S.measures||{};
  ['chest','waist','hips','arm','thigh','calf','fat'].forEach(function(k){
    var el=document.getElementById('mi-'+k);if(el)el.value=m[k]||'';
  });
}

function saveMeasures(){
  S.measures={
    chest:document.getElementById('mi-chest').value,
    waist:document.getElementById('mi-waist').value,
    hips:document.getElementById('mi-hips').value,
    arm:document.getElementById('mi-arm').value,
    thigh:document.getElementById('mi-thigh').value,
    calf:document.getElementById('mi-calf').value,
    fat:document.getElementById('mi-fat').value
  };
  sv();updateMeasureDisplay();
  document.getElementById('m-modal').style.display='none';
}

function updateMeasureDisplay(){
  var m=S.measures||{};
  document.getElementById('dm-chest').textContent=m.chest?m.chest+'см':'—';
  document.getElementById('dm-waist').textContent=m.waist?m.waist+'см':'—';
  document.getElementById('dm-hips').textContent=m.hips?m.hips+'см':'—';
  document.getElementById('dm-arm').textContent=m.arm?m.arm+'см':'—';
  document.getElementById('dm-thigh').textContent=m.thigh?m.thigh+'см':'—';
  document.getElementById('dm-calf').textContent=m.calf?m.calf+'см':'—';
}

// ─── ВКЛАДКИ ПРОФИЛЯ ─────────────────────────────────────────

function switchProfTab(tab){
  ['info','eq'].forEach(function(t){
    var btn=document.getElementById('ptab-'+t);
    var cont=document.getElementById('ptab-'+t+'-content');
    var on=t===tab;
    if(btn){btn.style.background=on?'var(--bg4)':'transparent';btn.style.color=on?'var(--text)':'var(--text2)';}
    if(cont)cont.style.display=on?'':'none';
  });
  if(tab==='eq')renderProfGyms();
}

function renderProfGyms(){
  var el=document.getElementById('prof-gyms-list');if(!el)return;
  el.innerHTML='';
  var gyms=getAllGyms();
  if(gyms.length===0){
    el.innerHTML='<div style="color:var(--text2);font-size:13px;text-align:center;padding:24px 0">Залы не добавлены</div>';
    return;
  }
  gyms.forEach(function(g){
    var cnt=(g.equipment||[]).length;
    var suf=cnt===1?'':cnt>1&&cnt<5?'а':'ов';
    var d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--bg3);border-radius:14px;margin-bottom:8px;border:1px solid var(--border)';
    d.innerHTML='<div><div style="font-size:15px;font-weight:700;margin-bottom:2px">'+g.name+'</div><div style="font-size:12px;color:var(--text2);font-weight:600">'+cnt+' тренажёр'+suf+'</div></div>';
    (function(gid){d.onclick=function(){goPage('gym');openGymDetail(gid);};})(g.id);
    el.appendChild(d);
  });
}

function renderProfEq(){
  var el=document.getElementById('prof-eq-list');if(!el)return;
  var eq=S.equipment||[];
  if(eq.length===0){
    el.innerHTML='<div style="color:var(--text2);font-size:13px;font-weight:500;padding:24px 0;text-align:center">Тренажёры не добавлены</div>';
    return;
  }
  el.innerHTML=eq.map(function(e,i){
    var img=e.photo
      ?'<img src="'+e.photo+'" style="width:56px;height:56px;object-fit:cover;border-radius:12px;flex-shrink:0">'
      :'<div style="width:56px;height:56px;background:var(--bg4);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg></div>';
    var ms=(e.muscles||[]).map(function(m){return '<span style="font-size:10px;font-weight:700;background:var(--green-dim);color:var(--green);border-radius:4px;padding:2px 6px">'+m+'</span>';}).join(' ');
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+img+'<div style="flex:1"><div style="font-size:14px;font-weight:700;margin-bottom:5px">'+e.name+'</div><div style="display:flex;flex-wrap:wrap;gap:3px">'+ms+'</div></div><button onclick="delEq('+i+');renderProfEq();" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;padding:0 4px">×</button></div>';
  }).join('');
}
