import { initI18n, setLanguage, getCurrentLang } from './i18n.js';
import { initMobileMenu, initActiveTabOnScroll, initLangDropdown, reflectActiveLang } from './nav.js';
import { primeTerminal } from './terminal.js';
import { updateExperienceStats } from './experience.js';
import { initContactForm } from './contact-form.js';

function setFooterYear() {
  const el = document.querySelector('[data-current-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

async function handleLangSelect(lang) {
  await setLanguage(lang);
}

document.addEventListener('i18n:applied', () => {
  reflectActiveLang(getCurrentLang());
  primeTerminal();
});

async function bootstrap() {
  setFooterYear();
  updateExperienceStats();
  initMobileMenu();
  initActiveTabOnScroll();
  initLangDropdown(handleLangSelect);
  initContactForm();
  await initI18n(); // dispara 'i18n:applied' ao concluir
}

document.addEventListener('DOMContentLoaded', bootstrap);
