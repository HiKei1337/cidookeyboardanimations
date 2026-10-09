// Used once to identify and hand over the device. Never executes per frame.
(() => {
  'use strict';
  if(window.cidooBackgroundBridge)return;
  function store(){
    const s=document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia?._s?.get('keyboard');
    if(!s?.isConnected||!s.sdk?.dm)throw Error('Подключите CIDOO C80 к новой версии сайта и выберите Пользовательский → Layer 2.');
    return s;
  }
  function describe(){
    const s=store(),d=s.sdk.dm.getDevice?.()||s.sdk.hidDevice;
    if(!d||!/CIDOO\s*C80/i.test([d.productName,s.device?.name,s.device?.title].join(' ')))throw Error('Подключена не CIDOO C80.');
    if(s.keyConfig?.lightLayer!==1||s.lightConfig?.mode!==10||s.lightConfig?.power!==0)throw Error('Включите Пользовательский → Layer 2 на сайте.');
    return {vendorId:d.vendorId,productId:d.productId,name:d.productName,profile:s.curIndex};
  }
  window.cidooBackgroundBridge=Object.freeze({describe,async handoff(){
    const identity=describe();
    if(window.cidooHeart?.stop)await window.cidooHeart.stop();
    await store().sdk.disconnect();return identity;
  }});
})();
