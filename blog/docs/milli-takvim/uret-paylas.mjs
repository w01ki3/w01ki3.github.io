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
const OG_IMAGE_W = '1200';
const OG_IMAGE_H = '630';
const SITE_NAME = 'Milli Takvim';
const MAX_DESC = 200;
const CARD_W = 1200;
const CARD_H = 630;
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

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

function dateLabel(ev) {
    const parts = String(ev.date || '').split('-');
    const m = parseInt(parts[0], 10) - 1;
    const d = parseInt(parts[1], 10);
    const month = MONTHS_TR[m] || '';
    return d + ' ' + month + (ev.year ? ' ' + ev.year : '');
}

function categoryLabel(cat) {
    if (cat === 'bayram') return 'MİLLİ BAYRAM';
    if (cat === 'anma') return 'ANMA';
    return 'TARİHİ OLAY';
}

function titleSize(title) {
    const n = String(title).length;
    if (n <= 18) return 84;
    if (n <= 30) return 72;
    if (n <= 44) return 60;
    if (n <= 60) return 50;
    return 42;
}

function renderCard(ev) {
    const desc = truncate(ev.description, 170);
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${CARD_W}px; height: ${CARD_H}px; }
body { font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif; }
.card { position: relative; width: ${CARD_W}px; height: ${CARD_H}px; padding: 68px 82px; display: flex; flex-direction: column; justify-content: space-between; background: radial-gradient(120% 130% at 100% 0%, #2a0a0e 0%, #0d1117 58%), #0d1117; color: #e5e7eb; overflow: hidden; }
.card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: linear-gradient(#e10600, #7f1d1d); }
.glow { position: absolute; right: -140px; top: -140px; width: 540px; height: 540px; border-radius: 50%; background: radial-gradient(circle, rgba(225, 6, 0, 0.30), transparent 70%); }
.kicker { position: relative; font-size: 22px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #ff5a5a; }
.badge { position: absolute; right: 82px; top: 64px; font-size: 17px; font-weight: 700; letter-spacing: 0.14em; color: #9aa4b2; border: 1px solid #30363d; border-radius: 999px; padding: 10px 20px; }
.mid { position: relative; }
h1 { font-size: ${titleSize(ev.title)}px; line-height: 1.08; font-weight: 800; letter-spacing: -0.01em; max-width: 1010px; }
.date { margin-top: 24px; font-size: 30px; font-weight: 700; color: #ff8080; }
.desc { margin-top: 20px; font-size: 25px; line-height: 1.45; color: #9aa4b2; max-width: 980px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.foot { position: relative; display: flex; align-items: center; justify-content: space-between; font-size: 22px; color: #7d8896; }
.foot b { color: #e5e7eb; font-weight: 700; }
</style>
</head>
<body>
<div class="card">
<div class="glow"></div>
<p class="kicker">Milli Takvim</p>
<span class="badge">${categoryLabel(ev.category)}</span>
<div class="mid">
<h1>${htmlEscape(ev.title)}</h1>
<p class="date">${htmlEscape(dateLabel(ev))}</p>
${desc ? `<p class="desc">${htmlEscape(desc)}</p>` : ''}
</div>
<div class="foot">
<svg width="34" height="34" viewBox="0 0 24 24" fill="#e10600" aria-hidden="true"><path d="M14.5 3a8.5 8.5 0 1 0 3.1 15.9A7 7 0 0 1 14.5 3z"/><path d="M18 4.5l.9 2.1 2.1.9-2.1.9L18 10.5l-.9-2.1L15 7.5l2.1-.9z"/></svg>
<span><b>VK | Günce</b> · w01ki3.github.io</span>
</div>
</div>
</body>
</html>`;
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
<meta property="og:image" content="${imageUrl(slug)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${OG_IMAGE_W}">
<meta property="og:image:height" content="${OG_IMAGE_H}">
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
    viewport: { width: CARD_W, height: CARD_H },
    deviceScaleFactor: 1
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

    fs.writeFileSync(path.join(OUT_DIR, slug + '.html'), renderPage(ev, slug), 'utf8');

    await page.setContent(renderCard(ev), { waitUntil: 'load' });
    await page.evaluate(function() {
        return Promise.race([
            document.fonts.ready,
            new Promise(function(r) { setTimeout(r, 1500); })
        ]);
    });
    const card = await page.$('.card');
    await card.screenshot({ path: path.join(OUT_DIR, slug + '.png') });

    generated += 1;
}

await browser.close();

console.log(generated + ' olay sayfası + görsel üretildi -> ' + OUT_DIR);