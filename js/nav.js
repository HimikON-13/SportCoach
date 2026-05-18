// ─── НАВИГАЦИЯ ───────────────────────────────────────────────

function saveWorkoutToHistory(){
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
  S.workouts.unshift({
    name:S.currentPlan.name,
    date:new Date().toLocaleDateString('ru'),
    rawDate:new Date().toISOString(),
    volume:vol,
    totalSets:document.querySelectorAll('.set-dot.done').length,
    exercises:(S.currentPlan.exercises||[]).map(function(e){return e.name;})
  });
  S.currentPlan=null;S.doneCount=0;S.totalSets=0;stopRest();
  sv();updateHome();renderHistory();renderProgress();
}

function goPage(name){
  if(name!=='workout'&&S.currentPlan){
    if(confirm('Тренировка в процессе. Хочешь продолжить тренировку?')){
      return;
    }
    saveWorkoutToHistory();
  }
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nb').forEach(function(b){b.classList.remove('on');});
  var pg=document.getElementById('p-'+name);if(pg)pg.classList.add('active');
  var nb=document.getElementById('nav-'+name);if(nb)nb.classList.add('on');
  if(name==='workout'){var cb=document.querySelector('.nb-cam');if(cb)cb.classList.add('on');}
  var tb=document.querySelector('.tb');
  if(tb)tb.style.display=(name==='profile'||name==='ai')?'none':'';
  var aib=document.getElementById('ai-input-bar');
  if(aib)aib.className=name==='ai'?'visible':'';
}

function navigateTo(name){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nb').forEach(function(b){b.classList.remove('on');});
  var pg=document.getElementById('p-'+name);if(pg)pg.classList.add('active');
  var nb=document.getElementById('nav-'+name);if(nb)nb.classList.add('on');
  if(name==='workout'){var cb=document.querySelector('.nb-cam');if(cb)cb.classList.add('on');}
  var tb=document.querySelector('.tb');
  if(tb)tb.style.display=(name==='profile'||name==='ai')?'none':'';
  var aib=document.getElementById('ai-input-bar');
  if(aib)aib.className=name==='ai'?'visible':'';
}
