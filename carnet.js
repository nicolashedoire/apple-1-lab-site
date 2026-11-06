import { getAchievements } from './achievements.js';
const KEY = 'apple1-lab-journey-v1';
const pages = [
  { href: 'guide.html', name: 'Les premiers mots', detail: 'Comprends comment la machine fonctionne.' },
  { href: 'montage.html', name: 'Le montage', detail: 'Découvre les pièces de l’Apple‑1.' },
  { href: 'laboratoire.html', name: 'Le laboratoire', detail: 'Suis une consigne à la fois.' },
  { href: 'memoire.html', name: 'La mémoire', detail: 'Change une case et observe le résultat.' },
  { href: 'enquete.html', name: 'L’enquête', detail: 'Suis le voyage d’une lettre.' },
  { href: 'prenom.html', name: 'Ton programme', detail: 'Écris ton prénom en code.' }
];
const allowed = new Set(pages.map(page => page.href));
let storageAvailable = true;
function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    const visited = Array.isArray(data?.visited) ? [...new Set(data.visited.filter(item => allowed.has(item)))] : [];
    return { visited, last: allowed.has(data?.last) ? data.last : '' };
  } catch (_) {
    storageAvailable = false;
    return { visited: [], last: '' };
  }
}
const badges = [
  { id:'montage', title:'Petit bâtisseur', detail:'Place toutes les pièces dans l’atelier.', href:'montage.html' },
  { id:'memory', title:'Clé des tiroirs', detail:'Change le code pour afficher B.', href:'memoire.html' },
  { id:'recipe', title:'Chef des consignes', detail:'Compose et exécute la recette qui affiche OK.', href:'laboratoire.html#recipe' },
  { id:'echo', title:'Œil de détective', detail:'Trouve pourquoi ECHO attend.', href:'enquete.html' },
  { id:'name', title:'Premier programme', detail:'Fais afficher ton prénom par la machine.', href:'prenom.html' }
];
const activityList = document.getElementById('notebook-activities');
const resetButton = document.getElementById('notebook-reset');
const status = document.getElementById('notebook-reset-status');
function render() {
  const data = readProgress();
  document.getElementById('notebook-count').innerHTML = `${data.visited.length} <small>/ ${pages.length}</small>`;
  document.getElementById('notebook-count-label').textContent = storageAvailable ? 'pages ouvertes' : 'pages enregistrées indisponibles';
  document.getElementById('notebook-progress-bar').style.width = `${data.visited.length / pages.length * 100}%`;
  document.getElementById('notebook-storage-note').textContent = storageAvailable ? 'Sur cet appareil. Une page ouverte ne signifie pas qu’elle est terminée.' : 'La progression ne peut pas être lue dans ce navigateur. Les activités restent accessibles.';
  const resume = document.getElementById('notebook-resume');
  const last = pages.find(page => page.href === data.last);
  resume.href = last?.href || 'guide.html';
  resume.innerHTML = `${last ? 'Reprendre : ' + last.name : 'Commencer l’aventure'} <span aria-hidden="true">→</span>`;
  activityList.replaceChildren(...pages.map((page, index) => {
    const link = document.createElement('a');
    link.className = 'notebook-activity';
    link.href = page.href;
    const seen = data.visited.includes(page.href);
    link.innerHTML = `<span class="notebook-number">${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}</span><strong>${page.name}</strong><p>${page.detail}</p><span class="notebook-state${seen ? ' seen' : ''}">${seen ? 'PAGE OUVERTE' : 'À DÉCOUVRIR'} <span aria-hidden="true">↗</span></span>`;
    return link;
  }));
  const earned = getAchievements();
  document.getElementById('notebook-badges-note').textContent = storageAvailable ? 'Les badges sont gardés sur cet appareil, séparément des pages ouvertes.' : 'Ce navigateur ne permet pas de conserver les badges entre les pages.';
  document.getElementById('notebook-badges').replaceChildren(...badges.map((badge, index) => {
    const link = document.createElement('a');
    const done = earned.includes(badge.id);
    link.href = badge.href;
    link.className = 'notebook-badge' + (done ? ' earned' : '');
    link.innerHTML = `<span class="notebook-badge-icon" aria-hidden="true">${done ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>${badge.title}</strong><p>${badge.detail}</p><span class="notebook-badge-state">${done ? 'DÉFI RÉUSSI' : 'À DÉCOUVRIR'} <span aria-hidden="true">↗</span></span>`;
    return link;
  }));
  resetButton.disabled = !storageAvailable || !data.visited.length;
}
resetButton.addEventListener('click', () => {
  try {
    localStorage.removeItem(KEY);
    status.textContent = 'Les pages ouvertes ont été effacées sur cet appareil.';
    render();
  } catch (_) {
    status.textContent = 'Impossible d’effacer la progression dans ce navigateur.';
  }
});
render();
