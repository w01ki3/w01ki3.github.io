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
        return theme === 'light' ? 'images/logo-white.png' : 'images/logo.png';
    }

    function updateLogos(theme) {
        const src = getLogoSrc(theme);
        document.querySelectorAll('img.mobile-logo, img.brand-logo, img.hero-logo').forEach(img => {
            if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const icon = theme === 'dark' ? '🌙' : '🌞';
        [themeToggleDesktop, themeToggleMobile].forEach(btn => {
            if (!btn) return;
            const span = btn.querySelector('.theme-icon');
            if (span) span.textContent = icon;
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

    // Render simple homepage (only logo + title)
    function renderHome() {
        contentEl.innerHTML = `
            <section class="home-hero simple-hero">
                <img src="${getLogoSrc(document.documentElement.getAttribute('data-theme'))}" class="hero-logo" alt="TSH logo" />
                <h1>Türk Sahası Eğitim Programı</h1>
            </section>
        `;
    }

    // Load a markdown doc
    async function loadDoc(doc) {
        try {
            const res = await fetch(doc.file);
            if (!res.ok) throw new Error('Not found');
            const text = await res.text();
            contentEl.innerHTML = marked.parse(text);
        } catch (e) {
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
        const hash = window.location.hash.substring(1);
        if (!hash || hash === 'home') {
            renderHome();
            setActiveLink('');
            mainContent.scrollTop = 0;
            return;
        }
        const doc = docsConfig.find(d => d.id === hash) || docsConfig[0];
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
});