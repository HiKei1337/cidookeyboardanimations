const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(dir,'popup.html'),'utf8');
const elements={};for(const match of html.matchAll(/\bid="([^"]+)"/g))elements[match[1]]={value:'',hidden:false,textContent:'',events:{},addEventListener(type,fn){this.events[type]=fn;}};
Object.assign(elements.effect,{value:'heartbeat'});for(const [id,value]of Object.entries({bpm:65,fps:8,min:15,max:100,autoOff:'never',hours:0,minutes:15,seconds:0}))elements[id].value=String(value);
elements.timerFields.hidden=true;elements.preview.getContext=()=>({clearRect(){},beginPath(){},roundRect(){},fill(){}});
const saved={settings:{bpm:70,fps:12,duration:60}};const sent=[];
const chrome={tabs:{create:async()=>{}},storage:{local:{get:async key=>({[key]:saved[key]}),set:async data=>Object.assign(saved,data)}},runtime:{sendMessage:async message=>{sent.push(message);return {ok:true,state:{ready:true,running:message.action==='start',config:message.config,error:'',elapsed:0}};}}};
const context=vm.createContext({console,chrome,navigator:{hid:{requestDevice:async()=>[{}]}},Uint8Array,setInterval(){},requestAnimationFrame(){},document:{hidden:false,getElementById:id=>{assert.ok(elements[id],`Missing ${id}`);return elements[id];}}});
vm.runInContext(fs.readFileSync(path.join(dir,'animation.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(dir,'popup.js'),'utf8'),context);
(async()=>{
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(elements.autoOff.value,'never','old mandatory session not migrated');assert.equal(elements.fps.value,'8');
  await elements.start.events.click();assert.equal(sent.at(-1).config.duration,0);assert.equal(saved.settings.schema,2);
  elements.autoOff.value='timer';elements.hours.value='1';elements.minutes.value='2';elements.seconds.value='3';elements.autoOff.events.input();assert.equal(elements.timerFields.hidden,false);
  await elements.start.events.click();assert.equal(sent.at(-1).config.duration,3723);assert.ok(elements.status.textContent.includes('01:02:03'));
  elements.hours.value=elements.minutes.value=elements.seconds.value='0';const count=sent.length;await elements.start.events.click();assert.equal(sent.length,count);assert.match(elements.status.textContent,/больше нуля/);
  elements.autoOff.value='never';elements.autoOff.events.input();assert.equal(elements.timerFields.hidden,true);await elements.start.events.click();assert.equal(sent.at(-1).config.duration,0);
  assert.ok(html.includes('value="timeline"'),'popup must offer the editor project instead of falling back to heartbeat');
  vm.runInContext("previewConfig=CidooHeartMath.options({effect:'timeline',keys:[2],frames:[{durationMs:500,colors:new Array(396).fill(80)}]})",context);elements.effect.value='timeline';await elements.start.events.click();assert.equal(sent.at(-1).config.effect,'timeline');assert.equal(sent.at(-1).config.frames.length,1);assert.equal(sent.at(-1).config.keys[0],2);
  console.log('PASS: popup control IDs; v1 session migration to Never/8 fps; optional hours/minutes/seconds timer; countdown; zero timer validation; switching back to Never.');
})().catch(error=>{console.error(error);process.exitCode=1;});

