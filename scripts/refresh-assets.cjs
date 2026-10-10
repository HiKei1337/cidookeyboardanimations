const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
const context=vm.createContext({Uint8Array});
for(const file of ['layout.js','animation.js','project.js','presets.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const names=context.CidooPresets.names;
for(const file of ['animation.js','project.js','layout.js','presets.js','i18n.js','studio.js','studio.css'])fs.copyFileSync(path.join(root,file),path.join(root,'docs',file));
let html=fs.readFileSync(path.join(root,'studio.html'),'utf8');
const choices='<option value="">Выбери шаблон…</option>'+Object.entries(names).map(([id,label])=>`<option value="${id}">${label.ru}</option>`).join('');
html=html.replace(/(<select id="preset">)[\s\S]*?(<\/select>)/,`$1${choices}$2`);
fs.writeFileSync(path.join(root,'studio.html'),html);
fs.writeFileSync(path.join(root,'docs/studio.html'),html.replace(/(src|href)="([^"?]+\.(?:js|css))"/g,`$1="$2?v=${version}"`));
for(const id of Object.keys(names)){
 const project=context.CidooPresets.build(id,'en');
 for(const dir of ['examples','docs/examples']){fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,id+'.json'),JSON.stringify(project,null,2)+'\n');}
}
console.log('Synced editor, translations and '+Object.keys(names).length+' presets for '+version);
