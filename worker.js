'use strict';
importScripts('animation.js','project.js','hid.js','i18n.js');
const engine=new CidooHid(navigator.hid,chrome.storage.local);
let actions=Promise.resolve();
const hydrated=(async()=>{const {device}=await chrome.storage.local.get('device');if(device){try{await engine.select(device);}catch{}}})();
async function siteAction(action){
  const tabs=await chrome.tabs.query({url:'https://cidoo.illumipc.com/*'});
  const active=tabs.filter(t=>t.active),tab=tabs.length===1?tabs[0]:active.length===1?active[0]:null;
  if(!tab)throw Error('Откройте одну вкладку CIDOO в Chrome, подключите C80 и выберите Пользовательский → Layer 2.');
  await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',files:['bridge.js']});
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:async action=>{
    try{return {ok:true,identity:await window.cidooBackgroundBridge[action]()};}catch(error){return {ok:false,error:error.message};}
  },args:[action]});
  if(!result[0]?.result?.ok)throw Error(result[0]?.result?.error||'Сайт не ответил.');return result[0].result.identity;
}
async function execute(action,config,identity){
  await hydrated;
  if(action==='status')return engine.state();
  if(action==='describe')return {identity:await siteAction('describe')};
  if(action==='connect'){
    await engine.stop();
    await engine.select(identity); // Check permission before releasing the site handle.
    const actual=await siteAction('handoff');
    if(actual.vendorId!==identity.vendorId||actual.productId!==identity.productId)throw Error('Клавиатура на сайте изменилась. Подключите её снова.');
    return engine.connect(actual);
  }
  if(action==='start')return engine.start(config);
  if(action==='stop')return engine.stop();
  if(action==='toggle')return engine.running?engine.stop():engine.start(config);
  if(action==='copy')return engine.copy();
  if(action==='source')return engine.source();
  if(action==='startProject')return engine.start(CidooProject.config(config));
  if(action==='restoreBackup')return engine.restoreBackup();
  throw Error('Неизвестная команда.');
}
function dispatch(action,config,identity){
  if(action==='stop')engine.cancel();
  const result=actions.then(()=>execute(action,config,identity));actions=result.catch(()=>{});return result;
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(sender.id!==chrome.runtime.id||message?.type!=='cidoo-heart')return;
  dispatch(message.action,message.config,message.identity).then(state=>sendResponse({ok:true,state}),error=>sendResponse({ok:false,error:error.message}));return true;
});
chrome.commands.onCommand.addListener(async command=>{
  try{const {settings}=await chrome.storage.local.get('settings');const config=settings?.schema===2?settings:{...settings,duration:0,fps:8};const state=await dispatch(command==='stop-heart'?'stop':'toggle',config);await chrome.action.setBadgeText({text:state.running?'ON':''});await chrome.action.setTitle({title:await localizedTitle(state.error||'CIDOO RGB Studio — Layer 2')});}
  catch(error){await chrome.action.setBadgeText({text:'!'});await chrome.action.setTitle({title:await localizedTitle(error.message)});}
});
async function localizedTitle(text){const {language}=await chrome.storage.local.get('language');return (language||navigator.language||'en').toLowerCase().startsWith('ru')?text:CidooI18n.translate(text);}
navigator.hid.addEventListener('disconnect',event=>{
  if(event.device!==engine.device)return;
  engine.cancel();engine.base=null;engine.device=null;engine.error='Клавиатура отключена. Подключите её снова.';
});
