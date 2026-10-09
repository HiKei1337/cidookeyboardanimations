(() => {
  'use strict';
  const REPORT=1,LAYER=1,SIZE=396;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function hasReport(device){
    const walk=collection=>[...(collection.outputReports||[]),...(collection.children||[]).flatMap(walk)];
    return (device.collections||[]).flatMap(walk).some(report=>report.reportId===REPORT&&(report.items||[]).reduce((bits,item)=>bits+item.reportSize*item.reportCount,0)===63*8);
  }
  class CidooHid {
    constructor(hid,storage){
      this.hid=hid;this.storage=storage;this.device=null;this.identity=null;
      this.running=false;this.timer=null;this.queue=Promise.resolve();this.base=null;this.previous=null;
      this.config=CidooHeartMath.options();this.frames=0;this.elapsed=0;this.writeMs=0;this.error='';
      this.bytes=new Uint8Array(SIZE);this.last=new Uint8Array(SIZE);this.hasLast=false;
      this.packets=Array.from({length:8},(_,page)=>{const p=new Uint8Array(63);p[0]=9;p[1]=LAYER;p[3]=page;p[4]=Math.min(54,SIZE-page*54);return p;});
    }
    enqueue(task){const result=this.queue.then(task);this.queue=result.catch(()=>{});return result;}
    cancel(){this.running=false;if(this.timer!==null)clearTimeout(this.timer);this.timer=null;}
    state(){const {effect,bpm,fps,min,max,duration,interpolation,projectName,restoreMode}=this.config;return {version:'1.5.0',running:this.running,ready:!!this.device,background:true,sourceLayer:1,layer:2,device:this.identity?.name||'CIDOO keyboard',config:{effect,bpm,fps,min,max,duration,interpolation,projectName,restoreMode},frames:this.frames,elapsed:this.elapsed,writeMs:this.writeMs,error:this.error};}
    async select(identity){
      if(!Number.isInteger(identity?.vendorId)||!Number.isInteger(identity?.productId))throw Error('Не определена клавиатура. Подключите её к расширению.');
      const devices=(await this.hid.getDevices()).filter(d=>d.vendorId===identity.vendorId&&d.productId===identity.productId&&hasReport(d));
      if(devices.length!==1)throw Error('Разрешите расширению доступ к одной CIDOO C80 с интерфейсом подсветки.');
      this.device=devices[0];this.identity=identity;
    }
    async open(){if(!this.device)throw Error('Нажмите «Подключить фоновое управление».');if(!this.device.opened)await this.device.open();}
    async close(){if(this.device?.opened)await this.device.close();}
    async request(packet,receive){
      await this.open();
      return new Promise((resolve,reject)=>{
        let ended=false;
        const device=this.device;
        const finish=(error,value)=>{if(ended)return;ended=true;clearTimeout(timeout);device.removeEventListener('inputreport',listener);error?reject(error):resolve(value);};
        const listener=event=>{if(event.reportId!==REPORT)return;try{const bytes=new Uint8Array(event.data.buffer,event.data.byteOffset,event.data.byteLength);const result=receive(bytes);if(result!==undefined)finish(null,result);}catch(error){finish(error);}};
        const timeout=setTimeout(()=>finish(Error('Клавиатура не ответила полностью за 2 секунды.')),2000);
        device.addEventListener('inputreport',listener);device.sendReport(REPORT,packet).catch(error=>finish(error));
      });
    }
    async checkConfig(){
      const p=new Uint8Array(63);p[0]=7;p[1]=1;
      const config=await this.request(p,b=>b[0]===7&&b[4]>=12?{mode:b[5],power:b[16]}:undefined);
      if(config.mode!==10||config.power!==0)throw Error('На сайте включите подсветку и Пользовательский → Layer 2, затем подключите расширение.');
    }
    async read(layer){
      const p=new Uint8Array(63);p[0]=9;p[1]=128+layer;
      const bytes=new Uint8Array(SIZE),pages=new Set();
      return this.request(p,response=>{
        if(response[0]!==9||response[1]!==128+layer||response.length<5)return;
        const page=(response[2]<<8)|response[3],offset=page*54;
        if(page>7)return;
        const length=Math.min(54,SIZE-offset);
        // Some firmware pads the final page to 54 bytes; only 18 are real keys.
        if(response[4]<length||response[4]>54||response.length<5+response[4])throw Error('Неполная страница цветов; запись отменена.');
        bytes.set(response.subarray(5,5+length),offset);pages.add(page);
        if(pages.size===8)return bytes;
      });
    }
    async write(bytes){
      if(!(bytes instanceof Uint8Array)||bytes.length!==SIZE)throw Error('Неверный размер кадра.');
      await this.open();const before=performance.now();
      for(let page=0;page<8;page++){
        const p=this.packets[page],length=p[4];p.set(bytes.subarray(page*54,page*54+length),5);
        await this.device.sendReport(REPORT,p);if(page<7)await wait(5);
      }
      this.writeMs=performance.now()-before;
    }
    connect(identity){this.cancel();return this.enqueue(async()=>{
      await this.stopInternal();await this.select(identity);this.error='';
      try{await this.open();await this.checkConfig();await this.read(LAYER);await this.storage.set({device:identity});return this.state();}
      finally{await this.close();}
    });}
    async stopInternal(){
      this.cancel();const base=this.base,previous=this.previous;this.base=null;this.previous=null;
      const restore=this.config.restoreMode==='previous'?previous:this.config.restoreMode==='source'?base:null;
      try{if(restore)await this.write(restore);}finally{await this.close();}
      return this.state();
    }
    stop(){this.cancel();return this.enqueue(()=>this.stopInternal());}
    start(raw){return this.enqueue(async()=>{
      await this.stopInternal();this.error='';this.config=CidooHeartMath.options(raw);
      try{
        await this.open();await this.checkConfig();const base=await this.read(0),previous=await this.read(LAYER);
        if(this.config.effect==='timeline'){
          CidooProject.validate({format:'cidoo-rgb-studio',version:1,sourceLayer:1,targetLayer:2,name:this.config.projectName,...this.config,sourceColors:Array.from(base)});
        }
        this.base=base;this.previous=previous;this.hasLast=false;this.frames=0;this.elapsed=0;this.started=performance.now();this.running=true;
        await this.tick();return this.state();
      }catch(error){this.cancel();this.error=error.message;await this.close();throw error;}
    });}
    async tick(){
      this.timer=null;if(!this.running||!this.base)return;
      try{
        this.elapsed=(performance.now()-this.started)/1000;
        if(this.config.duration>0&&this.elapsed>=this.config.duration){await this.stopInternal();return;}
        const before=performance.now();CidooHeartMath.paint(this.bytes,this.base,this.elapsed,this.config);
        if(!this.hasLast||this.bytes.some((byte,index)=>byte!==this.last[index])){await this.write(this.bytes);this.last.set(this.bytes);this.hasLast=true;this.frames++;}
        if(this.running)this.timer=setTimeout(()=>this.enqueue(()=>this.tick()),Math.max(0,1000/this.config.fps-(performance.now()-before)));
      }catch(error){this.error=error.message;this.cancel();try{await this.stopInternal();}catch(restoreError){this.error+=' Возврат цветов не подтверждён: '+restoreError.message;}}
    }
    source(){return this.enqueue(async()=>{
      try{await this.open();await this.checkConfig();return {colors:Array.from(await this.read(0)),sourceLayer:1,targetLayer:2};}
      finally{if(!this.running)await this.close();}
    });}
    copy(){this.cancel();return this.enqueue(async()=>{
      await this.stopInternal();this.error='';
      try{await this.open();await this.checkConfig();const source=await this.read(0),previous=await this.read(LAYER);await this.storage.set({layer2Backup:{identity:this.identity,bytes:Array.from(previous)}});await this.write(source);return this.state();}
      finally{await this.close();}
    });}
    restoreBackup(){this.cancel();return this.enqueue(async()=>{
      await this.stopInternal();const {layer2Backup}=await this.storage.get('layer2Backup');const id=layer2Backup?.identity;
      if(!id||id.vendorId!==this.identity?.vendorId||id.productId!==this.identity?.productId||id.profile!==this.identity?.profile||layer2Backup.bytes?.length!==SIZE)throw Error('Для этой клавиатуры и профиля нет резервной копии.');
      try{await this.open();await this.checkConfig();await this.write(new Uint8Array(layer2Backup.bytes));this.error='';return this.state();}finally{await this.close();}
    });}
  }
  globalThis.CidooHid=CidooHid;
})();
