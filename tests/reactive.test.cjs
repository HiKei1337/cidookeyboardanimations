const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Uint8Array});for(const file of ['layout.js','animation.js','project.js','presets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const {CidooHeartMath:math,CidooProject:projects,CidooLayout:layout}=ctx;
const beatProject=projects.validate({...projects.demo(),reactiveMode:'beat',min:15,max:100,reactiveDecay:1,reactiveStrength:100});
const beatBase=new Uint8Array(beatProject.sourceColors),beatOut=new Uint8Array(396),beatEngine=new math.Reactions();
math.paint(beatOut,beatBase,8,beatProject);
assert.deepEqual(Array.from(beatOut.slice(15,18)),[38,0,0],'idle heart keeps exact source hue at minimum brightness');
assert.deepEqual(Array.from(beatOut.slice(0,3)),[150,150,150],'background stays unchanged');
beatEngine.paint(beatOut,8,beatProject,beatBase);assert.equal(beatOut[15],38,'no spontaneous beats');
beatEngine.press(116,8);beatEngine.paint(beatOut,8.14,beatProject,beatBase);assert.ok(beatOut[15]>=250,'a press anywhere triggers the selected drawing');assert.equal(beatOut[16],0);assert.equal(beatOut[17],0);
beatEngine.paint(beatOut,8.39,beatProject,beatBase);assert.ok(beatOut[15]>170,'double beat');
beatEngine.paint(beatOut,9.1,beatProject,beatBase);assert.equal(beatOut[15],38,'returns to rest after one finite beat');
assert.deepEqual(Array.from(beatBase),Array.from(beatProject.sourceColors),'source is read only');
assert.equal(layout.codeIndex('KeyA'),68);assert.equal(layout.codeIndex('Digit4'),26);assert.equal(layout.codeIndex('Space'),116);assert.equal(layout.codeIndex('Unknown'),undefined);
const reactions=new math.Reactions(),source=new Uint8Array(396),out=new Uint8Array(396),opts={...projects.demo(),keys:[68,69,70],reactiveMode:'flash',reactiveColor:[255,0,0],reactiveDecay:1,reactiveStrength:100};
assert.equal(reactions.press(999,0),false);reactions.press(68,0);reactions.paint(out,0,opts);assert.deepEqual(Array.from(out.slice(204,207)),[255,0,0]);assert.deepEqual(Array.from(out.slice(207,210)),[0,0,0]);
out.fill(255);reactions.paint(out,0,opts);assert.deepEqual(Array.from(out.slice(204,207)),[255,0,0],'reaction peak uses exact RGB even over a white source');
out.fill(0);reactions.paint(out,.5,opts);assert.equal(out[204],64);out.fill(0);reactions.paint(out,1.1,opts);assert.equal(out[204],0);assert.equal(reactions.hits.length,0);
reactions.press(68,2);out.fill(0);reactions.paint(out,2.1,{...opts,reactiveMode:'ripple'});assert.ok(out[207]>out[210],'wave travels to neighbouring keys first');
out.fill(0);reactions.paint(out,2.1,{...opts,keys:[70],reactiveMode:'heat'});assert.equal(out[204],0,'selection must limit writes');
for(let n=0;n<1000;n++)reactions.press(68,n/100);assert.equal(reactions.hits.length,32,'bounded memory');reactions.paint(out,11,{...opts,reactiveMode:'off'});assert.equal(reactions.hits.length,0);
for(const id of ['reactive-ripple','reactive-fire']){const project=ctx.CidooPresets.build(id);assert.notEqual(project.reactiveMode,'off');assert.equal(projects.validate(JSON.parse(JSON.stringify(project))).reactiveMode,project.reactiveMode);assert.deepEqual(Array.from(source),Array(396).fill(0));}

(async()=>{
 const messages=[],handlers={};let clock=100;
 const capture=vm.createContext({console,location:{protocol:'https:'},performance:{now:()=>clock},document:{hidden:false,addEventListener(type,fn){handlers[type]=fn;}},chrome:{runtime:{id:'test',onMessage:{addListener(fn){handlers.message=fn;}},sendMessage:async msg=>{messages.push(msg);return {enabled:!msg.status};}}}});
 vm.runInContext(fs.readFileSync('layout.js','utf8'),capture);await new Promise(r=>setImmediate(r));messages.length=0;
 const event={code:'KeyA',key:'SECRET TEXT',isTrusted:true,repeat:false,target:{closest(){return false;}}};
 handlers.keydown(event);assert.equal(messages.length,0,'disabled capture stays idle');handlers.message({type:'cidoo-react-state',enabled:true});
 handlers.keydown({...event,isTrusted:false});handlers.keydown({...event,repeat:true});handlers.keydown({...event,target:{closest(){return true;}}});assert.equal(messages.length,0,'synthetic/repeated/password events ignored');
 handlers.keydown(event);assert.deepEqual(JSON.parse(JSON.stringify(messages)),[{type:'cidoo-react',index:68}],'only a matrix index leaves the tab');
 clock=105;handlers.keydown(event);assert.equal(messages.length,1,'bounded event rate');
 clock=150;handlers.message({type:'cidoo-react-state',enabled:false});handlers.keydown(event);assert.equal(messages.length,1);
 console.log('PASS: flash/ripple/heat decay, selected keys, bounded memory, JSON roundtrip and consent-scoped capture without text/password/synthetic/repeat events.');
})().catch(error=>{console.error(error);process.exitCode=1;});
