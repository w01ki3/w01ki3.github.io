/**
 * Sosyal medya botları için önizleme (Open Graph) HTML paylas/<slug>.html üretir
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
const EVENTS_FILE = path.join(__dirname, 'olaylar.js');
const OUT_DIR = path.join(__dirname, 'paylas');

const SITE = 'https://w01ki3.github.io';
const PAGE_BASE = SITE + '/blog/docs/milli-takvim/paylas/';
const OG_IMAGE = SITE + '/GokTurk.jpg';
const OG_IMAGE_W = '800';
const OG_IMAGE_H = '800';
const SITE_NAME = 'Milli Takvim';
const MAX_DESC = 200;

const TR_MAP = {
    'ç': 'c',
    'Ç': 'c',
    'ğ': 'g',
    'Ğ': 'g',
    'ı': 'i',
    'İ': 'i',
    'ö': 'o',
    'Ö': 'o',
    'ş': 's',
    'Ş': 's',
    'ü': 'u',
    'Ü': 'u',
    'â': 'a',
    'Â': 'a',
    'î': 'i',
    'Î': 'i',
    'û': 'u',
    'Û': 'u',
    'é': 'e',
    'è': 'e',
    'ê': 'e',
    'á': 'a',
    'à': 'a',
    'ä': 'a',
    'å': 'a',
    'ø': 'o',
    'æ': 'ae',
    'ô': 'o',
    'ñ': 'n',
    'ó': 'o',
    'ú': 'u',
    'í': 'i'
};

function slugify(input) {
    return String(input)
        .replace(/[^\x00-\x7F]/g, function(ch) { return TR_MAP[ch] || ''; })
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function htmlEscape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(text, max) {
    const s = String(text || '').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, '') + '…';
}

function pageUrl(slug) {
    return PAGE_BASE + slug + '.html';
}

function renderPage(ev, slug) {
    const title = ev.title + (ev.year ? ' · ' + ev.year : '');
    const description = truncate(ev.description, MAX_DESC) || ev.title;
    const url = pageUrl(slug);
    const redirect = '../../../index.html#milli-takvim/' + slug;
    const kicker = ev.category === 'bayram' ? 'Milli bayram' :
        ev.category === 'anma' ? 'Anma' : 'Tarihi olay';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htmlEscape(title)} | Milli Takvim</title>
<meta name="description" content="${htmlEscape(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${htmlEscape(SITE_NAME)}">
<meta property="og:locale" content="tr_TR">
<meta property="og:title" content="${htmlEscape(title)}">
<meta property="og:description" content="${htmlEscape(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="${OG_IMAGE_W}">
<meta property="og:image:height" content="${OG_IMAGE_H}">
<meta property="og:image:alt" content="${htmlEscape(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${htmlEscape(title)}">
<meta name="twitter:description" content="${htmlEscape(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta name="twitter:image:alt" content="${htmlEscape(title)}">
<meta name="theme-color" content="#ff0000ff">
<script>location.replace(${JSON.stringify(redirect)});</script>
</head>
<body>
<p>${htmlEscape(kicker)} · <strong>${htmlEscape(title)}</strong></p>
<p>Milli Takvim'e yönlendiriliyorsunuz… <a href="${redirect}">Devam et</a></p>
</body>
</html>
`;
}

const src = fs.readFileSync(EVENTS_FILE, 'utf8');
const sandbox = {};
new Function('window', src)(sandbox);
const events = sandbox.MILLI_TAKVIM_EVENTS || [];

fs.mkdirSync(OUT_DIR, { recursive: true });

const used = new Set();
let generated = 0;

events.forEach(function(ev, index) {
    let base = slugify(ev.date + '-' + (ev.year || '') + '-' + ev.title);
    if (!base) base = 'olay-' + (index + 1);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
        slug = base + '-' + n;
        n += 1;
    }
    used.add(slug);

    fs.writeFileSync(path.join(OUT_DIR, slug + '.html'), renderPage(ev, slug), 'utf8');
    generated += 1;
});

console.log(generated + ' olay sayfası üretildi -> ' + OUT_DIR);