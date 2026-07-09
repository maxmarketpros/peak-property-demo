// Peak Property Electric static site builder.
// Usage: node build/build.mjs
// Reads build/templates + build/content + build/data, writes the deployable
// HTML pages in the repo root (and services/ + areas/ when their data exists).
// Generated pages are committed — Netlify serves them as-is with no build step.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = dirname(fileURLToPath(import.meta.url));
const ROOT = join(BUILD, '..');
const T = (name) => join(BUILD, 'templates', name);
const C = (name) => join(BUILD, 'content', name);
const D = (name) => join(BUILD, 'data', name);

const site = JSON.parse(readFileSync(D('site.json'), 'utf8'));
const gallery = JSON.parse(readFileSync(D('gallery.json'), 'utf8'));

// ---------- token machinery ----------
function includePartials(text, tokens) {
  return text.replace(/\{\{>([\w.-]+)\}\}/g, (_, name) =>
    includePartials(readFileSync(T(name), 'utf8').trimEnd(), tokens));
}

function substitute(text, tokens) {
  const missing = new Set();
  const out = text.replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g, (m, key) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) return tokens[key];
    missing.add(key);
    return m;
  });
  if (missing.size) throw new Error(`Unknown tokens: ${[...missing].join(', ')}`);
  return out;
}

function li(items) {
  return items.map(({ label, href }) => `        <li><a href="${href}">${label}</a></li>`).join('\n');
}

const globalTokens = {
  PHONE: site.phone,
  EMAIL: site.email,
  LICENSE: site.license,
  TAGLINE: site.tagline,
  FOOTER_SERVICES: li(site.footerServices),
  FOOTER_AREAS: li(site.footerAreas),
};

// ---------- generated fragments ----------
function galleryCards() {
  return gallery.map(g => `        <div class="work-card">
          <div class="work-img-wrap">
            <img src="${g.src}" alt="${g.alt}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async">
            <div class="work-overlay"><span class="work-cat">${g.cat}</span></div>
          </div>
          <div class="work-label">${g.label}</div>
        </div>`).join('\n');
}

// ---------- page assembly ----------
const layout = readFileSync(T('layout.html'), 'utf8');

function renderPage({ out, title, desc, content, extraHead = '', extraBody = '', schema = '' }) {
  const path = '/' + out.replace(/\\/g, '/');
  const tokens = {
    ...globalTokens,
    TITLE: title,
    META_DESC: desc,
    CANONICAL: site.domain ? `\n<link rel="canonical" href="${site.domain}${path === '/index.html' ? '/' : path}">` : '',
    SCHEMA_JSONLD: schema,
    EXTRA_HEAD: extraHead,
    EXTRA_BODY: extraBody,
    CONTENT: content,
    GALLERY_CARDS: galleryCards(),
  };
  // two passes so tokens inside CONTENT/partials resolve
  let html = includePartials(layout, tokens);
  html = substitute(substitute(html, tokens), tokens);
  const dest = join(ROOT, out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log('wrote', out, `(${(html.length / 1024).toFixed(1)}KB)`);
}

// Root pages
const pages = JSON.parse(readFileSync(D('pages.json'), 'utf8'));
for (const page of pages) {
  renderPage({
    out: page.out,
    title: page.title,
    desc: page.desc,
    content: readFileSync(C(page.content), 'utf8'),
    extraHead: page.extraHead || '',
    extraBody: page.extraBody || '',
    schema: page.schema || '',
  });
}

// Service pages (Phase 3+)
if (existsSync(D('services.json')) && existsSync(T('service-page.html'))) {
  const services = JSON.parse(readFileSync(D('services.json'), 'utf8'));
  const tpl = readFileSync(T('service-page.html'), 'utf8');
  for (const svc of services.pages) {
    renderPage({
      out: `services/${svc.slug}.html`,
      title: svc.title,
      desc: svc.desc,
      content: substitute(tpl, { ...globalTokens, ...svc.tokens }),
      schema: svc.schema || '',
    });
  }
}

// Area pages (Phase 4+)
if (existsSync(D('areas.json')) && existsSync(T('area-page.html'))) {
  const areas = JSON.parse(readFileSync(D('areas.json'), 'utf8'));
  const tpl = readFileSync(T('area-page.html'), 'utf8');
  for (const area of areas.pages) {
    renderPage({
      out: `areas/${area.slug}.html`,
      title: area.title,
      desc: area.desc,
      content: substitute(tpl, { ...globalTokens, ...area.tokens }),
      schema: area.schema || '',
      extraHead: area.extraHead || '',
      extraBody: area.extraBody || '',
    });
  }
}

console.log('build complete');
