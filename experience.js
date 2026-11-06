import { mountPico } from './pico.js?v=3';
import { trackJourney, mountJourney } from './journey.js?v=4';

trackJourney();
const hero = document.getElementById('pico-hero');
if (hero) {
  mountPico(hero, { variant: 'hero' });
  setupPico3D(hero, 'hero');
}
mountJourney(document.getElementById('voyage'));

const part = location.pathname.split('/').pop();
const current = part && !part.includes('.') ? `${part}.html` : part;
const hints = {
  'carnet.html': 'Ici, retrouve tes pages ouvertes et les mots de l’ordinateur.',
  'prenom.html': 'On va préparer une recette pour afficher ton prénom !',
  'carte.html': 'Chaque point est une aventure. Choisis celui qui t’intrigue !',
  'guide.html': 'On commence doucement. Je te présente les mots qui vont nous servir.',
  'montage.html': 'Choisis une pièce, puis place-la sur la carte. Je reste avec toi !',
  'laboratoire.html': 'Appuie sur « Étape suivante » : on va suivre les consignes ensemble.',
  'memoire.html': 'Une petite case peut changer une lettre. Tu veux essayer ?',
  'enquete.html': 'Une lettre a un chemin à parcourir. Suis les indices avec moi.'
};
if (hints[current]) {
  const box = document.createElement('aside');
  box.className = 'page-pico';
  box.setAttribute('aria-label', 'Un conseil de Pico');
  const main = document.querySelector('main');
  if (main) { main.before(box); mountPico(box, { variant: 'compact', message: hints[current] }); setupPico3D(box, 'compact'); }
}

if (document.getElementById('map-root')) import('./map.js?v=3').then(({mountMap})=>mountMap(document.getElementById('map-root'))).catch(()=>{document.getElementById('map-root').textContent='La carte est indisponible. Les activités restent accessibles depuis le menu.'});
if (document.getElementById('recipe')) import('./recipe.js?v=4').then(({mountRecipe})=>mountRecipe(document.getElementById('recipe'))).catch(()=>{document.getElementById('recipe').textContent='Le jeu de recettes est momentanément indisponible.'});

async function setupPico3D(host, variant) {
  const figure = host.querySelector('.pico__figure');
  if (!figure) return;
  try {
    const { mountPico3D } = await import('./pico3d.js?v=6');
    const controls = document.getElementById('pico-actions');
    const player = mountPico3D(figure, { variant, onError: () => figure.classList.add('pico3d-failed'), onReady: () => { if (variant === 'hero' && controls) controls.hidden = false; } });
    if (variant === 'hero' && controls) controls.querySelectorAll('[data-pico-action]').forEach(button => button.addEventListener('click', () => player.setAction?.(button.dataset.picoAction)));
  } catch (_) { figure.classList.add('pico3d-failed'); }
}

const correctEcho = document.getElementById('echo-correct');
if (correctEcho) correctEcho.addEventListener('toggle', () => { if (correctEcho.open) import('./achievements.js').then(({recordAchievement}) => recordAchievement('echo')).catch(() => {}); });
