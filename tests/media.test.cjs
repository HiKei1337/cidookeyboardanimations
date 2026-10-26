const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context=vm.createContext({Uint8Array});
for(const file of ['animation.js','project.js','layout.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const media=context.CidooMedia,plain=value=>JSON.parse(JSON.stringify(value));
const boxes=media.geometry(context.CidooLayout.rows,320,96);
assert.equal(boxes.length,81);assert.equal(new Set(boxes.map(b=>b.index)).size,81);
for(const box of boxes){assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=320.00001&&box.y+box.height<=96.00001);}
assert.ok(boxes.find(k=>k.index===116).width>boxes[0].width*4,'Space must cover its physical width');
assert.deepEqual(plain(media.placement(100,100,{fit:'contain'},300,100)),{x:100,y:0,width:100,height:100});
assert.deepEqual(plain(media.placement(100,100,{fit:'cover'},300,100)),{x:0,y:-100,width:300,height:300});
assert.deepEqual(plain(media.placement(100,100,{fit:'stretch',zoom:200,x:10,y:-10},300,100)),{x:-120,y:-60,width:600,height:200});
const pixels=new Uint8Array(320*96*4);for(let i=0;i<pixels.length;i+=4)pixels.set([255,0,0,255],i);
const source=plain(context.CidooProject.demo().sourceColors),before=[...source];
for(const sampling of ['average','center']){
 const colors=media.sample(pixels,320,96,boxes,{sampling},source);
 for(const box of boxes)assert.deepEqual(plain(colors.slice(box.index*3,box.index*3+3)),[255,0,0],'pure RGB red must stay red');
 assert.deepEqual(plain(colors.slice(3,6)),source.slice(3,6),'unmapped LED slots retain the caller base');
 assert.deepEqual(plain(media.sample(pixels,320,96,boxes,{sampling,brightness:50}).slice(0,3)),[128,0,0]);
}
assert.deepEqual(plain(source),before,'sampling must not mutate Layer 1');
const black=new Uint8Array(pixels.length);assert.ok(media.sample(black,320,96,boxes).every(n=>n===0),'black remains black');
const testSource={frames:[{durationMs:100},{durationMs:300},{durationMs:100}]};
let result=media.plan(testSource,{fps:20});
assert.deepEqual(plain(result.map(f=>f.index)),[0,0,1,1,1,1,1,1,2,2]);assert.equal(result.reduce((n,f)=>n+f.durationMs,0),500);
result=media.plan(testSource,{fps:20,start:.1,end:.4});assert.ok(result.every(f=>f.index===1));assert.equal(result.reduce((n,f)=>n+f.durationMs,0),300);
result=media.plan({frames:Array.from({length:400},()=>({durationMs:100}))},{fps:20});
assert.equal(result.length,120);assert.equal(result.reduce((n,f)=>n+f.durationMs,0),40000,'frame cap must preserve duration');assert.ok(result.every(f=>f.durationMs>=50));
assert.equal(media.plan({frames:[{durationMs:100}]}).length,1);
assert.throws(()=>media.plan({frames:[]}));
console.log('PASS: image-to-physical-key geometry, fit/crop/zoom/offset, exact RGB/black, source immutability, variable GIF timing, clip range and 120-frame duration-preserving resampling.');

(async()=>{
 let closed=0,released=0,count=2;
 context.DOMException=DOMException;context.setTimeout=setTimeout;
 context.document={createElement(){return {width:0,height:0,getContext(){return {drawImage(){},getImageData(x,y,w,h){return {data:new Uint8Array(w*h*4)};}};}};}};
 context.ImageDecoder=class {
  static isTypeSupported=async()=>true;
  constructor(){this.tracks={ready:Promise.resolve(),selectedTrack:{frameCount:count}};this.completed=Promise.resolve();}
  async decode({frameIndex}){return {image:{displayWidth:100,displayHeight:50,duration:frameIndex?300000:100000,close(){released++;}}};}
  close(){closed++;}
 };
 const file={size:20,name:'sample.gif',type:'application/octet-stream',arrayBuffer:async()=>Uint8Array.from([71,73,70,56,57,97,0,0,0,0,0,0,0,0,0,0]).buffer};
 const decoded=await media.decode(file);assert.equal(decoded.frames.length,2);assert.equal(decoded.durationMs,400);assert.equal(released,2);assert.equal(closed,1);
 count=601;await assert.rejects(()=>media.decode(file),/600/);assert.equal(closed,2,'oversized track must close the decoder');
 const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>media.decode(file,{signal:cancelled.signal}),{name:'AbortError'});
 await assert.rejects(()=>media.decode({...file,size:26*1024*1024}),/25/);
 context.ImageDecoder=undefined;await assert.rejects(()=>media.decode(file),/ImageDecoder/,'unsupported animated GIF must not silently become a still image');
 console.log('PASS: native decoder timing and MIME sniffing, frame/decoder cleanup, frame/file limits, cancellation and explicit unsupported-animation error.');
})().catch(error=>{console.error(error);process.exitCode=1;});
