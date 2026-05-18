// ─── КОНСТАНТЫ ───────────────────────────────────────────────
var MUSCLES = ['Грудь','Спина','Плечи','Бицепс','Трицепс','Квадрицепс','Бицепс бедра','Икры','Пресс','Ягодицы','Другое'];
var WTYPES = [
  {v:'Силовая',d:'Макс. вес'},
  {v:'Гипертрофия',d:'Рост мышц'},
  {v:'Полное тело',d:'Всё сразу'},
  {v:'Верх тела',d:'Верх'},
  {v:'Низ тела',d:'Низ'},
  {v:'Выносливость',d:'Кардио'},
  {v:'Своё',d:'Написать своё'}
];
var MUSCLE_MAP = {
  'Верх тела':['Грудь','Спина','Плечи','Бицепс','Трицепс'],
  'Низ тела':['Квадрицепс','Бицепс бедра','Икры','Ягодицы'],
  'Полное тело':['Грудь','Спина','Квадрицепс','Пресс'],
  'Силовая':[],'Гипертрофия':[],'Выносливость':[]
};
var CHAT_Q = {
  technique:'По какому упражнению интересует техника?',
  program:'На сколько дней в неделю тренируешься?',
  nutrition:'Хочешь узнать про питание до, после тренировки, или общий рацион?',
  progress:'Что тебя беспокоит в прогрессе?'
};

// ─── TELEGRAM ────────────────────────────────────────────────
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// ─── СОСТОЯНИЕ ПРИЛОЖЕНИЯ ────────────────────────────────────
var S = {
  profile:{name:'',weight:'',height:'',goal:'Набор массы',level:'Средний',photo:''},
  measures:{chest:'',waist:'',hips:'',arm:'',thigh:'',calf:'',fat:''},
  equipment:[],gyms:[],activeGymId:null,workouts:[],chatHistory:[],meals:[],
  selMuscles:[],eqMuscles:[],scanMuscles:[],
  selectedWType:'',currentPlan:null,scanPhoto:null,
  doneCount:0,totalSets:0
};

// ─── СОХРАНЕНИЕ / ЗАГРУЗКА ───────────────────────────────────
function sv(){
  try{localStorage.setItem('gymai5',JSON.stringify(S));}catch(e){
    // Хранилище переполнено — сохраняем без фото
    try{
      var slim=JSON.parse(JSON.stringify(S));
      (slim.equipment||[]).forEach(function(eq){eq.photo=null;});
      (slim.gyms||[]).forEach(function(g){(g.equipment||[]).forEach(function(eq){eq.photo=null;});});
      if(slim.profile)slim.profile.photo=null;
      localStorage.setItem('gymai5',JSON.stringify(slim));
    }catch(e2){}
  }
}

function ld(){
  try{var d=localStorage.getItem('gymai5');if(d){var p=JSON.parse(d);for(var k in p)S[k]=p[k];}}catch(e){}
}
ld();
