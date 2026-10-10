'use strict';
const $=id=>document.getElementById(id);
const extension=!!globalThis.chrome?.runtime?.id;
const storage={
  async get(key){return extension?(await chrome.storage.local.get(key))[key]:JSON.parse(localStorage.getItem('cidooStudio.'+key)||'null');},
  async set(key,value){if(extension)await chrome.storage.local.set({[key]:value});else localStorage.setItem('cidooStudio.'+key,JSON.stringify(value));}
};
let project=CidooProject.demo(),activeFrame=0,playing=false,previewStarted=0,previewHandle=null,live=false,busy=false,saveTimer=null,library=[],undo=[];
let previewElapsed=0,pausedPreview=false,editingKeys=[...project.keys];
function selectedKeys(){return project.effect==='timeline'?editingKeys:project.keys;}
function setSelection(keys){if(project.effect==='timeline')editingKeys=keys;else project.keys=keys;}
const brightnessBases=new WeakMap();
let sourceBytes=new Uint8Array(project.sourceColors);
const previewReactions=new CidooHeartMath.Reactions();
function triggerReaction(index){if(project.reactiveMode==='off'&&!project.reactiveRulesEnabled)return;if(!playing)$('preview').click();previewReactions.press(index,(performance.now()-previewStarted)/1000,project);if(live&&extension)chrome.runtime.sendMessage({type:'cidoo-react',index}).catch(()=>{});}
const keyButtons=new Map(),previewBytes=new Uint8Array(396);
function notice(text,error=false){$('toast').textContent=text;$('toast').className='toast'+(error?' error':'');}
async function send(action,config,identity){
  if(!extension)throw Error('Загрузи папку как расширение Chrome. В обычной вкладке доступен только конструктор и предпросмотр.');
  const result=await chrome.runtime.sendMessage({type:'cidoo-heart',action,config,identity});
  if(!result?.ok)throw Error(result?.error||'Нет ответа расширения.');return result.state;
}
function checkpoint(){undo.push(JSON.stringify({project,activeFrame,editingKeys}));if(undo.length>50)undo.shift();}
function saveDraft(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>Promise.all([storage.set('studioDraft',project),storage.set('studioView',{name:project.name,activeFrame,previewElapsed,pausedPreview,editingKeys})]).catch(error=>notice(error.message,true)),250);}
function pausePreview(){
  if(!playing)return;
  previewElapsed=performance.now()-previewStarted;playing=false;pausedPreview=true;
  CidooHeartMath.paint(previewBytes,sourceBytes,previewElapsed/1000,project);
  previewReactions.paint(previewBytes,previewElapsed/1000,project,sourceBytes);
  if(project.effect==='timeline')activeFrame=CidooHeartMath.timelinePosition(project.frames,previewElapsed/1000*(project.playbackSpeed||1)).index;
  if(previewHandle!==null)cancelAnimationFrame(previewHandle);previewHandle=null;
}
function frameStart(){return project.effect==='timeline'?project.frames.slice(0,activeFrame).reduce((ms,f)=>ms+f.durationMs,0)/(project.playbackSpeed||1):0;}
function resetPreview(){pausePreview();playing=false;pausedPreview=false;previewElapsed=frameStart();previewReactions.clear();}
function change(task){pausePreview();checkpoint();pausedPreview=false;task();previewElapsed=frameStart();saveDraft();render();}
function selectFrame(index){resetPreview();activeFrame=index;previewElapsed=frameStart();render();saveDraft();}
function duration(){if($('autoOff').value==='never')return 0;const number=(id,max=Number.MAX_SAFE_INTEGER)=>Math.min(max,Math.max(0,Math.floor(Number($(id).value)||0)));return number('hours')*3600+number('minutes',59)*60+number('seconds',59);}
function clock(seconds){const n=Math.max(0,Math.ceil(seconds));return `${Math.floor(n/3600).toString().padStart(2,'0')}:${Math.floor(n%3600/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;}
function applyForm(){
  project.name=$('projectName').value.trim()||'Моя анимация';project.effect=$('effect').value;
  Object.assign(project,CidooHeartMath.options({...project,playbackSpeed:$('playbackSpeed').value,bpm:$('bpm').value,fps:$('fps').value,min:$('min').value,max:$('max').value,duration:duration(),restoreMode:$('restoreMode').value,interpolation:$('interpolation').value}));
  Object.assign(project,CidooHeartMath.options({...project,reactiveMode:$('reactiveMode').value,reactiveColor:rgb($('reactiveColor').value),reactiveDecay:$('reactiveDecay').value,reactiveStrength:$('reactiveStrength').value,reactiveDirection:$('reactiveDirection').value,reactiveSpeed:$('reactiveSpeed').value,reactiveTrail:$('reactiveTrail').value,reactiveRepeat:$('reactiveRepeat').value,reactiveOrigin:$('reactiveOrigin').value,reactiveAnchor:Number($('reactiveAnchor').value),reactiveCycle:$('reactiveCycle').checked,reactiveRulesEnabled:$('reactiveRulesEnabled').checked,reactiveFallback:$('reactiveFallback').checked,reactiveRuleWindow:$('reactiveRuleWindow').value}));
  if(project.reactiveMode==='frames'){project.effect='timeline';$('effect').value='timeline';}
  if(project.effect==='timeline'&&!project.frames.length)project.frames.push({durationMs:400,colors:[...project.sourceColors]});
}
function form(){
  $('preset').value=Object.keys(CidooPresets.names).find(id=>Object.values(CidooPresets.names[id]).includes(project.name))||'';
  $('projectName').value=project.name;for(const id of ['effect','bpm','fps','min','max','interpolation','restoreMode','playbackSpeed'])$(id).value=String(project[id]);
  $('autoOff').value=project.duration===0?'never':'timer';
  $('speedValue').textContent=(project.playbackSpeed||1)+'×';
  $('reactiveMode').value=project.reactiveMode;$('reactiveColor').value='#'+project.reactiveColor.map(n=>n.toString(16).padStart(2,'0')).join('');$('reactiveDecay').value=project.reactiveDecay;$('reactiveStrength').value=project.reactiveStrength;for(const id of ['reactiveDirection','reactiveSpeed','reactiveTrail','reactiveRepeat','reactiveOrigin','reactiveAnchor','reactiveRuleWindow'])$(id).value=project[id];
  if(project.duration>0){$('hours').value=Math.floor(project.duration/3600);$('minutes').value=Math.floor(project.duration%3600/60);$('seconds').value=Math.floor(project.duration%60);}
  for(const id of ['reactiveCycle','reactiveRulesEnabled','reactiveFallback'])$(id).checked=project[id];
  panels();
}
function panels(){ $('originFields').hidden=project.reactiveMode!=='frames';renderBindings();const timeline=project.effect==='timeline';$('timelinePanel').hidden=!timeline;$('effectSettings').hidden=timeline&&project.reactiveMode!=='beat';$('framesHint').hidden=!['frames','snake'].includes(project.reactiveMode);$('beatHint').hidden=project.reactiveMode!=='beat';$('motionFields').hidden=!['wave','cross','snake'].includes(project.reactiveMode);$('reactiveDirection').disabled=project.reactiveMode==='cross';$('repeatField').hidden=project.reactiveMode!=='frames';$('reactiveColor').disabled=['beat','frames'].includes(project.reactiveMode);$('reactiveDecay').disabled=project.reactiveMode==='frames';$('reactiveStrength').disabled=project.reactiveMode==='frames';$('bpm').disabled=project.reactiveMode==='beat';$('playbackSpeed').disabled=project.reactiveMode==='beat';$('transitionField').hidden=!timeline;$('timerFields').hidden=$('autoOff').value==='never';$('animateSelected').hidden=!timeline;$('animateAll').hidden=!timeline;$('bpmValue').textContent=`${project.bpm} уд/мин`;}
function renderBindings(){
  $('groupList').replaceChildren();(project.reactiveGroups||[]).forEach((group,n)=>{const row=document.createElement('div'),b=document.createElement('button'),del=document.createElement('button');row.className='binding-row';b.type='button';b.textContent=(document.documentElement.lang==='en'?'Group ':'Группа ')+(n+1)+' · '+group.length;b.onclick=()=>change(()=>setSelection([...group]));del.type='button';del.textContent='×';del.setAttribute('aria-label',(document.documentElement.lang==='en'?'Delete group ':'Удалить группу ')+(n+1));del.onclick=()=>change(()=>project.reactiveGroups.splice(n,1));row.append(b,del);$('groupList').append(row);});
  $('ruleList').replaceChildren();(project.reactiveRules||[]).forEach((rule,n)=>{const div=document.createElement('div'),b=document.createElement('button');div.textContent=rule.keys.map(i=>CidooLayout.keys.find(k=>k.index===i)?.label||i).join(' ')+' → '+rule.name+' ';b.type='button';b.textContent='×';b.setAttribute('aria-label',document.documentElement.lang==='en'?'Delete rule':'Удалить правило');b.onclick=()=>change(()=>project.reactiveRules.splice(n,1));div.append(b);$('ruleList').append(div);});
}
for(const key of CidooLayout.keys){const option=document.createElement('option');option.value=key.index;option.textContent=key.label;$('reactiveAnchor').append(option);}
const currentOption=document.createElement('option');currentOption.value='current';currentOption.textContent='Текущий проект';$('rulePreset').append(currentOption);
for(const [id,names] of Object.entries(CidooPresets.names)){if(id==='invoker-demo')continue;const option=document.createElement('option');option.value=id;option.textContent=names.ru;$('rulePreset').append(option);}
$('addGroup').onclick=()=>{if(!selectedKeys().length||project.reactiveGroups.length>=12){notice('Выбери клавиши. Не более 12 групп.',true);return;}change(()=>{project.reactiveGroups.push([...selectedKeys()]);project.keys=[...new Set([...project.keys,...selectedKeys()])];});};
$('addRule').onclick=()=>{try{
  applyForm();const tokens=$('ruleKeys').value.trim().split(/[ ,+]+/).filter(Boolean);if(!tokens.length||tokens.length>4)throw Error('Правило: от 1 до 4 клавиш.');
  const keys=tokens.map(t=>{const key=CidooLayout.keys.find(k=>k.label.toLowerCase()===t.toLowerCase());if(!key)throw Error('Неизвестная клавиша: '+t);return key.index;});
  let response=$('rulePreset').value==='current'?JSON.parse(JSON.stringify(project)):CidooPresets.build($('rulePreset').value,document.documentElement.lang);response.reactiveRules=[];response.reactiveRulesEnabled=false;
  if(response.reactiveMode==='off')response.reactiveMode=response.effect==='timeline'?'frames':'beat';
  const rule={name:response.name,match:$('ruleMatch').value,keys,project:response};const candidate=CidooProject.validate({...project,reactiveRules:[...project.reactiveRules,rule]});change(()=>project=candidate);notice('Правило добавлено. Включи правила для проверки.');
}catch(error){notice(error.message,true);}};
function buildKeyboard(){
  for(const row of CidooLayout.rows){const holder=document.createElement('div');holder.className='keyboard-row';
    for(const key of row){const button=document.createElement('button');button.type='button';button.className='key';button.textContent=key.label;button.style.flexGrow=key.width;button.dataset.index=String(key.index);button.setAttribute('aria-label',key.label+' · выбрать для анимации');button.title=key.label;
      button.addEventListener('click',()=>{if($('reactiveTest').checked){triggerReaction(key.index);return;}change(()=>{playing=false;const keys=selectedKeys();setSelection(keys.includes(key.index)?keys.filter(index=>index!==key.index):[...keys,key.index]);});});holder.append(button);keyButtons.set(key.index,button);}
    $('keyboard').append(holder);
  }
}
function showColors(colors){for(const [index,button]of keyButtons){const offset=index*3;button.style.backgroundColor=`rgb(${colors[offset]},${colors[offset+1]},${colors[offset+2]})`;button.style.color=colors[offset]*.2126+colors[offset+1]*.7152+colors[offset+2]*.0722>150?'#17121e':'#ffffff';button.setAttribute('aria-pressed',String(selectedKeys().includes(index)));}}
function renderTimeline(){
  $('timeline').replaceChildren();activeFrame=Math.min(activeFrame,Math.max(0,project.frames.length-1));
  project.frames.forEach((frame,index)=>{const button=document.createElement('button');button.className='frame-card'+(index===activeFrame?' active':'');button.setAttribute('aria-label',`Кадр ${index+1}`);
    const title=document.createElement('b');title.textContent=`Кадр ${index+1}`;const swatches=document.createElement('div');swatches.className='mini-keyboard';
    for(const row of CidooLayout.rows){const miniRow=document.createElement('div');miniRow.className='mini-row';for(const key of row){const dot=document.createElement('span');dot.style.flexGrow=key.width;dot.style.backgroundColor=`rgb(${frame.colors[key.index*3]},${frame.colors[key.index*3+1]},${frame.colors[key.index*3+2]})`;miniRow.append(dot);}swatches.append(miniRow);}
    const label=document.createElement('small');label.textContent=`${frame.durationMs} мс`;button.append(title,swatches,label);button.addEventListener('click',()=>selectFrame(index));$('timeline').append(button);
  });
  if(project.frames[activeFrame])$('frameMs').value=project.frames[activeFrame].durationMs;
}
function render(){
  sourceBytes.set(project.sourceColors);
  panels();$('selectionCount').textContent=project.effect==='timeline'?`Для редактирования: ${editingKeys.length} · В анимации: ${project.keys.length}`:`Клавиш выбрано: ${project.keys.length}`;
  $('viewLabel').textContent=playing?'На экране: предпросмотр анимации':pausedPreview?'На экране: пауза в текущей позиции':project.effect==='timeline'?`На экране: кадр ${activeFrame+1} · ${project.name}`:'На экране: исходный рисунок Layer 1';
  if(!playing&&pausedPreview)showColors(previewBytes);else if(!playing)showColors(project.effect==='timeline'&&project.frames.length?project.frames[activeFrame].colors:project.sourceColors);
  $('preview').textContent=playing?'❚❚ Пауза предпросмотра':pausedPreview?'▶ Продолжить предпросмотр':'▶ Предпросмотр';renderTimeline();
}
function frameEdit(task){if(!selectedKeys().length){notice('Сначала выбери клавиши на схеме.',true);return;}change(()=>{playing=false;task(project.frames[activeFrame]);});}
function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
for(const id of ['projectName','effect','bpm','fps','min','max','interpolation','restoreMode','autoOff','hours','minutes','seconds','reactiveMode','reactiveColor','reactiveDecay','reactiveStrength','reactiveDirection','reactiveSpeed','reactiveTrail','reactiveRepeat','reactiveOrigin','reactiveAnchor','reactiveCycle','reactiveRulesEnabled','reactiveFallback','reactiveRuleWindow'])$(id).addEventListener('input',()=>{
  if(id==='effect')change(applyForm);else{checkpoint();applyForm();saveDraft();render();}
});
$('selectHeart').addEventListener('click',()=>change(()=>setSelection([...CidooHeartMath.heart])));
$('selectAll').addEventListener('click',()=>change(()=>setSelection(CidooLayout.keys.map(key=>key.index))));
$('selectNone').addEventListener('click',()=>change(()=>setSelection([])));
function loadPreset(){if(!$('preset').value)return;resetPreview();checkpoint();project=CidooPresets.build($('preset').value,document.documentElement.lang);editingKeys=[...project.keys];activeFrame=0;previewElapsed=0;form();render();saveDraft();notice('Открыто: '+project.name);}
$('loadPreset').addEventListener('click',loadPreset);$('preset').addEventListener('change',loadPreset);
$('newProject').addEventListener('click',()=>{resetPreview();checkpoint();project=CidooProject.demo();project.name='Моя анимация';project.effect='timeline';project.keys=CidooLayout.keys.map(k=>k.index);editingKeys=[...project.keys];project.frames=[{durationMs:500,colors:new Array(396).fill(0)}];activeFrame=0;previewElapsed=0;form();render();saveDraft();notice('Новый проект: один пустой кадр.');});
$('animateSelected').addEventListener('click',()=>{if(!editingKeys.length){notice('Сначала выбери клавиши на схеме.',true);return;}change(()=>project.keys=[...editingKeys]);});
$('animateAll').addEventListener('click',()=>change(()=>project.keys=CidooLayout.keys.map(k=>k.index)));
$('selectColor').addEventListener('click',()=>{const color=rgb($('selectionColor').value);change(()=>{const colors=project.effect==='timeline'?project.frames[activeFrame].colors:project.sourceColors;setSelection(CidooLayout.keys.filter(key=>color.every((channel,i)=>colors[key.index*3+i]===channel)).map(key=>key.index));});});
$('preview').addEventListener('click',()=>{
  if(!project.keys.length){notice('Выбери хотя бы одну клавишу.',true);return;}
  if(project.reactiveMode==='frames'){project.effect='timeline';$('effect').value='timeline';}
  if(project.effect==='timeline'&&!project.frames.length){notice('Добавь кадр.',true);return;}
  if(playing)pausePreview();else{playing=true;pausedPreview=false;previewStarted=performance.now()-previewElapsed;if(previewHandle===null)previewHandle=requestAnimationFrame(animate);}render();saveDraft();
});
$('addFrame').addEventListener('click',()=>{if(project.frames.length>=120){notice('Максимум 120 кадров.',true);return;}change(()=>{project.frames.push({durationMs:400,colors:[...project.frames[activeFrame].colors]});activeFrame=project.frames.length-1;playing=false;});});
$('duplicateFrame').addEventListener('click',()=>{if(project.frames.length>=120)return;change(()=>{project.frames.splice(activeFrame+1,0,JSON.parse(JSON.stringify(project.frames[activeFrame])));activeFrame++;playing=false;});});
$('removeFrame').addEventListener('click',()=>{if(project.frames.length<=1){notice('Оставь хотя бы один кадр.',true);return;}change(()=>{project.frames.splice(activeFrame,1);activeFrame=Math.min(activeFrame,project.frames.length-1);playing=false;});});
$('paintSelected').addEventListener('click',()=>frameEdit(frame=>{const color=rgb($('paintColor').value);for(const index of selectedKeys())frame.colors.splice(index*3,3,...color);brightnessBases.delete(frame);}));
$('resetSelected').addEventListener('click',()=>frameEdit(frame=>{for(const index of selectedKeys())frame.colors.splice(index*3,3,...project.sourceColors.slice(index*3,index*3+3));}));
$('frameBrightness').addEventListener('input',()=>$('frameBrightnessValue').textContent=$('frameBrightness').value+'%');
$('applyBrightness').addEventListener('click',()=>frameEdit(frame=>{const level=Number($('frameBrightness').value)/100;if(!brightnessBases.has(frame))brightnessBases.set(frame,[...frame.colors]);const base=brightnessBases.get(frame);for(const index of selectedKeys())for(let c=0;c<3;c++)frame.colors[index*3+c]=Math.round(base[index*3+c]*level);}));
$('frameMs').addEventListener('change',()=>frameEdit(frame=>frame.durationMs=Math.max(50,Math.min(60000,Math.round(Number($('frameMs').value)||400)))));
$('frameMs').addEventListener('input',()=>{const value=Number($('frameMs').value);if(Number.isInteger(value)&&value>=50&&value<=60000&&value!==project.frames[activeFrame]?.durationMs)frameEdit(frame=>frame.durationMs=value);});
$('undo').addEventListener('click',()=>{if(!undo.length){notice('Пока нечего отменять.');return;}resetPreview();const previous=JSON.parse(undo.pop());project=previous.project;activeFrame=previous.activeFrame;editingKeys=previous.editingKeys;previewElapsed=frameStart();form();render();saveDraft();});
async function loadSource(){const result=await send('source');checkpoint();project.sourceColors=CidooProject.colors(result.colors);$('sourceLabel').textContent='Рисунок считан с Layer 1 · исходный слой не изменяется';render();saveDraft();}
async function action(task){if(busy)return;busy=true;for(const id of ['connect','readSource','start','stop'])$(id).disabled=true;try{await task();}catch(error){notice(error.message,true);}finally{busy=false;for(const id of ['connect','readSource','start','stop'])$(id).disabled=false;}}
function state(state){
  live=state.running;$('connectionDot').className='dot'+(state.ready?' ready':'');$('connectionText').textContent=state.ready?'Клавиатура · управление расширением':'Клавиатура не подключена';
  $('runStatus').textContent=state.error||(state.running?`Layer 2 · ${state.config.projectName||'Анимация'} · ${state.config.duration>0?'осталось '+clock(state.config.duration-state.elapsed):'без таймера'}`:state.ready?'Готово. Исходник Layer 1 будет прочитан перед запуском.':'Подключи клавиатуру. Предпросмотр работает без подключения.');
}
$('connect').addEventListener('click',()=>action(async()=>{
  if(!extension)throw Error('Загрузи папку как расширение Chrome.');
  await chrome.tabs.create({url:chrome.runtime.getURL('connect.html')});notice('Подключение открыто в отдельной вкладке. Вернись сюда после подключения.');
}));
$('readSource').addEventListener('click',()=>action(async()=>{await loadSource();notice('Layer 1 прочитан. Изменений в нём нет.');}));
$('start').addEventListener('click',()=>action(async()=>{
  applyForm();if($('autoOff').value==='timer'&&project.duration===0)throw Error('Укажи время таймера больше нуля или выбери «Никогда».');
  CidooProject.validate(project);await loadSource();const valid=CidooProject.validate(project);
  await storage.set('settings',{...CidooProject.config(valid),schema:2});state(await send('startProject',valid));notice('Анимация запущена в Layer 2. Можно закрыть редактор.');
}));
$('stop').addEventListener('click',()=>action(async()=>{const stopped=await send('stop');state(stopped);notice(stopped.config?.restoreMode==='source'?'Остановлено. В Layer 2 возвращён рисунок из Layer 1.':stopped.config?.restoreMode==='previous'?'Остановлено. Вернулась подсветка до запуска.':'Остановлено. Последний кадр остался на клавиатуре.');}));
function renderLibrary(){
  $('library').replaceChildren();library.forEach((entry,index)=>{const item=document.createElement('div');item.className='library-item';const open=document.createElement('button');open.textContent=entry.name;
    open.addEventListener('click',()=>{resetPreview();checkpoint();project=CidooProject.validate(entry);editingKeys=[...project.keys];activeFrame=0;previewElapsed=0;form();render();saveDraft();$('sourceLabel').textContent='Исходник из сохранённого проекта · перед запуском читается Layer 1';notice('Анимация открыта: '+project.name);});
    const remove=document.createElement('button');remove.className='delete';remove.textContent='×';remove.setAttribute('aria-label','Удалить из библиотеки '+entry.name);
    remove.addEventListener('click',async()=>{library.splice(index,1);await storage.set('studioLibrary',library);renderLibrary();notice('Удалено из библиотеки. Экспортированный файл не изменён.');});item.append(open,remove);$('library').append(item);
  });
}
$('saveProject').addEventListener('click',async()=>{try{applyForm();const valid=CidooProject.validate(project);const index=library.findIndex(entry=>entry.name===valid.name);if(index>=0)library[index]=valid;else library.push(valid);await storage.set('studioLibrary',library);renderLibrary();notice('Сохранено: '+valid.name);}catch(error){notice(error.message,true);}});
$('exportProject').addEventListener('click',()=>{try{applyForm();const valid=CidooProject.validate(project);const blob=new Blob([JSON.stringify(valid,null,valid.reactiveRules.length?0:2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(valid.name.replace(/[^\p{L}\p{N}_-]+/gu,'-')||'animation')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('JSON скачан. Его можно открыть в этом редакторе или поделиться файлом.');}catch(error){notice(error.message,true);}});
$('importProject').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Файл слишком большой: максимум 1 МБ.');const valid=CidooProject.validate(JSON.parse(await file.text()));resetPreview();checkpoint();project=valid;editingKeys=[...project.keys];activeFrame=0;previewElapsed=0;form();render();saveDraft();$('sourceLabel').textContent='Исходник из JSON · перед запуском читается Layer 1';notice('Открыто: '+project.name);}catch(error){notice(error.message,true);}finally{event.target.value='';}});
let lastDraw=-Infinity;
function animate(now){
  if(!playing){previewHandle=null;return;}
  if(playing&&!document.hidden&&now-lastDraw>=1000/20){lastDraw=now;const seconds=(now-previewStarted)/1000;CidooHeartMath.paint(previewBytes,sourceBytes,seconds,project);previewReactions.paint(previewBytes,seconds,project,sourceBytes);showColors(previewBytes);$('previewTime').textContent=clock(seconds);}
  previewHandle=requestAnimationFrame(animate);
}
buildKeyboard();form();render();
const presetSearch=globalThis.location?.search||'';
const presetQuery=decodeURIComponent((presetSearch.match(/[?&]preset=([^&]+)/)||[])[1]||'');
document.addEventListener('visibilitychange',async()=>{if(!extension||document.hidden||busy)return;try{state(await send('status'));}catch(error){notice(error.message,true);}});
(async()=>{
  try{const draft=await storage.get('studioDraft');if(draft&&!presetQuery){project=CidooProject.validate(draft);editingKeys=[...project.keys];const view=await storage.get('studioView');if(view?.name===project.name){if(Array.isArray(view.editingKeys))editingKeys=view.editingKeys.filter(n=>Number.isInteger(n)&&n>=0&&n<132);activeFrame=Math.max(0,Math.min(project.frames.length-1,Number(view.activeFrame)||0));previewElapsed=Math.max(0,Number(view.previewElapsed)||0);pausedPreview=!!view.pausedPreview;if(pausedPreview)CidooHeartMath.paint(previewBytes,new Uint8Array(project.sourceColors),previewElapsed/1000,project);}form();render();}if(presetQuery&&Object.prototype.hasOwnProperty.call(CidooPresets.names,presetQuery)){$('preset').value=presetQuery;loadPreset();}library=(await storage.get('studioLibrary')||[]).map(CidooProject.validate);renderLibrary();if(extension)state(await send('status'));else notice('Режим предпросмотра: устройство не подключается. Загрузи расширение в Chrome для управления клавиатурой.');}
  catch(error){notice(error.message,true);}
})();
setInterval(async()=>{if(!extension||busy||!live||document.hidden)return;try{state(await send('status'));}catch(error){notice(error.message,true);}},1000);

$('playbackSpeed').addEventListener('input',()=>{change(()=>project.playbackSpeed=Number($('playbackSpeed').value));$('speedValue').textContent=project.playbackSpeed+'×';});
document.addEventListener('keydown',event=>{if(event.repeat||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;const index=CidooLayout.codeIndex(event.code);if(index!==undefined&&(project.reactiveMode!=='off'||project.reactiveRulesEnabled)&&($('reactiveTest').checked||playing||live))triggerReaction(index);});
