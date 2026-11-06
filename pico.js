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
  figure.innerHTML = '<span class="pico__halo"></span><span class="pico__shadow"></span><span class="pico__orb"><span class="pico__sheen"></span><span class="pico__face"><span class="pico__eye pico__eye--left"><i></i></span><span class="pico__eye pico__eye--right"><i></i></span><span class="pico__cheek pico__cheek--left"></span><span class="pico__cheek pico__cheek--right"></span><span class="pico__mouth"></span></span></span>';
  const bubble = document.createElement('div');
  bubble.className = 'pico__bubble';
  const label = document.createElement('span');
  label.className = 'pico__label';
  label.textContent = 'PICO';
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
