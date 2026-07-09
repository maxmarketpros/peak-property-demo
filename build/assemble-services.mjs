// Assembles build/data/services.json from the drafted copy (service-copy.json)
// plus per-page metadata (titles, hero images, pull-quotes, related links, area rotations).
// Usage: node build/assemble-services.mjs <path-to-service-copy.json>

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = dirname(fileURLToPath(import.meta.url));
const copyPath = process.argv[2];
if (!copyPath) throw new Error('pass path to service-copy.json');

const drafts = JSON.parse(readFileSync(copyPath, 'utf8'));
const reviews = JSON.parse(readFileSync(join(BUILD, 'data', 'reviews.json'), 'utf8'));
const dims = JSON.parse(readFileSync(join(BUILD, 'data', 'image-dims.json'), 'utf8'));

const CATS = {
  Electrical: ['panel-upgrades', 'electrical-repairs', 'emergency-electrician', 'dedicated-circuits', 'wiring-rewiring', 'outlets-switches'],
  Lighting: ['indoor-lighting', 'outdoor-lighting', 'recessed-led-lighting'],
  Safety: ['electrical-safety-inspections', 'surge-protection', 'smoke-co-detectors'],
  'Power & Upgrades': ['ev-charger-installation', 'generator-installation'],
  'Commercial & New Construction': ['new-construction-wiring', 'commercial-electrical'],
};
const NAMES = {
  'panel-upgrades': 'Panel Upgrades & Replacements',
  'electrical-repairs': 'Electrical Repairs & Troubleshooting',
  'emergency-electrician': '24/7 Emergency Electrician',
  'dedicated-circuits': 'Dedicated Circuits',
  'wiring-rewiring': 'Wiring & Rewiring',
  'outlets-switches': 'Outlets & Switches',
  'indoor-lighting': 'Indoor Lighting',
  'outdoor-lighting': 'Outdoor Lighting',
  'recessed-led-lighting': 'Recessed & LED Lighting',
  'electrical-safety-inspections': 'Electrical Safety Inspections',
  'surge-protection': 'Whole-Home Surge Protection',
  'smoke-co-detectors': 'Smoke & CO Detectors',
  'ev-charger-installation': 'EV Charger Installation',
  'generator-installation': 'Generator Installation & Maintenance',
  'new-construction-wiring': 'New Construction Wiring',
  'commercial-electrical': 'Commercial Electrical Services',
};
const META = {
  'panel-upgrades': { title: 'Electrical Panel Upgrades in Skokie | Peak Property Electric', h1: 'Panel Upgrades in Skokie & the North Shore', img: '/photos/work/panel-neat-wiring.jpg', alt: 'Clean, code-compliant electrical panel installed by Peak Property Electric', quote: 'Irshad Hussain', areas: ['Skokie', 'Lincolnwood', 'Northbrook', 'Deerfield', 'Evanston'] },
  'electrical-repairs': { title: 'Electrical Repairs in Skokie, IL | Peak Property Electric', h1: 'Electrical Repairs in Skokie & the North Shore', img: '/photos/brand/electrician-panel-work.jpg', alt: 'Peak Property Electric electrician troubleshooting a panel in a branded shirt', quote: 'Sophia Granobles', areas: ['Skokie', 'Evanston', 'Lincolnwood', 'Wilmette', 'Glenview'] },
  'emergency-electrician': { title: '24/7 Emergency Electrician – Skokie & North Shore, IL', h1: '24/7 Emergency Electrician — Skokie & the North Shore', img: '/photos/brand/crew-ladder-2.jpg', alt: 'Peak Property Electric electrician responding to a service call at a North Shore home', quote: 'Nolan Luca', areas: ['Skokie', 'Evanston', 'Northbrook', 'Highland Park', 'Glenview'] },
  'dedicated-circuits': { title: 'Dedicated Circuits in Skokie, IL | Peak Property Electric', h1: 'Dedicated Circuits in Skokie & the North Shore', img: '/photos/work/control-equipment.jpg', alt: 'Dedicated circuit equipment wiring installed by Peak Property Electric', quote: 'Markus Rachi', areas: ['Skokie', 'Wilmette', 'Deerfield', 'Northfield', 'Lincolnwood'] },
  'wiring-rewiring': { title: 'Home Wiring & Rewiring in Skokie | Peak Property Electric', h1: 'Wiring & Rewiring in Skokie & the North Shore', img: '/photos/work/dual-panel-conduit.jpg', alt: 'New electrical wiring and conduit runs installed by Peak Property Electric', quote: 'Charlie Berkson', areas: ['Evanston', 'Wilmette', 'Kenilworth', 'Winnetka', 'Skokie'] },
  'outlets-switches': { title: 'Outlets & Switches in Skokie, IL | Peak Property Electric', h1: 'Outlets & Switches in Skokie & the North Shore', img: '/photos/work/kitchen-led-accent-lighting.jpg', alt: 'Kitchen with new outlets, switches, and LED lighting', quote: 'Chris R', areas: ['Skokie', 'Lincolnwood', 'Evanston', 'Northfield', 'Glenview'] },
  'indoor-lighting': { title: 'Indoor Lighting in Skokie, IL | Peak Property Electric', h1: 'Indoor Lighting in Skokie & the North Shore', img: '/photos/work/copper-pendant-kitchen.jpg', alt: 'Copper pendant lights over a kitchen island installed by Peak Property Electric', quote: 'Kristen Mirsky', areas: ['Skokie', 'Glencoe', 'Winnetka', 'Wilmette', 'Evanston'] },
  'outdoor-lighting': { title: 'Outdoor Lighting in Skokie, IL | Peak Property Electric', h1: 'Outdoor Lighting in Skokie & the North Shore', img: '/photos/work/tudor-home-exterior.jpg', alt: 'North Shore home exterior — outdoor lighting and exterior power by Peak Property Electric', quote: 'David Rumpel', areas: ['Glencoe', 'Winnetka', 'Highland Park', 'Riverwoods', 'Lincolnwood'] },
  'recessed-led-lighting': { title: 'Recessed & LED Lighting in Skokie | Peak Property Electric', h1: 'Recessed & LED Lighting in Skokie & the North Shore', img: '/photos/work/basement-recessed.jpg', alt: 'Finished basement with recessed LED lighting installed by Peak Property Electric', quote: 'Daniel Slobodyan', areas: ['Skokie', 'Evanston', 'Glenview', 'Deerfield', 'Northbrook'] },
  'electrical-safety-inspections': { title: 'Electrical Safety Inspections | Skokie, IL Electrician', h1: 'Electrical Safety Inspections in Skokie & the North Shore', img: '/photos/work/panel-safety-inspection.jpg', alt: 'Old fuse boxes next to a new electrical panel found during a safety inspection', quote: 'Tom Glatz', areas: ['Skokie', 'Evanston', 'Wilmette', 'Kenilworth', 'Lincolnwood'] },
  'surge-protection': { title: 'Whole-Home Surge Protection | Skokie, IL Electrician', h1: 'Whole-Home Surge Protection in Skokie & the North Shore', img: '/photos/work/service-panel-cables.jpg', alt: 'Electrical service panel where whole-home surge protection is installed', quote: 'Nate K', areas: ['Riverwoods', 'Northbrook', 'Highland Park', 'Glenview', 'Skokie'] },
  'smoke-co-detectors': { title: 'Smoke & CO Detector Installation | Skokie Electrician', h1: 'Smoke & CO Detector Installation in Skokie & the North Shore', img: '/photos/work/bedroom-ceiling-fan.jpg', alt: 'Bedroom ceiling where hardwired smoke detectors are installed', quote: 'Anne B', areas: ['Skokie', 'Lincolnwood', 'Evanston', 'Northfield', 'Deerfield'] },
  'ev-charger-installation': { title: 'EV Charger Installation in Skokie | Peak Property Electric', h1: 'EV Charger Installation in Skokie & the North Shore', img: '/photos/work/tesla-charger-garage.jpg', alt: 'Level 2 Tesla EV charger installed in a garage by Peak Property Electric', quote: 'V P', areas: ['Glenview', 'Wilmette', 'Evanston', 'Deerfield', 'Skokie'] },
  'generator-installation': { title: 'Generator Installation in Skokie | Peak Property Electric', h1: 'Generator Installation in Skokie & the North Shore', img: '/photos/work/generator-standby.jpg', alt: 'Whole-home standby generator installed beside a house', quote: 'Daniel Slobodyan', areas: ['Riverwoods', 'Winnetka', 'Highland Park', 'Northbrook', 'Glencoe'] },
  'new-construction-wiring': { title: 'New Construction Wiring in Skokie | Peak Property Electric', h1: 'New Construction Wiring in Skokie & the North Shore', img: '/photos/work/new-construction-plans.jpg', alt: 'Electrical plans on the table at a Peak Property Electric new construction job', quote: 'Claud', areas: ['Glenview', 'Winnetka', 'Glencoe', 'Skokie', 'Highland Park'] },
  'commercial-electrical': { title: 'Commercial Electrician in Skokie | Peak Property Electric', h1: 'Commercial Electrical in Skokie & the North Shore', img: '/photos/work/warehouse-highbay-lighting.jpg', alt: 'Commercial warehouse high-bay lighting installed by Peak Property Electric', quote: 'Ryan Levy', areas: ['Skokie', 'Northbrook', 'Evanston', 'Highland Park', 'Lincolnwood'] },
};

function catOf(slug) {
  return Object.entries(CATS).find(([, slugs]) => slugs.includes(slug))[0];
}
function relatedOf(slug) {
  const cat = catOf(slug);
  const sibs = CATS[cat].filter(s => s !== slug).slice(0, 3);
  const extras = [];
  if (!sibs.includes('panel-upgrades') && slug !== 'panel-upgrades') extras.push('panel-upgrades');
  if (!sibs.includes('electrical-safety-inspections') && slug !== 'electrical-safety-inspections' && cat !== 'Safety') extras.push('electrical-safety-inspections');
  return [...sibs, ...extras].slice(0, 4);
}

const pages = drafts.map(({ slug, copy }) => {
  const m = META[slug];
  const [w, h] = dims[m.img];
  const review = reviews.find(r => r.name === m.quote);
  const quoteHtml = review ? `<div class="pull-quote">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p>&ldquo;${review.text.replace(/…$|\.\.\.$/, '').trim()}&rdquo;</p>
        <cite>&mdash; ${review.name}, ${review.city} &middot; Google Review</cite>
      </div>` : '';
  const faqsHtml = copy.faqs.map(f => `        <div class="faq-item">
          <button class="faq-q">${f.q} <span class="faq-icon">+</span></button>
          <div class="faq-a">${f.a}</div>
        </div>`).join('\n');
  return {
    slug,
    title: m.title,
    desc: copy.meta_desc,
    name: NAMES[slug],
    areas: m.areas,
    faqs: copy.faqs,
    tokens: {
      SVC_NAME: NAMES[slug],
      SVC_H1: m.h1,
      SVC_CAT_LABEL: catOf(slug),
      SVC_HERO_SUB: copy.hero_sub,
      SVC_IMG: m.img,
      SVC_IMG_ALT: m.alt,
      SVC_IMG_W: String(w),
      SVC_IMG_H: String(h),
      SVC_INTRO: copy.intro,
      SVC_SYMPTOMS_HEAD: copy.symptoms_heading,
      SVC_SYMPTOMS_LIS: copy.symptoms.map(s => `        <li>${s}</li>`).join('\n'),
      SVC_INCLUDED_LIS: copy.included.map(s => `        <li>${s}</li>`).join('\n'),
      SVC_PROCESS_NOTE: copy.process_note,
      SVC_COST_HEAD: copy.cost_heading,
      SVC_COST_PARAS: copy.cost_paragraphs.join('\n      '),
      SVC_QUOTE_HTML: quoteHtml,
      SVC_FAQS_HTML: faqsHtml,
      SVC_RELATED_LIS: relatedOf(slug).map(s => `          <li><a href="/services/${s}.html">${NAMES[s]}</a></li>`).join('\n'),
      SVC_AREAS_LIS: m.areas.map(t => `          <li><a href="/areas/${t.toLowerCase().replace(/ /g, '-')}-electrician.html">${t}, IL</a></li>`).join('\n') + `\n          <li><a href="/areas.html" style="color:var(--gold);font-weight:700">All Service Areas &rarr;</a></li>`,
    },
  };
});

writeFileSync(join(BUILD, 'data', 'services.json'), JSON.stringify({ pages }, null, 1));
console.log(`services.json written with ${pages.length} pages`);
