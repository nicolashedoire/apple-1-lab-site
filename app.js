import {CPU, DEMOS, hex} from './cpu.js';
const $ = s => document.querySelector(s);
const cpu = $('#demo-select') ? new CPU() : null; let model = null, timer = null, history = [], lastDemo = DEMOS[0], selectedComponent = null;
const componentOrder = ['cpu','ram','rom','video','power'];
const facts = {
 cpu:['01 / LE CERVEAU','⌘','MOS 6502','C’est le cerveau de l’ordinateur : il lit les consignes et les suit une par une.','8 BITS · 1.023 MHZ'],
 ram:['02 / LA MÉMOIRE','▦','Mémoire vive','C’est une armoire à petits tiroirs : elle garde les consignes et les nombres pendant que l’ordinateur travaille.','4 KO FOURNIS · EXTENSIBLE'],
 rom:['03 / LES INSTRUCTIONS','▤','Le moniteur','Ce petit programme est déjà dans la machine. Il permet de regarder la mémoire, d’y écrire et de lancer un programme.','MONITEUR HEXADÉCIMAL'],
 video:['04 / LE TERMINAL','▣','Affichage & clavier','Il transforme les lettres envoyées par l’ordinateur pour les montrer sur l’écran.','40 × 24 CARACTÈRES'],
 power:['05 / L’ÉNERGIE','ϟ','Alimentation','Elle fournit aux composants l’électricité dont ils ont besoin pour fonctionner.','ALIMENTATION RÉGULÉE']
};
function selectComponent(id){const f=facts[id]; if(!f)return; document.querySelectorAll('.component-tab').forEach(x=>x.classList.toggle('active',x.dataset.component===id)); ['detail-kicker','detail-symbol','detail-title','detail-text','detail-foot'].forEach((key,i)=>{const el=document.getElementById(key);if(el)el.textContent=f[i]});model?.setActive(id)}
function focusComponent(id, scroll=false){const f=facts[id];if(!f)return;selectedComponent=id;selectComponent(id);const count=$('#component-count'),title=$('#scene-info-title'),desc=$('#scene-info-text'),info=$('#scene-info'),overview=$('#scene-overview');if(count)count.textContent=String(componentOrder.indexOf(id)+1).padStart(2,'0')+' / '+String(componentOrder.length).padStart(2,'0');if(title)title.textContent=f[2];if(desc)desc.textContent=f[3];if(info)info.hidden=false;if(overview)overview.hidden=false;if(scroll)$('#explorer')?.scrollIntoView({behavior:'smooth',block:'start'});model?.focus(id)}
document.querySelectorAll('.component-tab').forEach(el=>el.addEventListener('click',()=>focusComponent(el.dataset.component,true)));
$('#scene-overview')?.addEventListener('click',()=>{selectedComponent=null;model?.overview();model?.setActive(null);const info=$('#scene-info'),overview=$('#scene-overview');if(info)info.hidden=true;if(overview)overview.hidden=true;updateAnchor(null)});
function shiftComponent(delta){const index=componentOrder.indexOf(selectedComponent);focusComponent(componentOrder[(index+delta+componentOrder.length)%componentOrder.length])}
$('#component-prev')?.addEventListener('click',()=>shiftComponent(-1));
$('#component-next')?.addEventListener('click',()=>shiftComponent(1));
function updateAnchor(anchor){
 const marker=$('#scene-marker'),pointer=$('#scene-pointer'),info=$('#scene-info'),sceneElement=$('#scene');
 if(!marker||!pointer||!info||!sceneElement)return;
 const visible=!!anchor?.visible&&!info.hidden&&anchor.id===selectedComponent;
 marker.hidden=pointer.hidden=!visible;
 if(!visible)return;
 marker.style.left=anchor.x+'px';marker.style.top=anchor.y+'px';
 const scene=sceneElement.getBoundingClientRect(),box=info.getBoundingClientRect();
 const left=box.left-scene.left,top=box.top-scene.top,right=box.right-scene.left,bottom=box.bottom-scene.top;
 // Project the component to the closest point on the bubble boundary.
 let x=Math.max(left,Math.min(right,anchor.x)),y=Math.max(top,Math.min(bottom,anchor.y));
 if(anchor.x>=left&&anchor.x<=right&&anchor.y>=top&&anchor.y<=bottom){
  const nearest=[['left',anchor.x-left],['right',right-anchor.x],['top',anchor.y-top],['bottom',bottom-anchor.y]].sort((a,b)=>a[1]-b[1])[0][0];
  if(nearest==='left')x=left;else if(nearest==='right')x=right;else if(nearest==='top')y=top;else y=bottom;
 }
 for(const line of [$('#scene-pointer-line'),$('#scene-pointer-shadow')]){if(!line)continue;line.setAttribute('x1',x);line.setAttribute('y1',y);line.setAttribute('x2',anchor.x);line.setAttribute('y2',anchor.y)}
 const connector=info.querySelector('.scene-connector-anchor');
 if(connector){connector.style.left=(x-left)+'px';connector.style.top=(y-top)+'px';connector.style.right='auto';connector.style.transform='translate(-50%, -50%)'}
}
$('#explore-btn')?.addEventListener('click',()=>$('#composants')?.scrollIntoView({behavior:'smooth'}));
if($('#scene'))import('./scene.js').then(({createScene})=>{$('#scene').querySelector('.scene-loading')?.remove();model=createScene($('#scene'),{onSelect:id=>focusComponent(id),onAnchor:updateAnchor,onError:()=>fallback()});model.setScreen(cpu?.screen || readLastScreen())}).catch(fallback);
function readLastScreen(){try{return sessionStorage.getItem('apple1-lab-screen')||''}catch{return ''}}
function saveLastScreen(value){try{sessionStorage.setItem('apple1-lab-screen',value)}catch{}}
function fallback(){const el=$('#scene');if(!el)return;el.innerHTML='<div class="scene-loading">La vue 3D est indisponible sur ce navigateur.<br><br>Le laboratoire reste accessible ci-dessous.</div>'}
const select=$('#demo-select'); if(select)DEMOS.forEach(d=>{let o=document.createElement('option');o.value=d.id;o.textContent=d.title;select.appendChild(o)});
function stop(){if(timer){clearInterval(timer);timer=null}$('#run-btn').textContent='▶▶';$('#run-btn').title='Exécuter'}
function setDemo(){stop();lastDemo=DEMOS.find(d=>d.id===select.value)||DEMOS[0];$('#demo-description').textContent=lastDemo.description;$('#code-input').value=lastDemo.bytes.map(n=>hex(n)).join(' ');loadProgram()}
select?.addEventListener('change',setDemo);
function loadProgram(){stop(); const text=$('#code-input').value.trim(); const tokens=text.split(/[\s,;]+/).filter(Boolean); if(!tokens.length||tokens.some(x=>!/^(?:\$|0x)?[0-9a-fA-F]{2}$/.test(x))){$('#load-message').textContent='UTILISEZ DES OCTETS HEX : A9 C8 00';return}try{cpu.load(tokens.map(x=>parseInt(x.replace(/^\$|^0x/i,''),16)),0x300);history=[];$('#load-message').textContent='PROGRAMME CHARGÉ';render()}catch(e){$('#load-message').textContent=e.message}}
$('#load-btn')?.addEventListener('click',loadProgram);
function step(){if(cpu.halted){stop();return}const result=cpu.step();history.unshift(`$${hex(result.pc,4)}  ${result.mnemonic}`);history=history.slice(0,7);render(result);if(cpu.halted)stop()}
$('#step-btn')?.addEventListener('click',step);$('#flow-step')?.addEventListener('click',step);$('#run-btn')?.addEventListener('click',()=>{if(timer){stop();return}if(cpu.halted){$('#load-message').textContent='CHARGEZ OU RÉINITIALISEZ';return}$('#run-btn').textContent='Ⅱ';$('#run-btn').title='Mettre en pause';timer=setInterval(step,180)});$('#reset-btn')?.addEventListener('click',()=>{loadProgram();$('#load-message').textContent='PROGRAMME RÉINITIALISÉ'});
// Explain one whole instruction at a time. These highlights are teaching aids,
// not a visualization of the individual electrical cycles of the machine.
function renderFlow(last){
 const memory=$('#flow-memory'), processor=$('#flow-cpu'), result=$('#flow-result'), explanation=$('#flow-explanation');
 if(!explanation)return;
 const counter=$('#flow-step-count');if(counter)counter.textContent=`Pas ${cpu.steps}`;
 const changed=!!last&&(last.writes.length>0||!!last.output||['a','x','y'].some(k=>last.before[k]!==last.after[k]));
 memory?.classList.toggle('is-active',!!last);
 processor?.classList.toggle('is-active',!!last);
 result?.classList.toggle('is-active',changed);
 if(!last){
  const memValue=$('#flow-memory-value'), cpuValue=$('#flow-cpu-value'), resultValue=$('#flow-result-value');
  if(memValue)memValue.textContent=`Consigne prête à $${hex(cpu.pc,4)}.`;
  if(cpuValue)cpuValue.textContent='Prêt à lire.';
  if(resultValue)resultValue.textContent='Rien n’a changé pour l’instant.';
  explanation.textContent='La mémoire ressemble à une grande armoire à tiroirs. Le processeur va lire la prochaine consigne ; A est sa petite main pour tenir une valeur.';return
 }
 const op=last.opcode, v=n=>'$'+hex(n), addr=n=>'$'+hex(n,4), instruction=last.mnemonic;
 const next=last.after, before=last.before, write=last.writes[0];
 const memValue=$('#flow-memory-value'), cpuValue=$('#flow-cpu-value'), resultValue=$('#flow-result-value');
 if(memValue)memValue.textContent=`Consigne lue à ${addr(last.pc)}.`;
 if(cpuValue)cpuValue.textContent=`Consigne : ${instruction}.`;
 if(resultValue){
  if(cpu.halted)resultValue.textContent='Démonstration terminée.';
  else if(last.output)resultValue.textContent=last.output==='\n'?'Écran : nouvelle ligne.':`Écran : « ${last.output} ».`;
  else if(write)resultValue.textContent=`Mémoire ${addr(write.address)} : ${v(write.value)}.`;
  else {const reg=['a','x','y'].find(k=>before[k]!==next[k]);resultValue.textContent=reg?`${reg.toUpperCase()} contient ${v(next[reg])}.`:`Prochaine consigne à ${addr(next.pc)}.`}
 }
 let sentence='';
 if(op===0xA9){sentence=`Le processeur lit une consigne dans la mémoire et prend ${v(next.a)} dans sa petite main A. C’est une valeur écrite en hexadécimal.`}
 else if(op===0xAD||op===0xA5){sentence=`Le processeur ouvre le tiroir de mémoire indiqué par ${instruction} et place son contenu ${v(next.a)} dans sa petite main A.`}
 else if(op===0xA2||op===0xA0){const reg=op===0xA2?'X':'Y', value=op===0xA2?next.x:next.y;sentence=`Le processeur place ${v(value)} dans ${reg}, une petite case qui l’aide à compter ou à se repérer.`}
 else if(op===0x8D||op===0x85||op===0x8E){sentence=`Le processeur range ${v(write.value)} dans le tiroir mémoire ${addr(write.address)}. Il pourra retrouver cette valeur plus tard.`}
 else if(op===0x20&&instruction.includes('$FFEF')){if(last.output==='\n')sentence='Le processeur demande au moniteur de passer à la ligne sur l’écran.';else if(last.output)sentence=`Le processeur demande au moniteur d’envoyer le caractère « ${last.output} » à l’écran : il apparaît sur le terminal.`;else sentence=`Le processeur envoie ${v(before.a)} au terminal. Cette valeur correspond ici à un caractère de contrôle, donc aucune lettre visible ne s’ajoute.`}
 else if(op===0x20){sentence=`Le processeur note où revenir, puis part exécuter la petite suite d’instructions indiquée par ${instruction}.`}
 else if(op===0x60){sentence='La petite suite d’instructions est terminée : le processeur retrouve son adresse de retour et reprend son programme.'}
 else if(op===0x69){sentence=`Le processeur additionne la valeur demandée à sa petite main A : ${v(before.a)} devient ${v(next.a)}. La retenue est prise en compte.`}
 else if(op===0xE8||op===0xCA||op===0xC8||op===0x88){const reg=op===0xE8||op===0xCA?'X':'Y', key=reg.toLowerCase();sentence=`Le processeur ${op===0xE8||op===0xC8?'ajoute':'retire'} 1 à la case ${reg} : ${v(before[key])} devient ${v(next[key])}.`}
 else if(op===0xAA||op===0x8A||op===0xA8||op===0x98){const pairs={170:['A','X'],138:['X','A'],168:['A','Y'],152:['Y','A']};const [from,to]=pairs[op];sentence=`Le processeur copie la valeur de ${from} dans ${to}. La case ${to} contient maintenant ${v(next[to.toLowerCase()])}.`}
 else if(op===0x4C){sentence=`Le processeur saute directement à la consigne située dans le tiroir ${addr(next.pc)}.`}
 else if([0xD0,0xF0,0x10,0x30].includes(op)){sentence=`Le processeur regarde un indicateur pour choisir où continuer. ${last.description}`}
 else if(op===0x18||op===0x38){sentence=`Le processeur ${op===0x18?'efface':'active'} la retenue, un petit indicateur utilisé pour les calculs.`}
 else if(op===0xEA){sentence='Cette consigne demande au processeur de ne rien changer avant de passer à la suite.'}
 else if(op===0x00){sentence='Dans ce laboratoire, cette consigne arrête la démonstration. Sur un véritable 6502, BRK a un comportement plus complexe.'}
 else{sentence=`Le processeur s’arrête : cette consigne n’est pas encore comprise par le simulateur.`}
 explanation.textContent=sentence;
}
function render(last=null){const regs=[['A',cpu.a,2],['X',cpu.x,2],['Y',cpu.y,2],['PC',cpu.pc,4],['SP',cpu.sp,2],['P',cpu.p,2]];$('#registers').innerHTML=regs.map(([k,v,n])=>`<div class="register ${last && last.before[k.toLowerCase()]!==v?'changed':''}"><span>${k}</span><strong>$${hex(v,n)}</strong></div>`).join('');$('#step-count').textContent='PAS '+String(cpu.steps).padStart(3,'0');$('#instruction').innerHTML=last?`${last.mnemonic}<span>$${hex(last.pc,4)}</span>`:'EN ATTENTE<span>—</span>';$('#instruction-description').textContent=last?last.description:'Tout est prêt. Cliquez sur « Pas suivant » pour commencer.';
 const blocks=[0x300,0x308,0x310,0x400];$('#memory').innerHTML=blocks.map(start=>`<div><span class="address">${hex(start,4)}:</span> ${Array.from({length:8},(_,i)=>`<span class="${start+i===cpu.pc?'current':''}">${hex(cpu.memory[start+i])}</span>`).join(' ')}</div>`).join('');$('#trace').innerHTML=history.length?history.map(x=>`<div>${x}</div>`).join(''):'Les instructions apparaîtront ici.';$('#screen').textContent=cpu.screen;saveLastScreen(cpu.screen);model?.setScreen(cpu.screen);$('#output-explanation').textContent=last?.output?'Le caractère « '+(last.output==='\n'?'retour à la ligne':last.output)+' » vient d’être envoyé à l’écran.':cpu.screen?'Le terminal conserve les caractères déjà reçus.':'L’écran attend les caractères envoyés par le programme.';renderFlow(last)}
if(select)setDemo();

const atelier=$('#atelier'),hack=$('#hack');
if(atelier)import('./assembly.js').then(({mountAssembly})=>mountAssembly(atelier)).catch(()=>{atelier.textContent='L’atelier de montage est momentanément indisponible.'});
if(hack)import('./hack.js').then(({mountHack})=>mountHack(hack)).catch(()=>{hack.textContent='L’atelier de mémoire est momentanément indisponible.'});
