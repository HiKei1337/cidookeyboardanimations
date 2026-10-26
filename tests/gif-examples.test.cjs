const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/gif-examples'),ctx=vm.createContext({Uint8Array});
for(const f of ['animation.js','project.js','layout.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const items=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(items.length,60);assert.equal(new Set(items.map(i=>i.id)).size,60);
let frames=0;for(const item of items){
 assert.match(item.gif,/^gifs\/[a-z0-9-]+\.gif$/);assert.match(item.project,/^projects\/[a-z0-9-]+\.json$/);
 const gif=fs.readFileSync(path.join(dir,item.gif));assert.match(gif.subarray(0,6).toString(),/^GIF8[79]a$/);assert.equal(gif.readUInt16LE(6),320);assert.equal(gif.readUInt16LE(8),96);assert.ok(item.frames>1);
 assert.equal(crypto.createHash('sha256').update(gif).digest('hex'),item.gifSha256);
 const bytes=fs.readFileSync(path.join(dir,item.project));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.projectSha256);
 const p=ctx.CidooProject.validate(JSON.parse(bytes));assert.equal(p.effect,'timeline');assert.equal(p.reactiveMode,'off');assert.equal(p.keys.length,81);assert.equal(p.frames.length,32);assert.equal(p.frames.reduce((n,f)=>n+f.durationMs,0),4000);assert.ok(new Set(p.frames.map(f=>JSON.stringify(f.colors))).size>1);assert.deepEqual(JSON.stringify(p.sourceColors),JSON.stringify(ctx.CidooProject.demo().sourceColors));assert.ok(item.posterFrame>=0&&item.posterFrame<p.frames.length);frames+=p.frames.length;
}
for(const f of ['viewer-layout.js','viewer-engine.js','viewer-keyboard.js','gallery.js','catalog.js','gallery.css','LICENSE'])assert.ok(fs.statSync(path.join(dir,f)).size>0);
console.log(`PASS: 60 GIF files and native JSON projects, file hashes, animated RGB frames, all 81 keys, untouched Layer 1, ${frames} frames and 4-second loops; offline gallery assets.`);
