( function(){
    const navToggle = document.getElementById('navToggle');
    const menu = document.getElementById('primaryMenu');
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', String(expanded)); // inverte
      if (!expanded) {
        const first = menu.querySelector('[role="menuitem"]');
        if (first) first.focus();
      } else {
        navToggle.focus();
      }
    });
    const dropdowns = Array.from(document.querySelectorAll('.dropdown'));
    dropdowns.forEach(drop => {
      const btn = drop.querySelector('.dropdown-toggle');
      const menuEl = drop.querySelector('.dropdown-menu');

      btn.addEventListener('click', (e) => {
        const isOpen = drop.classList.contains('open');
        // close all
        dropdowns.forEach(d => d.classList.remove('open'));
        dropdowns.forEach(d => d.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded','false'));
        if (!isOpen) {
          drop.classList.add('open');
          btn.setAttribute('aria-expanded','true');
          // focus first menu item
          const first = menuEl.querySelector('[role="menuitem"]');
          if (first) first.focus();
        } else {
          drop.classList.remove('open');
          btn.setAttribute('aria-expanded','false');
        }
      });

      // Keyboard handling for Esc to close
      drop.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape') {
          drop.classList.remove('open');
          btn.setAttribute('aria-expanded','false');
          btn.focus();
        }
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav')) {
        dropdowns.forEach(d => {
          d.classList.remove('open');
          d.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded','false');
        });
      }
    });

    // Close menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (menu.classList.contains('open')) {
          menu.classList.remove('open');
          navToggle.setAttribute('aria-expanded','false');
          menu.setAttribute('aria-hidden','true');
          navToggle.focus();
        }
      }
    });
  })();
