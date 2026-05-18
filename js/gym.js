// ─── ЗАЛЫ И ТРЕНАЖЁРЫ ────────────────────────────────────────

function compressImage(dataUrl,maxW,maxH,cb){
  var img=new Image();
  img.onload=function(){
    var w=img.width,h=img.height;
    if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}
    if(h>maxH){w=Math.round(w*maxH/h);h=maxH;}
    var c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    cb(c.toDataURL('image/jpeg',0.65));
  };
  img.src=dataUrl;
}

function getAllGyms(){
  var gyms=S.gyms||[];
  if(S.equipment&&S.equipment.length>0){
    return [{id:'legacy',name:'Мой зал',equipment:S.equipment}].concat(gyms);
  }
  return gyms;
}

function getActiveGymEq(){
  if(!S.activeGymId)return S.equipment||[];
  var gym=(S.gyms||[]).find(function(g){return g.id===S.activeGymId;});
  return gym?gym.equipment:[];
}

function getEqForWorkout(){
  if(!S.activeGymId){
    var all=(S.equipment||[]).slice();
    (S.gyms||[]).forEach(function(g){all=all.concat(g.equipment||[]);});
    return all;
  }
  var gym=getAllGyms().find(function(g){return g.id==S.activeGymId;});
  return gym?gym.equipment:[];
}

function addEqToActiveGym(item){
  if(!S.activeGymId||S.activeGymId==='legacy'){
    if(!S.equipment)S.equipment=[];
    S.equipment.push(item);
  } else {
    var gym=(S.gyms||[]).find(function(g){return g.id===S.activeGymId;});
    if(gym){if(!gym.equipment)gym.equipment=[];gym.equipment.push(item);}
  }
}

function delEq(i){
  if(!S.activeGymId||S.activeGymId==='legacy'){
    S.equipment.splice(i,1);
  } else {
    var gym=(S.gyms||[]).find(function(g){return g.id===S.activeGymId;});
    if(gym)gym.equipment.splice(i,1);
  }
  sv();renderEq();updateHome();
}

function renderEq(){
  var el=document.getElementById('eq-list');if(!el)return;el.innerHTML='';
  var eqArr=getActiveGymEq();
  eqArr.forEach(function(eq,i){
    var ms=(eq.muscles||[]).map(function(m){return '<span class="eq-m">'+m+'</span>';}).join('');
    var img=eq.photo
      ?'<img src="'+eq.photo+'" style="width:100%;height:100%;object-fit:cover">'
      :'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--text3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>';
    var d=document.createElement('div');d.className='eq-card';
    d.innerHTML='<div class="eq-ph">'+img+'</div><button class="eq-del" onclick="delEq('+i+')">×</button><div class="eq-body"><div class="eq-name">'+eq.name+'</div><div class="eq-muscles">'+ms+'</div></div>';
    el.appendChild(d);
  });
}

// ─── СПИСОК ЗАЛОВ ────────────────────────────────────────────

function openNewGymModal(){
  document.getElementById('new-gym-name').value='';
  document.getElementById('new-gym-modal').style.display='flex';
}

function createGym(){
  var name=document.getElementById('new-gym-name').value.trim();if(!name)return;
  if(!S.gyms)S.gyms=[];
  var gym={id:Date.now(),name:name,equipment:[]};
  S.gyms.push(gym);
  sv();renderGyms();
  document.getElementById('new-gym-modal').style.display='none';
  openGymDetail(gym.id);
}

function renderGyms(){
  var el=document.getElementById('gyms-list');if(!el)return;
  el.innerHTML='';
  var gyms=S.gyms||[];
  if(S.equipment&&S.equipment.length>0){
    gyms=[{id:'legacy',name:'Мой зал',equipment:S.equipment}].concat(gyms);
  }
  if(gyms.length===0){
    el.innerHTML='<div style="text-align:center;color:var(--text2);font-size:13px;padding:32px 0">Залы не добавлены. Нажми Новый зал.</div>';
    updateGymSelector();return;
  }
  gyms.forEach(function(g){
    var cnt=(g.equipment||[]).length;
    var suf=cnt===1?'':cnt>1&&cnt<5?'а':'ов';
    var d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--bg3);border-radius:16px;margin-bottom:10px;cursor:pointer;border:1px solid var(--border)';
    d.innerHTML='<div><div style="font-size:16px;font-weight:800;margin-bottom:3px">'+g.name+'</div><div style="font-size:12px;color:var(--text2);font-weight:600">'+cnt+' тренажёр'+suf+'</div></div>';
    (function(gid){d.onclick=function(){openGymDetail(gid);};})(g.id);
    el.appendChild(d);
  });
  updateGymSelector();
}

function openGymDetail(gymId){
  S.activeGymId=gymId;sv();
  document.getElementById('gyms-list').style.display='none';
  var gymTopRow=document.querySelector('#p-gym > div:first-child');if(gymTopRow)gymTopRow.style.display='none';
  document.getElementById('gym-detail').style.display='';
  var gym=getAllGyms().find(function(g){return g.id==gymId;});
  document.getElementById('gym-detail-name').textContent=gym?gym.name:'';
  renderEq();
}

function backToGyms(){
  S.activeGymId=null;sv();
  document.getElementById('gyms-list').style.display='';
  document.getElementById('gym-detail').style.display='none';
  var topRow=document.querySelector('#p-gym > div:first-child');if(topRow)topRow.style.display='';
  renderGyms();
}

function deleteCurrentGym(){
  if(!S.activeGymId||S.activeGymId==='legacy')return;
  if(!confirm('Удалить этот зал и все его тренажёры?'))return;
  S.gyms=(S.gyms||[]).filter(function(g){return g.id!==S.activeGymId;});
  sv();backToGyms();
}

function updateGymSelector(){
  var sel=document.getElementById('gym-selector');if(!sel)return;
  var gyms=getAllGyms();
  sel.innerHTML='<option value="">Все тренажёры</option>'+gyms.map(function(g){return '<option value="'+g.id+'">'+g.name+'</option>';}).join('');
  if(S.activeGymId)sel.value=S.activeGymId;
}

function onGymSelect(){
  S.activeGymId=document.getElementById('gym-selector').value||null;
  sv();updateEqHint();
}

// ─── СКАНИРОВАНИЕ / ДОБАВЛЕНИЕ ВРУЧНУЮ ──────────────────────

function openCamForCurrentGym(){
  document.getElementById('cam-modal').style.display='flex';
  document.getElementById('cm-upload').style.display='';
  document.getElementById('cm-scanning').style.display='none';
  document.getElementById('cm-result').style.display='none';
  document.getElementById('cm-manual').style.display='none';
}
function openCam(){openCamForCurrentGym();}

async function scanEquip(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  var reader=new FileReader();
  reader.onload=async function(e){
    compressImage(e.target.result,600,450,function(compressed){S.scanPhoto=compressed;});
    var b64=e.target.result.split(',')[1];
    document.getElementById('cm-upload').style.display='none';
    document.getElementById('cm-scanning').style.display='';
    var prompt='На фото тренажёр. Ответь ТОЛЬКО JSON без markdown:\n{"name":"Название","muscles":["м1","м2"],"description":"Как использовать, 2 предложения"}\nMuscles только из: Грудь,Спина,Плечи,Бицепс,Трицепс,Квадрицепс,Бицепс бедра,Икры,Пресс,Ягодицы';
    try{
      var res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:file.type,data:b64}},{type:'text',text:prompt}]}],max_tokens:300})});
      var data=await res.json();
      var p=JSON.parse(data.text.replace(/```json/g,'').replace(/```/g,'').trim());
      document.getElementById('cm-scanning').style.display='none';
      document.getElementById('cm-result').style.display='';
      document.getElementById('sr-name').textContent=p.name;
      document.getElementById('sr-name-inp').value=p.name;
      document.getElementById('sr-desc').textContent=p.description;
      setChips('sr-chips','scanMuscles',p.muscles||[]);
    }catch(e){
      document.getElementById('cm-scanning').style.display='none';
      document.getElementById('cm-upload').style.display='';
      alert('Не удалось распознать. Попробуй другое фото.');
    }
  };
  reader.readAsDataURL(file);input.value='';
}

function getMusclesWithCustom(sk,customId){
  var muscles=(S[sk]||[]).slice();
  var idx=muscles.indexOf('Другое');
  if(idx>=0){muscles.splice(idx,1);var c=document.getElementById(customId);if(c&&c.value.trim())muscles.push(c.value.trim());}
  return muscles;
}

function confirmScan(){
  var name=document.getElementById('sr-name-inp').value.trim();if(!name)return;
  addEqToActiveGym({name:name,muscles:getMusclesWithCustom('scanMuscles','sr-custom'),photo:S.scanPhoto});
  sv();renderEq();updateHome();
  document.getElementById('cam-modal').style.display='none';S.scanPhoto=null;
}

function resetScan(){
  document.getElementById('cm-result').style.display='none';
  document.getElementById('cm-upload').style.display='';
  S.scanPhoto=null;
}

function showManual(){
  document.getElementById('cm-upload').style.display='none';
  document.getElementById('cm-manual').style.display='';
  document.getElementById('mn-name').value='';
  document.querySelectorAll('#mn-chips .chip').forEach(function(c){c.classList.remove('on');});
  S.eqMuscles=[];
}

function addManual(){
  var name=document.getElementById('mn-name').value.trim();if(!name)return;
  addEqToActiveGym({name:name,muscles:getMusclesWithCustom('eqMuscles','mn-custom'),photo:null});
  sv();renderEq();updateHome();
  document.getElementById('cam-modal').style.display='none';
}
