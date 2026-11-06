const menu = document.querySelector('.site-menu');
if (menu) {
  const summary = menu.querySelector('summary');
  let openedByHover = false;
  menu.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || menu.open) return;
    menu.open = true;
    openedByHover = true;
  });
  menu.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && openedByHover) {
      menu.open = false;
      openedByHover = false;
    }
  });
  summary.addEventListener('click', event => {
    if (openedByHover) {
      event.preventDefault();
      openedByHover = false;
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) {
      menu.open = false;
      openedByHover = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      openedByHover = false;
      summary.focus();
    }
  });
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) {
      menu.open = false;
      openedByHover = false;
    }
  });
}
