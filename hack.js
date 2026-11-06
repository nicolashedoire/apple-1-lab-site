import {CPU, hex} from './cpu.js';

// A self-contained, browser-local memory puzzle. It uses the same educational
// 6502 core as the lab, but it never touches the main lab's CPU or memory.
export function mountHack(container) {
  if (!container) return;
  const initial = [0xA9, 0xC1, 0x20, 0xEF, 0xFF, 0x00];
  const cpu = new CPU();
  container.innerHTML = `
    <div class="hack-shell">
      <div class="hack-intro">
        <div><span class="hack-eyebrow">MISSION 01 · BAC À SABLE</span><h3>Change la lettre<br><span>en modifiant la mémoire.</span></h3></div>
        <p>Un petit programme affiche la lettre <b>A</b>. Ta mission : trouver la valeur à changer dans sa mémoire pour afficher <b>B</b>.</p>
      </div>
      <div class="hack-workspace">
        <div class="hack-memory">
          <div class="hack-label"><span>01 &nbsp; LA MÉMOIRE</span><span>ADRESSES EN HEXADÉCIMAL</span></div>
          <p>Chaque case est un tiroir. Le deuxième contient le code de la lettre.</p>
          <div class="hack-cells" aria-label="Cases de la mémoire">
            <div class="hack-cell"><span>$0300</span><b>A9</b><small>consigne</small></div>
            <div class="hack-cell hack-cell-edit"><label for="hack-value">$0301 <span>À MODIFIER</span></label><input id="hack-value" value="C1" inputmode="text" maxlength="2" spellcheck="false" autocomplete="off" aria-describedby="hack-help"><small>code de la lettre</small></div>
            <div class="hack-cell"><span>$0302</span><b>20</b><small>consigne</small></div>
            <div class="hack-cell"><span>$0303</span><b>EF</b><small>adresse</small></div>
            <div class="hack-cell"><span>$0304</span><b>FF</b><small>adresse</small></div>
            <div class="hack-cell"><span>$0305</span><b>00</b><small>fin</small></div>
          </div>
          <p id="hack-help" class="hack-help">Entre deux chiffres ou lettres entre 0 et 9 et A et F, puis lance le programme.</p>
          <div class="hack-actions"><button class="hack-run" id="hack-run" type="button">Tester ma modification <span>→</span></button><button class="hack-reset" id="hack-reset" type="button">Recommencer</button></div>
          <div class="hack-feedback" id="hack-feedback" role="status" aria-live="polite">À toi de jouer : modifie le tiroir $0301.</div>
          <details class="hack-hint"><summary>Un indice ?</summary><p>Le code de <b>A</b> est <code>C1</code>. Pour obtenir <b>B</b>, avance d’un cran : quel nombre vient après 1 ?</p><details><summary>Voir la solution</summary><p>Écris <code>C2</code> dans le tiroir <code>$0301</code>, puis teste.</p></details></details>
        </div>
        <div class="hack-display">
          <div class="hack-label"><span>02 &nbsp; LE RÉSULTAT</span><span>ÉCRAN SIMULÉ</span></div>
          <div class="hack-comparison"><div><span>AVANT</span><div class="hack-screen" aria-label="Avant : A">A<i>▍</i></div></div><div class="hack-transition" aria-hidden="true">→</div><div><span>APRÈS</span><div class="hack-screen" id="hack-output" aria-label="Après : en attente">?<i>▍</i></div></div></div>
          <div class="hack-explain"><strong>Comment ça marche ?</strong><p>Le processeur lit la valeur dans le tiroir, puis demande au terminal de l’afficher. En changeant cette valeur, tu changes la lettre qu’il reçoit.</p></div>
        </div>
      </div>
      <p class="hack-note">Tout se passe dans ton navigateur, dans une copie isolée et simplifiée de l’Apple-1. Aucun ordinateur extérieur n’est modifié.</p>
    </div>`;
  const find = id => container.querySelector('#' + id);
  const input = find('hack-value'), feedback = find('hack-feedback'), output = find('hack-output');
  let lastValue = null;
  const run = () => {
    const raw = input.value.trim().toUpperCase();
    if (!/^[0-9A-F]{2}$/.test(raw)) {
      feedback.textContent = 'Il faut exactement deux caractères entre 0 et 9 ou A et F. Exemple : C1.';
      feedback.className = 'hack-feedback is-error';
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.value = raw; input.removeAttribute('aria-invalid');
    const value = parseInt(raw, 16);
    // Load the genuine demo, change one byte in the isolated CPU's memory,
    // and execute its actual LDA, JSR ECHO and simplified BRK instructions.
    cpu.load(initial, 0x0300);
    cpu.memory[0x0301] = value;
    for (let i = 0; i < 10 && !cpu.halted; i++) cpu.step();
    const text = cpu.screen;
    output.replaceChildren(document.createTextNode(text || '—'));
    const cursor = document.createElement('i'); cursor.textContent = '▍'; output.append(cursor);
    output.setAttribute('aria-label', 'Après : ' + (text || 'aucune lettre affichée'));
    lastValue = value;
    if (text === 'B') {
      feedback.textContent = 'Bravo ! Le tiroir contient C2 : le processeur a affiché B.';
      feedback.className = 'hack-feedback is-success';
    } else {
      feedback.textContent = text ? `Le code ${hex(value)} affiche « ${text} ». Cherche encore pour obtenir B.` : `Le code ${hex(value)} ne donne pas de lettre visible ici. Essaie une autre valeur.`;
      feedback.className = 'hack-feedback';
    }
  };
  find('hack-run').addEventListener('click', run);
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); run(); } });
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); if (lastValue !== null) { feedback.textContent = 'Ta nouvelle valeur sera utilisée au prochain test.'; feedback.className = 'hack-feedback'; } });
  find('hack-reset').addEventListener('click', () => {
    cpu.load(initial, 0x0300); lastValue = null; input.value = 'C1'; input.removeAttribute('aria-invalid');
    output.replaceChildren(document.createTextNode('?')); const cursor=document.createElement('i');cursor.textContent='▍';output.append(cursor); output.setAttribute('aria-label', 'Après : en attente');
    feedback.className='hack-feedback'; feedback.textContent='À toi de jouer : modifie le tiroir $0301.';
  });
}
