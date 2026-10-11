(() => {
'use strict';
const spells=[
 ['cold','QQQ','Cold Snap','Холодная хватка','Ледяные импульсы'],
 ['ghost','QQW','Ghost Walk','Призрачная прогулка','Холодный призрачный след'],
 ['wall','QQE','Ice Wall','Ледяная стена','Полоса морозного света'],
 ['emp','WWW','E.M.P.','Электромагнитный импульс','Заряд и вспышка энергии'],
 ['tornado','WWQ','Tornado','Торнадо','Вихрь через клавиатуру'],
 ['alacrity','WWE','Alacrity','Ускорение','Разгон световой волны'],
 ['sun','EEE','Sun Strike','Солнечный удар','Яркий удар сверху'],
 ['forge','EEQ','Forge Spirit','Духи огня','Два очага пламени'],
 ['meteor','EEW','Chaos Meteor','Метеор','Падение и огненный след'],
 ['blast','QWE','Deafening Blast','Оглушающий взрыв','Расходящийся световой удар']
];
const $=id=>document.getElementById(id),canvas=$('keyboard'),base=new Uint8Array(396),target=new Uint8Array(396),engine=new CidooHeartMath.Reactions();
let orbs=[],active=null,start=0,speed=1,loaded=false,autoIndex=8,lastAuto=0,animation=null;
const now=()=>performance.now()/1000;
function renderOrbs(){ $('orbs').replaceChildren(...Array.from({length:3},(_,i)=>{const el=document.createElement('span');el.textContent=orbs[i]||'·';el.className=orbs[i]||'';return el;}));$('invoke').disabled=!loaded||orbs.length!==3; }
function cast(spell){if(!loaded)return;active=spell;start=now();engine.clear();engine.press(spell.project.reactiveAnchor,start,spell.project);$('spell-name').textContent=spell[2]+' · '+spell[3];$('hint').textContent=spell[1]+' → '+spell[2]+'. Попробуй другое сочетание или повтори удар.';for(const button of $('spells').children)button.setAttribute('aria-pressed',String(button.dataset.id===spell[0]));orbs=[];renderOrbs();wake();}
function invoke(){if(orbs.length!==3)return;const signature=orbs.slice().sort().join('');cast(spells.find(s=>s[1].split('').sort().join('')===signature));}
function orb(letter){if(!loaded)return;$('autoplay').checked=false;if(orbs.length===3)orbs=[];orbs.push(letter);renderOrbs();$('hint').textContent=orbs.length===3?'Три сферы готовы. Нажми R или «Призвать».':'Добавь ещё '+(3-orbs.length)+' сферу(ы). Порядок не важен.';if(orbs.length===3&&$('auto-invoke').checked)invoke();}
function draw(){animation=null;const time=now();if($('autoplay').checked&&time-lastAuto>3.5){lastAuto=time;cast(spells[autoIndex++%spells.length]);}if(active){const profile={...active.project,playbackSpeed:speed};CidooHeartMath.paint(target,base,time-start,profile);engine.paint(target,time,profile,base);}else target.fill(0);CidooKeyboardPreview.draw(canvas,target);if(!document.hidden&&(engine.hits.length||$('autoplay').checked))wake();}
function wake(){if(animation===null&&!document.hidden)animation=requestAnimationFrame(draw);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(animation!==null)cancelAnimationFrame(animation);animation=null;}else wake();});
document.addEventListener('keydown',event=>{if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input:not([type=checkbox]),textarea,select'))return;const letter={KeyQ:'Q',KeyW:'W',KeyE:'E'}[event.code];if(letter){event.preventDefault();orb(letter);}else if(event.code==='KeyR'){event.preventDefault();invoke();}else if(event.code==='Escape')reset();});
function reset(){orbs=[];active=null;engine.clear();$('autoplay').checked=false;renderOrbs();$('spell-name').textContent='Собери три сферы';$('hint').textContent='Q / W / E — сферы. R — призвать. Можно нажимать кнопки мышью.';for(const button of $('spells').children)button.setAttribute('aria-pressed','false');wake();}
for(const button of document.querySelectorAll('[data-orb]'))button.addEventListener('click',()=>orb(button.dataset.orb));
$('invoke').addEventListener('click',invoke);$('reset').addEventListener('click',reset);$('auto-invoke').addEventListener('change',()=>{if($('auto-invoke').checked)invoke();});$('autoplay').addEventListener('change',()=>{lastAuto=0;wake();});
$('speed').addEventListener('input',()=>{speed=Number($('speed').value);$('speed-value').textContent=speed+'×';wake();});
Promise.all(spells.map(async spell=>{const response=await fetch('examples/invoker-'+spell[0]+'.json');if(!response.ok)throw new Error('HTTP '+response.status);spell.project=await response.json();spell.project.reactiveOrigin='fixed';spell.project.reactiveRulesEnabled=false;})).then(()=>{
 loaded=true;for(const spell of spells){const button=document.createElement('button');button.className='spell';button.dataset.id=spell[0];button.setAttribute('aria-pressed','false');const combo=document.createElement('span');combo.className='combo';combo.textContent=spell[1];const name=document.createElement('strong');name.textContent=spell[2];const description=document.createElement('small');description.textContent=spell[3]+' · '+spell[4];button.append(combo,name,description);button.addEventListener('click',()=>{$('autoplay').checked=false;cast(spell);});$('spells').append(button);}for(const button of document.querySelectorAll('[data-orb]'))button.disabled=false;renderOrbs();if(matchMedia('(prefers-reduced-motion: reduce)').matches)reset();else cast(spells[8]);
}).catch(()=>{$('spell-name').textContent='Не удалось загрузить демку';$('hint').textContent='Обнови страницу. Если ошибка повторяется, открой демо через мастерскую.';});
CidooKeyboardPreview.draw(canvas,target);
})();
