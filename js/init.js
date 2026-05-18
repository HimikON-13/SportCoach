// ─── ИНИЦИАЛИЗАЦИЯ ───────────────────────────────────────────

var SPLASH_QUOTES=[
  'Каждый подход — шаг к лучшей версии себя 💪',
  'Тело достигает того, во что верит разум 🔥',
  'Сегодняшняя боль — завтрашняя сила ⚡',
  'Не жди идеального момента — создай его сам 🚀',
  'Прогресс, а не совершенство — вот твоя цель 🎯',
  'Каждая тренировка считается, даже в трудный день 💥',
  'Ты сильнее, чем думаешь — докажи это сегодня 🏆',
  'Успех — это сумма маленьких усилий каждый день ✨',
  'Железо не лжёт — только ты решаешь кем стать 💎',
  'Лучшее вложение — это вложение в себя 🌟'
];

(function(){
  var sq=document.getElementById('sp-quote');
  if(sq)sq.textContent=SPLASH_QUOTES[Math.floor(Math.random()*SPLASH_QUOTES.length)];
})();

setTimeout(function(){
  document.getElementById('splash').style.opacity='0';
  setTimeout(function(){
    document.getElementById('splash').style.display='none';
    document.getElementById('app').classList.add('show');
    init();
  },500);
},2000);

function init(){
  var p=S.profile||{};
  document.getElementById('p-name').value=p.name||'';
  document.getElementById('p-weight').value=p.weight||'';
  document.getElementById('p-height').value=p.height||'';
  document.getElementById('p-goal').value=p.goal||'Набор массы';
  document.getElementById('p-level').value=p.level||'Средний';
  if(p.photo){
    document.getElementById('prof-img').src=p.photo;
    document.getElementById('prof-img').style.display='';
    document.getElementById('prof-svg').style.display='none';
  }
  updateProfDisplay();
  loadMeasureInputs();updateMeasureDisplay();
  buildWTypeGrid();
  makeChips('muscle-chips',MUSCLES,'selMuscles',null);
  makeChips('mn-chips',MUSCLES,'eqMuscles','mn-cw');
  makeChips('sr-chips',MUSCLES,'scanMuscles','sr-cw');
  renderGyms();renderEq();renderHistory();renderProgress();renderNutrition();updateHome();updateGymSelector();
  if(!S.chatHistory||S.chatHistory.length===0){
    addMsg('ai','Привет! Я твой AI-тренер. Знаю твой зал, параметры и цели. Спрашивай!');
  } else {
    S.chatHistory.forEach(function(m){addMsg(m.role==='assistant'?'ai':'user',m.content,false);});
  }
}

document.addEventListener('DOMContentLoaded',function(){
  var ci=document.getElementById('ci');
  if(ci)ci.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
  updateEqHint();
});
