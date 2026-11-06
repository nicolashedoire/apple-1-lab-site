/** Badges record completed challenges, independently of pages opened. */
const KEY = 'apple1-lab-achievements-v1';
const allowed = new Set(['montage', 'memory', 'recipe', 'echo', 'name']);
let volatileBadges = [];
export function getAchievements() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(data)) return [...volatileBadges];
    return [...new Set([...data.filter(id => allowed.has(id)), ...volatileBadges])];
  } catch (_) { return [...volatileBadges]; }
}
/** Call only when a challenge is genuinely completed. */
export function recordAchievement(id) {
  if (!allowed.has(id)) return false;
  const badges = getAchievements();
  if (!badges.includes(id)) badges.push(id);
  volatileBadges = badges;
  try { localStorage.setItem(KEY, JSON.stringify(badges)); return true; } catch (_) { return false; }
}
