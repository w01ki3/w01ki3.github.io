/**
 * Sosyal medya botları için önizleme (Open Graph) HTML paylas/<slug>.html üretir
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));
const EVENTS_FILE = path.join(__dirname, 'olaylar.js');
const OUT_DIR = path.join(__dirname, 'paylas');

const SITE = 'https://w01ki3.github.io';
const PAGE_BASE = SITE + '/blog/docs/milli-takvim/paylas/';
const OG_IMAGE_W = 1200;
const SITE_NAME = 'Milli Takvim';
const MAX_DESC = 200;

/* Görsel, paylaş akışının kullandığı kart yapısıyla aynı kaynaktan üretilir */
const CARD_THEME = 'dark';
const PANEL_W = 420;
const STAGE_PAD = 28;
const CARD_SCALE = OG_IMAGE_W / (PANEL_W + STAGE_PAD * 2);
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const STYLE_FILES = [
    path.join(__dirname, '..', '..', 'style.css'),
    path.join(__dirname, 'takvim.css')
];

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

function imageUrl(slug) {
    return PAGE_BASE + slug + '.png';
}

function siteCss() {
    return STYLE_FILES.map(function(file) {
        return fs.readFileSync(file, 'utf8');
    }).join('\n');
}

function dateLabel(ev) {
    const parts = String(ev.date || '').split('-');
    const m = parseInt(parts[0], 10) - 1;
    const d = parseInt(parts[1], 10);
    return d + ' ' + (MONTHS_TR[m] || '') + (ev.year ? ' ' + ev.year : '');
}

/* paylaş butonunun ürettiği içeriğin aynısı: .mt-share-stage > .mt-modal-panel (başlık + tam tarih + açıklama) */
function renderCard(ev) {
    const desc = ev.description || '';
    return `<!DOCTYPE html>
<html lang="tr" data-theme="${CARD_THEME}">
<head>
<meta charset="UTF-8">
<style>
${siteCss()}
html, body { height: auto; overflow: visible; }
body { display: block; }
.mt-share-stage { position: static; left: auto; top: auto; z-index: auto; display: inline-block; padding: ${STAGE_PAD}px; background-color: var(--bg-color); }
</style>
</head>
<body>
<div class="mt-share-stage">
<div class="mt-modal-panel">
<h2>${htmlEscape(ev.title)}</h2>
<p class="mt-modal-meta">${htmlEscape(dateLabel(ev))}</p>
${desc ? `<p class="mt-modal-desc">${htmlEscape(desc)}</p>` : ''}
</div>
</div>
</body>
</html>`;
}

function renderPage(ev, slug, imageHeight) {
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
<meta property="og:image" content="${imageUrl(slug)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${OG_IMAGE_W}">
<meta property="og:image:height" content="${imageHeight}">
<meta property="og:image:alt" content="${htmlEscape(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${htmlEscape(title)}">
<meta name="twitter:description" content="${htmlEscape(description)}">
<meta name="twitter:image" content="${imageUrl(slug)}">
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

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: PANEL_W + STAGE_PAD * 2, height: 2000 },
    deviceScaleFactor: CARD_SCALE
});

for (let index = 0; index < events.length; index++) {
    const ev = events[index];
    let base = slugify(ev.date + '-' + (ev.year || '') + '-' + ev.title);
    if (!base) base = 'olay-' + (index + 1);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
        slug = base + '-' + n;
        n += 1;
    }
    used.add(slug);

    await page.setContent(renderCard(ev), { waitUntil: 'load' });
    await page.evaluate(function() {
        return Promise.race([
            document.fonts.ready,
            new Promise(function(r) { setTimeout(r, 1500); })
        ]);
    });

    const stage = await page.$('.mt-share-stage');
    const box = await stage.boundingBox();
    await stage.screenshot({ path: path.join(OUT_DIR, slug + '.png') });

    fs.writeFileSync(path.join(OUT_DIR, slug + '.html'), renderPage(ev, slug, Math.round(box.height * CARD_SCALE)), 'utf8');

    generated += 1;
}

await browser.close();

console.log(generated + ' olay sayfası + görsel üretildi -> ' + OUT_DIR);