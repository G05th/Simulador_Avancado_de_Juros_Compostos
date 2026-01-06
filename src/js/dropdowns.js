// NAV + DROPDOWN behaviour (place inside ../js/dropdowns.js or ../js/main.js)
(function () {
  const NAV_BREAKPOINT = 1118;
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (!navToggle || !navMenu) return;

  // Ensure aria attributes exist
  if (!navToggle.hasAttribute('aria-expanded')) navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-controls', 'nav-menu');

  // Toggle mobile menu
  navToggle.addEventListener('click', (e) => {
    const opened = navMenu.classList.toggle('show-menu');
    navToggle.classList.toggle('show-icon', opened);
    navToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    // lock background scroll when open on mobile
    document.documentElement.style.overflow = opened ? 'hidden' : '';
    document.body.style.overflow = opened ? 'hidden' : '';
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!navMenu.classList.contains('show-menu')) return;
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navMenu.classList.remove('show-menu');
      navToggle.classList.remove('show-icon');
      navToggle.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (navMenu.classList.contains('show-menu')) {
        navMenu.classList.remove('show-menu');
        navToggle.classList.remove('show-icon');
        navToggle.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
      // also close any opened dropdowns
      document.querySelectorAll('.dropdown__item.open, .dropdown__subitem.open').forEach(d => d.classList.remove('open'));
    }
  });

  // Close/hide menu when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > NAV_BREAKPOINT) {
      if (navMenu.classList.contains('show-menu')) {
        navMenu.classList.remove('show-menu');
        navToggle.classList.remove('show-icon');
        navToggle.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    }
  });

  // DROPDOWN click behavior for mobile (and keyboard)
  document.querySelectorAll('.dropdown__item, .dropdown__subitem').forEach(item => {
    const toggle = item.querySelector('.nav__link, .dropdown__link');
    const menu = item.querySelector('.dropdown__menu, .dropdown__submenu');

    if (!toggle || !menu) return;

    // On mobile / small screens, we want click-to-toggle
    toggle.addEventListener('click', (ev) => {
      if (window.innerWidth <= NAV_BREAKPOINT) {
        ev.preventDefault();
        const opening = !item.classList.contains('open');
        // close sibling dropdowns at same level for better UX
        const parent = item.parentElement;
        parent && parent.querySelectorAll(':scope > .dropdown__item.open, :scope > .dropdown__subitem.open').forEach(sib => {
          if (sib !== item) {
            sib.classList.remove('open');
            const sibMenu = sib.querySelector('.dropdown__menu, .dropdown__submenu');
            if (sibMenu) sibMenu.style.maxHeight = null;
          }
        });
        item.classList.toggle('open', opening);
        if (opening) {
          // set explicit height for smooth animation
          menu.style.maxHeight = menu.scrollHeight + 'px';
        } else {
          menu.style.maxHeight = null;
        }
      }
    });
  });

  // Prevent focus trap: when opening menu, focus first link
  navToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navToggle.click();
    }
  });
})();
