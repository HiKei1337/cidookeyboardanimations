'use strict';
const $=id=>document.getElementById(id);
const extension=!!globalThis.chrome?.runtime?.id;
const storage={
  async get(key){return extension?(await chrome.storage.local.get(key))[key]:JSON.parse(localStorage.getItem('cidooStudio.'+key)||'null');},
  async set(key,value){if(extension)await chrome.storage.local.set({[key]:value});else localStorage.setItem('cidooStudio.'+key,JSON.stringify(value));}
};
let project=CidooProject.demo(),activeFrame=0,playing=false,previewStarted=0,previewHandle=null,live=false,busy=false,saveTimer=null,library=[],undo=[];
let sourceBytes=new Uint8Array(project.sourceColors);
const keyButtons=new Map(),previewBytes=new Uint8Array(396);
function notice(text,error=false){$('toast').textContent=text;$('toast').className='toast'+(error?' error':'');}
async function send(action,config,identity){
  if(!extension)throw Error('Загрузи папку как расширение Chrome. В обычной вкладке доступен только конструктор и предпросмотр.');
  const result=await chrome.runtime.sendMessage({type:'cidoo-heart',action,config,identity});
  if(!result?.ok)throw Error(result?.error||'Нет ответа расширения.');return result.state;
}
function checkpoint(){undo.push(JSON.stringify(project));if(undo.length>50)undo.shift();}
function saveDraft(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>storage.set('studioDraft',project).catch(error=>notice(error.message,true)),250);}
function change(task){checkpoint();task();saveDraft();render();}
function duration(){if($('autoOff').value==='never')return 0;const number=(id,max=Number.MAX_SAFE_INTEGER)=>Math.min(max,Math.max(0,Math.floor(Number($(id).value)||0)));return number('hours')*3600+number('minutes',59)*60+number('seconds',59);}
function clock(seconds){const n=Math.max(0,Math.ceil(seconds));return `${Math.floor(n/3600).toString().padStart(2,'0')}:${Math.floor(n%3600/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;}
function applyForm(){
  project.name=$('projectName').value.trim()||'Моя анимация';project.effect=$('effect').value;
  Object.assign(project,CidooHeartMath.options({...project,bpm:$('bpm').value,fps:$('fps').value,min:$('min').value,max:$('max').value,duration:duration(),interpolation:$('interpolation').value}));
  if(project.effect==='timeline'&&!project.frames.length)project.frames.push({durationMs:400,colors:[...project.sourceColors]});
}
function form(){
  $('projectName').value=project.name;for(const id of ['effect','bpm','fps','min','max','interpolation'])$(id).value=String(project[id]);
  $('autoOff').value=project.duration===0?'never':'timer';
  if(project.duration>0){$('hours').value=Math.floor(project.duration/3600);$('minutes').value=Math.floor(project.duration%3600/60);$('seconds').value=Math.floor(project.duration%60);}
  panels();
}
function panels(){const timeline=project.effect==='timeline';$('timelinePanel').hidden=!timeline;$('effectSettings').hidden=timeline;$('transitionField').hidden=!timeline;$('timerFields').hidden=$('autoOff').value==='never';$('bpmValue').textContent=`${project.bpm} уд/мин`;}
function buildKeyboard(){
  for(const row of CidooLayout.rows){const holder=document.createElement('div');holder.className='keyboard-row';
    for(const key of row){const button=document.createElement('button');button.type='button';button.className='key';button.textContent=key.label;button.style.flexGrow=key.width;button.dataset.index=String(key.index);button.setAttribute('aria-label',key.label+' · выбрать для анимации');button.title=key.label;
      button.addEventListener('click',()=>change(()=>{playing=false;project.keys=project.keys.includes(key.index)?project.keys.filter(index=>index!==key.index):[...project.keys,key.index];}));holder.append(button);keyButtons.set(key.index,button);}
    $('keyboard').append(holder);
  }
}
function showColors(colors){for(const [index,button]of keyButtons){const offset=index*3;button.style.backgroundColor=`rgb(${colors[offset]},${colors[offset+1]},${colors[offset+2]})`;button.setAttribute('aria-pressed',String(project.keys.includes(index)));}}
function renderTimeline(){
  $('timeline').replaceChildren();activeFrame=Math.min(activeFrame,Math.max(0,project.frames.length-1));
  project.frames.forEach((frame,index)=>{const button=document.createElement('button');button.className='frame-card'+(index===activeFrame?' active':'');button.setAttribute('aria-label',`Кадр ${index+1}`);
    const title=document.createElement('b');title.textContent=`Кадр ${index+1}`;const swatches=document.createElement('div');swatches.className='swatches';
    for(const key of project.keys.slice(0,7)){const swatch=document.createElement('span');swatch.style.backgroundColor=`rgb(${frame.colors[key*3]},${frame.colors[key*3+1]},${frame.colors[key*3+2]})`;swatches.append(swatch);}
    const label=document.createElement('small');label.textContent=`${frame.durationMs} мс`;button.append(title,swatches,label);button.addEventListener('click',()=>{activeFrame=index;playing=false;render();});$('timeline').append(button);
  });
  if(project.frames[activeFrame])$('frameMs').value=project.frames[activeFrame].durationMs;
}
function render(){
  sourceBytes.set(project.sourceColors);
  panels();$('selectionCount').textContent=`Клавиш выбрано: ${project.keys.length}`;
  if(!playing)showColors(project.effect==='timeline'&&project.frames.length?project.frames[activeFrame].colors:project.sourceColors);
  $('preview').textContent=playing?'❚❚ Пауза предпросмотра':'▶ Предпросмотр';renderTimeline();
}
function frameEdit(task){if(!project.keys.length){notice('Сначала выбери клавиши на схеме.',true);return;}change(()=>{playing=false;task(project.frames[activeFrame]);});}
function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
for(const id of ['projectName','effect','bpm','fps','min','max','interpolation','autoOff','hours','minutes','seconds'])$(id).addEventListener('input',()=>change(applyForm));
$('selectHeart').addEventListener('click',()=>change(()=>project.keys=[...CidooHeartMath.heart]));
$('selectAll').addEventListener('click',()=>change(()=>project.keys=CidooLayout.keys.map(key=>key.index)));
$('selectNone').addEventListener('click',()=>change(()=>project.keys=[]));
$('loadPreset').addEventListener('click',()=>{checkpoint();project=CidooPresets.build($('preset').value,document.documentElement.lang);activeFrame=0;playing=false;form();render();saveDraft();notice('Открыто: '+project.name);});
$('selectColor').addEventListener('click',()=>{const color=rgb($('selectionColor').value);change(()=>{project.keys=CidooLayout.keys.filter(key=>color.every((channel,i)=>project.sourceColors[key.index*3+i]===channel)).map(key=>key.index);});});
$('preview').addEventListener('click',()=>{
  if(!project.keys.length){notice('Выбери хотя бы одну клавишу.',true);return;}
  if(project.effect==='timeline'&&!project.frames.length){notice('Добавь кадр.',true);return;}
  playing=!playing;if(playing){previewStarted=performance.now();if(previewHandle===null)previewHandle=requestAnimationFrame(animate);}render();
});
$('addFrame').addEventListener('click',()=>{if(project.frames.length>=120){notice('Максимум 120 кадров.',true);return;}change(()=>{project.frames.push({durationMs:400,colors:[...project.sourceColors]});activeFrame=project.frames.length-1;playing=false;});});
$('duplicateFrame').addEventListener('click',()=>{if(project.frames.length>=120)return;change(()=>{project.frames.splice(activeFrame+1,0,JSON.parse(JSON.stringify(project.frames[activeFrame])));activeFrame++;playing=false;});});
$('removeFrame').addEventListener('click',()=>{if(project.frames.length<=1){notice('Оставь хотя бы один кадр.',true);return;}change(()=>{project.frames.splice(activeFrame,1);activeFrame=Math.min(activeFrame,project.frames.length-1);playing=false;});});
$('paintSelected').addEventListener('click',()=>frameEdit(frame=>{const color=rgb($('paintColor').value);for(const index of project.keys)frame.colors.splice(index*3,3,...color);}));
$('resetSelected').addEventListener('click',()=>frameEdit(frame=>{for(const index of project.keys)frame.colors.splice(index*3,3,...project.sourceColors.slice(index*3,index*3+3));}));
$('frameBrightness').addEventListener('input',()=>$('frameBrightnessValue').textContent=$('frameBrightness').value+'%');
$('applyBrightness').addEventListener('click',()=>frameEdit(frame=>{const level=Number($('frameBrightness').value)/100;for(const index of project.keys)for(let c=0;c<3;c++)frame.colors[index*3+c]=Math.round(project.sourceColors[index*3+c]*level);}));
$('frameMs').addEventListener('change',()=>frameEdit(frame=>frame.durationMs=Math.max(50,Math.min(60000,Math.round(Number($('frameMs').value)||400)))));
$('undo').addEventListener('click',()=>{if(!undo.length){notice('Пока нечего отменять.');return;}project=JSON.parse(undo.pop());playing=false;form();render();saveDraft();});
async function loadSource(){const result=await send('source');checkpoint();project.sourceColors=CidooProject.colors(result.colors);$('sourceLabel').textContent='Рисунок считан с Layer 1 · исходный слой не изменяется';render();saveDraft();}
async function action(task){if(busy)return;busy=true;for(const id of ['connect','readSource','start','stop'])$(id).disabled=true;try{await task();}catch(error){notice(error.message,true);}finally{busy=false;for(const id of ['connect','readSource','start','stop'])$(id).disabled=false;}}
function state(state){
  live=state.running;$('connectionDot').className='dot'+(state.ready?' ready':'');$('connectionText').textContent=state.ready?'C80 · управление расширением':'Клавиатура не подключена';
  $('runStatus').textContent=state.error||(state.running?`Layer 2 · ${state.config.projectName||'Анимация'} · ${state.config.duration>0?'осталось '+clock(state.config.duration-state.elapsed):'без таймера'}`:state.ready?'Готово. Исходник Layer 1 будет прочитан перед запуском.':'Подключи C80. Предпросмотр работает без подключения.');
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
$('stop').addEventListener('click',()=>action(async()=>{state(await send('stop'));notice('Остановлено. В Layer 2 возвращён рисунок из Layer 1.');}));
function renderLibrary(){
  $('library').replaceChildren();library.forEach((entry,index)=>{const item=document.createElement('div');item.className='library-item';const open=document.createElement('button');open.textContent=entry.name;
    open.addEventListener('click',()=>{checkpoint();project=CidooProject.validate(entry);activeFrame=0;playing=false;form();render();saveDraft();$('sourceLabel').textContent='Исходник из сохранённого проекта · перед запуском читается Layer 1';notice('Анимация открыта: '+project.name);});
    const remove=document.createElement('button');remove.className='delete';remove.textContent='×';remove.setAttribute('aria-label','Удалить из библиотеки '+entry.name);
    remove.addEventListener('click',async()=>{library.splice(index,1);await storage.set('studioLibrary',library);renderLibrary();notice('Удалено из библиотеки. Экспортированный файл не изменён.');});item.append(open,remove);$('library').append(item);
  });
}
$('saveProject').addEventListener('click',async()=>{try{applyForm();const valid=CidooProject.validate(project);const index=library.findIndex(entry=>entry.name===valid.name);if(index>=0)library[index]=valid;else library.push(valid);await storage.set('studioLibrary',library);renderLibrary();notice('Сохранено: '+valid.name);}catch(error){notice(error.message,true);}});
$('exportProject').addEventListener('click',()=>{try{applyForm();const valid=CidooProject.validate(project);const blob=new Blob([JSON.stringify(valid,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(valid.name.replace(/[^\p{L}\p{N}_-]+/gu,'-')||'animation')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('JSON скачан. Его можно открыть в этом редакторе или поделиться файлом.');}catch(error){notice(error.message,true);}});
$('importProject').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Файл слишком большой: максимум 1 МБ.');const valid=CidooProject.validate(JSON.parse(await file.text()));checkpoint();project=valid;activeFrame=0;playing=false;form();render();saveDraft();$('sourceLabel').textContent='Исходник из JSON · перед запуском читается Layer 1';notice('Открыто: '+project.name);}catch(error){notice(error.message,true);}finally{event.target.value='';}});
let lastDraw=-Infinity;
function animate(now){
  if(!playing){previewHandle=null;return;}
  if(playing&&!document.hidden&&now-lastDraw>=1000/20){lastDraw=now;const seconds=(now-previewStarted)/1000;CidooHeartMath.paint(previewBytes,sourceBytes,seconds,project);showColors(previewBytes);$('previewTime').textContent=clock(seconds);}
  previewHandle=requestAnimationFrame(animate);
}
buildKeyboard();form();render();
document.addEventListener('visibilitychange',async()=>{if(!extension||document.hidden||busy)return;try{state(await send('status'));}catch(error){notice(error.message,true);}});
(async()=>{
  try{const draft=await storage.get('studioDraft');if(draft){project=CidooProject.validate(draft);form();render();}library=(await storage.get('studioLibrary')||[]).map(CidooProject.validate);renderLibrary();if(extension)state(await send('status'));else notice('Режим предпросмотра: устройство не подключается. Для C80 загрузи расширение в Chrome.');}
  catch(error){notice(error.message,true);}
})();
setInterval(async()=>{if(!extension||busy||!live||document.hidden)return;try{state(await send('status'));}catch(error){notice(error.message,true);}},1000);
