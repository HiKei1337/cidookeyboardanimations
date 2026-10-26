(() => {
  'use strict';
  function colors(value){
    if(!Array.isArray(value)||value.length!==396||!value.every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('В кадре должно быть 396 значений RGB от 0 до 255.');
    return [...value];
  }
  function validateProject(raw,depth=0){
    if(depth>1)throw Error('Вложенные правила не поддерживаются.');
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
    if(raw.reactiveRules!==undefined&&(!Array.isArray(raw.reactiveRules)||raw.reactiveRules.length>12))throw Error('Не более 12 правил.');
    if(depth&&(raw.reactiveRulesEnabled||raw.reactiveRules?.length))throw Error('Вложенные правила не поддерживаются.');
    const rules=(raw.reactiveRules||[]).map(rule=>{
      if(!rule||!['sequence','set'].includes(rule.match)||!Array.isArray(rule.keys)||!rule.keys.length||rule.keys.length>4||!rule.keys.every(n=>Number.isInteger(n)&&n>=0&&n<132))throw Error('Правило: от 1 до 4 клавиш.');
      const project=validateProject(rule.project,depth+1);if(project.reactiveMode==='off')throw Error('Анимация правила должна реагировать на нажатие.');
      return {name:String(rule.name||project.name).slice(0,80),match:rule.match,keys:[...rule.keys],project};
    });
    if(checked.length+rules.reduce((n,r)=>n+r.project.frames.length,0)>240)throw Error('Проект с правилами: не более 240 кадров суммарно.');
    return {format:'cidoo-rgb-studio',version:1,sourceLayer:1,targetLayer:2,name:String(raw.name||'Моя анимация').slice(0,80),
      ...CidooHeartMath.options({...raw,frames:checked,reactiveRules:rules}),keys:[...new Set(raw.keys)],frames:checked,sourceColors:colors(raw.sourceColors)};
  }
  const validate=raw=>validateProject(raw);
  function config(project){const valid=validate(project);return CidooHeartMath.options({...valid,projectName:valid.name});}
  function demo(){
    const bytes=new Array(396);for(let index=0;index<132;index++)bytes.splice(index*3,3,...(CidooHeartMath.heart.includes(index)?[255,0,0]:index===66?[126,249,2]:[150,150,150]));
    return validate({format:'cidoo-rgb-studio',version:1,sourceLayer:1,targetLayer:2,name:'Бьющееся сердце',effect:'heartbeat',keys:[...CidooHeartMath.heart],sourceColors:bytes,frames:[],bpm:65,fps:8,min:15,max:100,duration:0});
  }
  globalThis.CidooProject=Object.freeze({validate,config,demo,colors});
})();

// Image files stay in this browser. Only the resulting RGB frames enter a project.
(() => {
  'use strict';
  const WIDTH=960,HEIGHT=288,MAX_FRAMES=120,MAX_BYTES=25*1024*1024;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function geometry(rows,width=WIDTH,height=HEIGHT){
    const gap=width/240,h=(height-gap*(rows.length-1))/rows.length;
    return rows.flatMap((row,y)=>{const unit=(width-gap*(row.length-1))/row.reduce((n,key)=>n+key.width,0);let x=0;return row.map(key=>{const box={index:key.index,label:key.label,x,y:y*(h+gap),width:key.width*unit,height:h};x+=box.width+gap;return box;});});
  }
  function placement(imageWidth,imageHeight,settings={},width=WIDTH,height=HEIGHT){
    const fit=settings.fit||'contain',zoom=clamp(Number(settings.zoom)||100,25,400)/100;
    const scale=(fit==='cover'?Math.max:Math.min)(width/imageWidth,height/imageHeight);
    const w=(fit==='stretch'?width:imageWidth*scale)*zoom,h=(fit==='stretch'?height:imageHeight*scale)*zoom;
    return {x:(width-w)/2+clamp(Number(settings.x)||0,-100,100)*width/100,y:(height-h)/2+clamp(Number(settings.y)||0,-100,100)*height/100,width:w,height:h};
  }
  function sample(rgba,width,height,boxes,settings={},base=new Array(396).fill(0)){
    const colors=Array.from(base),brightness=clamp(Number(settings.brightness??100),0,200)/100,contrast=clamp(Number(settings.contrast??100),0,200)/100;
    for(const box of boxes){
      let r=0,g=0,b=0,n=0;
      const center=settings.sampling==='center';
      const left=clamp(Math.floor(box.x+(center?.5:.15)*box.width),0,width-1),right=center?left+1:clamp(Math.ceil(box.x+.85*box.width),left+1,width);
      const top=clamp(Math.floor(box.y+(center?.5:.15)*box.height),0,height-1),bottom=center?top+1:clamp(Math.ceil(box.y+.85*box.height),top+1,height);
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const i=(y*width+x)*4;r+=rgba[i];g+=rgba[i+1];b+=rgba[i+2];n++;}
      for(const [c,value] of [r,g,b].entries())colors[box.index*3+c]=clamp(Math.round(((value/n-127.5)*contrast+127.5)*brightness),0,255);
    }
    return colors;
  }
  function plan(source,settings={}){
    if(!source.frames?.length)throw Error('Не удалось прочитать кадры изображения.');
    const total=source.frames.reduce((n,f)=>n+f.durationMs,0);
    if(source.frames.length===1)return [{index:0,durationMs:1000,time:0}];
    const start=clamp(Math.round((Number(settings.start)||0)*1000),0,Math.max(0,total-50));
    const end=clamp(Math.round(Number(settings.end??total/1000)*1000),start+50,total),length=end-start;
    const count=clamp(Math.ceil(length*clamp(Number(settings.fps)||8,4,20)/1000),1,MAX_FRAMES);
    const result=[];let sourceIndex=0,sourceEnd=source.frames[0].durationMs;
    for(let i=0;i<count;i++){
      const time=start+Math.round(i*length/count);
      while(sourceIndex<source.frames.length-1&&time>=sourceEnd)sourceEnd+=source.frames[++sourceIndex].durationMs;
      result.push({index:sourceIndex,time,durationMs:Math.max(50,Math.round((i+1)*length/count)-Math.round(i*length/count))});
    }
    return result;
  }
  function surface(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
  function render(frame,canvas,settings={}){
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),pixels=surface(frame.width,frame.height);
    const pixelContext=pixels.getContext('2d');const data=pixelContext.createImageData(frame.width,frame.height);data.data.set(frame.data);pixelContext.putImageData(data,0,0);
    ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(settings.background||'')?settings.background:'#000000';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=settings.sampling!=='center';ctx.imageSmoothingQuality='high';
    const box=placement(frame.width,frame.height,settings,canvas.width,canvas.height);ctx.drawImage(pixels,box.x,box.y,box.width,box.height);
    return sample(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,geometry(CidooLayout.rows,canvas.width,canvas.height),settings);
  }
  function sniff(bytes,type){
    if(bytes[0]===71&&bytes[1]===73&&bytes[2]===70)return 'image/gif';
    if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'image/png';
    if(bytes[0]===255&&bytes[1]===216)return 'image/jpeg';
    if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
    return type;
  }
  async function decode(file,{signal,onProgress=()=>{}}={}){
    if(!file||!file.size||file.size>MAX_BYTES)throw Error('Выбери изображение до 25 МБ.');
    const check=()=>{if(signal?.aborted)throw new DOMException('Aborted','AbortError');};
    const data=await file.arrayBuffer();check();const type=sniff(new Uint8Array(data,0,Math.min(16,data.byteLength)),file.type);
    let decoder;const frames=[];let originalWidth=0,originalHeight=0;
    function capture(image,count,durationMs){
      const w=image.displayWidth||image.width,h=image.displayHeight||image.height;
      if(!w||!h||w*h>20000000)throw Error('Изображение слишком большое: максимум 20 мегапикселей.');
      originalWidth=w;originalHeight=h;
      // Bound the retained pixels of all decoded frames to about 32 MB.
      const ratio=Math.min(1,384/w,384/h,Math.sqrt(8000000/(count*w*h)));
      const width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio)),canvas=surface(width,height),ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0,width,height);frames.push({width,height,data:ctx.getImageData(0,0,width,height).data,durationMs});
    }
    try{
      if(globalThis.ImageDecoder&&await ImageDecoder.isTypeSupported(type)){
        decoder=new ImageDecoder({data,type,preferAnimation:true});await decoder.tracks.ready;await decoder.completed;check();
        const count=decoder.tracks.selectedTrack?.frameCount||0;if(!count||count>600)throw Error('Слишком много кадров: максимум 600 в исходном файле.');
        for(let index=0;index<count;index++){
          check();const result=await decoder.decode({frameIndex:index,completeFramesOnly:true});
          try{capture(result.image,count,Math.min(60000,Math.max(20,Math.round((result.image.duration||100000)/1000))));}finally{result.image.close();}
          onProgress(index+1,count);if(index%8===0)await new Promise(resolve=>setTimeout(resolve,0));
        }
      }else{
        // Do not silently turn an unsupported animation into its first frame.
        const bytes=new Uint8Array(data);const animated=type==='image/gif'||(type==='image/png'&&hasChunk(bytes,'acTL'))||(type==='image/webp'&&hasChunk(bytes,'ANIM'));
        if(animated)throw Error('Для анимированных изображений нужен Chrome с ImageDecoder. Обнови Chrome.');
        let bitmap;try{bitmap=await createImageBitmap(new Blob([data],{type}));check();capture(bitmap,1,1000);}finally{bitmap?.close();}
      }
      check();return {name:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'Image',width:originalWidth,height:originalHeight,frames,durationMs:frames.reduce((n,f)=>n+f.durationMs,0)};
    }finally{decoder?.close();}
  }
  function hasChunk(bytes,name){const a=Array.from(name,c=>c.charCodeAt(0));for(let i=0;i<=bytes.length-4;i++)if(a.every((n,j)=>bytes[i+j]===n))return true;return false;}
  function project(source,settings,previous){
    const frames=plan(source,settings).map(entry=>({durationMs:entry.durationMs,colors:render(source.frames[entry.index],surface(320,96),settings)}));
    return CidooProject.validate({...previous,name:source.name,effect:'timeline',keys:CidooLayout.keys.map(k=>k.index),frames,interpolation:'step',playbackSpeed:1,fps:Number(settings.fps)||8,reactiveMode:'off',reactiveRulesEnabled:false,reactiveRules:[],reactiveGroups:[],reactiveCycle:false});
  }
  globalThis.CidooMedia=Object.freeze({WIDTH,HEIGHT,MAX_FRAMES,geometry,placement,sample,plan,decode,render,project});
})();
