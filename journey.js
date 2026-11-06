/** A local, optional record of pages opened. It does not claim activity completion. */
const KEY = 'apple1-lab-journey-v1';
const CHAPTERS = [
  { href:'guide.html', name:'Les premiers mots', title:'Comprendre la machine', text:'Découvre la mémoire, le processeur et l’écran.', art:'machine' },
  { href:'montage.html', name:'Le montage', title:'Construire l’Apple-1', text:'Choisis les pièces et place-les sur la carte.', art:'montage' },
  { href:'laboratoire.html', name:'Le laboratoire', title:'Suivre une consigne', text:'Regarde comment une lettre arrive à l’écran.', art:'instruction' },
  { href:'memoire.html', name:'La mémoire', title:'Changer un message', text:'Modifie une case et observe le résultat.', art:'memoire' },
  { href:'enquete.html', name:'L’enquête', title:'Suivre la lettre', text:'Découvre le secret du petit programme ECHO.', art:'enquete' },
  { href:'prenom.html', name:'Ton programme', title:'Écrire ton prénom', text:'Crée un programme et regarde ton prénom à l’écran.', art:'prenom' }
];
const byHref = new Map(CHAPTERS.map(item => [item.href, item]));
let volatileState = { visited: [], last: '' };
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data && Array.isArray(data.visited)) return { visited: [...new Set(data.visited.filter(x => byHref.has(x)))], last: byHref.has(data.last) ? data.last : '' };
  } catch (_) { /* The journey works even if storage is unavailable. */ }
  return volatileState;
}
function save(state) {
  volatileState = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (_) { return false; }
}
export function trackJourney() {
  const part = location.pathname.split('/').pop();
  const page = part && !part.includes('.') ? `${part}.html` : part;
  if (!byHref.has(page)) return;
  const data = load();
  if (!data.visited.includes(page)) data.visited.push(page);
  data.last = page;
  save(data);
}

export function mountJourney(container) {
  if (!container) return;
  container.classList.add('journey');
  container.setAttribute('aria-labelledby', 'journey-title');
  container.innerHTML = `<div class="journey-inner"><div class="journey-heading"><h2 id="journey-title">Une machine.<br><span>Plein de découvertes.</span></h2><p class="journey-lead">Comprends, construis, puis essaie. Tu peux explorer à ton rythme, dans l’ordre que tu veux.</p></div><div class="journey-cards">${CHAPTERS.map(item => `<a class="journey-card" href="${item.href}"><div class="journey-card-art"><img src="assets/journey/${item.art}.png" alt="" loading="lazy" decoding="async"></div><div class="journey-card-copy"><h3>${item.title}</h3><p>${item.text}</p><span class="journey-card-cta">Explorer <span aria-hidden="true">→</span></span></div></a>`).join('')}</div></div>`;
}
