'use strict';
const $=id=>document.getElementById(id);
const fields=['effect','bpm','fps','min','max','restoreMode'];
const buttons=['connect','start','stop','copy','restoreBackup'];
let busy=false,previewConfig=CidooHeartMath.options(),live=false;
function duration(){
  if($('autoOff').value==='never')return 0;
  const integer=(id,max=Number.MAX_SAFE_INTEGER)=>Math.min(max,Math.max(0,Math.floor(Number($(id).value)||0)));
  return integer('hours')*3600+integer('minutes',59)*60+integer('seconds',59);
}
function settings(){return CidooHeartMath.options({...previewConfig,...Object.fromEntries(fields.map(id=>[id,$(id).value])),duration:duration()});}
function time(seconds){const value=Math.max(0,Math.ceil(seconds));return `${Math.floor(value/3600).toString().padStart(2,'0')}:${Math.floor(value%3600/60).toString().padStart(2,'0')}:${(value%60).toString().padStart(2,'0')}`;}
function report(state){
  live=!!state.running;
  $('status').className=state.error?'error':'';
  const remaining=state.config?.duration>0?` · осталось ${time(state.config.duration-state.elapsed)}`:' · без таймера';
  $('status').textContent=state.error||(state.running?`Работает в фоне · ${state.config.bpm} уд/мин${remaining}`:state.ready?'Фоновое управление готово. Вкладку можно свернуть или закрыть.':'Подключите клавиатуру к фоновому управлению.');
}
async function send(action,config,identity){const result=await chrome.runtime.sendMessage({type:'cidoo-heart',action,config,identity});if(!result?.ok)throw Error(result?.error||'Расширение не получило ответ.');return result.state;}
async function command(action){
  if(busy)return;busy=true;for(const id of buttons)$(id).disabled=true;
  try{
    const config=settings();
    if(action==='start'&&$('autoOff').value==='timer'&&config.duration===0)throw Error('Укажите время таймера больше нуля или выберите «Никогда».');
    if(action!=='status')await chrome.storage.local.set({settings:{...config,schema:2}});
    if(action==='connect'){
      await chrome.tabs.create({url:chrome.runtime.getURL('connect.html')});
      $('status').textContent='Подключение открыто в отдельной вкладке. Вернись сюда после подключения.';
    }else report(await send(action,config));
  }catch(error){$('status').className='error';$('status').textContent=error.message;}
  finally{busy=false;for(const id of buttons)$(id).disabled=false;}
}
for(const id of [...fields,'autoOff','hours','minutes','seconds'])$(id).addEventListener('input',()=>{
  $('timerFields').hidden=$('autoOff').value==='never';previewConfig=settings();$('bpm-value').textContent=`${previewConfig.bpm} уд/мин`;
});
for(const action of buttons)$(action).addEventListener('click',()=>command(action));
$('open').addEventListener('click',()=>chrome.tabs.create({url:'https://cidoo.illumipc.com/#/'}));
$('studio').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('studio.html')}));
const ctx=$('preview').getContext('2d'),bytes=new Uint8Array(396),base=new Uint8Array(396);
for(let index=0;index<132;index++)base.set(CidooHeartMath.heart.includes(index)?[255,0,0]:index===66?[126,249,2]:[150,150,150],index*3);
let lastDraw=-Infinity;
function draw(ms){
  if(!document.hidden&&ms-lastDraw>=1000/20){
    lastDraw=ms;CidooHeartMath.paint(bytes,base,ms/1000,previewConfig);ctx.clearRect(0,0,360,155);
    for(let row=0;row<5;row++)for(let col=0;col<12;col++){
      const index=row*22+col+2,offset=index*3;
      ctx.fillStyle=`rgb(${bytes[offset]},${bytes[offset+1]},${bytes[offset+2]})`;ctx.globalAlpha=CidooHeartMath.heart.includes(index)?1:.13;
      ctx.beginPath();ctx.roundRect(22+col*26,17+row*25,21,19,4);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
(async()=>{
  const {settings:saved}=await chrome.storage.local.get('settings');
  if(saved){
    // v1 had a mandatory 60-second session. Its old limit is not migrated.
    previewConfig=CidooHeartMath.options({...saved,duration:saved.schema===2?saved.duration:0,fps:saved.schema===2?saved.fps:8});
    for(const id of fields)$(id).value=String(previewConfig[id]);
    $('autoOff').value=previewConfig.duration===0?'never':'timer';$('timerFields').hidden=previewConfig.duration===0;
    if(previewConfig.duration>0){$('hours').value=Math.floor(previewConfig.duration/3600);$('minutes').value=Math.floor(previewConfig.duration%3600/60);$('seconds').value=Math.floor(previewConfig.duration%60);}
    $('bpm-value').textContent=`${previewConfig.bpm} уд/мин`;
  }
  await command('status');
})();
setInterval(async()=>{if(busy||!live||document.hidden)return;try{report(await send('status'));}catch{}},1000);
