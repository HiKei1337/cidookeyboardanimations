const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({Uint8Array});
for(const file of ['animation.js','project.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const {CidooHeartMath:math,CidooProject:projects}=context;
const source=new Uint8Array(projects.demo().sourceColors);
const one=new Uint8Array(396),fast=new Uint8Array(396);
for(const effect of ['heartbeat','breathe','shimmer','timeline']){
 const raw={...projects.demo(),effect,frames:effect==='timeline'?[{durationMs:500,colors:Array(396).fill(0)},{durationMs:500,colors:Array(396).fill(255)}]:[]};
 const project=projects.validate(raw);math.paint(one,source,.38,project);math.paint(fast,source,.19,{...project,playbackSpeed:2});assert.deepEqual(fast,one);
}
assert.equal(projects.validate({...projects.demo(),playbackSpeed:2}).playbackSpeed,2);
assert.deepEqual(Array.from(source),Array.from(projects.demo().sourceColors));
console.log('PASS: 2x speed matches double elapsed time for timelines and procedural effects; JSON preserves speed; source RGB unchanged.');
