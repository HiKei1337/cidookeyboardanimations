const copy={
  en:{back:'Home',github:'GitHub ↗',kicker:'COMMUNITY ANIMATION LIBRARY',title:'Borrow a rhythm.<br><span>Make it yours.</span>',lead:'Ready-made animations for CIDOO RGB Studio. The small preview can look rough because it shows frames quickly; open the animation in the editor for the accurate result.',previewNote:'Preview may look rough — open the animation in the editor for the accurate result.',browse:'Browse animations ↓',libraryKicker:'01 / LIBRARY',libraryTitle:'A small collection,<br>made with care.',searchLabel:'Search',search:'Search…',all:'All',calm:'Calm',bright:'Bright',motion:'Motion',empty:'Nothing found. Try another word.',submitKicker:'02 / YOUR ANIMATION',submitTitle:'Have something to show?',submitCopy:'Suggest a JSON animation right here. After review, it will join the collection.',submitButton:'Send for review',nameLabel:'Name',authorLabel:'Author',descriptionLabel:'Description',jsonLabel:'Animation JSON',jsonHint:'A file from the editor, up to 512 KB.',admin:'Admin',footer:'Workshop Lite · projects stay local until you submit a JSON file.',guide:'How to make an animation ↗',download:'Download JSON',open:'Open in editor',tags:{calm:'calm',bright:'bright',motion:'motion'}},
  ru:{back:'На главную',github:'GitHub ↗',kicker:'КОЛЛЕКЦИЯ АНИМАЦИЙ',title:'Забери чужой ритм.<br><span>Сделай свой.</span>',lead:'Готовые анимации для CIDOO RGB Studio. Маленькое превью может отображаться криво, потому что быстро показывает кадры — для точного результата открой анимацию в конструкторе.',previewNote:'Превью может отображаться криво — для точного результата открой анимацию в конструкторе.',browse:'Смотреть анимации ↓',libraryKicker:'01 / LIBRARY',libraryTitle:'Небольшая коллекция,<br>сделанная с любовью.',searchLabel:'Поиск',search:'Поиск…',all:'Все',calm:'Спокойные',bright:'Яркие',motion:'Движение',empty:'Ничего не найдено. Попробуй другое слово.',submitKicker:'02 / YOUR ANIMATION',submitTitle:'Есть что показать?',submitCopy:'Предложи JSON прямо здесь. После проверки анимация появится в коллекции.',submitButton:'Отправить на проверку',nameLabel:'Название',authorLabel:'Автор',descriptionLabel:'Описание',jsonLabel:'JSON анимации',jsonHint:'Файл из конструктора, до 512 КБ.',admin:'Админка',footer:'Workshop Lite · проекты остаются локальными, пока ты сам не отправишь JSON.',guide:'Как сделать анимацию ↗',download:'Скачать JSON',open:'Открыть в конструкторе',tags:{calm:'спокойно',bright:'ярко',motion:'движение'}}
};
const entries=[
  {id:'heartbeat',icon:'♥',tags:['bright','motion'],ru:{name:'Красное сердце',desc:'Двойное биение красного сердца. RGB 255, 0, 0; фон сохраняет исходные цвета.'},en:{name:'Red heartbeat',desc:'A red heart beats twice. RGB 255, 0, 0; the background keeps its original colours.'}},
  {id:'flowers',icon:'✿',tags:['bright'],ru:{name:'Цветы',desc:'Три ярких цветка раскрываются по очереди.'},en:{name:'Flowers',desc:'Three bright flowers bloom one after another.'}},
  {id:'aurora',icon:'◌',tags:['calm','motion'],ru:{name:'Северное сияние',desc:'Медленные зелёно-синие волны по всей клавиатуре.'},en:{name:'Northern lights',desc:'Slow green and blue waves across the keyboard.'}},
  {id:'comet',icon:'☄',tags:['bright','motion'],ru:{name:'Комета',desc:'Холодный хвост разгорается оранжевым и белым.'},en:{name:'Comet',desc:'A cold tail heats up through orange into white.'}},
  {id:'fireflies',icon:'✦',tags:['calm'],ru:{name:'Светлячки',desc:'Редкие мягкие вспышки разбегаются по клавишам.'},en:{name:'Fireflies',desc:'Soft, rare flashes drift across the keys.'}},
  {id:'wave',icon:'≈',tags:['bright','motion'],ru:{name:'Радужная волна',desc:'Радуга плавно проходит от края к краю.'},en:{name:'Rainbow wave',desc:'A rainbow rolls smoothly from edge to edge.'}},
  {id:'rain',icon:'╱',tags:['calm','motion'],ru:{name:'Неоновый дождь',desc:'Синие капли падают вертикальными дорожками.'},en:{name:'Neon rain',desc:'Blue drops fall in vertical neon lanes.'}},
  {id:'sparkles',icon:'✧',tags:['bright'],ru:{name:'Искры',desc:'Розово-золотые искры вспыхивают в разных местах.'},en:{name:'Sparkles',desc:'Pink and gold sparks flash in different places.'}}
];
const additions=[
['ocean','≈',['calm','motion'],'Океан','Светящаяся пена на глубоких синих волнах.','Ocean','Bright foam rolls over deep blue waves.'],
['lava','♨',['bright','motion'],'Лава','Красно-оранжевые потоки медленно меняют направление.','Lava','Red and orange streams flow across the keys.'],
['matrix','▥',['motion'],'Зелёный код','Зелёные дорожки с яркими белыми вершинами.','Green code','Green columns fall with pale glowing heads.'],
['sunset','◒',['calm'],'Закат','Тёплый оранжевый растворяется в фиолетовом.','Sunset','Warm orange fades into violet.'],
['radar','◉',['motion'],'Радар','Зелёный луч обходит клавиатуру по кругу.','Radar','A green beam sweeps around the keyboard.'],
['candy','✦',['bright'],'Сахарный неон','Розовый и бирюзовый встречаются в мягкой волне.','Candy neon','Pink and cyan meet in a soft wave.'],
['reactive-ripple','◎',['interactive','motion'],'Волна от нажатия','Нажми клавишу в превью: от неё расходится голубая волна.','Key ripple','Click a preview key to send a cyan ripple outward.'],
['reactive-fire','♨',['interactive','bright'],'Огненные клавиши','Нажми клавишу в превью: вспышка оставит горячий след.','Fire keys','Click a preview key to leave a warm glowing trail.']
];
entries.push(...additions.map(([id,icon,tags,ruName,ruDesc,enName,enDesc])=>({id,icon,tags,ru:{name:ruName,desc:ruDesc},en:{name:enName,desc:enDesc}})));
copy.ru.tags.interactive='нажатия';copy.en.tags.interactive='interactive';
let language;try{language=localStorage.getItem('cidoo-landing-language')}catch{}if(!['ru','en'].includes(language))language=navigator.language?.toLowerCase().startsWith('ru')?'ru':'en';
let favorites=new Set();try{const saved=JSON.parse(localStorage.getItem('cidoo-workshop-favorites')||'[]');if(Array.isArray(saved))favorites=new Set(saved.filter(id=>typeof id==='string'));}catch{}
const canvases=new Map(),frames=new Map(),previewStates=new Map(),speedOverrides=new Map(),cloudEntries=[],assetRoot='./';
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(items=>{for(const item of items){const state=previewStates.get(item.target.dataset.previewId);if(state)state.visible=item.isIntersecting;}},{rootMargin:'120px'}):null;
function text(key){return copy[language][key]}
function setLanguage(value){
 language=value==='en'?'en':'ru';document.documentElement.lang=language;
 for(const el of document.querySelectorAll('[data-i]'))el.innerHTML=copy[language][el.dataset.i];
 document.querySelector('#search').placeholder=text('search');
 for(const el of document.querySelectorAll('[data-placeholder-'+language+']'))el.placeholder=el.dataset['placeholder'+(language==='en'?'En':'Ru')];
 const labels=[text('all'),text('calm'),text('bright'),text('motion'),language==='ru'?'На нажатия':'Interactive',language==='ru'?'Избранное':'Favorites'];
 [...document.querySelector('#filter').options].forEach((option,index)=>option.textContent=labels[index]);
 for(const b of document.querySelectorAll('[data-language]'))b.setAttribute('aria-pressed',String(b.dataset.language===language));
 render();try{localStorage.setItem('cidoo-landing-language',language)}catch{}
}
const draw=CidooKeyboardPreview.draw;
async function loadPreview(entry,canvas,speed,output){
 try{
  const raw=entry.animation||await fetch(assetRoot+'examples/'+entry.id+'.json').then(r=>{if(!r.ok)throw Error('Animation unavailable');return r.json()});
  const project=CidooProject.validate(raw);if(!canvas.isConnected)return;
  if(speedOverrides.has(entry.id))project.playbackSpeed=speedOverrides.get(entry.id);
  speed.value=project.playbackSpeed;output.textContent=project.playbackSpeed+'×';
  frames.set(entry.id,project);canvases.set(entry.id,canvas);
  const state={project,source:new Uint8Array(project.sourceColors),colors:new Uint8Array(396),reaction:new CidooHeartMath.Reactions(),demoAt:0,demoIndex:0,visible:true};previewStates.set(entry.id,state);canvas.dataset.previewId=entry.id;observer?.observe(canvas);
  const label=canvas.parentElement.querySelector('.preview-meta span:last-child');
  label.textContent=project.reactiveMode!=='off'?(language==='ru'?'ДЕМО · НАЖМИ КЛАВИШУ':'DEMO · CLICK A KEY'):(project.frames.length?project.frames.length+' FRAMES':'HEARTBEAT')+' · LAYER 2';
  if(project.reactiveMode!=='off'){
   canvas.classList.add('interactive-preview');canvas.tabIndex=0;canvas.setAttribute('role','button');
   canvas.addEventListener('click',event=>{const index=CidooKeyboardPreview.hitTest(canvas,event.clientX,event.clientY);if(index!==null){state.reaction.press(index,performance.now()/1000);state.demoAt=performance.now()/1000+3;}});
   canvas.addEventListener('keydown',event=>{if(event.repeat)return;const index=CidooLayout.codeIndex(event.code);if(index!==undefined){state.reaction.press(index,performance.now()/1000);state.demoAt=performance.now()/1000+3;}});
  }
  draw(canvas,project.frames[0]?.colors||project.sourceColors);
 }catch{const label=canvas.parentElement.querySelector('.preview-meta span:last-child');if(label)label.textContent=language==='ru'?'ПРЕВЬЮ НЕДОСТУПНО':'PREVIEW UNAVAILABLE';}
}
function render(){
 const query=document.querySelector('#search').value.toLowerCase().trim(),filter=document.querySelector('#filter').value,holder=document.querySelector('#cards');
 observer?.disconnect();for(const link of holder.querySelectorAll('a[data-blob]'))URL.revokeObjectURL(link.dataset.blob);holder.replaceChildren();canvases.clear();frames.clear();previewStates.clear();let count=0;
 for(const entry of [...entries,...cloudEntries]){
  const info=entry[language],hay=(info.name+' '+info.desc+' '+entry.tags.join(' ')).toLowerCase();
  if(query&&!hay.includes(query)||filter==='favorites'&&!favorites.has(entry.id)||!['all','favorites'].includes(filter)&&!entry.tags.includes(filter))continue;
  count++;const card=document.createElement('article');card.className='card';
  const preview=document.createElement('div');preview.className='preview';const canvas=document.createElement('canvas');canvas.width=760;canvas.height=240;canvas.setAttribute('aria-label',info.name);
  const meta=document.createElement('div');meta.className='preview-meta';const live=document.createElement('span'),caption=document.createElement('span');live.textContent='● LIVE PREVIEW';caption.textContent='LAYER 2';meta.append(live,caption);preview.append(canvas,meta);
  const body=document.createElement('div');body.className='card-body';const heading=document.createElement('div');heading.className='card-heading';const h=document.createElement('h3');h.textContent=entry.icon+' '+info.name;
  const favorite=document.createElement('button');favorite.className='favorite';favorite.type='button';favorite.setAttribute('aria-label',language==='ru'?'В избранное':'Add to favorites');
  const favoriteState=()=>{favorite.textContent=favorites.has(entry.id)?'★':'☆';favorite.setAttribute('aria-pressed',String(favorites.has(entry.id)));};favoriteState();
  favorite.addEventListener('click',()=>{if(favorites.has(entry.id))favorites.delete(entry.id);else favorites.add(entry.id);try{localStorage.setItem('cidoo-workshop-favorites',JSON.stringify([...favorites]))}catch{}favoriteState();if(filter==='favorites')render();});heading.append(h,favorite);
  const p=document.createElement('p');p.textContent=info.desc;const tags=document.createElement('div');tags.className='tags';for(const tag of entry.tags){const span=document.createElement('span');span.className='tag';span.textContent=copy[language].tags[tag]||tag;tags.append(span);}
  const speedLabel=document.createElement('label');speedLabel.className='preview-speed';speedLabel.textContent=language==='ru'?'Скорость':'Speed';const speed=document.createElement('input');speed.type='range';speed.min='.25';speed.max='4';speed.step='.05';speed.value='1';const output=document.createElement('output');output.textContent='1×';speedLabel.append(speed,output);
  speed.addEventListener('input',()=>{const value=Number(speed.value);speedOverrides.set(entry.id,value);const project=frames.get(entry.id);if(project)project.playbackSpeed=value;output.textContent=value+'×';});
  const actions=document.createElement('div');actions.className='card-actions';const download=document.createElement('a');download.className='button';download.download=entry.id+'.json';download.href=assetRoot+'examples/'+entry.id+'.json';download.textContent=text('download');
  const open=document.createElement('a');open.className='button primary';open.href=assetRoot+'studio.html';open.textContent=text('open');
  open.addEventListener('click',event=>{const project=frames.get(entry.id);if(!project){event.preventDefault();return;}try{localStorage.setItem('cidooStudio.studioDraft',JSON.stringify(project));}catch{event.preventDefault();}});
  download.addEventListener('click',event=>{const project=frames.get(entry.id);if(!project){event.preventDefault();return;}if(download.dataset.blob)URL.revokeObjectURL(download.dataset.blob);download.href=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));download.dataset.blob=download.href;});
  actions.append(download,open);body.append(heading,p,tags,speedLabel,actions);card.append(preview,body);holder.append(card);loadPreview(entry,canvas,speed,output);
 }
 document.querySelector('#empty').hidden=count!==0;
}
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.language)));document.querySelector('#search').addEventListener('input',render);document.querySelector('#filter').addEventListener('change',render);
setLanguage(language);window.CIDOO_WORKSHOP={addCloudEntries(items){cloudEntries.splice(0,cloudEntries.length,...items);render();},render};
function animatePreviews(now){if(document.hidden)return;const seconds=now/1000;for(const[id,canvas]of canvases){const state=previewStates.get(id);if(!state?.visible)continue;const {project,source,colors,reaction}=state;
 if(project.reactiveMode!=='off'&&seconds>=state.demoAt){const demo=[45,73,95,116,54,68];reaction.press(demo[state.demoIndex++%demo.length],seconds);state.demoAt=seconds+1.8;}
 CidooHeartMath.paint(colors,source,seconds,project);reaction.paint(colors,seconds,project,source);draw(canvas,colors);
}}
setInterval(()=>animatePreviews(performance.now()),125);
