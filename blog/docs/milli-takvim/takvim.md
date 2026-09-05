<div class="milli-takvim" id="milli-takvim">
    <header class="mt-header">
        <p class="mt-kicker">Milli Takvim</p>
        <p class="mt-today-label" id="mt-today-label"></p>
        <label class="mt-search">
            <span class="visually-hidden">Olay ara</span>
            <input type="text" id="mt-search" placeholder="Ara…" autocomplete="off">
        </label>
    </header>
    <div class="mt-legend">
        <span><i class="mt-dot mt-dot-tarih"></i> Tarihi olay</span>
        <span><i class="mt-dot mt-dot-bayram"></i> Milli bayram</span>
        <span><i class="mt-dot mt-dot-anma"></i> Anma</span>
    </div>
    <div class="mt-year-grid" id="mt-year-grid"></div>
</div>

<div class="mt-modal" id="mt-event-modal" hidden>
    <div class="mt-modal-backdrop" data-mt-close></div>
    <div class="mt-modal-panel" role="dialog" aria-modal="true" aria-labelledby="mt-modal-title">
        <button type="button" class="mt-modal-close" data-mt-close aria-label="Kapat">×</button>
        <p class="mt-modal-kicker" id="mt-modal-kicker"></p>
        <h2 id="mt-modal-title"></h2>
        <p class="mt-modal-meta" id="mt-modal-meta"></p>
        <p class="mt-modal-desc" id="mt-modal-desc"></p>
        <div class="mt-modal-list" id="mt-modal-list"></div>
    </div>
</div>
