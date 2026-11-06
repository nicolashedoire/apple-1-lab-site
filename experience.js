import { trackJourney, mountJourney } from './journey.js?v=5';

trackJourney();
mountJourney(document.getElementById('voyage'));

if (document.getElementById('map-root')) import('./map.js?v=5').then(({mountMap})=>mountMap(document.getElementById('map-root'))).catch(()=>{document.getElementById('map-root').textContent='La carte est indisponible. Les activités restent accessibles depuis le menu.'});
if (document.getElementById('recipe')) import('./recipe.js?v=4').then(({mountRecipe})=>mountRecipe(document.getElementById('recipe'))).catch(()=>{document.getElementById('recipe').textContent='Le jeu de recettes est momentanément indisponible.'});

const correctEcho = document.getElementById('echo-correct');
if (correctEcho) correctEcho.addEventListener('toggle', () => { if (correctEcho.open) import('./achievements.js').then(({recordAchievement}) => recordAchievement('echo')).catch(() => {}); });
