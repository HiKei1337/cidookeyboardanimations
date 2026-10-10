(() => {
  const row=(indexes,labels,widths={})=>indexes.map((index,i)=>({index,label:labels[i],width:widths[index]||1}));
  const rows=[
    row([0,2,3,4,5,6,7,8,9,10,11,12,13,14],['Esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Del']),
    row([22,23,24,25,26,27,28,29,30,31,32,33,34,36,37],['`','1','2','3','4','5','6','7','8','9','0','−','=','Back','Home'],{36:2}),
    row([44,45,46,47,48,49,50,51,52,53,54,55,56,58,59],['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\','End'],{44:1.5,58:1.5}),
    row([66,68,69,70,71,72,73,74,75,76,77,78,80,81],['Caps','A','S','D','F','G','H','J','K','L',';','\'','Enter','PgUp'],{66:1.75,80:2.25}),
    row([88,90,91,92,93,94,95,96,97,98,99,101,102,103],['Shift','Z','X','C','V','B','N','M',',','.','/','Shift','↑','PgDn'],{88:2.25,101:1.75}),
    row([110,111,112,116,120,121,123,124,125],['Ctrl','Win','Alt','Space','Alt','Fn','←','↓','→'],{110:1.25,111:1.25,112:1.25,116:6.25,120:1.25,121:1.25})
  ];
  const codeRows=[['Escape',...Array.from({length:12},(_,i)=>'F'+(i+1)),'Delete'],['Backquote',...Array.from({length:9},(_,i)=>'Digit'+(i+1)),'Digit0','Minus','Equal','Backspace','Home'],['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash','End'],['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter','PageUp'],['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight','ArrowUp','PageDown'],['ControlLeft','MetaLeft','AltLeft','Space','AltRight','Fn','ArrowLeft','ArrowDown','ArrowRight']];
  const codes=Object.fromEntries(rows.flatMap((row,r)=>row.map((key,c)=>[codeRows[r][c],key.index])));
  globalThis.CidooLayout=Object.freeze({rows,keys:rows.flat(),codeIndex:code=>codes[code]});
  // Installed only on a tab explicitly chosen through the extension popup.
  if(globalThis.chrome?.runtime?.id&&typeof document!=='undefined'&&/^https?:$/.test(globalThis.location?.protocol||'')&&!globalThis.__cidooReactiveListener){
    globalThis.__cidooReactiveListener=true;let enabled=false,last=-Infinity;
    chrome.runtime.onMessage.addListener(message=>{if(message?.type==='cidoo-react-state')enabled=message.enabled===true;});
    chrome.runtime.sendMessage({type:'cidoo-react',status:true}).then(result=>enabled=result?.enabled===true).catch(()=>{});
    document.addEventListener('keydown',event=>{
      if(!enabled||!event.isTrusted||event.repeat||document.hidden||event.target?.closest?.('input[type="password"]')||event.composedPath?.().some(node=>node.matches?.('input[type="password"]')))return;
      const index=codes[event.code],now=performance.now();if(index===undefined||now-last<16)return;last=now;
      // No text, key character, URL, input value or key history is sent or stored.
      chrome.runtime.sendMessage({type:'cidoo-react',index}).then(result=>{if(result?.enabled===false)enabled=false;}).catch(()=>{enabled=false;});
    },true);
  }
})();
