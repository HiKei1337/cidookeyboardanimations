const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture({badPage=false,missingPage=false,failAt=-1,delay=0,paddedLast=false}={}){
  const hearts=[5,6,9,10,26,27,28,29,30,31,32,48,49,50,51,52,53,72,73,74,95];
  const base=new Uint8Array(396);for(let i=0;i<132;i++)base.set(hearts.includes(i)?[255,0,0]:i===66?[126,249,2]:[150,150,150],i*3);
  const layer0=new Uint8Array(base),layer1=new Uint8Array(base);
  const reports=[],listeners=new Set(),saved={};let active=0,maxActive=0,clock=0;
  const identity={vendorId:1234,productId:5678,name:'CIDOO C80',profile:0};
  const device={vendorId:1234,productId:5678,productName:'CIDOO C80',opened:false,collections:[{outputReports:[{reportId:1,items:[{reportSize:8,reportCount:63}]}]}],async open(){this.opened=true;},async close(){this.opened=false;},addEventListener(type,fn){listeners.add(fn);},removeEventListener(type,fn){listeners.delete(fn);},async sendReport(id,input){
    assert.equal(id,1);assert.equal(input.length,63);assert.ok(this.opened);const bytes=new Uint8Array(input);reports.push(bytes);active++;maxActive=Math.max(maxActive,active);
    try{
      if(delay)await pause(delay);
      if(bytes[0]===7){const b=new Uint8Array(63);b[0]=7;b[4]=13;b[5]=10;b[16]=0;queueMicrotask(()=>emit(b));return;}
      assert.equal(bytes[0],9);
      if(bytes[1]>=128){
        const layer=bytes[1]-128;assert.ok(layer===0||layer===1);
        // Reordered and duplicated responses ensure page collection is real.
        for(const page of [7,2,0,2,6,4,1,5,3]){if(missingPage&&page===3)continue;const b=new Uint8Array(63);b[0]=9;b[1]=128+layer;b[3]=page;b[4]=paddedLast&&page===7?54:Math.min(54,396-page*54);b.set((layer===0?layer0:layer1).subarray(page*54,page*54+b[4]),5);if(badPage&&page===4)b[4]=1;queueMicrotask(()=>emit(b));}
      }else{
        assert.equal(bytes[1],1,'ALL writes must target Layer 2');const page=bytes[3];assert.ok(page>=0&&page<8);assert.equal(bytes[4],Math.min(54,396-page*54));
        if(page===failAt){failAt=-1;throw Error('USB simulated failure');}
        layer1.set(bytes.subarray(5,5+bytes[4]),page*54);
      }
    }finally{active--;}
  }};
  function emit(bytes){for(const fn of [...listeners])fn({reportId:1,data:new DataView(bytes.buffer)});}
  const hid={getDevices:async()=>[device],addEventListener(){}};
  const storage={async get(key){return {[key]:saved[key]};},async set(data){Object.assign(saved,structuredClone(data));}};
  const context=vm.createContext({console,Uint8Array,Array,Map,Set,Number,Math,Promise,setTimeout,clearTimeout,performance:{now:()=>clock},navigator:{hid},globalThis:undefined});context.globalThis=context;
  for(const file of ['animation.js','project.js','hid.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context);
  const engine=new context.CidooHid(hid,storage);
  return {base,layer0,layer1,engine,device,identity,reports,listeners,context,hid,storage,saved,setClock(value){clock=value;},get maxActive(){return maxActive;}};
}
(async()=>{
  const f=fixture();await f.engine.connect(f.identity);assert.equal(f.device.opened,false,'idle connection closes so worker may suspend');
  assert.deepEqual(await f.engine.read(0),f.base);await f.engine.close();assert.equal(f.listeners.size,0,'no leaked response listeners');
  f.layer1.fill(10);const previous=new Uint8Array(f.layer1);await f.engine.copy();assert.deepEqual(f.layer1,f.layer0);assert.equal(f.device.opened,false);
  await f.engine.restoreBackup();assert.deepEqual(f.layer1,previous);await f.engine.copy();
  // Typed-array renderer is equivalent to the reference effect for all four modes.
  const objects=Array.from({length:132},(_,index)=>({index,color:{r:f.base[index*3],g:f.base[index*3+1],b:f.base[index*3+2]}}));
  for(const effect of ['heartbeat','breathe','shimmer','heartbeat-shimmer'])for(const seconds of [.1,.3,.7,1.4]){
    const opts=f.context.CidooHeartMath.options({effect});const target=new Uint8Array(396);f.context.CidooHeartMath.paint(target,f.base,seconds,opts);
    const frame=f.context.CidooHeartMath.frame(objects,seconds,opts);
    assert.deepEqual(Array.from(target),frame.flatMap(k=>[k.color.r,k.color.g,k.color.b]));
  }
  await f.engine.start({duration:0,fps:8});assert.equal(f.device.opened,true,'active HID connection keeps Chrome worker alive');
  f.engine.cancel();f.engine.running=true;f.setClock(7200140);await f.engine.tick();assert.equal(f.engine.running,true,'never mode continues after two hours');
  f.engine.cancel();const count=f.reports.length;f.engine.running=true;await f.engine.tick();f.engine.cancel();assert.equal(f.reports.length,count,'unchanged frame skipped');
  await f.engine.stop();assert.deepEqual(f.layer1,f.base);assert.deepEqual(f.layer0,f.base);assert.equal(f.device.opened,false);
  f.setClock(0);await f.engine.start({duration:5,fps:8});f.engine.cancel();f.engine.running=true;f.setClock(5100);await f.engine.tick();assert.equal(f.engine.running,false);assert.deepEqual(f.layer1,f.base);
  assert.equal(f.maxActive,1,'HID transfers serialized');
  const padded=fixture({paddedLast:true});await padded.engine.connect(padded.identity);await padded.engine.copy();assert.deepEqual(padded.layer1,padded.base,'firmware may pad final read page');
  const bad=fixture({badPage:true});await bad.engine.select(bad.identity);await assert.rejects(bad.engine.copy(),/Неполная/);assert.ok(bad.reports.every(p=>!(p[0]===9&&p[1]===1)));assert.equal(bad.listeners.size,0);
  const missing=fixture({missingPage:true});await missing.engine.select(missing.identity);await assert.rejects(missing.engine.copy(),/2 секунды/);assert.equal(missing.listeners.size,0);assert.ok(missing.reports.every(p=>!(p[0]===9&&p[1]===1)));
  const usb=fixture({failAt:2});await usb.engine.connect(usb.identity);await usb.engine.start({duration:0});assert.equal(usb.engine.running,false);assert.match(usb.engine.error,/USB/);assert.deepEqual(usb.layer1,usb.base);assert.equal(usb.device.opened,false);
  const slow=fixture({delay:8});await slow.engine.connect(slow.identity);await slow.engine.start({duration:0,fps:20});await pause(150);await Promise.all([slow.engine.stop(),slow.engine.copy()]);assert.equal(slow.maxActive,1);assert.deepEqual(slow.layer0,slow.base);
  // Real worker routing, with site access allowed only during handoff.
  const workerFixture=fixture();let messageListener,commandListener,siteCalls=0,siteAllowed=true;
  const chrome={storage:{local:workerFixture.storage},runtime:{id:'test',onMessage:{addListener(fn){messageListener=fn;}}},commands:{onCommand:{addListener(fn){commandListener=fn;}}},action:{setBadgeText:async()=>{},setTitle:async()=>{}},tabs:{query:async()=>{assert.ok(siteAllowed,'animation must not touch a hidden or closed tab');siteCalls++;return[{id:42,active:true}];}},scripting:{executeScript:async req=>req.files?[]:[{result:{ok:true,identity:workerFixture.identity}}]}};
  workerFixture.context.chrome=chrome;workerFixture.context.importScripts=(...files)=>{for(const file of files)vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),workerFixture.context);};
  vm.runInContext(fs.readFileSync(path.join(dir,'worker.js'),'utf8'),workerFixture.context);
  const message=(action,config,identity)=>new Promise(resolve=>messageListener({type:'cidoo-heart',action,config,identity},{id:'test'},resolve));
  assert.equal((await message('connect',undefined,workerFixture.identity)).ok,true);siteAllowed=false;const oldSiteCalls=siteCalls;
  assert.equal((await message('start',{duration:0,fps:8})).state.running,true);await pause(170);assert.equal((await message('status')).state.running,true);assert.equal((await message('stop')).state.running,false);assert.equal(siteCalls,oldSiteCalls);
  assert.equal((await message('copy')).ok,true);assert.deepEqual(workerFixture.layer0,workerFixture.base);
  const sourceState=await message('source');assert.deepEqual(sourceState.state.colors,Array.from(workerFixture.layer0));
  const custom=workerFixture.context.CidooProject.demo();custom.effect='timeline';custom.keys=[5];custom.frames=[{durationMs:500,colors:Array.from(workerFixture.base)}];custom.frames[0].colors.splice(15,3,10,20,30);
  assert.equal((await message('startProject',custom)).state.running,true);assert.deepEqual(Array.from(workerFixture.layer1.slice(15,18)),[10,20,30]);
  assert.equal((await message('stop')).state.running,false);assert.deepEqual(workerFixture.layer1,workerFixture.layer0);
  workerFixture.layer0.set([40,200,70],15);workerFixture.layer1.set([255,0,0],15);
  assert.equal((await message('start',{effect:'breathe',keys:[5],duration:0})).state.running,true);
  await message('stop');assert.deepEqual(Array.from(workerFixture.layer1.slice(15,18)),[40,200,70],'Layer 1 is actual source, not Layer 2 or a hardcoded red heart');
  assert.deepEqual(Array.from(workerFixture.layer0.slice(15,18)),[40,200,70]);workerFixture.layer0.set([255,0,0],15);
  await commandListener('toggle-heart');assert.equal((await message('status')).state.config.duration,0);await commandListener('stop-heart');
  assert.equal(messageListener({type:'cidoo-heart',action:'start'},{id:'other'},()=>{}),undefined);
  assert.equal((await message('invalid')).ok,false);
  for(const file of ['animation.js','hid.js','worker.js','bridge.js','popup.js'])new vm.Script(fs.readFileSync(path.join(dir,file),'utf8'),{filename:file});
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));assert.equal(manifest.version,'1.2.0');assert.equal(manifest.background.service_worker,'worker.js');
  console.log('PASS: direct WebHID packet format; 8 reordered pages and duplicates; exact copy/backup; no Layer 1 writes; typed-buffer effect parity; never beyond 2 hours; optional timer restore; duplicate skipping; idle handle closes; incomplete/timeout guards; USB failure restore; serialized slow transport; background routing without ANY page calls after handoff; hotkeys; sender validation; manifest/syntax.');
})().catch(error=>{console.error(error);process.exitCode=1;});


