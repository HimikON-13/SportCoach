// ─── ПИТАНИЕ ─────────────────────────────────────────────────

function todayMeals(){
  var today=new Date().toLocaleDateString('ru');
  return (S.meals||[]).filter(function(m){return m.date===today;});
}

function openNutModal(){
  document.getElementById('nut-modal').style.display='flex';
  ['nut-name','nut-inp-kcal','nut-inp-p','nut-inp-f','nut-inp-c'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.value='';
  });
}

function addMeal(){
  var name=document.getElementById('nut-name').value.trim();if(!name)return;
  if(!S.meals)S.meals=[];
  S.meals.push({
    name:name,
    kcal:+document.getElementById('nut-inp-kcal').value||0,
    p:+document.getElementById('nut-inp-p').value||0,
    f:+document.getElementById('nut-inp-f').value||0,
    c:+document.getElementById('nut-inp-c').value||0,
    date:new Date().toLocaleDateString('ru')
  });
  sv();renderNutrition();
  document.getElementById('nut-modal').style.display='none';
}

function delMeal(i){
  var today=new Date().toLocaleDateString('ru');
  var todayIdx=[];
  S.meals.forEach(function(m,mi){if(m.date===today)todayIdx.push(mi);});
  S.meals.splice(todayIdx[i],1);
  sv();renderNutrition();
}

function renderNutrition(){
  var meals=todayMeals();
  var kcal=meals.reduce(function(a,m){return a+m.kcal;},0);
  var p=meals.reduce(function(a,m){return a+m.p;},0);
  var f=meals.reduce(function(a,m){return a+m.f;},0);
  var c=meals.reduce(function(a,m){return a+m.c;},0);
  document.getElementById('nut-kcal').textContent=kcal;
  document.getElementById('nut-p').textContent=p+'г';
  document.getElementById('nut-f').textContent=f+'г';
  document.getElementById('nut-c').textContent=c+'г';
  document.getElementById('meals-list').innerHTML=meals.map(function(m,i){
    return '<div class="meal-item"><div><div class="meal-name">'+m.name+'</div><div class="meal-macros">Б '+m.p+'г · Ж '+m.f+'г · У '+m.c+'г</div></div><div style="display:flex;align-items:center;gap:10px"><div class="meal-kcal">'+m.kcal+'</div><button class="meal-del" onclick="delMeal('+i+')">×</button></div></div>';
  }).join('');
}
