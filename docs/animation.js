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
      reactiveMode: ['flash','ripple','heat','beat','wave','cross','snake','frames'].includes(raw.reactiveMode)?raw.reactiveMode:'off',
      reactiveDirection: ['right','left','up','down','split'].includes(raw.reactiveDirection)?raw.reactiveDirection:'right',
      reactiveSpeed: range(raw.reactiveSpeed,1,30,10),
      reactiveTrail: range(raw.reactiveTrail,1,12,4),
      reactiveRepeat: raw.reactiveRepeat==='ignore'?'ignore':'restart',
      reactiveOrigin: raw.reactiveOrigin==='key'?'key':'fixed',
      reactiveAnchor: Number.isInteger(raw.reactiveAnchor)&&raw.reactiveAnchor>=0&&raw.reactiveAnchor<132?raw.reactiveAnchor:73,
      reactiveCycle: raw.reactiveCycle===true,
      reactiveGroups: Array.isArray(raw.reactiveGroups)?raw.reactiveGroups.slice(0,12).filter(Array.isArray).map(g=>[...new Set(g.filter(n=>Number.isInteger(n)&&n>=0&&n<132))]).filter(g=>g.length):[],
      reactiveRulesEnabled: raw.reactiveRulesEnabled===true,
      reactiveRules: Array.isArray(raw.reactiveRules)?raw.reactiveRules.slice(0,12):[],
      reactiveRuleWindow: range(raw.reactiveRuleWindow,.2,5,2),
      reactiveFallback: raw.reactiveFallback!==false,
      reactiveColor: Array.isArray(raw.reactiveColor)&&raw.reactiveColor.length===3&&raw.reactiveColor.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?[...raw.reactiveColor]:[0,220,255],
      reactiveDecay: range(raw.reactiveDecay,.2,15,1),
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
    if(opts.reactiveMode==='frames'&&opts.frames?.length){
      for(const index of opts.keys||heart)for(let c=0;c<3;c++)target[index*3+c]=opts.frames[0].colors[index*3+c];
      return target;
    }
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
    clear(){this.hits.length=0;this.serial=0;this.history=[];this.child=null;}
    press(index,seconds,raw={}){
      if(!Number.isInteger(index)||!this.positions.has(index)||!Number.isFinite(seconds))return false;
      if(raw.reactiveRulesEnabled){
        this.history=(this.history||[]).filter(h=>seconds-h.time<=(raw.reactiveRuleWindow||2));this.history.push({index,time:seconds});this.history=this.history.slice(-4);
        const matches=(raw.reactiveRules||[]).filter(r=>{const tail=this.history.slice(-r.keys.length).map(h=>h.index);return tail.length===r.keys.length&&(r.match==='set'?tail.sort((a,b)=>a-b).join()===r.keys.slice().sort((a,b)=>a-b).join():tail.every((n,i)=>n===r.keys[i]));}).sort((a,b)=>b.keys.length-a.keys.length);
        if(matches.length){this.history=[];const rule=matches[0],profile={...rule.project,playbackSpeed:Math.max(.25,Math.min(4,(rule.project.playbackSpeed||1)*(raw.playbackSpeed||1)))};if(this.child?.rule!==rule)this.child={rule,engine:new Reactions(),project:profile};else this.child.project=profile;return this.child.engine.press(index,seconds,profile);}
        if(raw.reactiveFallback===false)return false;
      }
      if(raw.reactiveMode==='frames'){
        const duration=(raw.frames||[]).reduce((sum,f)=>sum+f.durationMs,0)/1000/(raw.playbackSpeed||1),last=this.hits.at(-1);
        if(raw.reactiveRepeat==='ignore'&&last&&seconds-last.time<duration)return false;
        this.hits.length=0;
      }
      const groups=raw.reactiveGroups||[],group=raw.reactiveCycle&&groups.length?groups[(this.serial||0)%groups.length]:null;this.serial=(this.serial||0)+1;
      this.hits.push({index,time:seconds,group});if(this.hits.length>32)this.hits.shift();return true;
    }
    paint(target,seconds,raw,source){
      if(this.child){const {engine,project}=this.child;CidooHeartMath.paint(target,source||raw.sourceColors,seconds,project);engine.paint(target,seconds,project,source);if(engine.hits.length)return target;this.child=null;CidooHeartMath.paint(target,source||raw.sourceColors,seconds,raw);}
      if(!raw.reactiveMode||raw.reactiveMode==='off'){if(raw.reactiveRulesEnabled)this.hits.length=0;else this.clear();return target;}
      const decay=raw.reactiveMode==='frames'?(raw.frames||[]).reduce((sum,f)=>sum+f.durationMs,0)/1000/(raw.playbackSpeed||1):raw.reactiveDecay||1;
      const timeScale=raw.reactiveMode==='frames'?1:raw.playbackSpeed||1;
      this.hits=this.hits.filter(hit=>seconds-hit.time>=0&&(seconds-hit.time)*timeScale<decay);
      if(raw.reactiveMode==='frames'){
        const last=this.hits.at(-1);
        if(last&&raw.frames?.length){
          if(raw.reactiveOrigin==='key'){
            const anchor=this.positions.get(raw.reactiveAnchor??73),origin=this.positions.get(last.index),temp=new Uint8Array(396);
            CidooHeartMath.paint(temp,new Uint8Array(396),seconds-last.time,{...raw,effect:'timeline',reactiveMode:'off'});
            // Move deltas from the resting frame, preserving background RGB and dark pixels.
            const rest=raw.frames[0].colors;const allowed=new Set(raw.keys||[]);
            for(const [from,p] of this.positions){if(!allowed.has(from))continue;const delta=[0,1,2].map(c=>temp[from*3+c]-rest[from*3+c]);if(delta.every(n=>n===0))continue;
              const x=p.x+origin.x-anchor.x,y=p.y+origin.y-anchor.y;let to=null,distance=Infinity;
              for(const [candidate,q] of this.positions){if(!allowed.has(candidate)||q.y!==y)continue;const d=Math.abs(q.x-x);if(d<distance){distance=d;to=candidate;}}
              if(to!==null&&distance<=.8)for(let c=0;c<3;c++)target[to*3+c]=byte(target[to*3+c]+delta[c]);
            }
          }else CidooHeartMath.paint(target,source||raw.sourceColors,seconds-last.time,{...raw,effect:'timeline',reactiveMode:'off'});
        }
        return target;
      }
      const color=raw.reactiveColor||[0,220,255],strength=(raw.reactiveStrength||100)/100;
      if(raw.reactiveMode==='beat'){
        const base=raw.effect==='timeline'&&raw.frames?.length?raw.frames[0].colors:source||raw.sourceColors;
        if(!base)return target;
        // Each accepted press contributes one finite double beat, never an automatic loop.
        const low=(raw.min||0)/100,high=Math.max(raw.min||0,raw.max||100)/100;
        for(const index of raw.keys||[]){let level=0;for(const hit of this.hits)if(!hit.group||hit.group.includes(index))level=Math.min(1,level+pulse((seconds-hit.time)*timeScale/decay));const brightness=low+(high-low)*level*strength;for(let c=0;c<3;c++)target[index*3+c]=byte(base[index*3+c]*brightness);}
        return target;
      }
      const speed=raw.reactiveSpeed||10,trail=raw.reactiveTrail||4,direction=raw.reactiveDirection||'right';
      let path,offsets;
      if(raw.reactiveMode==='snake'){
        const vertical=direction==='up'||direction==='down';
        this.paths??=new Map();
        if(!this.paths.has(vertical)){
          const route=[...this.positions].sort((a,b)=>{const pa=a[1],pb=b[1],rowA=vertical?Math.floor(pa.x):pa.y,rowB=vertical?Math.floor(pb.x):pb.y;return rowA-rowB||((rowA%2?-1:1)*(vertical?pa.y-pb.y:pa.x-pb.x));}).map(([index])=>index);
          this.paths.set(vertical,{path:route,offsets:new Map(route.map((index,n)=>[index,n]))});
        }
        ({path,offsets}=this.paths.get(vertical));
      }
      for(const index of raw.keys||[]){const p=this.positions.get(index);if(!p)continue;let level=0;
        for(const hit of this.hits){const elapsed=(seconds-hit.time)*timeScale,age=elapsed/decay,origin=this.positions.get(hit.index),distance=Math.hypot(p.x-origin.x,(p.y-origin.y)*1.4);let glow;
          if(hit.group&&!hit.group.includes(index))continue;
          if(raw.reactiveMode==='flash')glow=index===hit.index?(1-age)**2:0;
          else if(raw.reactiveMode==='heat')glow=Math.max(0,1-distance/2)*(1-age)**2;
          else if(raw.reactiveMode==='wave'){
            const dx=p.x-origin.x,dy=(p.y-origin.y)*1.4;
            const along=direction==='left'?-dx:direction==='up'?-dy:direction==='down'?dy:direction==='split'?Math.abs(dx):dx;
            glow=along>=0?Math.max(0,1-Math.abs(along-elapsed*speed)/trail)*(1-age):0;
          }else if(raw.reactiveMode==='cross'){
            const dx=Math.abs(p.x-origin.x),dy=Math.abs((p.y-origin.y)*1.4);
            const arm=Math.min(dx,dy)<.75?Math.max(dx,dy):Infinity;
            glow=Math.max(0,1-Math.abs(arm-elapsed*speed)/trail)*(1-age);
          }else if(raw.reactiveMode==='snake'){
            const reverse=direction==='left'||direction==='up',sign=reverse?-1:1;
            const head=offsets.get(hit.index)+sign*elapsed*speed;
            const behind=((sign*(head-offsets.get(index)))%path.length+path.length)%path.length;
            glow=Math.max(0,1-behind/trail)*(1-age);
          }
          else glow=Math.max(0,1-Math.abs(distance-age*12)/1.4)*(1-age);
          level=Math.min(1,level+glow);
        }
        for(let c=0;c<3;c++){const o=index*3+c;target[o]=byte(target[o]+(color[c]-target[o])*level*strength);}
      }return target;
    }
  }
  globalThis.CidooHeartMath=Object.freeze({heart,options,pulse,frame,paint,timelinePosition,Reactions});
})();
