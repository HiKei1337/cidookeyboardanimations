const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/gif-examples');
const items=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'verification.json'),'utf8'));
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(dir,'catalog.js'),'utf8'),ctx);
assert.equal(items.length,50);assert.equal(JSON.stringify(ctx.CidooGifExamples),JSON.stringify(items));
for(const field of ['id','gif','gifSha256'])assert.equal(new Set(items.map(i=>i[field])).size,50,field);
for(const item of items){
 const url=new URL(item.gif);assert.equal(url.protocol,'https:');assert.ok(['developer.lametric.com','raw.githubusercontent.com'].includes(url.hostname));assert.ok(!url.pathname.includes('_icon_thumb'));
 assert.equal(item.height,8);assert.ok([8,80].includes(item.width));assert.ok(item.frames>1&&item.frames<=600);assert.match(item.gifSha256,/^[a-f0-9]{64}$/);assert.ok(item.source&&item.creator&&item.originalTitle);
 const checked=report.items.find(x=>x.id===item.id);assert.ok(checked);assert.equal(checked.originalSha256,item.gifSha256);assert.equal(checked.sourceFrames,item.frames);assert.ok(checked.distinctRgbFrames>1);assert.equal(checked.convertedFrames,item.verifiedFrames);assert.equal(checked.sourceLayer,1);assert.equal(checked.targetLayer,2);assert.equal(checked.keys,81);
}
for(const [viewer,original] of [['viewer-layout.js','layout.js'],['viewer-engine.js','animation.js'],['viewer-project.js','project.js'],['viewer-keyboard.js','docs/keyboard-preview.js']])assert.equal(fs.readFileSync(path.join(dir,viewer),'utf8'),fs.readFileSync(path.join(root,original),'utf8'),viewer);
assert.equal(fs.readFileSync(path.join(dir,'internet-gif-links.csv'),'utf8').trim().split(/\r?\n/).length,51);
assert.ok(!fs.existsSync(path.join(dir,'gifs')),'Generated artwork must not remain in this collection');
console.log('PASS: 50 distinct real Internet GIF URLs, original hashes and creator provenance; all native RGB conversions animate on 81 visible keys and target Layer 2; identical studio importer and renderer.');
