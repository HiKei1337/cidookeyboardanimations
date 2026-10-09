const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'studio.html'),'utf8');
class Element{constructor(){this.value='';this.style={};this.dataset={};this.children=[];this.events={};this.attributes={};this.textContent='';}addEventListener(t,f){this.events[t]=f;}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k];}click(){return this.events.click?.();}}
async function run(saved={}){
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  for(const[id,value]of Object.entries({paintColor:'#ff00ff',frameBrightness:'100',autoOff:'never',hours:'0',minutes:'15',seconds:'0'}))nodes[id].value=value;
  const messages=[],raf=new Map();let clock=0,next=0;
  const context=vm.createContext({console,Uint8Array,setTimeout,clearTimeout,setInterval(){},requestAnimationFrame(fn){raf.set(++next,fn);return next;},cancelAnimationFrame(id){raf.delete(id);},performance:{now:()=>clock},document:{hidden:false,documentElement:{lang:'ru'},getElementById:id=>{assert.ok(nodes[id],id);return nodes[id];},createElement:()=>new Element(),addEventListener(){}},chrome:{runtime:{id:'test',sendMessage:async message=>{messages.push(message);if(message.action==='source')return{ok:true,state:{colors:context.CidooProject.demo().sourceColors}};return{ok:true,state:{ready:true,running:message.action==='startProject',config:message.config||{},elapsed:0}};}},storage:{local:{get:async key=>({[key]:saved[key]}),set:async values=>Object.assign(saved,JSON.parse(JSON.stringify(values)))}},tabs:{create:async()=>{}}}});
  for(const file of ['animation.js','project.js','layout.js','presets.js','studio.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  await new Promise(r=>setImmediate(r));
  const data=expression=>JSON.parse(vm.runInContext(`JSON.stringify(${expression})`,context));
  return{nodes,context,data,saved,messages,advance(ms){clock=ms;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(ms));}};
}
(async()=>{
  const f=await run(),n=f.nodes;
  n.preset.value='flowers';n.preset.events.change();assert.equal(f.data('project.name'),'Цветы · распускаются','preset selection must load immediately');
  n.timeline.children[5].click();const frame=f.data('project.frames[5].colors');assert.equal(frame[46*3],255);assert.equal(frame[46*3+1],255);
  n.frameBrightness.value='50';n.applyBrightness.click();assert.deepEqual(f.data('project.frames[5].colors.slice(46*3,46*3+3)'),[128,128,0]);
  n.frameBrightness.value='100';n.applyBrightness.click();assert.deepEqual(f.data('project.frames[5].colors'),frame,'brightness returns to the current frame, not Layer 1');
  n.addFrame.click();assert.deepEqual(f.data('project.frames.at(-1).colors'),frame,'new frame copies the selected frame');
  n.frameMs.value='600';n.frameMs.events.input();assert.equal(f.data('project.frames.at(-1).durationMs'),600);
  const index=f.data('activeFrame');await n.readSource.click();assert.equal(f.data('activeFrame'),index);assert.deepEqual(f.data('project.frames.at(-1).colors'),frame);
  await n.start.click();assert.equal(f.messages.at(-1).action,'startProject');assert.deepEqual(Array.from(f.messages.at(-1).config.frames.at(-1).colors),frame);
  n.preview.click();f.advance(700);n.preview.click();const paused=f.data('Array.from(previewBytes)');assert.equal(f.data('pausedPreview'),true);
  n.minutes.value='30';n.minutes.events.input();assert.deepEqual(f.data('Array.from(previewBytes)'),paused);assert.equal(f.data('pausedPreview'),true,'timer change must preserve the preview position');
  await new Promise(r=>setTimeout(r,280));const reopened=await run(f.saved);assert.equal(reopened.data('activeFrame'),f.data('activeFrame'));assert.deepEqual(reopened.data('Array.from(previewBytes)'),paused,'reopen restores the paused view');
  n.newProject.click();assert.equal(f.data('project.frames.length'),1);assert.ok(f.data('project.frames[0].colors').every(v=>v===0));
  n.selectNone.click();f.context.document.getElementById('keyboard').children[2].children[2].click();assert.equal(f.data('editingKeys.length'),1);assert.equal(f.data('project.keys.length'),81,'painting selection must not reveal the Layer 1 heart as background');
  n.paintSelected.click();assert.deepEqual(f.data('project.frames[0].colors.slice(46*3,46*3+3)'),[255,0,255]);
  n.animateSelected.click();assert.deepEqual(f.data('project.keys'),[46]);n.animateAll.click();assert.equal(f.data('project.keys.length'),81);
  console.log('PASS: preset opens on selection; frame brightness and cloning preserve colours; source read/start preserve frames; pause/timer/reopen preserve position; blank project; painting and playback selections are separate.');
})().catch(e=>{console.error(e);process.exitCode=1;});

