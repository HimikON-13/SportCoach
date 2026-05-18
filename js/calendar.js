// ─── КАЛЕНДАРЬ ───────────────────────────────────────────────

var calViewDate=new Date();
var calSelectFrom=null,calSelectTo=null,calSelecting='from';
var MONTHS_RU=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function openCalModal(){
  calViewDate=new Date();
  calSelectFrom=null;calSelectTo=null;calSelecting='from';
  updateCalDisplay();renderCalGrid();
  document.getElementById('cal-modal').style.display='flex';
  document.getElementById('cal-apply-btn').disabled=true;
  document.getElementById('cal-from-val').textContent='—';
  document.getElementById('cal-to-val').textContent='—';
  document.getElementById('cal-hint').textContent='Нажми на начальную дату';
}

function updateCalDisplay(){
  document.getElementById('cal-month-label').textContent=MONTHS_RU[calViewDate.getMonth()]+' '+calViewDate.getFullYear();
}

function calPrevMonth(){
  calViewDate=new Date(calViewDate.getFullYear(),calViewDate.getMonth()-1,1);
  updateCalDisplay();renderCalGrid();
}

function calNextMonth(){
  calViewDate=new Date(calViewDate.getFullYear(),calViewDate.getMonth()+1,1);
  updateCalDisplay();renderCalGrid();
}

function dateToStr(d){
  var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}

function dateToRu(d){
  return d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0');
}

function renderCalGrid(){
  var el=document.getElementById('cal-days');el.innerHTML='';
  var year=calViewDate.getFullYear(),month=calViewDate.getMonth();
  var firstDay=new Date(year,month,1);
  var lastDay=new Date(year,month+1,0);
  var startOffset=(firstDay.getDay()+6)%7;
  var today=dateToStr(new Date());
  for(var i=0;i<startOffset;i++){var e=document.createElement('div');el.appendChild(e);}
  for(var day=1;day<=lastDay.getDate();day++){
    var d=new Date(year,month,day);
    var ds=dateToStr(d);
    var btn=document.createElement('button');
    btn.textContent=day;
    btn.style.cssText='width:100%;aspect-ratio:1;border-radius:10px;border:none;font-family:Manrope,sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;';
    var isFrom=calSelectFrom&&ds===calSelectFrom;
    var isTo=calSelectTo&&ds===calSelectTo;
    var inRange=calSelectFrom&&calSelectTo&&ds>calSelectFrom&&ds<calSelectTo;
    var isToday=ds===today;
    if(isFrom||isTo){btn.style.background='var(--green)';btn.style.color='#000';}
    else if(inRange){btn.style.background='rgba(168,255,0,0.15)';btn.style.color='var(--green)';}
    else if(isToday){btn.style.background='var(--bg4)';btn.style.color='var(--green)';btn.style.border='1px solid var(--green)';}
    else{btn.style.background='transparent';btn.style.color='var(--text)';}
    (function(dateStr,dateObj){
      btn.onclick=function(){
        if(calSelecting==='from'||(calSelectFrom&&dateStr<calSelectFrom)){
          calSelectFrom=dateStr;calSelectTo=null;calSelecting='to';
          document.getElementById('cal-from-val').textContent=dateToRu(dateObj);
          document.getElementById('cal-to-val').textContent='—';
          document.getElementById('cal-hint').textContent='Теперь выбери конечную дату';
          document.getElementById('cal-apply-btn').disabled=true;
        } else {
          calSelectTo=dateStr;calSelecting='from';
          document.getElementById('cal-to-val').textContent=dateToRu(dateObj);
          document.getElementById('cal-hint').textContent='Готово! Нажми Применить';
          document.getElementById('cal-apply-btn').disabled=false;
        }
        renderCalGrid();
      };
    })(ds,d);
    el.appendChild(btn);
  }
}

function applyCalRange(){
  if(!calSelectFrom||!calSelectTo)return;
  calFrom=calSelectFrom;calTo=calSelectTo;
  currentPeriod='custom';
  ['day','week','month','all'].forEach(function(t){var b=document.getElementById('pb-'+t);if(b)b.classList.remove('on');});
  var lbl=document.getElementById('ring-label');
  if(lbl)lbl.textContent='Объём '+calFrom.slice(5).replace('-','.')+' — '+calTo.slice(5).replace('-','.');
  document.getElementById('cal-modal').style.display='none';
  updateHome();
}
