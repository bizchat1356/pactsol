document
  .querySelectorAll('.site-header__mobile-nav a')
  .forEach((link) => {
    link.addEventListener('click', () => {
      const menu = link.closest('.site-header__mobile-menu');

      if (menu) {
        menu.removeAttribute('open');
      }
    });
  });