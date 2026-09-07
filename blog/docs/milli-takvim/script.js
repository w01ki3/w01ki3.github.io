(function() {
    const MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const CELLS_PER_MONTH = 42;
    const HISTORICAL_EVENTS = window.MILLI_TAKVIM_EVENTS || [];

    let year = new Date().getFullYear();
    let searchQuery = '';

    function onEscape(e) {
        if (e.key !== 'Escape') return;
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

    function openEventModal(monthIndex, day, dayEvents) {
        const modal = document.getElementById('mt-event-modal');
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

        document.addEventListener('keydown', onEscape);

        const todayEvents = eventsForDay(today.getMonth(), today.getDate());
        if (todayEvents.length > 0) {
            window.setTimeout(function() {
                openEventModal(today.getMonth(), today.getDate(), todayEvents);
            }, 650);
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