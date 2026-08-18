# Portfólio — Hendelly Mesquita

Vanilla JS + SCSS + i18n (pt-BR, en-GB, es-ES). Sem frameworks, sem bundler pesado.

## Desenvolvimento

```bash
npm install
npm run dev
```

Sobe em `http://127.0.0.1:5500`, compilando o SCSS em watch. Nesse modo, o `index.html`
(fonte/template) busca as traduções via `fetch('locales/<lang>.json')` — precisa rodar
via servidor local (não abra com `file://`).

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/`, pronta para deploy em qualquer host estático (GitHub Pages, Netlify,
Vercel...). O que o build faz, a partir das mesmas fontes de sempre (`locales/*.json` +
`site.config.json`), sem duplicar nenhuma string à mão:

- **Pré-renderiza** o conteúdo em pt-BR direto no HTML — a página funciona mesmo se o
  JavaScript falhar ao carregar.
- **Embute os 3 idiomas** como JSON inline no próprio HTML — trocar de idioma não depende
  mais de `fetch()`/rede.
- Escreve **SEO**: `<title>`/`<meta description>`, canonical, Open Graph, Twitter Card e
  JSON-LD (`schema.org/Person`) — a partir dos mesmos textos do `pt-BR.json`.
- Gera `robots.txt` e `sitemap.xml` usando a `siteUrl` de `site.config.json`.
- Copia `css/`, `js/`, `locales/` (fallback redundante) e `assets/` para dentro de `dist/`.

Antes de publicar, **edite `site.config.json`** com a URL final do site e os links reais
de LinkedIn/GitHub — hoje estão como placeholder e o build avisa isso no terminal.

```bash
npm run preview   # serve dist/ isoladamente em http://127.0.0.1:5501, pra testar o artefato final
```

## Deploy no Cloudflare Pages

1. Suba este repositório pro GitHub (pode ser privado).
2. No [dashboard da Cloudflare](https://dash.cloudflare.com) → Workers & Pages → **Create application** → **Pages** → **Connect to Git**.
3. Selecione o repositório e configure:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. A Cloudflare vai te dar uma URL `https://<nome-do-projeto>.pages.dev`.
5. **Atualize `site.config.json`** com essa URL exata em `siteUrl` (o nome do projeto que você escolher no passo 3 define o subdomínio) e rode `npm run build` de novo antes do próximo deploy — isso corrige canonical, Open Graph, robots.txt e sitemap.xml.
6. Se/quando conectar um domínio próprio: Pages → seu projeto → **Custom domains**, e repita o passo 5 com a URL final.

Cada novo `git push` na branch principal dispara um novo build+deploy automaticamente.

## Estrutura

```
index.html          ← template-fonte (usado em dev; vira dist/index.html no build)
site.config.json     ← siteUrl + links sociais (fonte única para SEO)
src/scss/            ← SCSS modular
src/js/               ← JS puro (ESM), copiado verbatim para dist/js
locales/              ← única fonte de verdade dos textos (pt-BR, en-GB, es-ES)
assets/icons/         ← favicon (SVG + PNGs, monograma HM)
assets/social/        ← og-image.png (card de compartilhamento)
scripts/build.mjs     ← gera dist/ a partir de tudo acima
```
