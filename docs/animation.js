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
    const level = opts.effect === 'breathe' ? (1-Math.cos(phase*2*Math.PI))/2 : pulse(phase);
    const high = Math.max(opts.min,opts.max) / 100;
    const brightness = opts.effect === 'shimmer' ? high : opts.min/100 + (high-opts.min/100)*level;
    return base.map(key => {
      if (!opts.keys.includes(key.index)) return {index:key.index,color:{...key.color}};
      let color = {...key.color};
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
  globalThis.CidooHeartMath=Object.freeze({heart,options,pulse,frame,paint,timelinePosition});
})();
