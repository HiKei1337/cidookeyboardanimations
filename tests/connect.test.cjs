const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function test(selected,granted=false){
  const nodes=Object.fromEntries(['status','authorize','refresh','editor'].map(id=>[id,{disabled:false,textContent:'',events:{},addEventListener(t,f){this.events[t]=f;}}]));
  let withinClick=false,pickers=0,connected=0;const identity={vendorId:1,productId:2,name:'CIDOO'};
  const context=vm.createContext({document:{getElementById:id=>nodes[id]},navigator:{hid:{getDevices:async()=>granted?[identity]:[],requestDevice(options){assert.ok(withinClick,'picker must be called synchronously within the click');assert.equal(options.filters[0].vendorId,1);pickers++;return Promise.resolve(selected);}}},chrome:{runtime:{sendMessage:async message=>{if(message.action==='describe')return{ok:true,state:{identity}};assert.equal(message.action,'connect');assert.equal(message.identity,identity);connected++;return{ok:true,state:{ready:true}};},getURL:x=>x},tabs:{create:async()=>{}}}});
  vm.runInContext(fs.readFileSync(path.join(root,'connect.js'),'utf8'),context);await new Promise(r=>setImmediate(r));
  if(granted){assert.equal(pickers,0,'saved permission avoids the picker');assert.equal(connected,1);return;}
  assert.equal(nodes.authorize.disabled,false);withinClick=true;nodes.authorize.events.click();withinClick=false;await new Promise(r=>setImmediate(r));
  assert.equal(pickers,1);assert.equal(connected,selected.length?1:0);assert.equal(nodes.authorize.disabled,false);
  assert.match(nodes.status.textContent,selected.length?/Подключено/:/Устройство не выбрано/);
}
(async()=>{await test([{}]);await test([]);await test([],true);console.log('PASS: persistent connection page; saved USB permission reuse without picker; synchronous user-gesture picker; successful handoff; empty selection allows retry.');})().catch(e=>{console.error(e);process.exitCode=1;});
