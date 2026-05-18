// ─── ГЕНЕРАЦИЯ ТРЕНИРОВКИ ────────────────────────────────────

async function generateWorkout(){
  var eq=getEqForWorkout();
  if(eq.length===0){alert('Сначала добавь тренажёры в зал!');return;}
  if(!S.selectedWType){alert('Выбери тип тренировки!');return;}
  var btn=document.getElementById('gen-btn');btn.disabled=true;btn.textContent='Генерирую...';
  var p=S.profile||{},m=S.measures||{},focus=S.selMuscles||[];
  var eqLines=eq.map(function(e){return '- '+e.name+' ('+(e.muscles||[]).join(', ')+')';}).join('\n');
  var mStr=(m.chest||m.waist)?'\nЗамеры: грудь '+(m.chest||'?')+', талия '+(m.waist||'?')+' см'+(m.fat?', жир '+m.fat+'%':''):'';
  var fStr=focus.length>0?' Акцент: '+focus.join(', ')+'.':'';
  var prompt='Составь тренировку используя ТОЛЬКО это оборудование (не обязательно всё, выбери подходящее):\n'+eqLines+'\n\nПрофиль: цель - '+(p.goal||'Набор массы')+', уровень - '+(p.level||'Средний')+(p.weight?', вес - '+p.weight+' кг':'')+(p.height?', рост - '+p.height+' см':'')+'.'+mStr+'\nТип: '+S.selectedWType+'.'+fStr+'\n\nВСЕ названия упражнений и поля ТОЛЬКО на русском языке.\nОтветь ТОЛЬКО JSON без markdown и звёздочек:\n{"name":"Название","duration":"~60 мин","exercises":[{"name":"Упражнение","equipment":"Тренажёр","sets":3,"reps":"8-10","weight":"70 кг","rest":90,"technique":"Техника выполнения, 2-3 предложения"}],"notes":"Короткие рекомендации"}';
  try{
    var res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt}],max_tokens:1500})});
    var data=await res.json();
    var plan=JSON.parse(data.text.replace(/```json/g,'').replace(/```/g,'').trim());
    S.currentPlan=plan;renderActivePlan(plan);
  }catch(e){alert('Ошибка: '+e.message);}
  btn.disabled=false;btn.textContent='Сгенерировать';
}

// ─── РЕНДЕР АКТИВНОЙ ТРЕНИРОВКИ ──────────────────────────────

function renderActivePlan(plan){
  document.getElementById('wo-form').style.display='none';
  document.getElementById('wo-result').style.display='';
  document.getElementById('wo-title').textContent=plan.name;
  document.getElementById('wo-meta').textContent=plan.duration;
  S.totalSets=(plan.exercises||[]).reduce(function(a,e){return a+(e.sets||0);},0);
  S.doneCount=0;updateWoProg();
  var el=document.getElementById('wo-exercises');el.innerHTML='';
  (plan.exercises||[]).forEach(function(ex,ei){
    var sets='';
    for(var i=0;i<(ex.sets||3);i++){
      sets+='<div class="set-dot" id="sd-'+ei+'-'+i+'" onclick="toggleSet('+ei+','+i+','+ex.rest+')">'
        +'<div class="set-dot-reps" id="sr-'+ei+'">'+ex.reps+'</div>'
        +'<div style="font-size:10px;color:var(--text3);font-weight:700;margin-top:1px" id="sw-'+ei+'">'+ex.weight+'</div></div>';
    }
    var item=document.createElement('div');item.className='ex-item';
    item.innerHTML='<div class="ex-top-row"><div class="ex-name">'+ex.name+'</div></div>'
      +'<div class="ex-eq-tag">'+ex.equipment+' · отдых '+(ex.rest||90)+'с</div>'
      +'<div class="ex-sets-row">'+sets+'</div>'
      +'<div style="display:flex;gap:8px;margin-top:8px;align-items:center">'
      +'<div style="flex:1"><div class="flbl" style="margin-bottom:4px">Вес (кг)</div><input class="inp" type="number" id="ew-'+ei+'" value="'+parseFloat(ex.weight||0)+'" oninput="updateExField('+ei+',\'weight\',this.value)" style="padding:8px 10px;font-size:13px"></div>'
      +'<div style="flex:1"><div class="flbl" style="margin-bottom:4px">Повторения</div><input class="inp" type="text" id="er-'+ei+'" value="'+ex.reps+'" oninput="updateExField('+ei+',\'reps\',this.value)" style="padding:8px 10px;font-size:13px"></div>'
      +'<div style="flex:0 0 56px"><div class="flbl" style="margin-bottom:4px">Подходы</div><input class="inp" type="number" id="es-'+ei+'" value="'+(ex.sets||3)+'" min="1" max="10" oninput="updateExSets('+ei+',this.value)" style="padding:8px 10px;font-size:13px"></div>'
      +'</div>'
      +'<button style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);font-family:Manrope,sans-serif;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;margin-top:6px" onclick="applyToAllSets('+ei+')">Применить ко всем подходам</button>'
      +(ex.technique?'<button class="tech-toggle" onclick="toggleTech('+ei+')" style="margin-top:6px;display:block">Показать технику</button><div class="tech-body" id="tb-'+ei+'">'+ex.technique+'</div>':'');
    el.appendChild(item);
  });
}

// ─── УПРАВЛЕНИЕ ВЕСОМ / ПОВТОРЕНИЯМИ / ПОДХОДАМИ ─────────────

function updateExField(ei,field,val){
  if(!S.currentPlan||!S.currentPlan.exercises[ei])return;
  S.currentPlan.exercises[ei][field]=val;
  if(field==='weight'){document.querySelectorAll('[id="sw-'+ei+'"]').forEach(function(e){e.textContent=val;});}
  if(field==='reps'){document.querySelectorAll('[id="sr-'+ei+'"]').forEach(function(e){e.textContent=val;});}
}

function updateExSets(ei,newCount){
  if(!S.currentPlan||!S.currentPlan.exercises[ei])return;
  var ex=S.currentPlan.exercises[ei];
  var n=Math.max(1,Math.min(10,parseInt(newCount)||3));
  ex.sets=n;
  S.totalSets=S.currentPlan.exercises.reduce(function(a,e){return a+(e.sets||0);},0);
  updateWoProg();
  var row=document.getElementById('sd-'+ei+'-0');if(!row)return;
  var setsRow=row.parentElement;setsRow.innerHTML='';
  for(var i=0;i<n;i++){
    var dot=document.createElement('div');
    dot.className='set-dot';dot.id='sd-'+ei+'-'+i;
    dot.onclick=(function(eei,ssi,rr){return function(){toggleSet(eei,ssi,rr);};})(ei,i,ex.rest);
    dot.innerHTML='<div class="set-dot-reps" id="sr-'+ei+'">'+ex.reps+'</div><div style="font-size:10px;color:var(--text3);font-weight:700;margin-top:1px" id="sw-'+ei+'">'+ex.weight+'</div>';
    setsRow.appendChild(dot);
  }
}

function applyToAllSets(ei){
  var wEl=document.getElementById('ew-'+ei);
  var rEl=document.getElementById('er-'+ei);
  if(wEl)updateExField(ei,'weight',wEl.value);
  if(rEl)updateExField(ei,'reps',rEl.value);
  if(tg&&tg.HapticFeedback)tg.HapticFeedback.impactOccurred('light');
}

function toggleSet(ei,si,restSec){
  var btn=document.getElementById('sd-'+ei+'-'+si);if(!btn)return;
  var wasDone=btn.classList.contains('done');
  btn.classList.toggle('done');
  S.doneCount+=wasDone?-1:1;
  updateWoProg();
  if(!wasDone)startRest(defaultRestSec||restSec||90);
  if(tg&&tg.HapticFeedback)tg.HapticFeedback.impactOccurred('light');
}

function updateWoProg(){
  var pct=S.totalSets>0?Math.round(S.doneCount/S.totalSets*100):0;
  document.getElementById('wo-prog-fill').style.width=pct+'%';
  document.getElementById('wo-prog-text').textContent=S.doneCount+' / '+S.totalSets+' подходов';
}

function toggleTech(ei){var el=document.getElementById('tb-'+ei);if(el)el.classList.toggle('open');}

// ─── ЗАВЕРШЕНИЕ / СБРОС ──────────────────────────────────────

function finishWorkout(){
  if(!S.currentPlan)return;
  var vol=0;
  (S.currentPlan.exercises||[]).forEach(function(ex,ei){
    for(var si=0;si<(ex.sets||3);si++){
      var btn=document.getElementById('sd-'+ei+'-'+si);
      if(btn&&btn.classList.contains('done')){
        vol+=(parseFloat(ex.weight)||0)*(parseInt(ex.reps)||10);
      }
    }
  });
  if(!S.workouts)S.workouts=[];
  var doneSetsCnt=document.querySelectorAll('.set-dot.done').length;
  S.workouts.unshift({
    name:S.currentPlan.name,date:new Date().toLocaleDateString('ru'),
    rawDate:new Date().toISOString(),volume:vol,
    totalSets:doneSetsCnt,exercises:(S.currentPlan.exercises||[]).map(function(e){return e.name;})
  });
  S._pendingPlan=S.currentPlan;
  sv();updateHome();renderHistory();renderProgress();
  document.getElementById('wo-feedback-modal').style.display='flex';
}

function sendWorkoutFeedback(rating){
  document.getElementById('wo-feedback-modal').style.display='none';
  var plan=S._pendingPlan;S._pendingPlan=null;
  if(rating&&plan){
    var ratingText=rating==='easy'?'Тренировка была слишком лёгкой':rating==='hard'?'Тренировка была слишком тяжёлой':'Тренировка была в самый раз';
    var msg='Я только что завершил тренировку "'+plan.name+'". '+ratingText+'. Как скорректировать следующую тренировку?';
    S.chatHistory.push({role:'user',content:msg});
    fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:buildSys(),messages:S.chatHistory.slice(-20),max_tokens:600})})
      .then(function(r){return r.json();})
      .then(function(data){S.chatHistory.push({role:'assistant',content:data.text});sv();})
      .catch(function(){});
  }
  resetWorkout();
}

function deleteWorkout(i){
  if(!confirm('Удалить тренировку "'+S.workouts[i].name+'"?'))return;
  S.workouts.splice(i,1);
  sv();updateHome();renderHistory();renderProgress();
}

function resetWorkout(){
  document.getElementById('wo-form').style.display='';
  document.getElementById('wo-result').style.display='none';
  S.currentPlan=null;S.doneCount=0;S.totalSets=0;stopRest();
  navigateTo('workout');
}
