const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Uint8Array});for(const file of ['layout.js','animation.js','project.js','presets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const {CidooHeartMath:math,CidooProject:projects,CidooLayout:layout}=ctx;
// Each press chooses a different group, including after idle expiry and JSON import.
const cycle=ctx.CidooPresets.build('reactive-bloom'),cycleEngine=new math.Reactions(),cycleSource=new Uint8Array(cycle.sourceColors),cycleOut=new Uint8Array(396);
assert.equal(cycle.reactiveGroups.length,3);
for(let n=0;n<4;n++){const t=n*3;cycleEngine.press(116,t,cycle);math.paint(cycleOut,cycleSource,t+.252,cycle);cycleEngine.paint(cycleOut,t+.252,cycle,cycleSource);for(let g=0;g<3;g++){const key=cycle.reactiveGroups[g][0];assert.equal(cycleOut[key*3]+cycleOut[key*3+1]+cycleOut[key*3+2]>100,g===n%3,'one flower at a time after resting');}}
const invoker=ctx.CidooPresets.build('invoker-demo'),router=new math.Reactions(),ruleOut=new Uint8Array(396),ruleBlack=new Uint8Array(396);
assert.equal(router.press(47,0,invoker),false);assert.equal(router.press(47,.1,invoker),false);assert.equal(router.press(46,.2,invoker),true);assert.ok(router.child.project.name.includes('Метеор'));router.paint(ruleOut,.6,invoker,ruleBlack);assert.ok(ruleOut.some(n=>n>0),'meteor plays after EEW');router.paint(ruleOut,5,invoker,ruleBlack);assert.equal(router.child,null,'finite rule returns to base');assert.ok(ruleOut.every(n=>n===0));
router.clear();router.press(47,0,invoker);router.press(47,3,invoker);assert.equal(router.press(46,3.1,invoker),false,'expired combo does not match');router.clear();router.press(46,0,invoker);router.paint(ruleOut,.05,invoker,ruleBlack);router.press(47,.1,invoker);router.paint(ruleOut,.15,invoker,ruleBlack);assert.equal(router.press(47,.2,invoker),true,'unordered combo survives rendering and counts duplicate orbs');
const mapped=projects.validate({...invoker,reactiveRules:[{name:'A cross',keys:[68],match:'sequence',project:ctx.CidooPresets.build('reactive-cross')},{name:'S snake',keys:[69],match:'sequence',project:ctx.CidooPresets.build('reactive-snake')}]});router.clear();router.press(68,0,mapped);assert.equal(router.child.project.reactiveMode,'cross');router.press(69,.1,mapped);assert.equal(router.child.project.reactiveMode,'snake');
assert.throws(()=>projects.validate({...invoker,reactiveRules:[{keys:[47],match:'sequence',project:invoker}]}),/Вложенные/);
assert.deepEqual(Array.from(projects.validate(JSON.parse(JSON.stringify(cycle))).reactiveGroups[0]),Array.from(cycle.reactiveGroups[0]));
assert.equal(projects.validate(JSON.parse(JSON.stringify(invoker))).reactiveRules.length,10);
const spellNames=new Set();let comboCount=0;
for(const a of [45,46,47])for(const b of [45,46,47])for(const c of [45,46,47]){router.clear();router.press(a,0,invoker);router.paint(ruleOut,.04,invoker,ruleBlack);router.press(b,.1,invoker);router.paint(ruleOut,.14,invoker,ruleBlack);assert.equal(router.press(c,.2,invoker),true,'every three-orb combination matches');spellNames.add(router.child.project.name);assert.ok(router.child.project.frames.some(f=>f.colors.some(n=>n>0)));comboCount++;}
assert.equal(comboCount,27);assert.equal(spellNames.size,10,'27 inputs cover exactly 10 distinct spells');
console.log('PASS: flower groups cycle, background stays black; key-anchored burst; single-key rules, timeout, all 27 Invoker inputs and 10 spells; JSON and nested-rule guards.');
// Translate a user-drawn burst by physical positions, not HID indices; background stays exact.
const spot=ctx.CidooPresets.build('reactive-shot');spot.reactiveAnchor=73;spot.frames=[{durationMs:100,colors:new Array(396).fill(0)},{durationMs:200,colors:new Array(396).fill(0)},{durationMs:100,colors:new Array(396).fill(0)}];spot.frames[1].colors.splice(73*3,3,255,0,0);spot.interpolation='step';const spotEngine=new math.Reactions();spotEngine.press(68,0,spot);math.paint(ruleOut,ruleBlack,.15,spot);spotEngine.paint(ruleOut,.15,spot,ruleBlack);assert.equal(ruleOut[68*3],255,'burst centre moves to A');assert.equal(ruleOut[73*3],0,'original centre does not light');assert.equal(ruleOut[68*3+2],0,'exact red hue');
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
const flower=ctx.CidooPresets.build('reactive-bloom'),flowerInput=new Uint8Array(396).fill(150),flowerOutput=new Uint8Array(396),flowerEngine=new math.Reactions();
math.paint(flowerOutput,flowerInput,0,flower);flowerEngine.press(116,0,flower);flowerEngine.paint(flowerOutput,.14*flower.reactiveDecay,flower,flowerInput);
const flowerKey=flower.reactiveGroups[0][0],flowerRgb=flower.frames[0].colors.slice(flowerKey*3,flowerKey*3+3);
assert.ok(flowerRgb.some(n=>n>0));assert.equal(flowerOutput[flowerKey*3],flowerRgb[0],'custom drawing survives a different hardware source');
const backgroundIndex=layout.keys.find(k=>!flower.reactiveGroups.flat().includes(k.index)).index;
assert.equal(flowerOutput[backgroundIndex*3],0,'template black covers the original heart background');
const motion=projects.validate({...projects.demo(),keys:layout.keys.map(k=>k.index),reactiveMode:'wave',reactiveDirection:'right',reactiveSpeed:4,reactiveTrail:1,reactiveDecay:5,reactiveColor:[0,255,0]});
const movement=new math.Reactions(),black=new Uint8Array(396),moving=new Uint8Array(396);movement.press(68,0,motion);movement.paint(moving,.5,motion,black);
assert.ok(moving[70*3+1]>0,'wave reaches keys to the right');assert.equal(moving[66*3+1],0,'rightward wave never propagates left');
moving.fill(0);movement.paint(moving,.5,{...motion,reactiveDirection:'left'},black);assert.equal(moving[70*3+1],0,'direction changes propagation');
moving.fill(0);movement.paint(moving,.5,{...motion,reactiveMode:'snake',reactiveSpeed:8,reactiveTrail:3},black);assert.ok(moving.some(v=>v>0),'snake moves away from its origin');assert.equal(moving[68*3+1],0,'head leaves its starting key');
moving.fill(0);movement.paint(moving,6,motion,black);assert.ok(moving.every(v=>v===0),'moving effects end without new presses');
const shot=ctx.CidooPresets.build('reactive-shot'),sequence=new math.Reactions(),duration=shot.frames.reduce((n,f)=>n+f.durationMs,0)/1000;
math.paint(moving,black,100,shot);assert.ok(moving.every(v=>v===0),'custom frames stay idle before a press');
assert.equal(sequence.press(68,100,shot),true);sequence.paint(moving,100.4,shot,black);assert.ok(moving.some(v=>v>0),'press plays the painted frame sequence');
assert.equal(sequence.press(68,100.5,{...shot,reactiveRepeat:'ignore'}),false,'ignore waits until the sequence finishes');
assert.equal(sequence.press(68,100.6,shot),true,'restart immediately starts a new sequence');
math.paint(moving,black,102+duration,shot);sequence.paint(moving,102+duration,shot,black);assert.ok(moving.every(v=>v===0),'sequence plays once then returns to frame one');
const saved=projects.validate(JSON.parse(JSON.stringify({...motion,reactiveMode:'snake',reactiveTrail:9,reactiveRepeat:'ignore'})));
assert.equal(saved.reactiveDirection,'right');assert.equal(saved.reactiveSpeed,4);assert.equal(saved.reactiveTrail,9);assert.equal(saved.reactiveRepeat,'ignore');
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
