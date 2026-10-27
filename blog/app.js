document.addEventListener('DOMContentLoaded', () => {
    const themeToggleDesktop = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const highlightTheme = document.getElementById('highlight-theme');
    const sidebar = document.getElementById('sidebar');
    const navContainer = document.getElementById('sidebar-nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const contentEl = document.getElementById('content');
    const mainContent = document.querySelector('.main-content');

    // Theme
    function getLogoSrc(theme) {
        return theme === 'light' ? 'https://raw.githubusercontent.com/w01ki3/w01ki3/main/img/vkIcon.png' : 'https://raw.githubusercontent.com/w01ki3/w01ki3/main/img/vkIcon.png';
    }

    let logoOverrideSrc = null;

    function setLogoOverride(docId) {
        logoOverrideSrc = docId === 'milli-takvim' ? '../GokTurk.jpg' : null;
        updateLogos(document.documentElement.getAttribute('data-theme'));
    }

    const defaultTitle = document.title;
    const iconLinks = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]'));
    const defaultIconHrefs = iconLinks.map(link => link.getAttribute('href'));
    const brandTitleEl = document.querySelector('.brand-text strong');
    const defaultBrandText = brandTitleEl ? brandTitleEl.textContent : '';

    function setPageMeta(docId) {
        const isCalendar = docId === 'milli-takvim';
        document.title = isCalendar ? 'Milli Takvim' : defaultTitle;
        iconLinks.forEach((link, i) => {
            link.setAttribute('href', isCalendar ? 'gokturk-192.png' : defaultIconHrefs[i]);
        });
        if (brandTitleEl) brandTitleEl.textContent = isCalendar ? 'Milli Takvim' : defaultBrandText;
    }

    function updateLogos(theme) {
        const src = logoOverrideSrc || getLogoSrc(theme);
        document.querySelectorAll('img.mobile-logo, img.brand-logo, img.hero-logo').forEach(img => {
            if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const icon = theme === 'dark' ? 'fa-star-and-crescent' : 'fa-sun';
        [themeToggleDesktop, themeToggleMobile].forEach(btn => {
            if (!btn) return;
            const span = btn.querySelector('.theme-icon');
            if (span) span.className = 'theme-icon fa-solid ' + icon;
        });
        if (theme === 'dark') {
            highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
        } else {
            highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        }
        updateLogos(theme);
    }

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
    [themeToggleDesktop, themeToggleMobile].forEach(btn => {
        if (btn) btn.addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    });

    // Mobile menu
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    }
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileMenu);

    // Build sidebar from docsConfig
    let currentCategory = '';
    docsConfig.forEach(doc => {
        if (doc.category !== currentCategory) {
            const catEl = document.createElement('div');
            catEl.className = 'nav-category';
            catEl.textContent = doc.category;
            navContainer.appendChild(catEl);
            currentCategory = doc.category;
        }

        const link = document.createElement('a');
        link.href = `#${doc.id}`;
        link.id = `nav-${doc.id}`;
        link.className = 'nav-item';
        link.textContent = doc.title;
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) toggleMobileMenu();
        });
        navContainer.appendChild(link);
    });

    // Marked/highlight options
    marked.setOptions({
        highlight(code, lang) {
            if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
            return hljs.highlightAuto(code).value;
        }
    });

    let skeletonTimer = null;

    function renderSkeleton() {
        contentEl.innerHTML = `
            <div class="doc-skeleton" aria-hidden="true">
                <div class="doc-skeleton-line doc-skeleton-line--title"></div>
                <div class="doc-skeleton-line"></div>
                <div class="doc-skeleton-line"></div>
                <div class="doc-skeleton-line doc-skeleton-line--short"></div>
                <div class="doc-skeleton-line"></div>
                <div class="doc-skeleton-line doc-skeleton-line--short"></div>
            </div>
        `;
    }

    // Dış bağlantı önizlemesi
    const linkPreview = document.createElement('div');
    linkPreview.className = 'link-preview';
    linkPreview.setAttribute('aria-hidden', 'true');
    document.body.appendChild(linkPreview);

    const linkPreviewTags = {
        pdf: 'PDF',
        doc: 'Word',
        docx: 'Word',
        xls: 'Excel',
        xlsx: 'Excel',
        csv: 'CSV',
        ppt: 'Sunum',
        pptx: 'Sunum',
        zip: 'Arşiv',
        rar: 'Arşiv',
        jpg: 'Görsel',
        jpeg: 'Görsel',
        png: 'Görsel',
        webp: 'Görsel',
        svg: 'Görsel',
        mp3: 'Ses',
        mp4: 'Video'
    };

    let linkPreviewTarget = null;

    function escapePreviewText(value) {
        return String(value).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function resolveLinkPreview(href) {
        let url;
        try {
            url = new URL(href, window.location.href);
        } catch (e) {
            return null;
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        if (url.origin === window.location.origin) return null;
        const ext = url.pathname.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
        return {
            host: url.hostname.replace(/^www\./, ''),
            path: (url.pathname + url.search) || '/',
            tag: ext ? (linkPreviewTags[ext[1]] || '') : ''
        };
    }

    function hideLinkPreview() {
        linkPreviewTarget = null;
        linkPreview.classList.remove('visible');
    }

    function showLinkPreview(link) {
        const info = resolveLinkPreview(link.getAttribute('href'));
        if (!info) return;
        const favicon = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(info.host) + '&amp;sz=64';
        linkPreview.innerHTML =
            '<span class="link-preview-icon">' +
            '<i class="fa-solid fa-link" aria-hidden="true"></i>' +
            '<img src="' + favicon + '" alt="">' +
            '</span>' +
            '<span class="link-preview-body">' +
            '<span class="link-preview-domain">' + escapePreviewText(info.host) +
            (info.tag ? '<span class="link-preview-tag">' + escapePreviewText(info.tag) + '</span>' : '') +
            '</span>' +
            '<span class="link-preview-url">' + escapePreviewText(info.path) + '</span>' +
            '</span>';
        const icon = linkPreview.querySelector('img');
        icon.addEventListener('error', () => icon.remove(), { once: true });

        linkPreview.classList.add('visible');
        positionLinkPreview(link);
    }

    function positionLinkPreview(link) {
        const gap = 12;
        const rect = link.getBoundingClientRect();
        const panel = linkPreview.getBoundingClientRect();
        const left = Math.min(Math.max(8, rect.left + rect.width / 2 - panel.width / 2), window.innerWidth - panel.width - 8);
        let top = rect.top - panel.height - gap;
        let placement = 'top';
        if (top < 8) {
            top = Math.min(rect.bottom + gap, window.innerHeight - panel.height - 8);
            placement = 'bottom';
        }
        linkPreview.style.left = left + 'px';
        linkPreview.style.top = top + 'px';
        linkPreview.dataset.placement = placement;
        const caretX = Math.min(Math.max(14, rect.left + rect.width / 2 - left), panel.width - 14);
        linkPreview.style.setProperty('--caret-x', caretX + 'px');
    }

    function handleLinkPreviewEnter(target) {
        const link = target.closest && target.closest('a[href]');
        if (!link || link === linkPreviewTarget) return;
        if (!resolveLinkPreview(link.getAttribute('href'))) return;
        linkPreviewTarget = link;
        showLinkPreview(link);
    }

    const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    contentEl.addEventListener('mouseover', (e) => {
        if (hoverCapable) handleLinkPreviewEnter(e.target);
    });

    contentEl.addEventListener('mouseout', (e) => {
        const link = e.target.closest && e.target.closest('a[href]');
        if (!link || link !== linkPreviewTarget) return;
        if (e.relatedTarget && link.contains(e.relatedTarget)) return;
        hideLinkPreview();
    });

    contentEl.addEventListener('focusin', (e) => handleLinkPreviewEnter(e.target));
    contentEl.addEventListener('focusout', hideLinkPreview);

    mainContent.addEventListener('scroll', hideLinkPreview, { passive: true });
    window.addEventListener('resize', hideLinkPreview);

    // Render simple homepage (only logo + title)
    function renderHome() {
        window.clearTimeout(skeletonTimer);
        if (window.MilliTakvim) window.MilliTakvim.destroy();
        contentEl.innerHTML = `
            <section class="home-hero simple-hero">
                <div class="hero-intro">
                    <p class="hero-lead">Hafızasını kaybeden bir toplum, geleceğin mücadelesini veremez.<br>
                    Buradaki içeriklerin tamamını, geçmişten günümüze tüm değerlerimizi ve başta vatanı için kendini feda edenlerin mirasını diri tutmak için yazdım...</p>
                    <p class="hero-lead">Çağlar boyunca biçim değiştirerek devam eden Türk düşmanlığı ile hesaplaşmak ve unutturulmak istenen milli hafızayı yeniden inşa etmek temel hedefimdir.</p>
                    <p class="hero-lead">Burada, yarının ihtiyaç duyduğu bağımsız düşüncelerimi paylaşıyorum.</p>
                    <p class="hero-quote">Belki bir gün bir vatansever bu yazıları okur ve bu fikirlerden bir meşale devralır...<br>O zaman "Ne mutlu bana" derim.<br>Başka gayem yoktur.</p>
                </div>
                <div class="hero-links">
                    <a href="#milli-takvim" class="hero-link-card">
                        <div class="hero-link-content">
                            <h3>Milli Takvim</h3>
                            <p>Tarihteki önemli olaylar ve milli günler</p>
                        </div>
                        <i class="hero-link-arrow fa-solid fa-up-right-from-square"></i>
                    </a>
                    <a href="#b0100-onsoz" class="hero-link-card">
                        <div class="hero-link-content">
                            <h3>Neden Biz?</h3>
                            <p>neden Türkiye hedef? neden Türk hedef?</p>
                        </div>
                        <i class="hero-link-arrow fa-solid fa-up-right-from-square"></i>
                    </a>
                </div>
                <div class="hero-signature">
                    <img src="${getLogoSrc(document.documentElement.getAttribute('data-theme'))}" class="hero-logo" alt="logo" />
                </div>
            </section>
        `;
    }

    let calendarAssetsLoaded = false;

    function loadScriptOnce(id, src) {
        return new Promise((resolve, reject) => {
            const existing = document.getElementById(id);
            if (existing) {
                if (existing.getAttribute('data-loaded') === '1') {
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.onload = () => {
                script.setAttribute('data-loaded', '1');
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function ensureCalendarAssets() {
        const __v = window.APP_VERSION || 'v0';
        const cssId = 'mt-calendar-css-' + __v;
        const evId = 'mt-events-js-' + __v;
        const scId = 'mt-calendar-js-' + __v;
        return new Promise((resolve, reject) => {
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = 'docs/milli-takvim/takvim.css?v=' + __v;
                document.head.appendChild(link);
            }
            if (window.MilliTakvim && window.MilliTakvim.__v === __v) {
                resolve();
                return;
            }
            loadScriptOnce(evId, 'docs/milli-takvim/olaylar.js?v=' + __v)
                .then(() => loadScriptOnce(scId, 'docs/milli-takvim/script.js?v=' + __v))
                .then(() => {
                    if (window.MilliTakvim) window.MilliTakvim.__v = __v;
                    resolve();
                })
                .catch(reject);
        });
    }

    async function loadDoc(doc) {
        if (window.MilliTakvim) window.MilliTakvim.destroy();
        // Kısa süren yüklemelerde titremeyi önlemek için iskeleti gecikmeli göster
        window.clearTimeout(skeletonTimer);
        skeletonTimer = window.setTimeout(renderSkeleton, 120);
        try {
            const res = await fetch(doc.file);
            if (!res.ok) throw new Error('Not found');
            const text = await res.text();
            window.clearTimeout(skeletonTimer);
            contentEl.innerHTML = marked.parse(text);
            if (doc.id === 'milli-takvim') {
                await ensureCalendarAssets();
                if (window.MilliTakvim) window.MilliTakvim.init();
            }
        } catch (e) {
            window.clearTimeout(skeletonTimer);
            contentEl.innerHTML = `<h1>Erişim Hatası</h1><p><strong>${doc.file}</strong> yüklenemedi.</p>`;
        }
    }

    // Routing
    function setActiveLink(id) {
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const el = document.getElementById(`nav-${id}`);
        if (el) el.classList.add('active');
    }

    function handleRoute() {
        hideLinkPreview();
        const hash = window.location.hash.substring(1).split('/')[0];
        if (!hash || hash === 'home') {
            setLogoOverride('');
            setPageMeta('');
            renderHome();
            setActiveLink('');
            mainContent.scrollTop = 0;
            return;
        }
        const doc = docsConfig.find(d => d.id === hash) || docsConfig[0];
        setLogoOverride(doc.id);
        setPageMeta(doc.id);
        loadDoc(doc).then(() => setActiveLink(doc.id));
        mainContent.scrollTop = 0;
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Search index
    const searchIndex = [];
    async function buildIndex() {
        for (const doc of docsConfig) {
            try {
                const r = await fetch(doc.file);
                const t = await r.text();
                searchIndex.push({...doc, content: t.toLowerCase() });
            } catch (e) {
                console.warn('Index error', doc.file);
            }
        }
    }
    buildIndex();

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';
        if (q.length < 3) { searchResults.classList.add('hidden'); return; }
        const results = searchIndex.filter(i => i.title.toLowerCase().includes(q) || i.content.includes(q));
        if (results.length === 0) searchResults.innerHTML = '<li>Sonuç bulunamadı.</li>';
        results.forEach(r => {
            const li = document.createElement('li');
            const idx = r.content.indexOf(q);
            let snippet = idx !== -1 ? '...' + r.content.substring(Math.max(0, idx - 30), Math.min(r.content.length, idx + q.length + 30)).replace(/\n/g, ' ') + '...' : r.content.substring(0, 60) + '...';
            li.innerHTML = `<strong>${r.title}</strong><span>${snippet}</span>`;
            li.addEventListener('click', () => {
                window.location.hash = `#${r.id}`;
                searchResults.classList.add('hidden');
                searchInput.value = '';
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) toggleMobileMenu();
            });
            searchResults.appendChild(li);
        });
        searchResults.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.add('hidden');
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js', {
                updateViaCache: 'none'
            }).then(reg => {
                reg.update();
                setInterval(() => reg.update(), 60 * 1000);
                if (reg.installing) {
                    reg.installing.addEventListener('statechange', () => {
                        if (reg.installing && reg.installing.state === 'installed' && navigator.serviceWorker.controller) {
                            window.location.reload();
                        }
                    });
                }
            }).catch(() => {});
        });
    }
});