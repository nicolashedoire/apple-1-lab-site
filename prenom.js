import { recordAchievement } from './achievements.js';
import { CPU, hex } from './cpu.js';
const $ = id => document.getElementById(id);
const cpu = new CPU();
let target = '', program = [];
const input = $('name-input'), message = $('name-message'), screen = $('name-screen'), action = $('name-action'), certificate = $('certificate');
const stepButton = $('name-step'), runButton = $('name-run'), resetButton = $('name-reset');
function normalizeName(value) { return value.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function makeProgram(name) { const bytes=[]; for (const character of name) bytes.push(0xA9, character.charCodeAt(0) | 0x80, 0x20, 0xEF, 0xFF); bytes.push(0x00); return bytes; }
function draw() { screen.textContent=cpu.screen; $('name-count').textContent = cpu.steps ? `${cpu.steps} CONSIGNE${cpu.steps>1?'S':''} EXÉCUTÉE${cpu.steps>1?'S':''}` : 'AUCUNE CONSIGNE EXÉCUTÉE'; }
function enableReady(value) { stepButton.disabled=!value; runButton.disabled=!value; resetButton.disabled=!value; }
function prepare() {
 const name = normalizeName(input.value);
 if (!name || !/[A-Z]/.test(name) || name.length > 20 || !/^[A-Z ]+$/.test(name)) { message.textContent = 'Utilise seulement des lettres et des espaces : 20 caractères maximum. Par exemple : Léa.'; input.setAttribute('aria-invalid','true'); return; }
 input.removeAttribute('aria-invalid'); target=name; program=makeProgram(name); cpu.load(program,0x0300); certificate.hidden=true; enableReady(true); draw();
 const normalized=$('name-normalized');normalized.hidden=false;normalized.textContent=`La machine écrira : ${target}`;
 $('name-code').textContent=program.map(n=>hex(n)).join(' ');
 message.textContent=`Ta recette est prête pour écrire « ${target} ». Appuie sur Étape suivante ou Tout lancer.`;
 action.textContent='La première consigne attend dans la mémoire.';
}
function step() {
 if (!target || cpu.halted) return;
 const result=cpu.step(); draw();
 if (result.opcode===0xA9) { const character=String.fromCharCode(cpu.a & 0x7F); action.textContent=character===' '?'Le processeur prépare un espace.':`Le processeur prépare la lettre « ${character} » dans sa petite case A.`; }
 else if (result.opcode===0x20) action.textContent=result.output===' '?'La machine a ajouté un espace.':`La machine ajoute « ${result.output} » à l’écran.`;
 else if (result.opcode===0x00) { action.textContent='La recette est terminée !'; if(cpu.screen===target){ recordAchievement('name'); message.textContent=`Bravo ! La machine a écrit « ${target} ».`; $('certificate-name').textContent=target; $('certificate-code').textContent=program.map(n=>hex(n)).join(' '); certificate.hidden=false; } else message.textContent='Le résultat ne correspond pas au prénom. Recommence pour essayer encore.'; stepButton.disabled=true;runButton.disabled=true; }
}
$('name-form').addEventListener('submit', event=>{event.preventDefault();prepare()});
stepButton.addEventListener('click', step);
runButton.addEventListener('click', ()=>{let guard=0;while(!cpu.halted && guard++<45)step()});
resetButton.addEventListener('click', ()=>{if(!target)return;cpu.load(program,0x0300);certificate.hidden=true;enableReady(true);draw();action.textContent='La recette revient au début.';message.textContent='Tout est prêt pour recommencer.'});
$('certificate-print').addEventListener('click',()=>window.print());
