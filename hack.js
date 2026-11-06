import { recordAchievement } from './achievements.js';
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
        <div><span class="hack-eyebrow">MISSION 01 · JEU DANS UNE MACHINE SIMULÉE</span><h3>Change la lettre<br><span>en modifiant la mémoire.</span></h3></div>
        <p>Un petit programme affiche la lettre <b>A</b>. Ta mission : modifier une case de sa mémoire pour lui faire afficher <b>B</b>.</p>
      </div>
      <div class="hack-walkthrough" aria-label="Comment jouer">
        <div><span>1</span><p><b>Trouve la case bleue</b><br>Elle contient <code>C1</code>, le code de A dans ce jeu.</p></div>
        <div><span>2</span><p><b>Change son contenu</b><br>Choisis un code dans le dictionnaire ou écris-le dans la case.</p></div>
        <div><span>3</span><p><b>Lance le programme</b><br>Clique sur « Tester » et regarde l’écran après.</p></div>
      </div>
      <div class="hack-workspace">
        <div class="hack-memory">
          <div class="hack-label"><span>01 &nbsp; LA MÉMOIRE</span><span>LES CASES DU PROGRAMME</span></div>
          <p>La mémoire ressemble à une rangée de tiroirs. Chaque tiroir a un numéro pour le retrouver. La case bleue contient le code de la lettre.</p>
          <div class="hack-cells" aria-label="Cases de la mémoire">
            <div class="hack-cell"><span>$0300</span><b>A9</b><small>consigne</small></div>
            <div class="hack-cell hack-cell-edit"><label for="hack-value">$0301 <span>À MODIFIER</span></label><input id="hack-value" value="C1" inputmode="text" maxlength="2" spellcheck="false" autocomplete="off" aria-describedby="hack-help"><small>lettre à afficher</small></div>
            <div class="hack-cell"><span>$0302</span><b>20</b><small>consigne</small></div>
            <div class="hack-cell"><span>$0303</span><b>EF</b><small>adresse</small></div>
            <div class="hack-cell"><span>$0304</span><b>FF</b><small>adresse</small></div>
            <div class="hack-cell"><span>$0305</span><b>00</b><small>fin</small></div>
          </div>
          <p id="hack-help" class="hack-help">Choisis un code ou écris-le dans la case bleue, puis appuie sur « Tester ma modification ».</p>
          <div class="hack-dictionary"><strong>Le dictionnaire des lettres</strong><p>Choisis un code : il se range dans le tiroir bleu.</p><div class="hack-code-options" aria-label="Codes des lettres"><button type="button" data-letter-code="C1"><b>A</b><small>193 en nombre<span>$C1 en code</span></small></button><button type="button" data-letter-code="C2"><b>B</b><small>194 en nombre<span>$C2 en code</span></small></button><button type="button" data-letter-code="C3"><b>C</b><small>195 en nombre<span>$C3 en code</span></small></button></div><p class="hack-code-note">193 et $C1 sont deux façons d’écrire le même nombre. Le signe $ indique l’écriture hexadécimale.</p></div><details class="hack-words"><summary>Que veulent dire ces codes ?</summary><p>Un <b>octet</b>, c’est une petite quantité d’information que l’ordinateur peut ranger dans un tiroir. Ici, on l’écrit avec deux signes comme <code>C1</code>.</p><p>On utilise 16 signes : <code>0 à 9</code>, puis <code>A à F</code>. Cette façon d’écrire s’appelle l’<b>hexadécimal</b>. Le signe <code>$</code> devant un numéro indique cette écriture : <code>$0301</code> est l’adresse, c’est-à-dire le numéro du tiroir.</p><p>Dans ce programme, l’Apple-1 reconnaît <code>C1</code> comme A et <code>C2</code> comme B. Tu peux aussi essayer <code>C3</code>.</p></details>
          <div class="hack-actions"><button class="hack-run" id="hack-run" type="button">Tester ma modification <span>→</span></button><button class="hack-reset" id="hack-reset" type="button">Recommencer</button></div>
          <div class="hack-feedback" id="hack-feedback" role="status" aria-live="polite">Commence par cliquer dans la case bleue : c’est le tiroir $0301.</div>
          <details class="hack-hint"><summary>Un indice ?</summary><p>Le code de <b>A</b> est <code>C1</code>. Pour obtenir <b>B</b>, avance d’un cran : quel nombre vient après 1 ?</p><details><summary>Voir la solution</summary><p>Écris <code>C2</code> dans le tiroir <code>$0301</code>, puis teste.</p></details></details>
        </div>
        <div class="hack-display">
          <div class="hack-label"><span>02 &nbsp; LE RÉSULTAT</span><span>ÉCRAN SIMULÉ</span></div>
          <div class="hack-comparison"><div><span>AVANT</span><div class="hack-screen" aria-label="Avant : A">A<i>▍</i></div></div><div class="hack-transition" aria-hidden="true">→</div><div><span>APRÈS</span><div class="hack-screen" id="hack-output" aria-label="Après : en attente">?<i>▍</i></div></div></div>
          <div class="hack-explain"><strong>Comment ça marche ?</strong><p>Le processeur est la partie qui suit les consignes. Il prend le code dans la case bleue, puis demande à l’écran de montrer la lettre correspondante. Si tu changes le code, tu changes le résultat.</p></div>
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
      feedback.textContent = 'Il faut deux signes : utilise les chiffres de 0 à 9 ou les lettres de A à F. Par exemple : C2.';
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
      recordAchievement('memory');
      feedback.textContent = 'Bravo ! Tu as remplacé C1 par C2 : le programme a affiché B. Essaie maintenant C3 pour voir ce qui se passe.';
      feedback.className = 'hack-feedback is-success';
    } else {
      feedback.textContent = text ? `Le code ${hex(value)} affiche « ${text} ». Cherche encore pour obtenir B.` : `Le code ${hex(value)} ne donne pas de lettre visible ici. Essaie une autre valeur.`;
      feedback.className = 'hack-feedback';
    }
  };
  container.querySelectorAll('[data-letter-code]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.letterCode; input.removeAttribute('aria-invalid'); feedback.textContent = `Le code ${input.value} est rangé dans le tiroir. Maintenant, clique sur « Tester ma modification ».`; feedback.className = 'hack-feedback'; }));
  find('hack-run').addEventListener('click', run);
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); run(); } });
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); if (lastValue !== null) { feedback.textContent = 'C’est noté. Clique sur « Tester ma modification » pour voir le résultat.'; feedback.className = 'hack-feedback'; } });
  find('hack-reset').addEventListener('click', () => {
    cpu.load(initial, 0x0300); lastValue = null; input.value = 'C1'; input.removeAttribute('aria-invalid');
    output.replaceChildren(document.createTextNode('?')); const cursor=document.createElement('i');cursor.textContent='▍';output.append(cursor); output.setAttribute('aria-label', 'Après : en attente');
    feedback.className='hack-feedback'; feedback.textContent='Commence par cliquer dans la case bleue : c’est le tiroir $0301.';
  });
}
