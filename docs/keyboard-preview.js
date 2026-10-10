(() => {
function draw(canvas,colors){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=14,gap=4,rowH=(h-pad*2-gap*5)/6;
 ctx.fillStyle='#121016';ctx.fillRect(0,0,w,h);
 CidooLayout.rows.forEach((row,r)=>{const unit=(w-pad*2-gap*(row.length-1))/row.reduce((n,k)=>n+k.width,0);let x=pad;
 for(const key of row){const width=unit*key.width,o=key.index*3,rgb=colors.slice(o,o+3);ctx.fillStyle='rgb('+rgb.join(',')+')';ctx.strokeStyle='#caa8eb';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,pad+r*(rowH+gap),width,rowH,3);ctx.fill();ctx.stroke();ctx.fillStyle=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>150?'#17121e':'#fff';ctx.font='9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(key.label,x+width/2,pad+r*(rowH+gap)+rowH/2,width-3);x+=width+gap;}}
 );
}
globalThis.CidooKeyboardPreview=Object.freeze({draw});
})();
