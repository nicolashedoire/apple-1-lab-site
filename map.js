/* A visual table of the real activities. The board is a playful map, not a circuit schematic. */
const STORAGE_KEY = 'apple1-lab-journey-v1';
const stops = [
  { id:'guide', href:'guide.html', label:'Les premiers mots', title:'Les secrets de la machine', text:'Avant de partir, découvre les mots qui vont nous servir.', learn:['La mémoire et ses tiroirs','Le processeur qui suit les consignes','Comment une lettre arrive à l’écran'], x:20, y:27, color:'#f9c933' },
  { id:'build', href:'montage.html', label:'Le montage', title:'Construis ton Apple‑1', text:'La carte est vide ! Choisis les pièces et découvre à quoi elles servent.', learn:['Repérer les grandes pièces','Placer le processeur et la mémoire','Réunir ce qui fait fonctionner la machine'], x:41, y:67, color:'#ff9a3c' },
  { id:'lab', href:'laboratoire.html', label:'Le laboratoire', title:'Une consigne à la fois', text:'Suis un petit programme et regarde une lettre apparaître.', learn:['Lire une consigne','Suivre le travail du processeur','Voir le résultat à l’écran'], x:67, y:30, color:'#5dceff' },
  { id:'memory', href:'memoire.html', label:'La mémoire', title:'La ville des tiroirs', text:'Change ce qu’il y a dans un tiroir et observe le message à l’écran.', learn:['Comprendre une adresse','Modifier une valeur','Voir l’effet de ton changement'], x:77, y:69, color:'#4cf69b' },
  { id:'echo', href:'enquete.html', label:'L’enquête', title:'Où va la lettre ?', text:'Suis les indices et découvre comment ECHO aide la lettre à s’afficher.', learn:['Préparer la lettre','Attendre que l’écran soit prêt','Découvrir le code de Wozniak'], x:23, y:64, color:'#d591ff' }
];

function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const test = STORAGE_KEY + '-map-check'; localStorage.setItem(test, '1'); localStorage.removeItem(test);
    const valid = new Set(stops.map(s => s.href));
    const visited = Array.isArray(data?.visited) ? [...new Set(data.visited.filter(x => valid.has(x)))] : [];
    return { visited, last: valid.has(data?.last) ? data.last : '', available:true };
  } catch { return { visited:[], last:'', available:false }; }
}

function boardArtwork() {
  const chips = [];
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 9; column++) {
      const x = 126 + column * 65, y = 92 + row * 81;
      chips.push(`<g transform="translate(${x} ${y})"><rect x="-4" y="5" width="49" height="46" rx="2" fill="#93a999" opacity=".30"/><rect x="0" y="0" width="41" height="55" rx="4" fill="#141b19" stroke="#b9cec3" stroke-opacity=".3"/><path d="M7 6h27" stroke="#87998d" stroke-opacity=".35"/></g>`);
    }
  }
  return `<svg class="amap-art" viewBox="0 0 800 470" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><pattern id="amap-grid" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M17 0H0V17" fill="none" stroke="#9fd3ad" stroke-opacity=".09"/></pattern><linearGradient id="amap-board" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#193b29"/><stop offset="1" stop-color="#0a2116"/></linearGradient></defs><rect x="20" y="16" width="760" height="438" rx="18" fill="url(#amap-board)" stroke="#526f5c" stroke-opacity=".6"/><rect x="20" y="16" width="760" height="438" rx="18" fill="url(#amap-grid)"/><path d="M74 62h644M74 398h644M79 62v330M717 62v330" fill="none" stroke="#e2c876" stroke-opacity=".35" stroke-width="2"/><g fill="#e4ca80" opacity=".6"><circle cx="51" cy="45" r="7"/><circle cx="749" cy="45" r="7"/><circle cx="51" cy="425" r="7"/><circle cx="749" cy="425" r="7"/></g>${chips.join('')}<g fill="#d7be70" opacity=".7">${Array.from({length:19},(_,i)=>`<rect x="${270+i*14}" y="434" width="8" height="18" rx="1"/>`).join('')}</g></svg>`;
}

/** Mount the chapter map into a dedicated, empty section. */
export function mountMap(container) {
  if (!container) return;
  const progress = readProgress();
  let active = Math.max(0, stops.findIndex(stop => stop.href === progress.last));
  container.classList.add('adventure-map');
  container.innerHTML = `<div class="amap-inner"><div class="amap-heading"><div><p class="amap-eyebrow">TON AVENTURE · 5 DESTINATIONS</p><h1>La carte de<br><span>tes découvertes.</span></h1><p class="amap-intro">Chaque point t’emmène vers une activité. Choisis-en un pour voir ce qui t’attend.</p></div><div class="amap-progress"><span>TON EXPLORATION</span><strong>${progress.visited.length} / ${stops.length} pages ouvertes</strong><div class="amap-progress-track" aria-hidden="true"><i style="width:${progress.visited.length / stops.length * 100}%"></i></div><small>${progress.available ? "Sur cet appareil · une page ouverte n’est pas une activité terminée." : "La progression ne peut pas être enregistrée dans ce navigateur."}</small></div></div><div class="amap-layout"><div><div class="amap-board" role="group" aria-label="Choisis une étape de l’aventure">${boardArtwork()}${stops.map((s,i)=>`<button type="button" class="amap-point" data-amap-step="${i}" style="--x:${s.x}%;--y:${s.y}%;--point:${s.color}" aria-label="Étape ${i+1} : ${s.label}" aria-pressed="false"><span>${i+1}</span></button>`).join('')}<div class="amap-board-caption">CARTE IMAGINAIRE · PAS UN SCHÉMA ÉLECTRIQUE</div></div><p class="amap-tip"><span aria-hidden="true">●</span> Pico te dit : choisis un point coloré pour découvrir l’étape.</p></div><aside class="amap-panel" aria-live="polite"><span class="amap-panel-kicker"></span><h2 class="amap-panel-title"></h2><p class="amap-panel-text"></p><span class="amap-learn-label">TU VAS DÉCOUVRIR</span><ul class="amap-learn"></ul><div class="amap-panel-status"></div><a class="amap-go" href="#">Ouvrir l’activité <span aria-hidden="true">→</span></a></aside></div><div class="amap-bottom"><div><strong>Ton aventure, à ton rythme.</strong><p>Tu peux aller d’une étape à l’autre dans l’ordre que tu veux.</p></div><a href="index.html">Retour à la machine <span aria-hidden="true">→</span></a></div></div>`;
  const buttons = [...container.querySelectorAll('[data-amap-step]')];
  const byClass = name => container.querySelector(`.${name}`);
  function select(index) {
    if (!Number.isInteger(index) || index < 0 || index >= stops.length) return;
    active = index;
    const stop = stops[active];
    buttons.forEach((button, i) => { button.setAttribute('aria-pressed', String(i === active)); button.classList.toggle('is-active', i === active); });
    const panel = byClass('amap-panel');
    panel.style.setProperty('--accent', stop.color);
    byClass('amap-panel-kicker').textContent = `${String(active+1).padStart(2,'0')} · ${stop.label}`;
    byClass('amap-panel-title').textContent = stop.title;
    byClass('amap-panel-text').textContent = stop.text;
    byClass('amap-learn').replaceChildren(...stop.learn.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    byClass('amap-panel-status').textContent = progress.visited.includes(stop.href) ? 'Tu as déjà ouvert cette page.' : 'Cette page est à découvrir.';
    const link = byClass('amap-go');
    link.href = stop.href;
    link.innerHTML = `${progress.last === stop.href ? 'Reprendre l’activité' : 'Ouvrir l’activité'} <span aria-hidden="true">→</span>`;
    link.setAttribute('aria-label', `${progress.last === stop.href ? 'Reprendre' : 'Ouvrir'} : ${stop.label}`);
  }
  buttons.forEach(button => button.addEventListener('click', () => select(Number(button.dataset.amapStep))));
  select(active);
}
