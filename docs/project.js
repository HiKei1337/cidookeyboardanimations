(() => {
  'use strict';
  function colors(value){
    if(!Array.isArray(value)||value.length!==396||!value.every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('В кадре должно быть 396 значений RGB от 0 до 255.');
    return [...value];
  }
  function validate(raw){
    if(!raw||raw.format!=='cidoo-rgb-studio'||raw.version!==1)throw Error('Это не проект CIDOO RGB Studio версии 1.');
    if(raw.sourceLayer!==1||raw.targetLayer!==2)throw Error('Разрешено только чтение Layer 1 и анимация Layer 2.');
    if(!Array.isArray(raw.keys)||!raw.keys.length||raw.keys.length>132||!raw.keys.every(n=>Number.isInteger(n)&&n>=0&&n<132))throw Error('Выберите хотя бы одну клавишу для анимации.');
    if(!['heartbeat','breathe','shimmer','heartbeat-shimmer','timeline'].includes(raw.effect))throw Error('Неизвестный эффект.');
    const frames=raw.frames||[];
    if(!Array.isArray(frames)||frames.length>120)throw Error('В проекте может быть не более 120 кадров.');
    if(raw.effect==='timeline'&&!frames.length)throw Error('Добавьте хотя бы один кадр.');
    const checked=frames.map(frame=>{
      if(!Number.isInteger(frame.durationMs)||frame.durationMs<50||frame.durationMs>60000)throw Error('Длительность кадра должна быть от 50 до 60000 мс.');
      return {durationMs:frame.durationMs,colors:colors(frame.colors)};
    });
    return {format:'cidoo-rgb-studio',version:1,sourceLayer:1,targetLayer:2,name:String(raw.name||'Моя анимация').slice(0,80),
      ...CidooHeartMath.options({...raw,frames:checked}),keys:[...new Set(raw.keys)],frames:checked,sourceColors:colors(raw.sourceColors)};
  }
  function config(project){const valid=validate(project);return CidooHeartMath.options({...valid,projectName:valid.name});}
  function demo(){
    const bytes=new Array(396);for(let index=0;index<132;index++)bytes.splice(index*3,3,...(CidooHeartMath.heart.includes(index)?[255,0,0]:index===66?[126,249,2]:[150,150,150]));
    return validate({format:'cidoo-rgb-studio',version:1,sourceLayer:1,targetLayer:2,name:'Бьющееся сердце',effect:'heartbeat',keys:[...CidooHeartMath.heart],sourceColors:bytes,frames:[],bpm:65,fps:8,min:15,max:100,duration:0});
  }
  globalThis.CidooProject=Object.freeze({validate,config,demo,colors});
})();
