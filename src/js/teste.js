(function(){
  const navToggle = document.getElementById('navToggle');
  const primaryMenu = document.getElementById('primaryMenu');
  const overlay = document.getElementById('navOverlay');
  const dropdownToggles = Array.from(document.querySelectorAll('.dropdown-toggle'));
  const NAV_OPEN_CLASS = 'open';

  if (!primaryMenu || !navToggle || !overlay) return;

  // Inicial estado ARIA
  primaryMenu.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');

  /* abrir / fechar menu mobile */
  function openMobileMenu(){
    primaryMenu.classList.add(NAV_OPEN_CLASS);
    overlay.classList.add('visible');
    primaryMenu.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');

    // focus no primeiro item navegável
    const first = primaryMenu.querySelector('[role="menuitem"], a, button');
    if(first) first.focus();

    // Evita scroll do body
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu(){
    primaryMenu.classList.remove(NAV_OPEN_CLASS);
    overlay.classList.remove('visible');
    primaryMenu.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');

    // fecha dropdowns internos
    dropdownToggles.forEach(bt => closeDropdown(bt));

    // Restaura scroll do body
    document.body.style.overflow = '';
    // retorna foco para o toggle
    navToggle.focus();
  }
  function toggleMobileMenu(){ primaryMenu.classList.contains(NAV_OPEN_CLASS) ? closeMobileMenu() : openMobileMenu(); }

  /* dropdowns */
  function openDropdown(button){
    const li = button.closest('.dropdown'); if(!li) return;
    li.classList.add(NAV_OPEN_CLASS);
    button.setAttribute('aria-expanded','true');
    const menu = li.querySelector('.dropdown-menu'); if(menu) menu.setAttribute('aria-hidden','false');
    const first = menu ? menu.querySelector('[role="menuitem"], a, button') : null; if(first) first.focus();
  }
  function closeDropdown(button){
    const li = button.closest('.dropdown'); if(!li) return;
    li.classList.remove(NAV_OPEN_CLASS);
    button.setAttribute('aria-expanded','false');
    const menu = li.querySelector('.dropdown-menu'); if(menu) menu.setAttribute('aria-hidden','true');
  }
  function toggleDropdown(button){ button.getAttribute('aria-expanded') === 'true' ? closeDropdown(button) : openDropdown(button); }

  /* listeners básicos */
  navToggle.addEventListener('click', toggleMobileMenu);
  // suporte teclado no toggle (Enter / Space)
  navToggle.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      toggleMobileMenu();
    }
  });

  overlay.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' || e.key === 'Esc'){
      if(primaryMenu.classList.contains(NAV_OPEN_CLASS)){ closeMobileMenu(); return; }
      dropdownToggles.forEach(bt => { if(bt.getAttribute('aria-expanded') === 'true') closeDropdown(bt); });
    }
  });

  // Clique global fecha menus apenas quando clicar FORA do nav
  document.addEventListener('click', (e)=>{
    if(e.target.closest('.nav')) return; // dentro do nav: não fecha
    dropdownToggles.forEach(bt => { if(bt.getAttribute('aria-expanded') === 'true') closeDropdown(bt); });
    if(primaryMenu.classList.contains(NAV_OPEN_CLASS)) closeMobileMenu();
  });

  /* TRATAMENTO ESPECIAL: cliques dentro do primaryMenu */
  primaryMenu.addEventListener('click', (e)=>{
    e.stopPropagation();
    const link = e.target.closest('a[href]');
    if(link){
      const shouldCloseAfter = !link.hasAttribute('data-no-close'); // use data-no-close para manter aberto
      if(shouldCloseAfter && primaryMenu.classList.contains(NAV_OPEN_CLASS)){
        // fecha após um curto delay para permitir navegação/jump
        setTimeout(()=> {
          if(primaryMenu.classList.contains(NAV_OPEN_CLASS)) closeMobileMenu();
        }, 60);
      }
      return; // permite o comportamento padrão do link
    }

    const btn = e.target.closest('.dropdown-toggle');
    if(btn){
      e.stopPropagation();
      toggleDropdown(btn);
    }
  });

  /* Dropdown buttons: inicialização & teclado */
  dropdownToggles.forEach(bt=>{
    bt.setAttribute('aria-expanded', 'false');
    const ul = bt.parentElement ? bt.parentElement.querySelector('.dropdown-menu') : null;
    if(ul) ul.setAttribute('aria-hidden', 'true');

    bt.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggleDropdown(bt); }
      if(e.key === 'ArrowDown'){ e.preventDefault(); openDropdown(bt); }
      if(e.key === 'ArrowUp'){
        e.preventDefault();
        openDropdown(bt);
        const li = bt.closest('.dropdown');
        const menu = li ? li.querySelector('.dropdown-menu') : null;
        if(menu){
          const items = Array.from(menu.querySelectorAll('[role="menuitem"], a, button'));
          if(items.length) items[items.length-1].focus();
        }
      }
    });

    // clique no botão abre/fecha
    bt.addEventListener('click', (ev)=> {
      ev.stopPropagation();
      toggleDropdown(bt);
    });
  });

  // resize: limpa estados ao cruzar breakpoint
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', ()=>{
    const curWidth = window.innerWidth;
    const breakpoint = 920;
    if((lastWidth < breakpoint && curWidth >= breakpoint) || (lastWidth >= breakpoint && curWidth < breakpoint)){
      closeMobileMenu();
      dropdownToggles.forEach(bt => closeDropdown(bt));
    }
    lastWidth = curWidth;
  });

})();
