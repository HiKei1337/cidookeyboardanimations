(() => {
  'use strict';
  const heart = [5,6,9,10,26,27,28,29,30,31,32,48,49,50,51,52,53,72,73,74,95];
  const heartSet = new Set(heart);
  const byte = n => Math.max(0, Math.min(255, Math.round(n)));
  const pulse = phase => {
    const bump = (c,w,a) => a * Math.exp(-0.5 * ((phase-c)/w)**2);
    return Math.min(1, bump(.14,.065,1) + bump(.39,.075,.67));
  };
  function options(raw = {}) {
    const range = (n,min,max,fallback) => Number.isFinite(Number(n)) ? Math.max(min,Math.min(max,Number(n))) : fallback;
    return {
      effect: ['heartbeat','breathe','shimmer','heartbeat-shimmer','timeline'].includes(raw.effect) ? raw.effect : 'heartbeat',
      bpm: range(raw.bpm,35,140,65),
      playbackSpeed: range(raw.playbackSpeed,.25,4,1),
      reactiveMode: ['flash','ripple','heat','beat'].includes(raw.reactiveMode)?raw.reactiveMode:'off',
      reactiveColor: Array.isArray(raw.reactiveColor)&&raw.reactiveColor.length===3&&raw.reactiveColor.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?[...raw.reactiveColor]:[0,220,255],
      reactiveDecay: range(raw.reactiveDecay,.2,3,1),
      reactiveStrength: range(raw.reactiveStrength,10,100,100),
      fps: range(raw.fps,4,20,8),
      min: range(raw.min,0,80,15),
      max: range(raw.max,20,100,100),
      duration: range(raw.duration,0,Number.MAX_SAFE_INTEGER,0),
      restoreMode: ['hold','previous','source'].includes(raw.restoreMode)?raw.restoreMode:'hold',
      keys: Array.isArray(raw.keys)?[...new Set(raw.keys.filter(index=>Number.isInteger(index)&&index>=0&&index<132))]:heart,
      frames: raw.frames||[],
      interpolation: raw.interpolation==='step'?'step':'smooth',
      projectName: typeof raw.projectName==='string'?raw.projectName.slice(0,80):''
    };
  }
  function frame(base,seconds,raw) {
    const opts = options(raw);
    seconds *= opts.playbackSpeed;
    const phase = (seconds * opts.bpm / 60) % 1;
    const level = opts.reactiveMode === 'beat' ? 0 : opts.effect === 'breathe' ? (1-Math.cos(phase*2*Math.PI))/2 : pulse(phase);
    const high = Math.max(opts.min,opts.max) / 100;
    const brightness = opts.effect === 'shimmer' ? high : opts.min/100 + (high-opts.min/100)*level;
    return base.map(key => {
      if (!opts.keys.includes(key.index)) return {index:key.index,color:{...key.color}};
      let color = {...key.color};
      if(opts.reactiveMode==='beat')return {index:key.index,color:{r:byte(color.r*opts.min/100),g:byte(color.g*opts.min/100),b:byte(color.b*opts.min/100)}};
      if (opts.effect.includes('shimmer')) {
        const x = key.index % 22;
        const wave = .5 + .5 * Math.sin(x*.55-seconds*1.8);
        color = {r:color.r+(255-color.r)*wave*.35,g:color.g+(28-color.g)*wave*.35,b:color.b+(105-color.b)*wave};
      }
      return {index:key.index,color:{r:byte(color.r*brightness),g:byte(color.g*brightness),b:byte(color.b*brightness)}};
    });
  }
  function paint(target,base,seconds,opts) {
    seconds *= Math.max(.25,Math.min(4,Number(opts.playbackSpeed)||1));
    target.set(base);
    if(opts.reactiveMode==='beat'){
      const drawing=opts.effect==='timeline'&&opts.frames?.length?opts.frames[0].colors:base;
      for(const index of opts.keys||heart)for(let c=0;c<3;c++)target[index*3+c]=byte(drawing[index*3+c]*opts.min/100);
      return target;
    }
    if(opts.effect==='timeline'){
      if(!opts.frames?.length)return target;
      const {index:frameIndex,time}=timelinePosition(opts.frames,seconds);
      const current=opts.frames[frameIndex],next=opts.frames[(frameIndex+1)%opts.frames.length];
      const mix=opts.interpolation==='step'?0:time/current.durationMs;
      for(const index of opts.keys)for(let channel=0;channel<3;channel++){
        const offset=index*3+channel;target[offset]=byte(current.colors[offset]+(next.colors[offset]-current.colors[offset])*mix);
      }
      return target;
    }
    const phase=(seconds*opts.bpm/60)%1;
    const level=opts.effect==='breathe'?(1-Math.cos(phase*2*Math.PI))/2:pulse(phase);
    const high=Math.max(opts.min,opts.max)/100;
    const brightness=opts.effect==='shimmer'?high:opts.min/100+(high-opts.min/100)*level;
    for(const index of opts.keys||heart){
      const offset=index*3;
      if(opts.effect.includes('shimmer')){
        const wave=.5+.5*Math.sin((index%22)*.55-seconds*1.8);
        const red=base[offset],green=base[offset+1],blue=base[offset+2];
        // Blend the source colour toward a warmer highlight; keep arbitrary source drawings.
        target[offset]=byte((red+(255-red)*wave*.35)*brightness);
        target[offset+1]=byte((green+(28-green)*wave*.35)*brightness);
        target[offset+2]=byte((blue+(105-blue)*wave)*brightness);
      }else{target[offset]=byte(base[offset]*brightness);target[offset+1]=byte(base[offset+1]*brightness);target[offset+2]=byte(base[offset+2]*brightness);}
    }
    return target;
  }
  function timelinePosition(frames,seconds){
    const total=frames.reduce((sum,frame)=>sum+frame.durationMs,0);if(!total)return {index:0,time:0};
    let time=((seconds*1000)%total+total)%total,index=0;
    while(index<frames.length-1&&time>=frames[index].durationMs){time-=frames[index].durationMs;index++;}
    return {index,time};
  }
  class Reactions {
    constructor(){this.hits=[];this.positions=new Map();const rows=globalThis.CidooLayout?.rows;if(rows)rows.forEach((row,y)=>{let x=0;for(const k of row){this.positions.set(k.index,{x:x+k.width/2,y});x+=k.width;}});else for(let i=0;i<132;i++)this.positions.set(i,{x:i%22,y:Math.floor(i/22)});}
    clear(){this.hits.length=0;}
    press(index,seconds){if(!Number.isInteger(index)||!this.positions.has(index)||!Number.isFinite(seconds))return false;this.hits.push({index,time:seconds});if(this.hits.length>32)this.hits.shift();return true;}
    paint(target,seconds,raw,source){
      if(!raw.reactiveMode||raw.reactiveMode==='off'){this.clear();return target;}
      const decay=raw.reactiveDecay||1;this.hits=this.hits.filter(hit=>seconds-hit.time>=0&&seconds-hit.time<decay);
      const color=raw.reactiveColor||[0,220,255],strength=(raw.reactiveStrength||100)/100;
      if(raw.reactiveMode==='beat'){
        const base=raw.effect==='timeline'&&raw.frames?.length?raw.frames[0].colors:source||raw.sourceColors;
        if(!base)return target;
        let level=0;
        // Each accepted press contributes one finite double beat, never an automatic loop.
        for(const hit of this.hits)level=Math.min(1,level+pulse((seconds-hit.time)/decay));
        const low=(raw.min||0)/100,high=Math.max(raw.min||0,raw.max||100)/100;
        const brightness=low+(high-low)*level*strength;
        for(const index of raw.keys||[])for(let c=0;c<3;c++)target[index*3+c]=byte(base[index*3+c]*brightness);
        return target;
      }
      for(const index of raw.keys||[]){const p=this.positions.get(index);if(!p)continue;let level=0;
        for(const hit of this.hits){const age=(seconds-hit.time)/decay,origin=this.positions.get(hit.index),distance=Math.hypot(p.x-origin.x,(p.y-origin.y)*1.4);let glow;
          if(raw.reactiveMode==='flash')glow=index===hit.index?(1-age)**2:0;
          else if(raw.reactiveMode==='heat')glow=Math.max(0,1-distance/2)*(1-age)**2;
          else glow=Math.max(0,1-Math.abs(distance-age*12)/1.4)*(1-age);
          level=Math.min(1,level+glow);
        }
        for(let c=0;c<3;c++){const o=index*3+c;target[o]=byte(target[o]+(color[c]-target[o])*level*strength);}
      }return target;
    }
  }
  globalThis.CidooHeartMath=Object.freeze({heart,options,pulse,frame,paint,timelinePosition,Reactions});
})();
