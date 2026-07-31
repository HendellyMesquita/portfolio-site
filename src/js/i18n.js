/**
 * i18n.js — internacionalização simples, sem dependências.
 *
 * Idiomas suportados: pt-BR (padrão), en-GB, es-ES
 * Arquivos de tradução em /locales/<lang>.json
 *
 * Uso no HTML:
 *   <h1 data-i18n="hero.title"></h1>                → define textContent
 *   <p data-i18n-html="about.bio"></p>               → define innerHTML (permite <strong> etc.)
 *   <input data-i18n-attr="placeholder:contact.form.namePlaceholder">
 *   <a data-i18n-attr="aria-label:nav.homeAria">      → múltiplos: separados por ";"
 */

const SUPPORTED_LANGS = ['pt-BR', 'en-GB', 'es-ES'];
const DEFAULT_LANG = 'pt-BR';
const STORAGE_KEY = 'portfolio:lang';

let currentTranslations = {};
let currentLang = DEFAULT_LANG;

/** Resolve o idioma inicial: localStorage > idioma do navegador > padrão */
function detectInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

  const browserLangs = navigator.languages || [navigator.language || DEFAULT_LANG];

  for (const raw of browserLangs) {
    const lower = raw.toLowerCase();
    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('en')) return 'en-GB';
    if (lower.startsWith('es')) return 'es-ES';
  }
  return DEFAULT_LANG;
}

/** Busca um valor aninhado a partir de uma chave "a.b.c" */
function resolveKey(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

async function loadTranslations(lang) {
  const res = await fetch(`locales/${lang}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Falha ao carregar locales/${lang}.json (${res.status})`);
  return res.json();
}

function applyTranslations() {
  // Texto simples
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolveKey(currentTranslations, key);
    if (value !== undefined) el.textContent = value;
  });

  // HTML (para trechos com marcação simples, ex: <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const value = resolveKey(currentTranslations, key);
    if (value !== undefined) el.innerHTML = value;
  });

  // Atributos (placeholder, aria-label, title, etc.)
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const rules = el.getAttribute('data-i18n-attr').split(';').map((r) => r.trim()).filter(Boolean);
    rules.forEach((rule) => {
      const [attr, key] = rule.split(':').map((s) => s.trim());
      const value = resolveKey(currentTranslations, key);
      if (attr && value !== undefined) el.setAttribute(attr, value);
    });
  });

  document.documentElement.setAttribute('lang', currentLang);

  const metaTitle = resolveKey(currentTranslations, 'meta.title');
  const metaDesc = resolveKey(currentTranslations, 'meta.description');
  if (metaTitle) document.title = metaTitle;
  if (metaDesc) {
    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', metaDesc);
  }

  document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: currentLang } }));
}

/** Troca de idioma em runtime, sem recarregar a página */
async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

  try {
    currentTranslations = await loadTranslations(lang);
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
  } catch (err) {
    console.error('[i18n] erro ao trocar idioma:', err);
    if (lang !== DEFAULT_LANG) await setLanguage(DEFAULT_LANG);
  }
}

async function initI18n() {
  const initialLang = detectInitialLang();
  await setLanguage(initialLang);
}

function getCurrentLang() {
  return currentLang;
}

export { initI18n, setLanguage, getCurrentLang, SUPPORTED_LANGS };
