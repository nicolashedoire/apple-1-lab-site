/** A local, optional record of pages opened. It does not claim activity completion. */
const KEY = 'apple1-lab-journey-v1';
const CHAPTERS = [
  { href:'guide.html', name:'Les premiers mots', title:'Comprendre la machine', text:'Découvre la mémoire, le processeur et l’écran.', art:'learn' },
  { href:'montage.html', name:'Le montage', title:'Construire l’Apple-1', text:'Choisis les pièces et place-les sur la carte.', art:'build' },
  { href:'laboratoire.html', name:'Le laboratoire', title:'Suivre une consigne', text:'Regarde comment une lettre arrive à l’écran.', art:'step' },
  { href:'memoire.html', name:'La mémoire', title:'Changer un message', text:'Modifie une case et observe le résultat.', art:'memory' },
  { href:'enquete.html', name:'L’enquête', title:'Suivre la lettre', text:'Découvre le secret du petit programme ECHO.', art:'echo' }
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
function canSave() {
  try { const test = KEY + '-check'; localStorage.setItem(test, '1'); localStorage.removeItem(test); return true; } catch (_) { return false; }
}
export function trackJourney() {
  const page = location.pathname.split('/').pop();
  if (!byHref.has(page)) return;
  const data = load();
  if (!data.visited.includes(page)) data.visited.push(page);
  data.last = page;
  save(data);
}

export function mountJourney(container) {
  if (!container) return;
  const state = load();
  const enabled = canSave();
  const hasLast = !!state.last;
  const progress = enabled ? `${state.visited.length} / ${CHAPTERS.length} pages ouvertes` : 'Choisis par où commencer';
  const resume = hasLast ? `Reprendre : ${byHref.get(state.last).name}` : 'Commencer par les premiers mots';
  const next = hasLast ? state.last : CHAPTERS[0].href;
  container.classList.add('journey');
  container.setAttribute('aria-labelledby', 'journey-title');
  container.innerHTML = `<div class="journey-inner"><div class="journey-heading"><div><p class="journey-eyebrow">TON PARCOURS · 5 ÉTAPES</p><h2 id="journey-title">Une machine.<br><span>Plein de découvertes.</span></h2><p class="journey-lead">Comprends, construis, puis essaie. Tu peux explorer à ton rythme, dans l’ordre que tu veux.</p></div><div class="journey-progress"><span class="journey-progress-label">TON EXPLORATION</span><strong>${progress}</strong><div class="journey-progress-track" aria-hidden="true"><i style="width:${state.visited.length / CHAPTERS.length * 100}%"></i></div><small>${enabled ? 'Gardée sur cet appareil.' : 'La progression ne peut pas être enregistrée ici.'}</small><a class="journey-resume" href="${next}">${resume}<span aria-hidden="true">→</span></a></div></div><div class="journey-cards">${CHAPTERS.map((item, index) => {
    const seen = state.visited.includes(item.href);
    return `<a class="journey-card journey-card-${item.art}" href="${item.href}"><div class="journey-card-top"><span>${String(index+1).padStart(2,'0')} / ${item.name}</span><span class="journey-card-state">${seen ? 'DÉJÀ OUVERTE' : 'À DÉCOUVRIR'}</span></div><div class="journey-card-art journey-art-${item.art}" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="journey-card-copy"><h3>${item.title}</h3><p>${item.text}</p><span class="journey-card-cta">Explorer <b>→</b></span></div></a>`;
  }).join('')}</div><p class="journey-privacy">Les pages s’ouvrent librement. Le compteur indique les pages visitées, pas des activités terminées.</p></div>`;
}
