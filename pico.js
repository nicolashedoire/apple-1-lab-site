/**
 * Pico, a small friendly guide for Apple-1 Lab.
 *
 * mountPico(element, { message, variant }) -> { setMessage(text), destroy() }
 * variant: 'hero' (default) or 'compact'. An empty message hides the bubble.
 */
export function mountPico(container, { message = '', variant = 'hero' } = {}) {
  if (!(container instanceof Element)) throw new TypeError('Pico needs a container element.');
  const root = document.createElement('div');
  root.className = `pico pico--${variant === 'compact' ? 'compact' : 'hero'}`;

  // The face is decorative; the guide's message is ordinary readable text.
  const figure = document.createElement('div');
  figure.className = 'pico__figure';
  figure.setAttribute('aria-hidden', 'true');
  // Show the current character while the 3D model loads (or if WebGL is unavailable).
  // The images use the same 3D design, so there is no flash of the old character.
  const poster = document.createElement('img');
  poster.className = 'pico__poster';
  poster.src = new URL(variant === 'compact' ? './assets/pico-reference.png' : './assets/pico-meshy-preview.png', import.meta.url).href;
  poster.alt = '';
  poster.decoding = 'async';
  const loading = document.createElement('span');
  loading.className = 'pico__loading';
  loading.innerHTML = '<span></span><span></span><span></span>';
  figure.append(poster, loading);
  const bubble = document.createElement('div');
  bubble.className = 'pico__bubble';
  const label = document.createElement('span');
  label.className = 'pico__label';
  label.textContent = 'PIXEL';
  const text = document.createElement('p');
  text.className = 'pico__message';
  bubble.append(label, text);
  root.append(figure, bubble);
  container.append(root);

  function setMessage(value) {
    const content = typeof value === 'string' ? value : '';
    text.textContent = content;
    bubble.hidden = !content.trim();
  }
  setMessage(message);
  return { setMessage, destroy() { root.remove(); } };
}
