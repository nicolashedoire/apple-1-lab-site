import { CPU, hex } from './cpu.js';

// Each card is one actual instruction in the project's educational CPU.
const CARDS = {
  takeO: { title: 'Prendre la lettre O', help: 'La garder dans la petite case A.', bytes: [0xA9, 0xCF], asm: 'LDA #$CF', kind: 'take' },
  takeK: { title: 'Prendre la lettre K', help: 'La garder dans la petite case A.', bytes: [0xA9, 0xCB], asm: 'LDA #$CB', kind: 'take' },
  show:  { title: 'Montrer à l’écran', help: 'Afficher ce que contient A.', bytes: [0x20, 0xEF, 0xFF], asm: 'JSR $FFEF', kind: 'show' },
  stop:  { title: 'Arrêter', help: 'Terminer cette démonstration.', bytes: [0x00], asm: 'BRK', kind: 'stop' }
};
const START = ['takeO', 'show'];
const MAX_CARDS = 12;

export function mountRecipe(container) {
  if (!container) return;
  const cpu = new CPU();
  let recipe = [...START], step = 0, running = false, message = '';
  container.innerHTML = `
    <div class="recipe-inner">
      <div class="recipe-heading"><div><span class="recipe-kicker">LE DÉFI DES CONSIGNES</span><h2>Fais apparaître <em>OK.</em></h2><p>Le processeur suit une recette. Choisis des cartes, puis regarde-le avancer une consigne à la fois.</p></div><div class="recipe-intro">La recette commence avec <strong>O</strong>. Ajoute ce qu’il faut pour afficher <strong>K</strong>, puis arrête la machine.</div></div>
      <div class="recipe-workspace">
        <section class="recipe-palette" aria-labelledby="recipe-palette-title"><h3 id="recipe-palette-title">Les cartes</h3><p>Choisis une carte pour l’ajouter à la fin.</p><div class="recipe-palette-list"></div></section>
        <section class="recipe-program" aria-labelledby="recipe-program-title"><div class="recipe-program-heading"><div><h3 id="recipe-program-title">Ta recette</h3><p>Les cartes sont lues de haut en bas.</p></div><span class="recipe-count"></span></div><ol class="recipe-list"></ol><p class="recipe-empty" hidden>Ta recette est vide. Choisis une carte pour commencer.</p><div class="recipe-controls"><button type="button" class="recipe-next">Étape suivante <span aria-hidden="true">→</span></button><button type="button" class="recipe-restart">Recommencer</button><button type="button" class="recipe-clear">Vider la recette</button></div><p class="recipe-hint">Modifier une carte remet la lecture au début.</p></section>
        <section class="recipe-output" aria-labelledby="recipe-output-title"><h3 id="recipe-output-title">Le petit écran</h3><div class="recipe-crt" aria-label="Résultat affiché par la machine"><span class="recipe-screen"></span><span class="recipe-cursor" aria-hidden="true">▍</span></div><p class="recipe-held"></p><div class="recipe-feedback" role="status" aria-live="polite"></div></section>
      </div>
      <details class="recipe-code"><summary>Pour les curieux · Voir les codes de la recette <span aria-hidden="true">+</span></summary><p>Chaque carte devient une instruction du 6502. Le laboratoire simplifie l’appel à ECHO et utilise BRK pour arrêter la démonstration.</p><pre class="recipe-code-text"></pre></details>
    </div>`;

  const find = sel => container.querySelector(sel);
  const palette = find('.recipe-palette-list'), list = find('.recipe-list');
  palette.innerHTML = Object.entries(CARDS).map(([id, card]) => `<button type="button" class="recipe-card-choice" data-add="${id}"><span class="recipe-card-mark recipe-mark-${card.kind}" aria-hidden="true"></span><span><strong>${card.title}</strong><small>${card.help}</small></span><span class="recipe-add-symbol" aria-hidden="true">+</span></button>`).join('');
  function resetMachine() {
    cpu.load(recipe.flatMap(id => CARDS[id].bytes), 0x0300);
    step = 0; running = false;
  }
  function cardCode() {
    let address = 0x0300;
    return recipe.map(id => { const c=CARDS[id], row=`${hex(address,4)}  ${c.bytes.map(v=>hex(v)).join(' ').padEnd(8, ' ')} ${c.asm}`; address += c.bytes.length; return row; }).join('\n') || 'Ajoute une carte pour voir son code.';
  }
  function currentHeld() {
    const value=cpu.a & 0x7F;
    return cpu.steps && value>=32 && value<=126 ? `Dans A : « ${String.fromCharCode(value)} »` : 'Dans A : aucune lettre pour le moment.';
  }
  function render() {
    find('.recipe-count').textContent = `${recipe.length} / ${MAX_CARDS} cartes`;
    list.innerHTML = recipe.map((id,i) => {
      const card = CARDS[id], done = i < step, active = running && i === step && !cpu.halted;
      return `<li class="recipe-row ${done?'is-done':''} ${active?'is-current':''}"><span class="recipe-row-index">${i+1}</span><span class="recipe-card-mark recipe-mark-${card.kind}" aria-hidden="true"></span><span class="recipe-row-title">${card.title}</span>${done?'<span class="recipe-row-state">Fait</span>':active?'<span class="recipe-row-state">À suivre</span>':''}<button type="button" class="recipe-remove" data-remove="${i}" aria-label="Retirer la carte ${i+1} : ${card.title}">×</button></li>`;
    }).join('');
    find('.recipe-empty').hidden = recipe.length !== 0;
    find('.recipe-screen').textContent = cpu.screen;
    find('.recipe-held').textContent = currentHeld();
    find('.recipe-feedback').textContent = message;
    find('.recipe-code-text').textContent = cardCode();
    find('.recipe-next').disabled = cpu.halted || recipe.length === 0;
    find('.recipe-clear').disabled = recipe.length === 0;
    palette.querySelectorAll('button').forEach(button => { button.disabled = recipe.length >= MAX_CARDS; });
  }
  function changed() {
    resetMachine(); message='La recette a changé : la lecture recommence au début.'; render();
  }
  palette.addEventListener('click', e => {
    const button=e.target.closest('[data-add]'); if(!button || !container.contains(button) || recipe.length>=MAX_CARDS) return;
    recipe.push(button.dataset.add); changed();
  });
  list.addEventListener('click', e => {
    const button=e.target.closest('[data-remove]'); if(!button || !container.contains(button)) return;
    const i=Number(button.dataset.remove); if(!Number.isInteger(i) || i<0 || i>=recipe.length)return;
    recipe.splice(i,1); changed();
  });
  find('.recipe-clear').addEventListener('click', () => {recipe=[];resetMachine();message='La recette est vide. Choisis des cartes pour en écrire une nouvelle.';render();});
  find('.recipe-restart').addEventListener('click', () => {resetMachine();message='La lecture recommence au début. Tes cartes sont toujours là.';render();});
  find('.recipe-next').addEventListener('click', () => {
    if(cpu.halted || !recipe.length)return;
    if(step >= recipe.length) { message='Il n’y a plus de carte à lire. Ajoute « Arrêter » pour terminer la recette.';render();return; }
    running = true;
    const id=recipe[step], card=CARDS[id], result=cpu.step(); step++;
    if(id === 'takeO' || id === 'takeK') message=`Le processeur prend « ${id==='takeO'?'O':'K'} » et le garde dans sa petite case A.`;
    else if(id === 'show') message=result.output ? `Il envoie « ${result.output} » à l’écran.` : 'Aucune lettre visible n’est prête. Essaie de prendre une lettre avant de la montrer.';
    else if(id === 'stop') {
      if(cpu.screen === 'OK') message='Bravo ! La machine affiche OK et la recette est terminée.';
      else if(!cpu.screen) message='La recette est arrêtée, mais l’écran est vide. Essaie de prendre puis de montrer une lettre.';
      else message=`La recette est arrêtée et l’écran affiche « ${cpu.screen} ». Peux-tu le faire afficher OK ?`;
    }
    if(!cpu.halted && step===recipe.length) message += ' Il n’y a plus de carte : ajoute la suite pour continuer.';
    render();
  });
  resetMachine(); message='Les deux premières cartes sont prêtes. Ajoute la suite pour écrire OK.'; render();
}
