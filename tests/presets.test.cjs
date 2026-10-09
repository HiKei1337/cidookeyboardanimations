const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'..'),c=vm.createContext({Uint8Array});
for(const file of ['animation.js','project.js','layout.js','presets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
for(const id of Object.keys(c.CidooPresets.names)){const project=c.CidooPresets.build(id,'en');assert.equal(project.targetLayer,2);assert.equal(project.sourceLayer,1);assert.equal(project.keys.length,81);assert.ok(project.frames.length>1);assert.ok(new Set(project.frames.map(f=>f.colors.join(","))).size>1);c.CidooProject.validate(project);}
console.log('PASS: four editable presets; full keyboard coverage; Layer 1 / Layer 2 constraints.');

const flowers=c.CidooPresets.build("flowers"),peaks=new Set();for(const frame of flowers.frames)for(const key of flowers.keys)peaks.add(frame.colors.slice(key*3,key*3+3).join(","));for(const rgb of ["255,255,0","255,0,255","0,255,255","255,0,0"])assert.ok(peaks.has(rgb),"full RGB flower peak: "+rgb);

assert.deepEqual(Array.from(c.CidooPresets.cometColor({x:-3,y:2},0)),[0,128,255]);assert.deepEqual(Array.from(c.CidooPresets.cometColor({x:-2+.9*23-1,y:2},.9)),[255,255,255]);const head=c.CidooPresets.cometColor({x:10,y:2},.55),tail=c.CidooPresets.cometColor({x:7,y:2},.55);assert.ok(tail.some(v=>v>0),"comet has a visible tail");assert.ok(head.reduce((a,b)=>a+b,0)>tail.reduce((a,b)=>a+b,0));
