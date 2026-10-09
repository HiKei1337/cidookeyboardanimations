(() => {
  'use strict';
  const names={flag:{ru:'Флаг России · мигание',en:'Russian flag · blink'},flowers:{ru:'Цветы · распускаются',en:'Flowers · blooming'},aurora:{ru:'Северное сияние',en:'Northern lights'},comet:{ru:'Комета',en:'Comet'},fireflies:{ru:'Светлячки',en:'Fireflies'}};
  const positions=CidooLayout.rows.flatMap((row,y)=>{let x=0;return row.map(key=>{const pos={index:key.index,x:x+key.width/2,y};x+=key.width;return pos;});});
  function build(id,language='ru'){
    if(!names[id])throw Error('Неизвестный шаблон.');
    const project=CidooProject.demo();project.name=names[id][language==='en'?'en':'ru'];project.effect='timeline';project.keys=positions.map(p=>p.index);project.frames=[];project.duration=0;project.interpolation=id==='flag'?'step':'smooth';
    const add=(color,durationMs=150)=>{const colors=[...project.sourceColors];for(const pos of positions)colors.splice(pos.index*3,3,...color(pos).map(v=>Math.round(Math.max(0,Math.min(255,v)))));project.frames.push({durationMs,colors});};
    if(id==='flag'){
      const bands=[[255,255,255],[0,0,255],[255,0,0]];
      add(p=>bands[Math.floor(p.y/2)],800);add(()=>[0,0,0],500);
    }else for(let frame=0;frame<32;frame++){
      const phase=frame/32;
      if(id==='flowers')add(p=>{
        const centers=[{x:3,y:2,t:0},{x:8,y:3,t:.3},{x:12,y:2,t:.6}];let result=[0,0,0];
        for(let n=0;n<centers.length;n++){const c=centers[n],age=(phase-c.t+1)%1,life=age<.12?age/.12:age<.48?1:Math.max(0,(.6-age)/.12);if(age>.6)continue;
          const dx=Math.abs(p.x-c.x),dy=Math.abs(p.y-c.y),distance=dx+dy,radius=Math.min(1.8,age*12);let rgb=null;
          if(distance<.7)rgb=[255,255,0];else if(distance<radius+.5&&((dx<.9)||(dy<.6)))rgb=[[255,0,255],[0,255,255],[255,0,0]][n];
          if(rgb)result=rgb.map(v=>v*life);
        }return result;
      },180);
      else if(id==='aurora')add(p=>{const a=(1+Math.sin(p.x*.45+p.y*.6+phase*Math.PI*2))/2,b=(1+Math.cos(p.x*.3-phase*Math.PI*2))/2;return [15+65*b,15+175*a,50+155*(1-a)];},130);
      else if(id==='comet')add(p=>{const distance=(phase*19-p.x+19)%19,level=distance<5?(1-distance/5)**2:0;return [8+70*level,10+185*level,18+237*level];},120);
      else add(p=>{const seed=((p.index*37)%97)/97,life=Math.max(0,Math.cos((phase-seed)*Math.PI*2))**14;return [4+180*life,7+248*life,8+35*life];},180);
    }
    return CidooProject.validate(project);
  }
  globalThis.CidooPresets=Object.freeze({names,build});
})();
