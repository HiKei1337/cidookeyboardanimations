const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const context=vm.createContext({console,Uint8Array});
for(const file of ['animation.js','project.js','layout.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const math=context.CidooHeartMath,model=context.CidooProject;
const project=model.demo();assert.equal(project.sourceLayer,1);assert.equal(project.targetLayer,2);assert.equal(project.sourceColors.length,396);
const plain=value=>JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(model.validate(JSON.parse(JSON.stringify(project)))),plain(project));
for(const field of ['sourceLayer','targetLayer']){const bad=plain(project);bad[field]=0;assert.throws(()=>model.validate(bad),/Layer/);}
for(const change of [p=>p.keys=[],p=>p.keys=[132],p=>p.sourceColors[0]=256,p=>p.frames=Array(121).fill({}),p=>p.effect='eval',p=>p.version=99]){const bad=plain(project);change(bad);assert.throws(()=>model.validate(bad));}
const source=new Uint8Array(project.sourceColors),snapshot=new Uint8Array(source),a=Array.from(source),b=Array.from(source);
a.splice(5*3,3,0,0,0);b.splice(5*3,3,200,100,50);
const custom=model.validate({...plain(project),effect:'timeline',keys:[5],frames:[{colors:a,durationMs:1000},{colors:b,durationMs:500}],interpolation:'smooth'});
const out=new Uint8Array(396);math.paint(out,source,.5,custom);assert.deepEqual(Array.from(out.slice(15,18)),[100,50,25]);
for(let index=0;index<132;index++)if(index!==5)assert.deepEqual(Array.from(out.slice(index*3,index*3+3)),Array.from(source.slice(index*3,index*3+3)));
math.paint(out,source,1.25,custom);assert.deepEqual(Array.from(out.slice(15,18)),[100,50,25]);
math.paint(out,source,1.5,custom);assert.deepEqual(Array.from(out.slice(15,18)),[0,0,0],'timeline loops');
math.paint(out,source,.9,{...custom,interpolation:'step'});assert.deepEqual(Array.from(out.slice(15,18)),[0,0,0]);assert.deepEqual(source,snapshot,'source buffer never changes');
assert.throws(()=>model.validate({...plain(custom),frames:[{durationMs:0,colors:a}]}),/50/);
for(const effect of ['heartbeat','breathe','shimmer','heartbeat-shimmer']){math.paint(out,source,.3,math.options({effect,keys:[66]}));for(let index=0;index<132;index++)if(index!==66)assert.deepEqual(Array.from(out.slice(index*3,index*3+3)),Array.from(source.slice(index*3,index*3+3)));}
assert.equal(context.CidooLayout.keys.length,81);assert.equal(new Set(context.CidooLayout.keys.map(k=>k.index)).size,81);
// Every user-facing preset, including shipped examples, validates without code execution.
for(const file of fs.readdirSync(path.join(root,'examples')).filter(file=>file.endsWith('.json')))model.validate(JSON.parse(fs.readFileSync(path.join(root,'examples',file),'utf8')));
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
console.log('PASS: project import/export; read-only source/Layer 2 enforcement; bounded input validation; timeline interpolation/loop/step; arbitrary selected keys; source buffer unchanged; C80 matrix; examples; all JavaScript syntax.');
