/**
 * nav.js — comportamento de navegação:
 *  - abre/fecha menu mobile
 *  - destaca a aba correspondente à seção visível (IntersectionObserver)
 *  - controla o dropdown do seletor de idioma (topbar)
 */

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initActiveTabOnScroll() {
  const sections = document.querySelectorAll('main [id]');
  const tabLinks = document.querySelectorAll('.tabs__item, .mobile-menu__item');
  if (!sections.length || !tabLinks.length) return;

  const setActive = (id) => {
    tabLinks.forEach((link) => {
      const match = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', match);
      if (match) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initLangDropdown(onSelect) {
  const wrapper = document.querySelector('.lang-switch');
  const button = wrapper?.querySelector('.lang-switch__button');
  const menu = wrapper?.querySelector('.lang-switch__menu');
  if (!wrapper || !button || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('[data-lang]').forEach((option) => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      onSelect(lang);
      closeMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/** Atualiza o rótulo do idioma ativo no botão/status bar e o "check" no menu */
function reflectActiveLang(lang) {
  document.querySelectorAll('[data-lang-label]').forEach((el) => {
    el.textContent = lang;
  });
  document.querySelectorAll('.lang-switch__option').forEach((opt) => {
    opt.classList.toggle('is-selected', opt.getAttribute('data-lang') === lang);
  });
}

export { initMobileMenu, initActiveTabOnScroll, initLangDropdown, reflectActiveLang };
