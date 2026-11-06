import { mountPico } from './pico.js';
import { trackJourney, mountJourney } from './journey.js?v=2';

trackJourney();
const hero = document.getElementById('pico-hero');
if (hero) mountPico(hero, { variant: 'hero' });
mountJourney(document.getElementById('voyage'));

const part = location.pathname.split('/').pop();
const current = part && !part.includes('.') ? `${part}.html` : part;
const hints = {
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
  if (main) { main.before(box); mountPico(box, { variant: 'compact', message: hints[current] }); }
}

if (document.getElementById('map-root')) import('./map.js').then(({mountMap})=>mountMap(document.getElementById('map-root'))).catch(()=>{document.getElementById('map-root').textContent='La carte est indisponible. Les activités restent accessibles depuis le menu.'});
if (document.getElementById('recipe')) import('./recipe.js').then(({mountRecipe})=>mountRecipe(document.getElementById('recipe'))).catch(()=>{document.getElementById('recipe').textContent='Le jeu de recettes est momentanément indisponible.'});
