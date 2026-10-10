(() => {
  'use strict';
  const names={heartbeat:{ru:'Красное сердце',en:'Red heartbeat'},flowers:{ru:'Цветы · распускаются',en:'Flowers · blooming'},aurora:{ru:'Северное сияние',en:'Northern lights'},comet:{ru:'Комета',en:'Comet'},fireflies:{ru:'Светлячки',en:'Fireflies'},wave:{ru:'Радужная волна',en:'Rainbow wave'},rain:{ru:'Неоновый дождь',en:'Neon rain'},sparkles:{ru:'Искры',en:'Sparkles'},ocean:{ru:'Океан',en:'Ocean'},lava:{ru:'Лава',en:'Lava'},matrix:{ru:'Зелёный код',en:'Green code'},sunset:{ru:'Закат',en:'Sunset'},radar:{ru:'Радар',en:'Radar'},candy:{ru:'Сахарный неон',en:'Candy neon'},'reactive-ripple':{ru:'Волна от нажатия',en:'Key ripple'},'reactive-fire':{ru:'Огненные клавиши',en:'Fire keys'}};
  const positions=CidooLayout.rows.flatMap((row,y)=>{let x=0;return row.map(key=>{const pos={index:key.index,x:x+key.width/2,y};x+=key.width;return pos;});});
  function cometColor(p,phase){
    const headX=-2+phase*23,headY=Math.round(2+Math.sin(phase*Math.PI*2)*.7),dx=headX-p.x;
    const width=Math.max(0,1-(Math.abs(p.y-headY)/1.5)**2);
    if(dx<0||dx>7||!width)return [0,0,0];
    const heat=Math.min(1,phase/.8),cold=[0,128,255],hot=[255,64,0],white=[255,255,255];
    const a=heat<.5?cold:hot,b=heat<.5?hot:white,mix=heat<.5?heat*2:(heat-.5)*2;
    const head=a.map((v,i)=>v+(b[i]-v)*mix);
    const tail=dx<1.4?0:(dx-1.4)/5.6,level=dx<1.4?1:(1-tail)**1.5;
    return head.map((v,i)=>(v+(cold[i]-v)*tail)*level*width);
  }
  function hsv(h,s=1,v=1){const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6].map(x=>x*255);}
  function build(id,language='ru'){
    if(id==='heartbeat'){const project=CidooProject.demo();project.name=names[id][language==='en'?'en':'ru'];return project;}
    if(!names[id])throw Error('Неизвестный шаблон.');
    const project=CidooProject.demo();project.name=names[id][language==='en'?'en':'ru'];project.effect='timeline';project.keys=positions.map(p=>p.index);project.frames=[];project.duration=0;project.interpolation='smooth';
    const add=(color,durationMs=150)=>{const colors=[...project.sourceColors];for(const pos of positions)colors.splice(pos.index*3,3,...color(pos).map(v=>Math.round(Math.max(0,Math.min(255,v)))));project.frames.push({durationMs,colors});};
    if(id.startsWith('reactive-')){project.reactiveMode=id==='reactive-ripple'?'ripple':'heat';project.reactiveColor=id==='reactive-ripple'?[0,220,255]:[255,80,0];project.reactiveDecay=id==='reactive-ripple'?1.4:1;add(()=>[0,0,0],1000);add(()=>[0,0,0],1000);return CidooProject.validate(project);}
    for(let frame=0;frame<32;frame++){
      const phase=frame/32;
      if(id==='ocean'){add(p=>{const foam=(.5+.5*Math.sin(p.x*.6+p.y*1.3-phase*2*Math.PI))**8;return [foam*120,25+foam*180,80+foam*175];},170);continue;}
      if(id==='lava'){add(p=>{const glow=.5+.5*Math.sin(p.x*.7+Math.sin(p.y+phase*2*Math.PI)*2-phase*2*Math.PI);return [70+185*glow,8+95*glow**3,0];},180);continue;}
      if(id==='matrix'){add(p=>{const head=((p.index%22)*1.7+phase*9)%9-1,d=head-p.y;return d>=0&&d<3?[d<.4?170:0,255*(1-d/3),d<.4?170:0]:[0,3,0];},120);continue;}
      if(id==='sunset'){add(p=>{const a=.5+.5*Math.sin(p.x*.2+p.y*.45-phase*2*Math.PI);return [130+125*a,12+90*a*a,160*(1-a)];},220);continue;}
      if(id==='radar'){add(p=>{const angle=Math.atan2((p.y-2.5)*2,p.x-8),sweep=phase*2*Math.PI-Math.PI,delta=((angle-sweep)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),level=Math.max(0,1-delta/1.8);return [0,12+243*level,40*level];},110);continue;}
      if(id==='candy'){add(p=>{const a=.5+.5*Math.sin(p.x*.8+p.y*.7-phase*2*Math.PI);return [255*a,220*(1-a),255];},140);continue;}
      if(id==='flowers')add(p=>{
        const centers=[{x:3,y:2,t:0},{x:8,y:3,t:.3},{x:12,y:2,t:.6}];let result=[0,0,0];
        for(let n=0;n<centers.length;n++){const c=centers[n],age=(phase-c.t+1)%1,life=age<.12?age/.12:age<.48?1:Math.max(0,(.6-age)/.12);if(age>.6)continue;
          const dx=Math.abs(p.x-c.x),dy=Math.abs(p.y-c.y),distance=dx+dy,radius=Math.min(1.8,age*12);let rgb=null;
          if(distance<.7)rgb=[255,255,0];else if(distance<radius+.5&&((dx<.9)||(dy<.6)))rgb=[[255,0,255],[0,255,255],[255,0,0]][n];
          if(rgb)result=rgb.map(v=>v*life);
        }return result;
      },180);
      else if(id==='aurora')add(p=>{const a=(1+Math.sin(p.x*.45+p.y*.6+phase*Math.PI*2))/2,b=(1+Math.cos(p.x*.3-phase*Math.PI*2))/2;return [15+65*b,15+175*a,50+155*(1-a)];},130);
      else if(id==='comet')add(p=>cometColor(p,phase),140);
      else if(id==='wave')add(p=>hsv((p.x/18+phase)%1,.9,.25+.75*(.5+.5*Math.sin((p.x*.7-phase*18+p.y)*.7))),130);
      else if(id==='rain')add(p=>{const seed=((p.index*17)%31)/31,drop=(phase*6+seed*6)%6,dist=Math.abs(p.y-drop),level=Math.max(0,1-dist*1.8);return [0,80*level,180*level+75*level*level];},150);
      else if(id==='sparkles')add(p=>{const seed=((p.index*37)%101)/101,life=Math.max(0,Math.cos((phase-seed)*Math.PI*2))**18;return [255*life,70*life+8,180*life+25*life];},170);
      else add(p=>{const seed=((p.index*37)%97)/97,life=Math.max(0,Math.cos((phase-seed)*Math.PI*2))**14;return [4+180*life,7+248*life,8+35*life];},180);
    }
    return CidooProject.validate(project);
  }
  globalThis.CidooPresets=Object.freeze({names,build,cometColor});
})();
