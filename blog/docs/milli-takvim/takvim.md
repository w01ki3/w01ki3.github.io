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
        <div class="mt-modal-actions">
            <button type="button" class="mt-share-btn" id="mt-modal-share"><i class="fa-solid fa-share" aria-hidden="true"></i><span>Paylaş</span></button>
        </div>
    </div>
</div>

<div class="mt-modal mt-share-modal" id="mt-share-modal" hidden>
    <div class="mt-modal-backdrop" data-mt-share-close></div>
    <div class="mt-modal-panel" role="dialog" aria-modal="true" aria-labelledby="mt-share-title">
        <button type="button" class="mt-modal-close" data-mt-share-close aria-label="Kapat">×</button>
        <p class="mt-modal-kicker">Paylaş</p>
        <h2 id="mt-share-title">Milli Takvim</h2>
        <p class="mt-share-desc" id="mt-share-desc"></p>        
        <p class="mt-share-divider"><span>Sosyal medyada paylaş</span></p>
        <div class="mt-share-social" id="mt-share-social">
            <button type="button" class="mt-social-btn mt-social-x" data-mt-social="x" title="X" aria-label="X (Twitter)'da paylaş"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></button>
            <button type="button" class="mt-social-btn mt-social-facebook" data-mt-social="facebook" title="Facebook" aria-label="Facebook'ta paylaş"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></button>
            <button type="button" class="mt-social-btn mt-social-instagram" data-mt-social="instagram" title="Instagram" aria-label="Instagram için bağlantıyı kopyala"><i class="fa-brands fa-instagram" aria-hidden="true"></i></button>
            <button type="button" class="mt-social-btn mt-social-linkedin" data-mt-social="linkedin" title="LinkedIn" aria-label="LinkedIn'de paylaş"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></button>
            <button type="button" class="mt-social-btn mt-social-whatsapp" data-mt-social="whatsapp" title="WhatsApp" aria-label="WhatsApp'ta paylaş"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></button>
        </div>
        <button type="button" class="mt-share-image-btn" id="mt-share-image-btn">
            <i class="fa-solid fa-image" aria-hidden="true"></i>
            <span>Görsel paylaş</span>
        </button>
    </div>
</div>
