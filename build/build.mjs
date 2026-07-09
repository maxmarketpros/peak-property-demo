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
        </div>`).join('\n');
}

// ---------- structured data ----------
const TOWNS = ['Skokie', 'Evanston', 'Lincolnwood', 'Wilmette', 'Glenview', 'Northbrook', 'Winnetka', 'Kenilworth', 'Glencoe', 'Northfield', 'Deerfield', 'Riverwoods', 'Highland Park'];
const BUSINESS_ID = `${site.domain}/#business`;

const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Electrician',
  '@id': BUSINESS_ID,
  name: 'Peak Property Electric LLC',
  url: `${site.domain}/`,
  telephone: '+17739877677',
  email: site.email,
  description: `Family-owned electrician serving Skokie, Cook County, and the Chicago North Shore. Illinois License ${site.license}. Panel upgrades, EV chargers, lighting, generators, and 24/7 emergency service.`,
  slogan: site.tagline,
  image: [`${site.domain}/photos/brand/red-van-2.jpg`, `${site.domain}/photos/work/crew-on-the-job.jpg`],
  address: { '@type': 'PostalAddress', addressLocality: 'Skokie', addressRegion: 'IL', addressCountry: 'US' },
  areaServed: TOWNS.map(t => ({ '@type': 'City', name: `${t}, IL` })),
  openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' },
  sameAs: [site.googleProfile],
};

const stripTags = s => s.replace(/<[^>]+>/g, '');
const faqSchema = faqs => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({ '@type': 'Question', name: stripTags(f.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) } })),
});
const breadcrumbSchema = crumbs => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${site.domain}${url}` })),
});
const jsonld = objs => objs.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');

// ---------- page assembly ----------
const layout = readFileSync(T('layout.html'), 'utf8');
const sitemapPaths = [];
const renderedOuts = [];

// Netlify serves pretty URLs: /page.html is reachable at /page (no trailing
// slash), so all canonical/OG/sitemap/schema URLs use the extensionless form.
const prettyPath = out => {
  const path = '/' + out.replace(/\\/g, '/');
  return path === '/index.html' ? '/' : path.replace(/\.html$/, '');
};

function renderPage({ out, title, desc, content, extraHead = '', extraBody = '', schema = '', noindex = false }) {
  const canonicalPath = prettyPath(out);
  renderedOuts.push(out);
  if (!noindex) sitemapPaths.push(canonicalPath);
  const og = site.domain && !noindex ? `
<meta property="og:type" content="website">
<meta property="og:site_name" content="Peak Property Electric LLC">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${site.domain}${canonicalPath}">
<meta property="og:image" content="${site.domain}/photos/brand/red-van-2.jpg">
<meta name="twitter:card" content="summary_large_image">` : '';
  const tokens = {
    ...globalTokens,
    TITLE: title,
    META_DESC: desc,
    CANONICAL: (noindex ? '\n<meta name="robots" content="noindex">' : (site.domain ? `\n<link rel="canonical" href="${site.domain}${canonicalPath}">` : '')) + og,
    SCHEMA_JSONLD: schema,
    EXTRA_HEAD: extraHead,
    EXTRA_BODY: extraBody,
    CONTENT: content,
    GALLERY_CARDS: galleryCards(),
  };
  // include partials + substitute twice: the first substitute inserts CONTENT,
  // which may itself contain {{>partial}} refs and tokens
  let html = includePartials(layout, tokens);
  html = substitute(html, tokens);
  html = includePartials(html, tokens);
  html = substitute(html, tokens);
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
    schema: page.out === 'index.html' ? jsonld([businessSchema]) : jsonld([breadcrumbSchema([['Home', '/'], [page.title.split(/[—|–]/)[0].trim(), prettyPath(page.out)]])]),
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
      schema: jsonld([
        { '@context': 'https://schema.org', '@type': 'Service', serviceType: svc.name, provider: { '@id': BUSINESS_ID }, areaServed: (svc.areas || TOWNS).map(t => ({ '@type': 'City', name: `${t}, IL` })), url: `${site.domain}/services/${svc.slug}` },
        breadcrumbSchema([['Home', '/'], ['Services', '/services'], [svc.name, `/services/${svc.slug}`]]),
        ...(svc.faqs ? [faqSchema(svc.faqs)] : []),
      ]),
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
      schema: jsonld([
        { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Electrician', provider: { '@id': BUSINESS_ID }, areaServed: { '@type': 'City', name: `${area.town}, IL` }, url: `${site.domain}/areas/${area.slug}` },
        breadcrumbSchema([['Home', '/'], ['Service Areas', '/areas'], [area.town, `/areas/${area.slug}`]]),
        ...(area.faqs ? [faqSchema(area.faqs)] : []),
      ]),
      extraHead: area.extraHead || '',
      extraBody: area.extraBody || '',
    });
  }
}

// 404 page (excluded from sitemap)
if (existsSync(C('404.html'))) {
  renderPage({
    out: '404.html',
    title: 'Page Not Found | Peak Property Electric',
    desc: 'That page could not be found. Browse Peak Property Electric services and service areas, or call (773) 987-7677.',
    content: readFileSync(C('404.html'), 'utf8'),
    noindex: true,
  });
}

// sitemap.xml + robots.txt
if (site.domain) {
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map(p => `  <url><loc>${site.domain}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
  writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /build/\n\nSitemap: ${site.domain}/sitemap.xml\n`);
  console.log(`wrote sitemap.xml (${sitemapPaths.length} urls) + robots.txt`);
}

// _redirects: legacy old-site URLs + .html→pretty 301s (Netlify, first match wins).
// The .html rules must be forced (301!) — the files exist, and Netlify never
// applies an unforced redirect when the requested path matches a real file.
const legacy = JSON.parse(readFileSync(D('redirects.json'), 'utf8'));
const htmlRules = renderedOuts
  .filter(o => o !== '404.html')
  .map(o => `/${o.replace(/\\/g, '/')} ${prettyPath(o)} 301!`);
writeFileSync(join(ROOT, '_redirects'), [
  '# Legacy URLs from the old Webflow site (indexed in Google / external links)',
  ...legacy.map(r => `${r.from} ${r.to} 301`),
  '',
  '# Pretty URLs: redirect the physical .html paths to the extensionless form',
  ...htmlRules,
  '',
].join('\n'));
console.log(`wrote _redirects (${legacy.length} legacy + ${htmlRules.length} pretty-url rules)`);

console.log('build complete');
