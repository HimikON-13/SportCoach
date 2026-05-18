// ─── ТАЙМЕР ОТДЫХА ───────────────────────────────────────────

var restInterval=null;
var restEndTime=null;
var defaultRestSec=90;

function startRest(sec){
  if(restInterval)clearInterval(restInterval);
  restEndTime=Date.now()+sec*1000;
  updateRestDisplay(sec);
  document.getElementById('rest-timer').classList.add('show');
  restInterval=setInterval(function(){
    var left=Math.round((restEndTime-Date.now())/1000);
    if(left<=0){stopRest();return;}
    updateRestDisplay(left);
  },500);
}

// Перезапуск после разблокировки экрана
document.addEventListener('visibilitychange',function(){
  if(!document.hidden&&restEndTime){
    var left=Math.round((restEndTime-Date.now())/1000);
    if(left<=0){stopRest();}else{
      updateRestDisplay(left);
      if(restInterval)clearInterval(restInterval);
      restInterval=setInterval(function(){
        var rem=Math.round((restEndTime-Date.now())/1000);
        if(rem<=0){stopRest();return;}
        updateRestDisplay(rem);
      },500);
    }
  }
});

function updateRestDisplay(sec){
  var m=Math.floor(sec/60),s=sec%60;
  document.getElementById('rt-time').textContent=m+':'+(s<10?'0':'')+s;
}

function stopRest(){
  clearInterval(restInterval);restInterval=null;restEndTime=null;
  document.getElementById('rest-timer').classList.remove('show');
  if(tg&&tg.HapticFeedback)tg.HapticFeedback.notificationOccurred('success');
}

function skipRest(){stopRest();}

function openRestEdit(){
  var m=Math.floor(defaultRestSec/60),s=defaultRestSec%60;
  document.getElementById('rest-min').value=m;
  document.getElementById('rest-sec').value=s;
  document.getElementById('rest-edit-modal').style.display='flex';
}

function setRestPreset(sec){
  var m=Math.floor(sec/60),s=sec%60;
  document.getElementById('rest-min').value=m;
  document.getElementById('rest-sec').value=s;
}

function applyRestTime(){
  var m=parseInt(document.getElementById('rest-min').value)||0;
  var s=parseInt(document.getElementById('rest-sec').value)||0;
  defaultRestSec=m*60+s;
  document.getElementById('rest-edit-modal').style.display='none';
  if(restInterval){clearInterval(restInterval);startRest(defaultRestSec);}
}
