import { mountPico } from './pico.js';
import { trackJourney, mountJourney } from './journey.js?v=2';

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

if (document.getElementById('map-root')) import('./map.js').then(({mountMap})=>mountMap(document.getElementById('map-root'))).catch(()=>{document.getElementById('map-root').textContent='La carte est indisponible. Les activités restent accessibles depuis le menu.'});
if (document.getElementById('recipe')) import('./recipe.js').then(({mountRecipe})=>mountRecipe(document.getElementById('recipe'))).catch(()=>{document.getElementById('recipe').textContent='Le jeu de recettes est momentanément indisponible.'});

async function setupPico3D(host, variant) {
  const figure = host.querySelector('.pico__figure');
  if (!figure) return;
  try {
    const { mountPico3D } = await import('./pico3d.js?v=5');
    const controls = document.getElementById('pico-actions');
    const player = mountPico3D(figure, { variant, onReady: () => { if (variant === 'hero' && controls) controls.hidden = false; } });
    if (variant === 'hero' && controls) {
      let walkAnimation = null;
      controls.querySelectorAll('[data-pico-action]').forEach(button => button.addEventListener('click', () => {
        const action = button.dataset.picoAction;
        if (walkAnimation) { walkAnimation.cancel(); walkAnimation = null; }
        player.setAction?.(action);
        if (action === 'walk' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof host.animate === 'function') {
          const screen = host.closest('.intro-screen');
          const text = screen?.querySelector('.terminal-text');
          let textRight = screen?.getBoundingClientRect().left || 0;
          if (text) {
            for (const node of text.childNodes) {
              if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const rect of range.getClientRects()) textRight = Math.max(textRight, rect.right);
            }
            const cursor = text.querySelector('.terminal-cursor');
            if (cursor) textRight = Math.max(textRight, cursor.getBoundingClientRect().right);
          }
          const actorLeft = host.getBoundingClientRect().left;
          // Keep a clear gap between Pico and every visible line of text.
          const distance = Math.max(0, Math.min((screen?.clientWidth || 0) * .50, actorLeft - textRight - 18));
          walkAnimation = host.animate([{transform:'translateX(0)'},{transform:`translateX(-${distance}px)`,offset:.43},{transform:`translateX(-${distance}px)`,offset:.51},{transform:'translateX(0)',offset:.94},{transform:'translateX(0)'}], {duration:5400,easing:'ease-in-out'});
          walkAnimation.onfinish = () => { walkAnimation = null; player.setAction?.('look'); };
        }
      }));
    }
  } catch (_) { /* The existing CSS character is the graceful fallback. */ }
}
