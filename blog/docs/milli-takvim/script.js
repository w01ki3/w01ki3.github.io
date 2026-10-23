(function() {
    const MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const CELLS_PER_MONTH = 42;
    const HISTORICAL_EVENTS = window.MILLI_TAKVIM_EVENTS || [];
    const SHARE_LIB_URL = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';
    const SITE_URL = 'https://w01ki3.github.io';
    const MAIN_SHARE_URL = SITE_URL + '/blog/#milli-takvim';
    const SHARE_PAGE_BASE = SITE_URL + '/blog/docs/milli-takvim/paylas/';
    const TR_MAP = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
        'â': 'a', 'Â': 'a', 'î': 'i', 'Î': 'i', 'û': 'u', 'Û': 'u',
        'é': 'e', 'è': 'e', 'ê': 'e', 'á': 'a', 'à': 'a', 'ä': 'a',
        'å': 'a', 'ø': 'o', 'æ': 'ae', 'ô': 'o', 'ñ': 'n', 'ó': 'o',
        'ú': 'u', 'í': 'i'
    };

    let year = new Date().getFullYear();
    let shareLibPromise = null;
    let searchQuery = '';
    let currentDay = null;
    let shareCtx = null;
    let slugMap = null;

    function slugify(input) {
        return String(input)
            .replace(/[^\x00-\x7F]/g, function(ch) { return TR_MAP[ch] || ''; })
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-');
    }

    function ensureSlugMap() {
        if (slugMap) return slugMap;
        slugMap = {};
        const used = {};
        HISTORICAL_EVENTS.forEach(function(ev, index) {
            let base = slugify(ev.date + '-' + (ev.year || '') + '-' + ev.title);
            if (!base) base = 'olay-' + (index + 1);
            let slug = base;
            let n = 2;
            while (used[slug]) {
                slug = base + '-' + n;
                n += 1;
            }
            used[slug] = true;
            slugMap[ev.date + '||' + ev.title] = slug;
        });
        return slugMap;
    }

    function onEscape(e) {
        if (e.key !== 'Escape') return;
        const shareModal = document.getElementById('mt-share-modal');
        if (shareModal && !shareModal.hidden) {
            closeModal(shareModal);
            return;
        }
        const eventModal = document.getElementById('mt-event-modal');
        if (eventModal && !eventModal.hidden) closeModal(eventModal);
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function toKey(monthIndex, day) {
        return pad(monthIndex + 1) + '-' + pad(day);
    }

    function eventsForDay(monthIndex, day) {
        const key = toKey(monthIndex, day);
        return HISTORICAL_EVENTS.filter(function(ev) {
            return ev.date === key;
        });
    }

    function matchesSearch(ev) {
        if (!searchQuery) return false;
        const hay = (ev.title + ' ' + (ev.description || '')).toLowerCase();
        return hay.indexOf(searchQuery) !== -1;
    }

    function categoryLabel(cat) {
        if (cat === 'bayram') return 'Milli bayram';
        if (cat === 'anma') return 'Anma';
        return 'Tarihi olay';
    }

    function mondayOffset(y, monthIndex) {
        const dow = new Date(y, monthIndex, 1).getDay();
        return (dow + 6) % 7;
    }

    function daysInMonth(y, monthIndex) {
        return new Date(y, monthIndex + 1, 0).getDate();
    }

    function dayPosition(monthIndex, day) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(year, monthIndex, day);
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === today.getTime()) return 'today';
        if (date < today) return 'past';
        return 'future';
    }

    function renderYearGrid(container) {
        const today = new Date();
        container.innerHTML = '';

        for (let m = 0; m < 12; m++) {
            const monthEl = document.createElement('section');
            monthEl.className = 'mt-month';
            if (m === today.getMonth() && year === today.getFullYear()) {
                monthEl.classList.add('mt-month--current');
            }
            monthEl.setAttribute('aria-label', MONTH_NAMES[m] + ' ' + year);

            const title = document.createElement('h2');
            title.className = 'mt-month-title';
            title.textContent = MONTH_NAMES[m];
            monthEl.appendChild(title);

            const weekRow = document.createElement('div');
            weekRow.className = 'mt-weekdays';
            WEEKDAYS.forEach(function(d) {
                const el = document.createElement('span');
                el.textContent = d;
                weekRow.appendChild(el);
            });
            monthEl.appendChild(weekRow);

            const grid = document.createElement('div');
            grid.className = 'mt-days';

            const offset = mondayOffset(year, m);
            const total = daysInMonth(year, m);
            let cellCount = 0;
            let monthHasMatch = !searchQuery;

            for (let i = 0; i < offset; i++) {
                const empty = document.createElement('span');
                empty.className = 'mt-day mt-day--empty';
                empty.setAttribute('aria-hidden', 'true');
                grid.appendChild(empty);
                cellCount += 1;
            }

            for (let d = 1; d <= total; d++) {
                const pos = dayPosition(m, d);
                const dayEvents = eventsForDay(m, d);
                const el = document.createElement(dayEvents.length ? 'button' : 'span');
                if (dayEvents.length) el.type = 'button';
                el.className = 'mt-day mt-day--' + pos;
                el.textContent = String(d);

                if (dayEvents.length) {
                    el.classList.add('mt-day--event');
                    el.classList.add('mt-day--' + (dayEvents[0].category || 'tarih'));
                    el.setAttribute('aria-label', d + ' ' + MONTH_NAMES[m] + ', ' + dayEvents[0].title);

                    const badge = document.createElement('span');
                    badge.className = 'mt-badge';
                    badge.textContent = dayEvents.length > 1 ? String(dayEvents.length) : '';
                    el.appendChild(badge);

                    const dayMatches = dayEvents.some(matchesSearch);
                    if (dayMatches) {
                        el.classList.add('mt-day--match');
                        monthHasMatch = true;
                    }

                    el.addEventListener('click', function() {
                        openEventModal(m, d, dayEvents);
                    });
                }

                grid.appendChild(el);
                cellCount += 1;
            }

            while (cellCount < CELLS_PER_MONTH) {
                const empty = document.createElement('span');
                empty.className = 'mt-day mt-day--empty';
                empty.setAttribute('aria-hidden', 'true');
                grid.appendChild(empty);
                cellCount += 1;
            }

            monthEl.appendChild(grid);
            if (!monthHasMatch) monthEl.classList.add('mt-month--hidden');
            container.appendChild(monthEl);
        }
    }

    function openModal(el) {
        el.hidden = false;
        requestAnimationFrame(function() {
            el.classList.add('is-open');
        });
    }

    function closeModal(el) {
        el.classList.remove('is-open');
        window.setTimeout(function() {
            if (!el.classList.contains('is-open')) el.hidden = true;
        }, 280);
    }

    function ensureShareLib() {
        if (window.htmlToImage) return Promise.resolve(window.htmlToImage);
        if (shareLibPromise) return shareLibPromise;
        shareLibPromise = new Promise(function(resolve, reject) {
            const script = document.createElement('script');
            script.src = SHARE_LIB_URL;
            script.onload = function() { resolve(window.htmlToImage); };
            script.onerror = function() {
                shareLibPromise = null;
                reject(new Error('Paylaşım kütüphanesi yüklenemedi'));
            };
            document.body.appendChild(script);
        });
        return shareLibPromise;
    }

    function buildShareStage(single) {
        const eventModal = document.getElementById('mt-event-modal');
        const panel = eventModal ? eventModal.querySelector('.mt-modal-panel') : null;
        if (!panel) return null;

        const clone = panel.cloneNode(true);
        clone.removeAttribute('role');
        clone.removeAttribute('aria-modal');
        clone.removeAttribute('aria-labelledby');
        clone.querySelectorAll('[id]').forEach(function(el) { el.removeAttribute('id'); });
        clone.querySelectorAll('[data-mt-close], .mt-modal-close, .mt-modal-actions, .mt-event-share, .mt-modal-kicker').forEach(function(el) {
            el.remove();
        });

        if (single) {
            clone.querySelectorAll('.mt-event-card, .mt-event-group-title').forEach(function(el) { el.remove(); });
            const title = clone.querySelector('h2');
            const meta = clone.querySelector('.mt-modal-meta');
            const desc = clone.querySelector('.mt-modal-desc');
            if (title) title.textContent = single.title || '';
            if (meta) meta.textContent = single.day + ' ' + MONTH_NAMES[single.monthIndex] +
                (single.year ? ' ' + single.year : '');
            if (desc) desc.textContent = single.description || '';
        }

        const stage = document.createElement('div');
        stage.className = 'mt-share-stage';
        stage.appendChild(clone);
        document.body.appendChild(stage);
        return stage;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    function shareStage(stage, filename) {
        const node = stage.firstElementChild;
        const titleEl = node.querySelector('h2');
        const shareTitle = titleEl ? titleEl.textContent : 'Milli Takvim';
        return ensureShareLib().then(function(lib) {
            return lib.toBlob(node, {
                pixelRatio: 2,
                backgroundColor: getComputedStyle(node).backgroundColor || '#ffffff',
                cacheBust: true
            });
        }).then(function(blob) {
            if (!blob) throw new Error('Görsel üretilemedi');
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                return navigator.share({ files: [file], title: shareTitle, text: shareTitle })
                    .catch(function(err) {
                        if (err && err.name === 'AbortError') return null;
                        downloadBlob(blob, filename);
                        return null;
                    });
            }
            downloadBlob(blob, filename);
            return null;
        });
    }

    function slugForEvent(ev) {
        const map = ensureSlugMap();
        return map[ev.date + '||' + ev.title] || null;
    }

    function eventBySlug(slug) {
        const map = ensureSlugMap();
        for (let i = 0; i < HISTORICAL_EVENTS.length; i++) {
            const ev = HISTORICAL_EVENTS[i];
            if (map[ev.date + '||' + ev.title] === slug) return ev;
        }
        return null;
    }

    function eventShareContext(ev, monthIndex, day) {
        const slug = slugForEvent(ev);
        return {
            title: ev.title,
            meta: day + ' ' + MONTH_NAMES[monthIndex] + (ev.year ? ' ' + ev.year : ''),
            description: ev.description || '',
            shareUrl: slug ? SHARE_PAGE_BASE + slug + '.html' : MAIN_SHARE_URL,
            shareText: ev.title + (ev.year ? ' (' + ev.year + ')' : '') + ' · Milli Takvim',
            filename: 'milli-takvim-' + pad(day) + '-' + pad(monthIndex + 1) + '.png',
            makeStage: function() {
                return buildShareStage({
                    title: ev.title,
                    description: ev.description || '',
                    category: ev.category,
                    year: ev.year,
                    monthIndex: monthIndex,
                    day: day
                });
            }
        };
    }

    function panelShareContext() {
        return {
            title: 'Milli Takvim',
            meta: 'Milli Takvim',
            description: 'Tarihteki önemli olaylar ve milli günler',
            shareUrl: MAIN_SHARE_URL,
            shareText: 'Milli Takvim · Tarihteki önemli olaylar ve milli günler',
            filename: 'milli-takvim.png',
            makeStage: function() { return buildShareStage(null); }
        };
    }

    function showToast(message) {
        let toast = document.getElementById('mt-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mt-toast';
            toast.className = 'mt-toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(showToast._timer);
        showToast._timer = window.setTimeout(function() {
            toast.classList.remove('is-visible');
        }, 2800);
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function(resolve, reject) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                ta.remove();
            }
        });
    }

    function openShareModal(ctx) {
        const modal = document.getElementById('mt-share-modal');
        if (!modal) return;
        shareCtx = ctx;
        const titleEl = document.getElementById('mt-share-title');
        if (titleEl) titleEl.textContent = ctx.meta || ctx.title || 'Milli Takvim';
        const descEl = document.getElementById('mt-share-desc');
        if (descEl) descEl.textContent = ctx.description || '';
        openModal(modal);
    }

    function openPopup(url) {
        const win = window.open(url, '_blank', 'noopener,noreferrer,width=680,height=680');
        if (win) win.focus();
    }

    function shareToInstagram() {
        if (!shareCtx) return;
        const url = shareCtx.shareUrl;
        const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (isTouch && typeof navigator.share === 'function') {
            navigator.share({ title: shareCtx.title, text: shareCtx.shareText, url: url })
                .catch(function(err) {
                    if (err && err.name === 'AbortError') return;
                    copyText(url).then(function() {
                        showToast('Bağlantı kopyalandı. Instagram\'a yapıştırabilirsiniz.');
                    }).catch(function() { showToast('Bağlantı kopyalanamadı.'); });
                });
            return;
        }
        copyText(url).then(function() {
            showToast('Bağlantı kopyalandı. Instagram\'a yapıştırabilirsiniz.');
        }).catch(function() {
            showToast('Bağlantı kopyalanamadı.');
        });
    }

    function shareToSocial(network) {
        if (!shareCtx) return;
        const url = shareCtx.shareUrl;
        const text = shareCtx.shareText;
        const encUrl = encodeURIComponent(url);

        if (network === 'x') {
            openPopup('https://twitter.com/intent/tweet?url=' + encUrl + '&text=' + encodeURIComponent(text));
        } else if (network === 'facebook') {
            openPopup('https://www.facebook.com/sharer/sharer.php?u=' + encUrl);
        } else if (network === 'linkedin') {
            openPopup('https://www.linkedin.com/sharing/share-offsite/?url=' + encUrl);
        } else if (network === 'whatsapp') {
            openPopup('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url));
        } else if (network === 'instagram') {
            shareToInstagram();
        }
    }

    function runShareImage(btn) {
        if (!shareCtx) return;
        const stage = shareCtx.makeStage();
        if (!stage) return;
        btn.disabled = true;
        shareStage(stage, shareCtx.filename)
            .catch(function(err) { console.error('Paylaşım hatası:', err); })
            .then(function() {
                stage.remove();
                btn.disabled = false;
            });
    }

    function openEventModal(monthIndex, day, dayEvents) {
        const modal = document.getElementById('mt-event-modal');
        currentDay = { monthIndex: monthIndex, day: day, events: dayEvents };
        const kicker = document.getElementById('mt-modal-kicker');
        const title = document.getElementById('mt-modal-title');
        const meta = document.getElementById('mt-modal-meta');
        const desc = document.getElementById('mt-modal-desc');
        const list = document.getElementById('mt-modal-list');
        const first = dayEvents[0];

        kicker.textContent = categoryLabel(first.category);
        title.textContent = first.title;
        meta.textContent = day + ' ' + MONTH_NAMES[monthIndex] + (first.year ? ' ' + first.year : '');
        desc.textContent = first.description || '';
        list.innerHTML = '';

        if (dayEvents.length > 1) {
            const categoryOrder = ['bayram', 'tarih', 'anma'];
            const grouped = {};
            dayEvents.forEach(function(ev) {
                const cat = ev.category || 'tarih';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(ev);
            });

            title.textContent = day + ' ' + MONTH_NAMES[monthIndex];
            desc.textContent = '';
            meta.textContent = '';
            kicker.textContent = '';

            categoryOrder.forEach(function(cat) {
                const events = grouped[cat];
                if (!events || events.length === 0) return;

                const groupHeader = document.createElement('h5');
                groupHeader.className = 'mt-event-group-title';
                groupHeader.textContent = categoryLabel(cat);
                list.appendChild(groupHeader);

                events.forEach(function(ev) {
                    const item = document.createElement('article');
                    item.className = 'mt-event-card';
                    const h = document.createElement('h4');
                    h.textContent = ev.title;
                    const p = document.createElement('p');
                    p.textContent = (ev.year ? ev.year + ' · ' : '') + (ev.description || '');
                    item.appendChild(h);
                    item.appendChild(p);

                    const shareBtn = document.createElement('button');
                    shareBtn.type = 'button';
                    shareBtn.className = 'mt-event-share';
                    shareBtn.innerHTML = '<i class="fa-solid fa-share" aria-hidden="true"></i><span>Paylaş</span>';
                    shareBtn.setAttribute('aria-label', ev.title + ' olayını paylaş');
                    shareBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        openShareModal(eventShareContext(ev, monthIndex, day));
                    });
                    item.appendChild(shareBtn);

                    list.appendChild(item);
                });
            });
        }

        openModal(modal);
    }

    function refresh() {
        const grid = document.getElementById('mt-year-grid');
        if (grid) renderYearGrid(grid);
    }

    function init() {
        const root = document.getElementById('milli-takvim');
        if (!root) return;

        document.body.classList.add('mt-page');
        year = new Date().getFullYear();
        searchQuery = '';

        const today = new Date();
        const todayLabel = document.getElementById('mt-today-label');
        const search = document.getElementById('mt-search');
        const eventModal = document.getElementById('mt-event-modal');

        todayLabel.textContent = today.getDate() + ' ' + MONTH_NAMES[today.getMonth()] + ' ' + year;

        refresh();

        search.addEventListener('input', function() {
            searchQuery = search.value.trim().toLowerCase();
            refresh();
        });

        eventModal.querySelectorAll('[data-mt-close]').forEach(function(el) {
            el.addEventListener('click', function() { closeModal(eventModal); });
        });

        const shareBtn = document.getElementById('mt-modal-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                if (currentDay && currentDay.events.length === 1) {
                    openShareModal(eventShareContext(currentDay.events[0], currentDay.monthIndex, currentDay.day));
                } else {
                    openShareModal(panelShareContext());
                }
            });
        }

        const shareModal = document.getElementById('mt-share-modal');
        if (shareModal) {
            shareModal.querySelectorAll('[data-mt-share-close]').forEach(function(el) {
                el.addEventListener('click', function() { closeModal(shareModal); });
            });
            const imageBtn = document.getElementById('mt-share-image-btn');
            if (imageBtn) {
                imageBtn.addEventListener('click', function() { runShareImage(imageBtn); });
            }
            shareModal.querySelectorAll('[data-mt-social]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    shareToSocial(btn.getAttribute('data-mt-social'));
                });
            });
        }

        document.addEventListener('keydown', onEscape);

        const deepMatch = (window.location.hash || '').match(/^#milli-takvim\/(.+)$/);
        const deepEvent = deepMatch ? eventBySlug(decodeURIComponent(deepMatch[1])) : null;

        if (deepEvent) {
            const deepMonth = parseInt(deepEvent.date.slice(0, 2), 10) - 1;
            const deepDay = parseInt(deepEvent.date.slice(3, 5), 10);
            const dayEvents = eventsForDay(deepMonth, deepDay);
            window.setTimeout(function() {
                openEventModal(deepMonth, deepDay, dayEvents.length ? dayEvents : [deepEvent]);
            }, 500);
        } else {
            const todayEvents = eventsForDay(today.getMonth(), today.getDate());
            if (todayEvents.length > 0) {
                window.setTimeout(function() {
                    openEventModal(today.getMonth(), today.getDate(), todayEvents);
                }, 650);
            }
        }
    }

    function destroy() {
        document.body.classList.remove('mt-page');
        document.removeEventListener('keydown', onEscape);
    }

    window.MilliTakvim = {
        init: init,
        destroy: destroy,
        events: HISTORICAL_EVENTS
    };
})();