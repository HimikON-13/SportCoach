// ─── AI ЧАТ ──────────────────────────────────────────────────

function buildSys(){
  var p=S.profile||{},m=S.measures||{};
  var s='Ты персональный AI-тренер. Отвечай по-русски кратко и конкретно. Предлагай упражнения ТОЛЬКО на оборудовании пользователя. Не используй markdown разметку — никаких ** ## * _ символов. Пиши обычным текстом.\n';
  s+='Профиль: цель - '+(p.goal||'Набор массы')+', уровень - '+(p.level||'Средний')+(p.weight?', вес - '+p.weight+' кг':'')+(p.height?', рост - '+p.height+' см':'')+'.'  ;
  if(m.chest||m.waist)s+='\nЗамеры: грудь '+(m.chest||'?')+', талия '+(m.waist||'?')+', бёдра '+(m.hips||'?')+' см'+(m.fat?', жир '+m.fat+'%':'');
  s+='\nОборудование:\n'+((S.equipment||[]).length>0?(S.equipment||[]).map(function(e){return '- '+e.name+' ('+(e.muscles||[]).join(', ')+')';}).join('\n'):'(не добавлено)');
  return s;
}

function startChat(type){
  var msg=CHAT_Q[type];if(!msg)return;
  if(!S.chatHistory)S.chatHistory=[];
  S.chatHistory.push({role:'assistant',content:msg});
  addMsg('ai',msg);goPage('ai');
}

function addMsg(role,text,scroll){
  if(scroll===undefined)scroll=true;
  var el=document.getElementById('chat-msgs');
  var d=document.createElement('div');d.className='msg'+(role==='user'?' u':'');
  var safe=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  d.innerHTML='<div class="m-av '+(role==='ai'?'ai':'u')+'">'+(role==='ai'?'AI':'Я')+'</div><div class="m-bbl '+(role==='ai'?'ai':'u')+'">'+safe+'</div>';
  el.appendChild(d);if(scroll)el.scrollTop=el.scrollHeight;
}

async function sendMsg(){
  var inp=document.getElementById('ci');var text=inp.value.trim();if(!text)return;
  inp.value='';addMsg('user',text);
  if(!S.chatHistory)S.chatHistory=[];
  S.chatHistory.push({role:'user',content:text});
  var el=document.getElementById('chat-msgs');
  var dot=document.createElement('div');dot.className='msg';dot.id='typing';
  dot.innerHTML='<div class="m-av ai">AI</div><div class="m-bbl ai"><div class="dots"><span></span><span></span><span></span></div></div>';
  el.appendChild(dot);el.scrollTop=el.scrollHeight;
  try{
    var res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:buildSys(),messages:S.chatHistory.slice(-20),max_tokens:900})});
    var data=await res.json();
    var t=document.getElementById('typing');if(t)t.remove();
    addMsg('ai',data.text);S.chatHistory.push({role:'assistant',content:data.text});
    if(S.chatHistory.length>40)S.chatHistory=S.chatHistory.slice(-40);
    sv();
  }catch(e){var t=document.getElementById('typing');if(t)t.remove();addMsg('ai','Ошибка соединения.');}
}
