// Assembles build/data/areas.json from drafted town copy (area-copy.json)
// plus per-town metadata (coords, titles, pull-quotes, nearby towns).
// Usage: node build/assemble-areas.mjs <path-to-area-copy.json>

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = dirname(fileURLToPath(import.meta.url));
const copyPath = process.argv[2];
if (!copyPath) throw new Error('pass path to area-copy.json');

const drafts = JSON.parse(readFileSync(copyPath, 'utf8'));
const reviews = JSON.parse(readFileSync(join(BUILD, 'data', 'reviews.json'), 'utf8'));

const SVC_NAMES = {
  'panel-upgrades': 'Panel Upgrades & Replacements', 'electrical-repairs': 'Electrical Repairs & Troubleshooting',
  'emergency-electrician': '24/7 Emergency Electrician', 'dedicated-circuits': 'Dedicated Circuits',
  'wiring-rewiring': 'Wiring & Rewiring', 'outlets-switches': 'Outlets & Switches',
  'indoor-lighting': 'Indoor Lighting', 'outdoor-lighting': 'Outdoor Lighting',
  'recessed-led-lighting': 'Recessed & LED Lighting', 'electrical-safety-inspections': 'Electrical Safety Inspections',
  'surge-protection': 'Whole-Home Surge Protection', 'smoke-co-detectors': 'Smoke & CO Detectors',
  'ev-charger-installation': 'EV Charger Installation', 'generator-installation': 'Generator Installation & Maintenance',
  'new-construction-wiring': 'New Construction Wiring', 'commercial-electrical': 'Commercial Electrical Services',
};

const META = {
  skokie: { lat: 42.0261, lng: -87.7560, title: 'Skokie Electrical Services – Your Hometown Electricians', h1: 'Electrical Services in Skokie — Our Hometown', quote: 'Irshad Hussain', nearby: ['lincolnwood', 'evanston', 'wilmette', 'glenview'] },
  evanston: { lat: 42.0480, lng: -87.6843, title: 'Electrician in Evanston, IL | Peak Property Electric', h1: 'Electrician in Evanston, Illinois', quote: 'Kristen Mirsky', nearby: ['skokie', 'wilmette', 'lincolnwood'] },
  glenview: { lat: 42.0785, lng: -87.8226, title: 'Electrician in Glenview, IL | Peak Property Electric', h1: 'Electrician in Glenview, Illinois', quote: null, nearby: ['northbrook', 'northfield', 'wilmette'] },
  northbrook: { lat: 42.1295, lng: -87.8312, title: 'Electrician in Northbrook, IL | Peak Property Electric', h1: 'Electrician in Northbrook, Illinois', quote: 'Maxim Smirnov', nearby: ['glenview', 'deerfield', 'northfield'] },
  wilmette: { lat: 42.0761, lng: -87.7079, title: 'Electrician in Wilmette, IL | Peak Property Electric', h1: 'Electrician in Wilmette, Illinois', quote: null, nearby: ['kenilworth', 'evanston', 'winnetka'] },
  winnetka: { lat: 42.1052, lng: -87.7340, title: 'Electrician in Winnetka, IL | Peak Property Electric', h1: 'Electrician in Winnetka, Illinois', quote: null, nearby: ['kenilworth', 'glencoe', 'northfield'] },
  kenilworth: { lat: 42.0869, lng: -87.7165, title: 'Electrician in Kenilworth, IL | Peak Property Electric', h1: 'Electrician in Kenilworth, Illinois', quote: null, nearby: ['wilmette', 'winnetka'] },
  'highland-park': { lat: 42.1836, lng: -87.7965, title: 'Electrician in Highland Park, IL | Peak Property Electric', h1: 'Electrician in Highland Park, Illinois', quote: null, nearby: ['deerfield', 'glencoe', 'riverwoods'] },
  deerfield: { lat: 42.1690, lng: -87.8470, title: 'Electrician in Deerfield, IL | Peak Property Electric', h1: 'Electrician in Deerfield, Illinois', quote: null, nearby: ['northbrook', 'riverwoods', 'highland-park'] },
  glencoe: { lat: 42.1337, lng: -87.7576, title: 'Electrician in Glencoe, IL | Peak Property Electric', h1: 'Electrician in Glencoe, Illinois', quote: null, nearby: ['winnetka', 'highland-park', 'northbrook'] },
  northfield: { lat: 42.0984, lng: -87.7648, title: 'Electrician in Northfield, IL | Peak Property Electric', h1: 'Electrician in Northfield, Illinois', quote: null, nearby: ['winnetka', 'glenview', 'wilmette'] },
  riverwoods: { lat: 42.1739, lng: -87.8895, title: 'Electrician in Riverwoods, IL | Peak Property Electric', h1: 'Electrician in Riverwoods, Illinois', quote: null, nearby: ['deerfield', 'highland-park', 'northbrook'] },
  lincolnwood: { lat: 41.9939, lng: -87.7326, title: 'Electrician in Lincolnwood, IL | Peak Property Electric', h1: 'Electrician in Lincolnwood, Illinois', quote: null, nearby: ['skokie', 'evanston'] },
};

const townName = slug => drafts.find(d => d.slug === slug)?.town
  || slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const LEAFLET_HEAD = '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">';
const LEAFLET_BODY = `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
document.querySelectorAll('.area-map[data-lat]').forEach(function (el) {
  var lat = parseFloat(el.dataset.lat), lng = parseFloat(el.dataset.lng);
  var m = L.map(el, { center: [lat, lng], zoom: 13, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
  L.marker([lat, lng], { icon: L.divIcon({ className: '', html: "<div style='width:16px;height:16px;background:#111;border:3px solid #E8641C;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4)'></div>", iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(m);
});
</script>`;

const pages = drafts.map(({ slug, town, picks, copy }) => {
  const m = META[slug];
  const review = m.quote ? reviews.find(r => r.name === m.quote) : null;
  const quoteHtml = review ? `<div class="pull-quote">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p>&ldquo;${review.text.replace(/…$|\.\.\.$/, '').trim()}&rdquo;</p>
        <cite>&mdash; ${review.name}, ${review.city} &middot; Google Review</cite>
      </div>` : '';
  return {
    slug: `${slug}-electrician`,
    title: m.title,
    desc: copy.meta_desc,
    town: town,
    faqs: copy.faqs,
    extraHead: LEAFLET_HEAD,
    extraBody: LEAFLET_BODY,
    tokens: {
      AREA_TOWN: town,
      AREA_H1: m.h1,
      AREA_HERO_SUB: copy.hero_sub,
      AREA_LAT: String(m.lat),
      AREA_LNG: String(m.lng),
      AREA_HOMES_INTRO: copy.homes_intro,
      AREA_PROBLEMS_HEAD: copy.problems_heading,
      AREA_PROBLEMS_LIS: copy.problems.map(p => `        <li>${p}</li>`).join('\n'),
      AREA_SERVICES_INTRO: copy.services_intro,
      AREA_SERVICE_PICKS: picks.map((p, i) => `        <li><a href="/services/${p}"><strong>${SVC_NAMES[p]}</strong></a> — ${copy.service_blurbs[i] || ''}</li>`).join('\n'),
      AREA_QUOTE_HTML: quoteHtml,
      AREA_FAQS_HTML: copy.faqs.map(f => `        <div class="faq-item">
          <button class="faq-q">${f.q} <span class="faq-icon">+</span></button>
          <div class="faq-a">${f.a}</div>
        </div>`).join('\n'),
      AREA_DRIVE_NOTE: copy.drive_note,
      AREA_SIDE_SERVICES: picks.map(p => `          <li><a href="/services/${p}">${SVC_NAMES[p]}</a></li>`).join('\n'),
      AREA_NEARBY: m.nearby.map(n => `          <li><a href="/areas/${n}-electrician">${townName(n)}, IL</a></li>`).join('\n') + `\n          <li><a href="/areas" style="color:var(--gold);font-weight:700">All Service Areas &rarr;</a></li>`,
    },
  };
});

writeFileSync(join(BUILD, 'data', 'areas.json'), JSON.stringify({ pages }, null, 1));
console.log(`areas.json written with ${pages.length} pages`);
