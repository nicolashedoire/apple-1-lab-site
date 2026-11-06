import {CPU, DEMOS, hex} from './cpu.js';
const $ = s => document.querySelector(s);
const cpu = $('#demo-select') ? new CPU() : null; let model = null, timer = null, history = [], lastDemo = DEMOS[0], selectedComponent = null;
const componentOrder = ['cpu','ram','rom','video','power'];
const facts = {
 cpu:['01 / LE CERVEAU','⌘','MOS 6502','Cette puce est le cerveau de la machine. Elle lit une consigne dans la mémoire, puis la réalise. Par exemple : prépare une lettre ou fais une addition.','8 BITS · 1.023 MHZ'],
 ram:['02 / LA MÉMOIRE','▦','Mémoire vive','Imagine une armoire à petits tiroirs. Elle garde les consignes et les nombres utiles à la machine. Quand on coupe le courant, son contenu disparaît.','4 KO FOURNIS · EXTENSIBLE'],
 rom:['03 / LES INSTRUCTIONS','▤','Le moniteur','Le moniteur est un petit programme déjà présent dans la machine. Il aide à explorer la mémoire, à y écrire des nombres et à lancer un programme.','MONITEUR HEXADÉCIMAL'],
 video:['04 / LE TERMINAL','▣','Affichage & clavier','Le clavier permet d’envoyer des consignes. Les circuits vidéo, eux, transforment les codes envoyés par la machine en lettres visibles à l’écran.','40 × 24 CARACTÈRES'],
 power:['05 / L’ÉNERGIE','ϟ','Alimentation','Elle prépare et distribue l’électricité nécessaire aux autres pièces. Sans elle, aucune puce ne peut travailler.','ALIMENTATION RÉGULÉE']
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
const demoDescriptions={bonjour:'Cette petite recette affiche « HI! » à l’écran, lettre après lettre.',memoire:'On range un nombre dans un tiroir, puis on en calcule un autre.',ascii:'Ce programme inspiré du manuel compte et essaie d’afficher les caractères les uns après les autres.'};
function setDemo(){stop();lastDemo=DEMOS.find(d=>d.id===select.value)||DEMOS[0];$('#demo-description').textContent=demoDescriptions[lastDemo.id]||lastDemo.description;$('#code-input').value=lastDemo.bytes.map(n=>hex(n)).join(' ');loadProgram()}
select?.addEventListener('change',setDemo);
function loadProgram(){stop(); const text=$('#code-input').value.trim(); const tokens=text.split(/[\s,;]+/).filter(Boolean); if(!tokens.length||tokens.some(x=>!/^(?:\$|0x)?[0-9a-fA-F]{2}$/.test(x))){$('#load-message').textContent='UTILISEZ DES OCTETS HEX : A9 C8 00';return}try{cpu.load(tokens.map(x=>parseInt(x.replace(/^\$|^0x/i,''),16)),0x300);history=[];$('#load-message').textContent='PROGRAMME CHARGÉ';render()}catch(e){$('#load-message').textContent=e.message}}
$('#load-btn')?.addEventListener('click',loadProgram);
function step(){if(cpu.halted){stop();return}const result=cpu.step();history.unshift(`$${hex(result.pc,4)}  ${result.mnemonic}`);history=history.slice(0,7);render(result);if(cpu.halted)stop()}
$('#step-btn')?.addEventListener('click',step);$('#flow-step')?.addEventListener('click',step);$('#flow-reset')?.addEventListener('click',()=>{loadProgram();$('#load-message').textContent='PROGRAMME RÉINITIALISÉ'});$('#run-btn')?.addEventListener('click',()=>{if(timer){stop();return}if(cpu.halted){$('#load-message').textContent='CHARGEZ OU RÉINITIALISEZ';return}$('#run-btn').textContent='Ⅱ';$('#run-btn').title='Mettre en pause';timer=setInterval(step,180)});$('#reset-btn')?.addEventListener('click',()=>{loadProgram();$('#load-message').textContent='PROGRAMME RÉINITIALISÉ'});
// Explain one whole instruction at a time. These highlights are teaching aids,
// not a visualization of the individual electrical cycles of the machine.
function renderFlow(last){
 const memory=$('#flow-memory'), processor=$('#flow-cpu'), result=$('#flow-result'), explanation=$('#flow-explanation');
 if(!explanation)return;
 const counter=$('#flow-step-count');if(counter)counter.textContent=`Étape ${cpu.steps}`;
 const changed=!!last&&(last.writes.length>0||!!last.output||['a','x','y'].some(k=>last.before[k]!==last.after[k]));
 memory?.classList.toggle('is-active',!!last); processor?.classList.toggle('is-active',!!last); result?.classList.toggle('is-active',changed);
 const memValue=$('#flow-memory-value'), cpuValue=$('#flow-cpu-value'), resultValue=$('#flow-result-value');
 if(!last){
  if(memValue)memValue.textContent=`La prochaine consigne est dans le tiroir $${hex(cpu.pc,4)}.`;
  if(cpuValue)cpuValue.textContent='Le processeur est prêt.';
  if(resultValue)resultValue.textContent='L’écran est encore vide.';
  const intros={bonjour:'Clique sur « Étape suivante ». Tu verras comment la machine prépare une lettre avant de l’afficher.',memoire:'Clique sur « Étape suivante ». Tu verras la machine ranger un nombre dans un tiroir, puis le modifier.',ascii:'Clique sur « Étape suivante ». La machine va compter et essayer d’afficher des caractères. Certains ne sont pas visibles.'};
  explanation.textContent=intros[lastDemo.id]||'Clique sur « Étape suivante » pour voir ce que fait la machine.';return;
 }
 const op=last.opcode, v=n=>'$'+hex(n), addr=n=>'$'+hex(n,4), instruction=last.mnemonic;
 const next=last.after, before=last.before, write=last.writes[0];
 if(memValue)memValue.textContent=`Consigne trouvée dans le tiroir ${addr(last.pc)}.`;
 if(cpuValue)cpuValue.textContent=`Il suit ${instruction}, le nom de cette consigne.`;
 if(resultValue){
  if(cpu.halted)resultValue.textContent='Le programme est terminé.';
  else if(last.output)resultValue.textContent=last.output==='\n'?'L’écran passe à la ligne.':`La lettre « ${last.output} » apparaît à l’écran.`;
  else if(write)resultValue.textContent=`Le tiroir ${addr(write.address)} contient ${v(write.value)}.`;
  else {const reg=['a','x','y'].find(k=>before[k]!==next[k]);resultValue.textContent=reg?`La petite case ${reg.toUpperCase()} contient ${v(next[reg])}.`:'Pas encore de nouvelle lettre à l’écran.';}
 }
 let sentence='';
 if(op===0xA9){
  const followsEcho=cpu.memory[next.pc]===0x20&&cpu.memory[(next.pc+1)&0xFFFF]===0xEF&&cpu.memory[(next.pc+2)&0xFFFF]===0xFF;
  const char=next.a&0x7F;
  if(followsEcho&&char>=32&&char<=126){const letter=String.fromCharCode(char);sentence=`Le processeur place ${v(next.a)} dans sa petite case A. Ici, c’est le code de « ${letter} ». À l’étape suivante, la machine demandera de l’afficher.`;}
  else sentence=`Le processeur place le nombre ${v(next.a)} dans sa petite case A pour l’utiliser ensuite. Le signe $ indique une écriture spéciale avec 0 à 9 et A à F.`;
 }
 else if(op===0xAD||op===0xA5)sentence=`Le processeur lit le nombre du tiroir indiqué et le copie dans sa petite case A. A contient maintenant ${v(next.a)}.`;
 else if(op===0xA2||op===0xA0){const reg=op===0xA2?'X':'Y', value=op===0xA2?next.x:next.y;sentence=`Le processeur place ${v(value)} dans ${reg}, une petite case qui lui sert notamment à compter.`;}
 else if(op===0x8D||op===0x85||op===0x8E)sentence=`Le processeur range ${v(write.value)} dans le tiroir ${addr(write.address)}. L’adresse est simplement le numéro qui permet de retrouver ce tiroir.`;
 else if(op===0x20&&instruction.includes('$FFEF')){
  if(last.output==='\n')sentence='Le processeur demande à ECHO, un petit programme de la machine, de passer à la ligne sur l’écran.';
  else if(last.output)sentence=`Le processeur donne le code ${v(before.a)} à ECHO, un petit programme qui sait écrire à l’écran. Regarde : « ${last.output} » apparaît !`;
  else sentence=`Le processeur donne ${v(before.a)} à ECHO. Ce code ne correspond pas ici à une lettre visible, donc l’écran ne change pas.`;
 }
 else if(op===0x20)sentence='Le processeur met un marque-page pour savoir où revenir, puis suit une autre petite suite de consignes.';
 else if(op===0x60)sentence='La petite suite de consignes est terminée. Le processeur retrouve son marque-page et reprend la suite.';
 else if(op===0x69)sentence=`Le processeur fait une addition. Dans sa case A, ${v(before.a)} devient ${v(next.a)}. Ces nombres utilisent l’écriture avec 0 à 9 et A à F.`;
 else if(op===0xE8||op===0xCA||op===0xC8||op===0x88){const reg=op===0xE8||op===0xCA?'X':'Y', key=reg.toLowerCase();sentence=`Le processeur ${op===0xE8||op===0xC8?'ajoute':'enlève'} 1 dans la petite case ${reg} : ${v(before[key])} devient ${v(next[key])}.`;}
 else if(op===0xAA||op===0x8A||op===0xA8||op===0x98){const pairs={170:['A','X'],138:['X','A'],168:['A','Y'],152:['Y','A']};const [from,to]=pairs[op];sentence=`Le processeur copie le nombre de la case ${from} dans la case ${to}. ${to} contient maintenant ${v(next[to.toLowerCase()])}.`;}
 else if(op===0x4C)sentence=`Au lieu de continuer tout droit, le processeur va chercher la prochaine consigne dans le tiroir ${addr(next.pc)}.`;
 else if([0xD0,0xF0,0x10,0x30].includes(op)){const jumped=next.pc!==((last.pc+2)&0xFFFF);sentence=jumped?`Le processeur vérifie un petit signal, puis choisit d’aller au tiroir ${addr(next.pc)}.`:'Le processeur vérifie un petit signal, puis continue avec la consigne qui suit.';}
 else if(op===0x18||op===0x38)sentence=`Le processeur ${op===0x18?'efface':'allume'} un petit signal appelé « retenue », utile pour faire des additions.`;
 else if(op===0xEA)sentence='Cette consigne dit au processeur : ne change rien et passe simplement à la suite.';
 else if(op===0x00)sentence='Bravo ! Dans ce laboratoire, cette consigne termine le programme. Pour le rejouer, utilise le bouton de recommencement. Sur un vrai 6502, cette consigne fait davantage de choses.';
 else sentence='Ce laboratoire ne sait pas encore lire cette consigne. Tu peux charger un des exemples pour continuer.';
 explanation.textContent=sentence;
}
function render(last=null){const regs=[['A',cpu.a,2],['X',cpu.x,2],['Y',cpu.y,2],['PC',cpu.pc,4],['SP',cpu.sp,2],['P',cpu.p,2]];$('#registers').innerHTML=regs.map(([k,v,n])=>`<div class="register ${last && last.before[k.toLowerCase()]!==v?'changed':''}"><span>${k}</span><strong>$${hex(v,n)}</strong></div>`).join('');$('#step-count').textContent='PAS '+String(cpu.steps).padStart(3,'0');$('#instruction').innerHTML=last?`${last.mnemonic}<span>$${hex(last.pc,4)}</span>`:'EN ATTENTE<span>—</span>';$('#instruction-description').textContent=last?last.description:'Tout est prêt. Cliquez sur « Pas suivant » pour commencer.';
 const blocks=[0x300,0x308,0x310,0x400];$('#memory').innerHTML=blocks.map(start=>`<div><span class="address">${hex(start,4)}:</span> ${Array.from({length:8},(_,i)=>`<span class="${start+i===cpu.pc?'current':''}">${hex(cpu.memory[start+i])}</span>`).join(' ')}</div>`).join('');$('#trace').innerHTML=history.length?history.map(x=>`<div>${x}</div>`).join(''):'Les instructions apparaîtront ici.';$('#screen').textContent=cpu.screen;const simpleScreen=$('#flow-screen');if(simpleScreen)simpleScreen.textContent=cpu.screen;saveLastScreen(cpu.screen);model?.setScreen(cpu.screen);$('#output-explanation').textContent=last?.output?'Le caractère « '+(last.output==='\n'?'retour à la ligne':last.output)+' » vient d’être envoyé à l’écran.':cpu.screen?'Le terminal conserve les caractères déjà reçus.':'L’écran attend les caractères envoyés par le programme.';renderFlow(last)}
if(select)setDemo();

const atelier=$('#atelier'),hack=$('#hack');
if(atelier)import('./assembly.js?v=3').then(({mountAssembly})=>mountAssembly(atelier)).catch(()=>{atelier.textContent='L’atelier de montage est momentanément indisponible.'});
if(hack)import('./hack.js?v=4').then(({mountHack})=>mountHack(hack)).catch(()=>{hack.textContent='L’atelier de mémoire est momentanément indisponible.'});
