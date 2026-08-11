/**
 * scripts/build.mjs
 * -----------------------------------------------------------------------
 * Gera dist/index.html a partir do index.html (template-fonte) + locales/*.json
 * + site.config.json. Fonte única de verdade continua sendo os JSONs — este
 * script só projeta esse conteúdo para dentro do HTML no momento do build,
 * do mesmo jeito que `sass:build` projeta o SCSS para CSS.
 *
 * Resolve dois problemas:
 *  1. Página em branco se o JS falhar — o idioma padrão (pt-BR) fica
 *     pré-renderizado direto no HTML.
 *  2. Troca de idioma sem depender de fetch() — os 3 locales ficam
 *     embutidos como JSON inline no próprio HTML.
 *
 * Também escreve tags de SEO (canonical, Open Graph, Twitter Card, JSON-LD,
 * robots.txt, sitemap.xml) a partir do mesmo site.config.json + locales.
 *
 * Uso: node scripts/build.mjs   (chamado por `npm run build`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TEMPLATE_PATH = path.join(ROOT, 'index.html');
const LOCALES_DIR = path.join(ROOT, 'locales');
const CONFIG_PATH = path.join(ROOT, 'site.config.json');
const DIST_DIR = path.join(ROOT, 'dist');

const SUPPORTED_LANGS = ['pt-BR', 'en-GB', 'es-ES'];
const DEFAULT_LANG = 'pt-BR';

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function resolveKey(obj, keyPath) {
  return keyPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Mesma lógica de src/js/experience.js, para pré-calcular no build */
function calculateFullYears(startDateStr, now = new Date()) {
  const start = new Date(startDateStr);
  let years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  const dayDiff = now.getDate() - start.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years -= 1;
  return Math.max(years, 0);
}

// -------------------------------------------------------------------------
// Build
// -------------------------------------------------------------------------

function build() {
  const config = loadJson(CONFIG_PATH);
  const translations = {};
  for (const lang of SUPPORTED_LANGS) {
    translations[lang] = loadJson(path.join(LOCALES_DIR, `${lang}.json`));
  }
  const dict = translations[DEFAULT_LANG];

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const root = parse(template, { comment: true });

  // 1) Pré-renderizar texto (data-i18n) -------------------------------------
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolveKey(dict, key);
    if (value !== undefined) el.innerHTML = escapeHtml(value);
  });

  // 2) Pré-renderizar HTML confiável (data-i18n-html) -----------------------
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const value = resolveKey(dict, key);
    if (value !== undefined) el.innerHTML = value; // já é HTML de confiança, vindo do nosso próprio JSON
  });

  // 3) Pré-renderizar atributos (data-i18n-attr) -----------------------------
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const rules = el.getAttribute('data-i18n-attr').split(';').map((r) => r.trim()).filter(Boolean);
    rules.forEach((rule) => {
      const [attr, key] = rule.split(':').map((s) => s.trim());
      const value = resolveKey(dict, key);
      if (attr && value !== undefined) el.setAttribute(attr, value);
    });
  });

  // 4) Anos de experiência e ano corrente (mesma lógica do experience.js) ---
  root.querySelectorAll('[data-exp-start]').forEach((el) => {
    const years = calculateFullYears(el.getAttribute('data-exp-start'));
    el.innerHTML = `${years}+`;
  });
  root.querySelectorAll('[data-current-year]').forEach((el) => {
    el.innerHTML = String(new Date().getFullYear());
  });

  // 5) <html lang>, <title>, <meta name="description"> ----------------------
  const htmlTag = root.querySelector('html');
  if (htmlTag) htmlTag.setAttribute('lang', DEFAULT_LANG);

  const metaTitle = resolveKey(dict, 'meta.title');
  const metaDesc = resolveKey(dict, 'meta.description');
  const titleTag = root.querySelector('title');
  if (titleTag && metaTitle) titleTag.innerHTML = escapeHtml(metaTitle);

  const descTag = root.querySelector('meta[name="description"]');
  if (descTag && metaDesc) descTag.setAttribute('content', metaDesc);

  // 6) SEO: canonical, Open Graph, Twitter Card, JSON-LD --------------------
  const head = root.querySelector('head');
  const siteUrl = config.siteUrl.replace(/\/$/, '');
  const ogImageUrl = `${siteUrl}/assets/social/og-image.png`;

  const seoTags = [
    `<link rel="canonical" href="${escapeAttr(siteUrl)}/" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeAttr(siteUrl)}/" />`,
    `<meta property="og:title" content="${escapeAttr(metaTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(metaDesc)}" />`,
    `<meta property="og:image" content="${escapeAttr(ogImageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:locale:alternate" content="en_GB" />`,
    `<meta property="og:locale:alternate" content="es_ES" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(metaTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(metaDesc)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />`,
  ].join('\n  ');
  head.insertAdjacentHTML('beforeend', `\n  ${seoTags}\n`);

  // JSON-LD (schema.org/Person) — a partir do idioma padrão + site.config.json
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Hendelly Mesquita',
    jobTitle: metaTitle.split('—')[1]?.trim() || metaTitle,
    url: `${siteUrl}/`,
    image: ogImageUrl,
    worksFor: {
      '@type': 'Organization',
      name: 'Invent Software',
    },
    knowsLanguage: ['pt-BR', 'es', 'en'],
    sameAs: [config.social.linkedin, config.social.github].filter(
      (url) => url && !url.includes('seu-usuario')
    ),
  };
  head.insertAdjacentHTML(
    'beforeend',
    `\n  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`
  );

  // 7) Embutir os 3 idiomas como dado inline (troca de idioma sem fetch) ----
  head.insertAdjacentHTML(
    'beforeend',
    `\n  <script id="i18n-data" type="application/json">${JSON.stringify(translations)}</script>\n`
  );

  // 8) Corrigir caminhos de asset: no template (dev) apontam para dist/css e
  //    src/js; no artefato final (dist/index.html) precisam ser relativos a
  //    ele mesmo, já que css/js são copiados para dentro de dist/.
  const cssLink = root.querySelector('link[href="dist/css/main.css"]');
  if (cssLink) cssLink.setAttribute('href', 'css/main.css');

  const scriptTag = root.querySelector('script[src="src/js/main.js"]');
  if (scriptTag) scriptTag.setAttribute('src', 'js/main.js');

  // -------------------------------------------------------------------------
  // Escrever dist/
  // -------------------------------------------------------------------------
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), root.toString());

  copyDir(path.join(ROOT, 'src/js'), path.join(DIST_DIR, 'js'));
  copyDir(LOCALES_DIR, path.join(DIST_DIR, 'locales')); // fallback redundante para fetch()
  copyDir(path.join(ROOT, 'assets'), path.join(DIST_DIR, 'assets'));

  // robots.txt + sitemap.xml
  fs.writeFileSync(
    path.join(DIST_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
  );
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(DIST_DIR, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n` +
      `</urlset>\n`
  );

  console.log('✔ dist/ gerado:');
  console.log(`  - index.html (pré-renderizado em ${DEFAULT_LANG}, SEO + i18n embutido)`);
  console.log('  - css/, js/, locales/, assets/');
  console.log('  - robots.txt, sitemap.xml');
  if (siteUrl.includes('example.com')) {
    console.log('\n⚠ site.config.json ainda usa a siteUrl placeholder (example.com).');
    console.log('  Atualize antes de publicar — afeta canonical, og:url, robots.txt e sitemap.xml.');
  }
}

build();
