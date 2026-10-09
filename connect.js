'use strict';
const status=document.getElementById('status'),authorize=document.getElementById('authorize');
let identity=null,busy=false;
async function send(action){const result=await chrome.runtime.sendMessage({type:'cidoo-heart',action,identity});if(!result?.ok)throw Error(result?.error||'Нет ответа расширения.');return result.state;}
async function prepare(){
  if(busy)return;identity=null;authorize.disabled=true;status.textContent='Определяю устройство на сайте…';
  try{
    const result=await send('describe');identity=result.identity;
    const granted=await navigator.hid.getDevices();
    if(granted.some(device=>device.vendorId===identity.vendorId&&device.productId===identity.productId)){
      busy=true;status.textContent='Использую сохранённое разрешение USB…';await send('connect');
      status.textContent='Подключено. Вернись в конструктор и нажми «Считать Layer 1». Layer 1 не изменён.';
    }else{authorize.disabled=false;status.textContent='Устройство найдено: '+identity.name+'. Нажми «Выбрать USB-клавиатуру».';}
  }
  catch(error){status.textContent=error.message;}
  finally{busy=false;authorize.disabled=!identity;}
}
authorize.addEventListener('click',()=>{
  if(busy||!identity)return;
  // Invoke the picker directly in the user gesture, before any await or message.
  const selection=navigator.hid.requestDevice({filters:[{vendorId:identity.vendorId,productId:identity.productId}]});
  busy=true;authorize.disabled=true;
  (async()=>{try{
    const devices=await selection;
    if(!devices.length)throw Error('Устройство не выбрано. Нажми кнопку снова, выбери клавиатуру в списке и подтверди подключение.');
    status.textContent='Передаю управление расширению…';await send('connect');
    status.textContent='Подключено. Вернись в конструктор и нажми «Считать Layer 1». Layer 1 не изменён.';
  }catch(error){status.textContent=error.name==='NotAllowedError'?'Chrome не разрешил выбор USB. Нажми кнопку снова в этой вкладке.':error.message;}
  finally{busy=false;authorize.disabled=false;}})();
});
document.getElementById('refresh').addEventListener('click',prepare);
document.getElementById('editor').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('studio.html')}));
prepare();
