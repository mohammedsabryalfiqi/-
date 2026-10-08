/* ==========================================================================
   مكتبة الخطوط العربية — Arabic Font Library (frontend)
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------ i18n ---------------------------------- */
  const I18N = {
    ar: {
      'brand.title': 'مكتبة الخطوط العربية',
      'nav.upload': 'رفع خطوط',
      'theme.toggle': 'تبديل المظهر',
      'search.placeholder': 'ابحث باسم الخط أو المصمم أو الوسم…',
      'hero.eyebrow': 'مكتبة خطوط مفتوحة · استضافة ذاتية',
      'hero.title': 'اكتشف الخط العربي المناسب في ثوانٍ',
      'hero.lead': 'ارفع خطوطك مرة واحدة، وستُحفظ على السيرفر داخل مكتبتك الخاصة. اكتب جملة المعاينة وستظهر أسفل اسم كل خط بخطّه نفسه — لتتعرّف على الخط الذي تبحث عنه بلمحة واحدة.',
      'hero.cta.upload': 'ارفع مكتبة الخطوط',
      'hero.cta.browse': 'تصفّح المكتبة',
      'showcase.label': 'معاينة حيّة',
      'filter.all': 'الكل',
      'filter.arabic': 'يدعم العربية',
      'filter.variable': 'خطوط متغيّرة',
      'filter.static': 'خطوط ثابتة',
      'filter.latin': 'يدعم اللاتينية',
      'sort.recent': 'الأحدث إضافة',
      'sort.name': 'الاسم (أ - ي)',
      'sort.size': 'الحجم',
      'sort.downloads': 'الأكثر تحميلًا',
      'preview.size': 'حجم المعاينة',
      'preview.sample.placeholder': 'اكتب جملة المعاينة التي ستظهر أسفل اسم كل خط…',
      'preview.sample.hint': 'تُحفظ في المتصفح · Enter للتطبيق',
      'results.title': 'المكتبة',
      'results.more': 'عرض المزيد',
      'results.searching': 'نتائج البحث عن: {q}',
      'results.count': '{n} خطًا',
      'results.none.title': 'لا توجد خطوط بعد',
      'results.none.text': 'ارفع أول خط عربي لتبدأ مكتبتك. سيُحفظ الخط على السيرفر ويمكن تصفّحه في أي وقت.',
      'results.nomatch.title': 'لا نتائج مطابقة',
      'results.nomatch.text': 'جرّب كلمة أخرى أو أزل عوامل التصفية.',
      'results.clear': 'مسح البحث',
      'stats.fonts': 'إجمالي الخطوط',
      'stats.arabic': 'تدعم العربية',
      'stats.variable': 'خطوط متغيّرة',
      'stats.size': 'حجم المكتبة',
      'card.detail': 'التفاصيل',
      'card.download': 'تنزيل',
      'card.copy': 'نسخ CSS',
      'card.delete': 'حذف',
      'card.sample': 'معاينة',
      'badge.arabic': 'عربي',
      'badge.latin': 'لاتيني',
      'badge.variable': 'متغيّر',
      'badge.static': 'ثابت',
      'upload.title': 'رفع خطوط إلى المكتبة',
      'upload.drop.title': 'اسحب ملفات الخطوط هنا أو اضغط للاختيار',
      'upload.drop.text': 'TTF · OTF · WOFF · WOFF2 — حتى ٦٤ ميجابايت للملف، ويمكن رفع عدة خطوط معًا',
      'upload.name': 'اسم الخط (اختياري — يُقترح تلقائيًا)',
      'upload.tags': 'وسوم (افصل بفاصلة)',
      'upload.sample': 'جملة معاينة خاصة بهذا الخط (اختياري)',
      'upload.note': 'ملاحظة (المصدر، الرخصة…)',
      'upload.force': 'أضف حتى لو كان الخط موجودًا مسبقًا (نفس البصمة)',
      'upload.go': 'ابدأ الرفع',
      'upload.selected': 'تم اختيار {n} ملفًا',
      'upload.uploading': 'جارٍ الرفع… {p}%',
      'upload.done': 'تم رفع {n} خطًا بنجاح',
      'upload.partial': 'تم رفع {ok} خطًا، وفشل {err}',
      'upload.dup': 'موجود مسبقًا',
      'upload.ok': 'تم',
      'upload.fail': 'فشل',
      'upload.nothing': 'اختر ملفات الخطوط أولًا',
      'btn.cancel': 'إلغاء',
      'toast.copied': 'تم نسخ كود CSS',
      'toast.copyerr': 'تعذر النسخ — انسخ يدويًا',
      'toast.deleted': 'تم حذف الخط',
      'toast.deleteerr': 'تعذر حذف الخط',
      'toast.saved': 'تم حفظ التعديلات',
      'toast.saveerr': 'تعذر الحفظ',
      'toast.uploaded': 'تمت إضافة {n} خطًا إلى المكتبة',
      'toast.uploaderr': 'فشل الرفع: {m}',
      'detail.sample.title': 'جملة المعاينة',
      'detail.sample.save': 'حفظ الجملة',
      'detail.sample.global': 'استخدم الجملة العامة',
      'detail.embed': 'تضمين في موقعك',
      'detail.meta': 'بيانات الخط',
      'detail.glyphs': 'عيّنات الحروف',
      'detail.file': 'الملف',
      'detail.format': 'الصيغة',
      'detail.size': 'الحجم',
      'detail.version': 'الإصدار',
      'detail.designer': 'المصمم',
      'detail.license': 'الرخصة',
      'detail.created': 'تاريخ الإضافة',
      'detail.downloads': 'مرات التنزيل',
      'detail.axes': 'محاور متغيّرة',
      'detail.nameLabel': 'اسم الخط',
      'detail.arabicNameLabel': 'الاسم العربي',
      'detail.tagsLabel': 'الوسوم',
      'detail.noteLabel': 'ملاحظة',
      'detail.save': 'حفظ',
      'detail.edit': 'تحرير البيانات',
      'confirm.delete': 'هل تريد حذف "{name}" نهائيًا من السيرفر؟',
      'view.grid': 'عرض شبكي',
      'view.list': 'عرض قائمة',
      'footer.rights': 'مكتبة الخطوط العربية — جميع الخطوط المرفوعة تبقى ملك أصحابها.',
      'footer.api': 'واجهة برمجية (API)',
      'footer.export': 'نسخة احتياطية JSON',
      'footer.widget': 'أداة التضمين',
      'lang.switch': 'English',
    },
    en: {
      'brand.title': 'Arabic Font Library',
      'nav.upload': 'Upload fonts',
      'theme.toggle': 'Toggle theme',
      'search.placeholder': 'Search by font name, designer or tag…',
      'hero.eyebrow': 'Open font library · self-hosted',
      'hero.title': 'Find the right Arabic typeface in seconds',
      'hero.lead': 'Upload your fonts once — they are stored on your own server. Type a preview sentence and it appears under every font name, rendered in that very font, so you spot the one you need at a glance.',
      'hero.cta.upload': 'Upload your library',
      'hero.cta.browse': 'Browse library',
      'showcase.label': 'Live preview',
      'filter.all': 'All',
      'filter.arabic': 'Arabic support',
      'filter.variable': 'Variable',
      'filter.static': 'Static',
      'filter.latin': 'Latin support',
      'sort.recent': 'Newest first',
      'sort.name': 'Name (A–Z)',
      'sort.size': 'File size',
      'sort.downloads': 'Most downloaded',
      'preview.size': 'Preview size',
      'preview.sample.placeholder': 'Type the preview sentence shown under each font name…',
      'preview.sample.hint': 'Saved in your browser · press Enter to apply',
      'results.title': 'Library',
      'results.more': 'Load more',
      'results.searching': 'Search results for: {q}',
      'results.count': '{n} fonts',
      'results.none.title': 'No fonts yet',
      'results.none.text': 'Upload your first Arabic font to start the library. It is stored on the server and browsable anytime.',
      'results.nomatch.title': 'No matches',
      'results.nomatch.text': 'Try another keyword or clear the filters.',
      'results.clear': 'Clear search',
      'stats.fonts': 'Total fonts',
      'stats.arabic': 'Arabic support',
      'stats.variable': 'Variable fonts',
      'stats.size': 'Library size',
      'card.detail': 'Details',
      'card.download': 'Download',
      'card.copy': 'Copy CSS',
      'card.delete': 'Delete',
      'card.sample': 'Preview',
      'badge.arabic': 'ARABIC',
      'badge.latin': 'LATIN',
      'badge.variable': 'VARIABLE',
      'badge.static': 'STATIC',
      'upload.title': 'Upload fonts to the library',
      'upload.drop.title': 'Drag font files here or click to choose',
      'upload.drop.text': 'TTF · OTF · WOFF · WOFF2 — up to 64 MB per file, multiple files allowed',
      'upload.name': 'Font name (optional — auto-detected)',
      'upload.tags': 'Tags (comma separated)',
      'upload.sample': 'Custom preview sentence for this font (optional)',
      'upload.note': 'Note (source, license…)',
      'upload.force': 'Upload even if an identical font already exists',
      'upload.go': 'Start upload',
      'upload.selected': '{n} file(s) selected',
      'upload.uploading': 'Uploading… {p}%',
      'upload.done': '{n} font(s) uploaded successfully',
      'upload.partial': '{ok} uploaded, {err} failed',
      'upload.dup': 'already exists',
      'upload.ok': 'done',
      'upload.fail': 'failed',
      'upload.nothing': 'Choose font files first',
      'btn.cancel': 'Cancel',
      'toast.copied': 'CSS copied to clipboard',
      'toast.copyerr': 'Copy failed — please copy manually',
      'toast.deleted': 'Font deleted',
      'toast.deleteerr': 'Could not delete the font',
      'toast.saved': 'Changes saved',
      'toast.saveerr': 'Could not save',
      'toast.uploaded': '{n} font(s) added to the library',
      'toast.uploaderr': 'Upload failed: {m}',
      'detail.sample.title': 'Preview sentence',
      'detail.sample.save': 'Save sentence',
      'detail.sample.global': 'Use global sentence',
      'detail.embed': 'Embed in your site',
      'detail.meta': 'Font metadata',
      'detail.glyphs': 'Glyph samples',
      'detail.file': 'File',
      'detail.format': 'Format',
      'detail.size': 'Size',
      'detail.version': 'Version',
      'detail.designer': 'Designer',
      'detail.license': 'License',
      'detail.created': 'Added',
      'detail.downloads': 'Downloads',
      'detail.axes': 'Variable axes',
      'detail.nameLabel': 'Font name',
      'detail.arabicNameLabel': 'Arabic name',
      'detail.tagsLabel': 'Tags',
      'detail.noteLabel': 'Note',
      'detail.save': 'Save',
      'detail.edit': 'Edit metadata',
      'confirm.delete': 'Permanently delete "{name}" from the server?',
      'view.grid': 'Grid view',
      'view.list': 'List view',
      'footer.rights': 'Arabic Font Library — all uploaded fonts remain the property of their owners.',
      'footer.api': 'API',
      'footer.export': 'JSON backup',
      'footer.widget': 'Embed widget',
      'lang.switch': 'العربية',
    },
  };

  const DEFAULT_SAMPLE = {
    ar: 'الخطّ العربي فنٌّ وحضارة — أبجد هوّز حطّي كلمن سعفص',
    en: 'The quick brown fox jumps over the lazy dog 0123456789',
  };

  const LS = {
    sample: 'afl.sample',
    theme: 'afl.theme',
    lang: 'afl.lang',
    size: 'afl.previewSize',
    view: 'afl.view',
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* ignore */ }
    },
  };

  /* ------------------------------ state --------------------------------- */
  const state = {
    lang: store.get(LS.lang, 'ar'),
    theme: store.get(LS.theme, 'dark'),
    sample: store.get(LS.sample, ''),
    previewSize: Number(store.get(LS.size, 34)) || 34,
    view: store.get(LS.view, 'grid'),
    query: '',
    filter: '',
    sort: 'recent',
    limit: 36,
    fonts: [],
    counts: null,
    loading: false,
    showcase: [],
    showcaseIndex: 0,
  };

  const t = (key, vars = {}) => {
    const dict = I18N[state.lang] || I18N.ar;
    let text = dict[key] ?? I18N.ar[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };

  const sampleText = () => state.sample || DEFAULT_SAMPLE[state.lang] || DEFAULT_SAMPLE.ar;
  const nf = (n) => new Intl.NumberFormat(state.lang === 'ar' ? 'ar-EG' : 'en-US').format(n || 0);

  const fmtBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    const num = v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1);
    return `${num} ${units[i]}`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG' : 'en-GB',
        { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso));
    } catch { return iso.slice(0, 10); }
  };

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const fontFamily = (font) => `AFL_${String(font.id).replace(/[^A-Za-z0-9_]/g, '')}`;

  /* ---------------------------- api client ------------------------------ */
  const api = {
    async list() {
      const params = new URLSearchParams();
      if (state.query) params.set('q', state.query);
      if (state.filter) params.set('filter', state.filter);
      params.set('sort', state.sort);
      params.set('limit', String(state.limit));
      const res = await fetch(`/api/fonts?${params}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    async patch(id, payload) {
      const res = await fetch(`/api/fonts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
    async remove(id) {
      const res = await fetch(`/api/fonts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
  };

  /* ---------------------------- font loading ---------------------------- */
  const loadedFamilies = new Set();
  const observedEls = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      loadFontFor(entry.target);
    }
  }, { rootMargin: '400px 0px' });

  async function loadFontFor(el) {
    const { fontId, fontUrl } = el.dataset;
    if (!fontId || !fontUrl) return;
    const family = fontFamily({ id: fontId });
    if (loadedFamilies.has(family)) {
      el.style.fontFamily = `"${family}", var(--ui-font)`;
      el.classList.add('loaded');
      return;
    }
    try {
      const face = new FontFace(family, `url("${fontUrl}")`, { display: 'swap' });
      await face.load();
      document.fonts.add(face);
      loadedFamilies.add(family);
      el.style.fontFamily = `"${family}", var(--ui-font)`;
      requestAnimationFrame(() => el.classList.add('loaded'));
    } catch {
      el.classList.add('loaded');
    }
  }

  function observePreview(el) { observedEls.add(el); observer.observe(el); }
  function unobserveAll() {
    for (const el of observedEls) observer.unobserve(el);
    observedEls.clear();
  }

  /* ------------------------------ toasts -------------------------------- */
  function toast(message, kind = 'ok', timeout = 4200) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        ${kind === 'err' ? '<path d="M12 8v5m0 3.5h.01"/><circle cx="12" cy="12" r="9"/>' : '<path d="M5 12l5 5L19 7"/>'}
      </svg>
      <span style="flex:1">${esc(message)}</span>
      <button aria-label="close"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
    el.querySelector('button').addEventListener('click', () => el.remove());
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, timeout);
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || t('toast.copied'));
    } catch {
      // fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const done = document.execCommand && document.execCommand('copy');
      ta.remove();
      toast(done ? (okMsg || t('toast.copied')) : t('toast.copyerr'), done ? 'ok' : 'err');
    }
  }

  /* ------------------------------- render ------------------------------- */
  function renderStats() {
    const c = state.counts || { total: 0, arabic: 0, variable: 0, bytes: 0 };
    const items = [
      [nf(c.total), t('stats.fonts')],
      [nf(c.arabic), t('stats.arabic')],
      [nf(c.variable), t('stats.variable')],
      [fmtBytes(c.bytes), t('stats.size')],
    ];
    $('#stats').innerHTML = items
      .map(([value, label]) => `<div class="stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`)
      .join('');
  }

  function badgeList(font) {
    const badges = [];
    if (font.arabic) badges.push(`<span class="badge accent">${esc(t('badge.arabic'))}</span>`);
    if (font.variable) badges.push(`<span class="badge teal">${esc(t('badge.variable'))}</span>`);
    badges.push(`<span class="badge">${esc((font.format || 'ttf').toUpperCase())}</span>`);
    return badges.join('');
  }

  function cardHTML(font) {
    const tags = (font.tags || []).slice(0, 3).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('');
    return `
    <article class="card" data-id="${esc(font.id)}" tabindex="0" role="button"
             aria-label="${esc(font.name)}">
      <div class="card-head">
        <div class="card-title">
          <div class="card-name" title="${esc(font.name)}">${esc(font.name)}${
            font.nameArabic ? `<span class="ar">${esc(font.nameArabic)}</span>` : ''}</div>
          <div class="card-sub">
            ${font.style ? `<span>${esc(font.style)}</span>` : ''}
            ${font.designer ? `<span>· ${esc(font.designer)}</span>` : ''}
            ${font.numGlyphs ? `<span>· ${nf(font.numGlyphs)} محرف</span>` : ''}
          </div>
          <div class="badges">${badgeList(font)}${tags}</div>
        </div>
        <div class="card-actions">
          <button class="icon-btn" data-act="download" title="${esc(t('card.download'))}" data-id="${esc(font.id)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 4v12m0 0-4.5-4.5M12 16l4.5-4.5"/><path d="M4 20h16"/></svg>
          </button>
          <button class="icon-btn" data-act="css" title="${esc(t('card.copy'))}" data-id="${esc(font.id)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="m9 8-5 4 5 4M15 8l5 4-5 4"/></svg>
          </button>
          <button class="icon-btn" data-act="delete" title="${esc(t('card.delete'))}" data-id="${esc(font.id)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>
      </div>

      <div class="card-preview" data-open="${esc(font.id)}" title="${esc(t('card.detail'))}">
        <div class="preview-text" dir="auto" title="${esc(font.sample || sampleText())}"
             data-font-id="${esc(font.id)}"
             data-font-url="${esc(font.url)}">${esc(font.sample || sampleText())}</div>
      </div>

      <div class="card-foot">
        <span>${esc(fmtBytes(font.size))}</span>
        <span class="sep">•</span>
        <span>${esc(fmtDate(font.addedAt))}</span>
        ${font.downloads ? `<span class="sep">•</span><span>${nf(font.downloads)} تنزيل</span>` : ''}
        <span class="spacer"></span>
        <span style="color:var(--accent);opacity:.85">${esc(t('card.detail'))} ←</span>
      </div>
    </article>`;
  }

  function renderGrid() {
    const grid = $('#grid');
    unobserveAll();
    grid.innerHTML = state.fonts.map(cardHTML).join('');
    $$('.preview-text', grid).forEach(observePreview);

    if (!state.fonts.length) {
      const searching = state.query || state.filter;
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <path d="M5 19c5 0 6.6-3 6.6-7.2C11.6 7.6 9.6 4 5 4"/><path d="M14 19h5"/><path d="M17 4c1.8 2.6 2.4 5 2.4 7.2 0 2.2-1.1 3.7-3.7 3.7"/>
          </svg>
          <h3>${esc(t(searching ? 'results.nomatch.title' : 'results.none.title'))}</h3>
          <p>${esc(t(searching ? 'results.nomatch.text' : 'results.none.text'))}</p>
          ${searching
            ? `<button class="btn" id="btn-clear-search">${esc(t('results.clear'))}</button>`
            : `<button class="btn btn-primary" data-upload-trigger>${esc(t('hero.cta.upload'))}</button>`}
        </div>`;
      const clear = $('#btn-clear-search');
      if (clear) clear.addEventListener('click', clearSearch);
      return;
    }

  }

  function renderResultsHead() {
    $('#results-title').textContent = state.query
      ? t('results.searching', { q: state.query })
      : t('results.title');
    const shown = state.fonts.length;
    const total = typeof state.total === 'number' ? state.total : shown;
    $('#results-meta').textContent = `${t('results.count', { n: nf(shown) })}${shown < total ? ` / ${nf(total)}` : ''}`;
    $('#btn-more').hidden = shown >= total;
  }

  /* ------------------------------ showcase ------------------------------ */
  function buildShowcase() {
    state.showcase = state.fonts.filter((f) => f.size < 9 * 1024 * 1024).slice(0, 12);
    state.showcaseIndex = 0;
    const dots = $('#showcase-dots');
    dots.innerHTML = state.showcase.map((_, i) => `<i data-i="${i}" class="${i === 0 ? 'on' : ''}"></i>`).join('');
    renderShowcase();
  }

  function renderShowcase() {
    const font = state.showcase[state.showcaseIndex];
    if (!font) return;
    const textEl = $('#showcase-text');
    $('#showcase-name').textContent = font.name + (font.style ? ` · ${font.style}` : '');
    $('#showcase-meta').textContent = `${(font.format || '').toUpperCase()} · ${fmtBytes(font.size)} · ${font.arabic ? t('badge.arabic') : ''}`;
    $$('#showcase-dots i').forEach((d, i) => d.classList.toggle('on', i === state.showcaseIndex));
    textEl.style.opacity = '0';
    setTimeout(async () => {
      textEl.textContent = font.sample || sampleText();
      textEl.dir = 'auto';
      textEl.dataset.fontId = font.id;
      textEl.dataset.fontUrl = font.url;
      await loadFontFor(textEl);
      textEl.style.opacity = '1';
    }, 180);
  }

  let showcaseTimer = null;
  function startShowcase() {
    clearInterval(showcaseTimer);
    showcaseTimer = setInterval(() => {
      if (!state.showcase.length || document.hidden) return;
      state.showcaseIndex = (state.showcaseIndex + 1) % state.showcase.length;
      renderShowcase();
    }, 5200);
  }

  /* ------------------------------ actions ------------------------------- */
  function cssSnippet(font) {
    const family = font.name;
    const fmt = (font.format || 'ttf').toLowerCase();
    const mime = fmt === 'woff2' ? 'font/woff2' : fmt === 'woff' ? 'font/woff' : fmt === 'otf' ? 'font/otf' : 'font/ttf';
    return `@font-face {\n  font-family: "${family}";\n  src: url("${location.origin}${font.url}") format("${fmt}");\n  font-weight: ${font.weightClass || (font.bold ? 700 : 400)};\n  font-style: ${font.italic ? 'italic' : 'normal'};\n  font-display: swap;\n}\n\n.arabic-text {\n  font-family: "${family}", serif;\n}`;
  }

  function embedSnippet(font) {
    return `<div data-arabic-fonts data-query="${esc(font.name)}" data-limit="1"></div>\n<script src="${location.origin}/embed.js"><\/script>`;
  }

  function downloadFont(font) {
    window.open(`/download/${encodeURIComponent(font.file)}`, '_blank', 'noopener');
    font.downloads = (font.downloads || 0) + 1;
  }

  async function deleteFont(font) {
    if (!window.confirm(t('confirm.delete', { name: font.name }))) return;
    try {
      await api.remove(font.id);
      toast(t('toast.deleted'));
      closeModal('#detail-modal');
      await refresh();
    } catch (err) {
      toast(t('toast.deleteerr'), 'err');
    }
  }

  /* ---------------------------- detail modal ---------------------------- */
  function openDetail(font) {
    const title = $('#detail-title');
    title.textContent = font.name;
    const body = $('#detail-body');
    const corpus = 'أبجد هوّز حطّي كلمن سعفص قرشت ثخذ ضظغ';
    const axes = (font.axes || []).map((a) => `${a.tag} ${a.min}–${a.max}`).join(' · ') || '—';

    body.innerHTML = `
      <div class="detail-hero">
        <div class="detail-preview" dir="auto" id="detail-preview"
             ${font.variable ? 'contenteditable="false"' : ''}>${esc(font.sample || sampleText())}</div>
        <div class="detail-sizes">
          ${[16, 22, 32, 48].map((sz) => `<div dir="auto" style="font-size:${sz}px" data-size-preview>${esc(corpus)}</div>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>${esc(t('detail.sample.title'))}</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input class="input" id="detail-sample" style="flex:1;min-width:220px" dir="auto" value="${esc(font.sample || '')}"
                 placeholder="${esc(sampleText())}">
          <button class="btn btn-primary" id="detail-save-sample">${esc(t('detail.sample.save'))}</button>
          <button class="btn" id="detail-reset-sample">${esc(t('detail.sample.global'))}</button>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>${esc(t('detail.nameLabel'))}</label>
          <input class="input" id="detail-name" value="${esc(font.name)}">
        </div>
        <div class="field">
          <label>${esc(t('detail.arabicNameLabel'))}</label>
          <input class="input" id="detail-name-ar" dir="rtl" value="${esc(font.nameArabic || '')}">
        </div>
      </div>
      <div class="field">
        <label>${esc(t('detail.tagsLabel'))}</label>
        <input class="input" id="detail-tags" value="${esc((font.tags || []).join('، '))}">
      </div>
      <div class="field">
        <label>${esc(t('detail.noteLabel'))}</label>
        <textarea class="textarea" id="detail-note" rows="2">${esc(font.note || '')}</textarea>
      </div>

      <dl class="meta-grid">
        ${[
          [t('detail.format'), (font.format || '').toUpperCase()],
          [t('detail.size'), fmtBytes(font.size)],
          [t('detail.file'), font.file],
          [t('detail.version'), font.version || '—'],
          [t('detail.designer'), font.designer || '—'],
          [t('detail.license'), font.licenseUrl ? `<a href="${esc(font.licenseUrl)}" target="_blank" rel="noopener">${esc((font.licenseUrl || '').slice(0, 40))}…</a>` : (font.license ? esc(font.license.slice(0, 60)) + '…' : '—')],
          [t('detail.created'), fmtDate(font.addedAt)],
          [t('detail.downloads'), nf(font.downloads || 0)],
          [t('detail.axes'), axes],
          ['SHA-256', esc(font.sha256Short || '—')],
        ].map(([k, v]) => `<div class="meta-item"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}
      </dl>

      <div class="field">
        <label>${esc(t('detail.glyphs'))}</label>
        <div class="glyphs" id="detail-glyphs" dir="auto" data-font-id="${esc(font.id)}" data-font-url="${esc(font.url)}">
          ${'أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ ٠١٢٣٤٥٦٧٨٩ ABC abc'.split('').map((ch) => `<span>${esc(ch)}</span>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>CSS</label>
        <div class="code-block">${esc(cssSnippet(font))}<button class="btn btn-sm copy" data-copy-css>${esc(t('card.copy'))}</button></div>
      </div>
      <div class="field">
        <label>${esc(t('detail.embed'))}</label>
        <div class="code-block">${esc(embedSnippet(font))}<button class="btn btn-sm copy" data-copy-embed>${esc(t('card.copy'))}</button></div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:18px">
        <button class="btn btn-primary" id="detail-save">${esc(t('detail.save'))}</button>
        <button class="btn" id="detail-download">${esc(t('card.download'))}</button>
        <span style="flex:1"></span>
        <button class="btn btn-danger" id="detail-delete">${esc(t('card.delete'))}</button>
      </div>
    `;

    openModal('#detail-modal');

    // load the font inside the modal and wire up actions
    const previewEl = $('#detail-preview');
    previewEl.dataset.fontId = font.id;
    previewEl.dataset.fontUrl = font.url;
    loadFontFor(previewEl).then(() => {
      $$('[data-size-preview]', body).forEach((el) => {
        el.style.fontFamily = `"${fontFamily(font)}", var(--ui-font)`;
      });
      loadFontFor($('#detail-glyphs'));
    });

    const applySample = (value) => {
      const text = value || sampleText();
      $('#detail-preview').textContent = text;
      $$('[data-size-preview]', body).forEach((el) => { el.textContent = text; });
    };

    $('#detail-sample').addEventListener('input', (e) => applySample(e.target.value));

    $('#detail-save-sample').addEventListener('click', async () => {
      const value = $('#detail-sample').value.trim();
      try {
        await api.patch(font.id, { sample: value });
        font.sample = value || null;
        toast(t('toast.saved'));
        await refresh();
      } catch { toast(t('toast.saveerr'), 'err'); }
    });

    $('#detail-reset-sample').addEventListener('click', async () => {
      $('#detail-sample').value = '';
      applySample('');
      try {
        await api.patch(font.id, { sample: '' });
        font.sample = null;
        toast(t('toast.saved'));
        await refresh();
      } catch { toast(t('toast.saveerr'), 'err'); }
    });

    $('#detail-save').addEventListener('click', async () => {
      const payload = {
        name: $('#detail-name').value.trim(),
        nameArabic: $('#detail-name-ar').value.trim(),
        note: $('#detail-note').value,
        tags: $('#detail-tags').value.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      };
      try {
        await api.patch(font.id, payload);
        Object.assign(font, { ...payload });
        toast(t('toast.saved'));
        await refresh();
        $('#detail-title').textContent = payload.name || font.name;
      } catch { toast(t('toast.saveerr'), 'err'); }
    });

    $('#detail-download').addEventListener('click', () => downloadFont(font));
    $('#detail-delete').addEventListener('click', () => deleteFont(font));
    $('[data-copy-css]', body).addEventListener('click', () => copyText(cssSnippet(font)));
    $('[data-copy-embed]', body).addEventListener('click', () => copyText(embedSnippet(font)));
  }

  /* ----------------------------- modal core ----------------------------- */
  function openModal(sel) {
    const el = $(sel);
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(sel) {
    const el = $(sel);
    if (el) el.classList.remove('open');
    if (!$('.modal-backdrop.open')) document.body.style.overflow = '';
  }
  $$('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(`#${backdrop.id}`); });
    $$('[data-close]', backdrop).forEach((btn) => btn.addEventListener('click', () => closeModal(`#${backdrop.id}`)));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal-backdrop.open').forEach((m) => closeModal(`#${m.id}`));
  });

  /* ------------------------------ upload -------------------------------- */
  const upload = { files: [] };

  function renderFileList() {
    const list = $('#file-list');
    list.innerHTML = upload.files.map((entry, i) => `
      <div class="file-item ${entry.state || ''}" data-file="${i}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="color:var(--muted);flex-shrink:0">
          <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z"/><path d="M14 3v4h4"/>
        </svg>
        <span class="fname" title="${esc(entry.file.name)}">${esc(entry.file.name)}</span>
        <span class="fsize">${esc(fmtBytes(entry.file.size))}</span>
        <span class="fstate">${entry.message ? esc(entry.message) : ''}</span>
      </div>`).join('');
    $('#btn-do-upload').disabled = !upload.files.length;
  }

  function addFiles(fileList) {
    const allowed = /\.(ttf|otf|woff2?|ttc)$/i;
    for (const file of fileList) {
      if (!allowed.test(file.name)) {
        upload.files.push({ file, state: 'err', message: 'صيغة غير مدعومة' });
        continue;
      }
      if (upload.files.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
      upload.files.push({ file, state: '', message: '' });
    }
    renderFileList();
  }

  function resetUpload() {
    upload.files = [];
    renderFileList();
    $('#progress').hidden = true;
    $('#progress i').style.width = '0%';
    ['#up-name', '#up-tags', '#up-sample', '#up-note'].forEach((sel) => { $(sel).value = ''; });
    $('#up-force').checked = false;
  }

  function doUpload() {
    const pending = upload.files.filter((f) => f.state !== 'err');
    if (!pending.length) { toast(t('upload.nothing'), 'err'); return; }

    const fd = new FormData();
    pending.forEach((entry) => fd.append('files', entry.file, entry.file.name));
    if ($('#up-name').value.trim()) fd.append('name', $('#up-name').value.trim());
    if ($('#up-tags').value.trim()) fd.append('tags', $('#up-tags').value.trim());
    if ($('#up-sample').value.trim()) fd.append('sample', $('#up-sample').value.trim());
    if ($('#up-note').value.trim()) fd.append('note', $('#up-note').value.trim());
    if ($('#up-force').checked) fd.append('overwrite', '1');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/fonts');
    const progress = $('#progress');
    const bar = $('#progress i');
    progress.hidden = false;
    $('#btn-do-upload').disabled = true;

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      bar.style.width = `${pct}%`;
      $('#btn-do-upload').querySelector('span').textContent = t('upload.uploading', { p: pct });
    };

    xhr.onload = async () => {
      $('#btn-do-upload').disabled = false;
      $('#btn-do-upload').querySelector('span').textContent = t('upload.go');
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }

      if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
        const addedNames = new Set((data.added || []).map((f) => f.originalFileName || f.file));
        const dupNames = new Set((data.duplicates || []).map((d) => d.file));
        const errMap = new Map((data.errors || []).map((e) => [e.file, e.message]));
        for (const entry of upload.files) {
          if (entry.state === 'err') continue;
          if (addedNames.has(entry.file.name)) { entry.state = 'ok'; entry.message = t('upload.ok'); }
          else if (dupNames.has(entry.file.name)) { entry.state = 'dup'; entry.message = t('upload.dup'); }
          else if (errMap.has(entry.file.name)) { entry.state = 'err'; entry.message = errMap.get(entry.file.name); }
        }
        renderFileList();
        const okCount = (data.added || []).length;
        const errCount = (data.errors || []).length + (data.duplicates || []).length;
        if (okCount) toast(t('toast.uploaded', { n: nf(okCount) }));
        if (errCount && !okCount) toast(t('upload.partial', { ok: nf(okCount), err: nf(errCount) }), 'err');
        else if (errCount) toast(t('upload.partial', { ok: nf(okCount), err: nf(errCount) }), 'err');
        await refresh();
        setTimeout(() => { closeModal('#upload-modal'); resetUpload(); }, 1400);
      } else {
        const msg = data.error || `HTTP ${xhr.status}`;
        for (const entry of upload.files) {
          if (entry.state === 'err') continue;
          entry.state = 'err';
          entry.message = data.errors?.[0]?.message || msg;
        }
        renderFileList();
        toast(t('toast.uploaderr', { m: msg }), 'err', 7000);
      }
    };

    xhr.onerror = () => {
      $('#btn-do-upload').disabled = false;
      $('#btn-do-upload').querySelector('span').textContent = t('upload.go');
      toast(t('toast.uploaderr', { m: 'network' }), 'err');
    };

    xhr.send(fd);
  }

  /* ---------------------------- data loading ---------------------------- */
  function renderSkeletons() {
    $('#grid').innerHTML = `<div class="skeletons" style="grid-column:1/-1">
      <div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`;
  }

  async function refresh() {
    state.loading = true;
    if (!state.fonts.length) renderSkeletons();
    try {
      const data = await api.list();
      state.fonts = data.fonts || [];
      state.counts = data.counts || null;
      state.total = typeof data.total === 'number' ? data.total : state.fonts.length;
      renderStats();
      renderGrid();
      renderResultsHead();
      if (!state.query && !state.filter) buildShowcase();
    } catch (err) {
      toast(`تعذر تحميل المكتبة: ${err.message}`, 'err');
    } finally {
      state.loading = false;
    }
  }

  function clearSearch() {
    state.query = '';
    state.filter = '';
    $('#search').value = '';
    $$('#filters .chip').forEach((c) => c.classList.toggle('on', c.dataset.filter === ''));
    state.limit = 36;
    refresh();
  }

  /* ------------------------------- wiring ------------------------------- */
  function debounce(fn, ms = 240) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  $('#search').addEventListener('input', debounce((e) => {
    state.query = e.target.value.trim();
    state.limit = 36;
    refresh();
  }, 240));

  $$('#filters .chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('#filters .chip').forEach((c) => c.classList.toggle('on', c === chip));
    state.filter = chip.dataset.filter;
    state.limit = 36;
    refresh();
  }));

  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; refresh(); });

  $('#preview-size').addEventListener('input', (e) => {
    state.previewSize = Number(e.target.value);
    document.documentElement.style.setProperty('--preview-size', `${state.previewSize}px`);
    store.set(LS.size, state.previewSize);
  });

  $('#btn-view').addEventListener('click', () => {
    state.view = state.view === 'grid' ? 'list' : 'grid';
    document.body.dataset.view = state.view;
    $('#btn-view').title = state.view === 'grid' ? t('view.grid') : t('view.list');
    store.set(LS.view, state.view);
  });

  $('#sample').addEventListener('input', (e) => {
    state.sample = e.target.value;
    store.set(LS.sample, state.sample);
    $$('.preview-text').forEach((el) => {
      const id = el.dataset.fontId;
      const font = state.fonts.find((f) => f.id === id);
      if (font && !font.sample) el.textContent = sampleText();
    });
    const detailPreview = $('#detail-preview');
    if (detailPreview && $('#detail-modal').classList.contains('open')) {
      const openId = $('#detail-glyphs')?.dataset.fontId;
      const font = state.fonts.find((f) => f.id === openId);
      if (font && !font.sample) {
        detailPreview.textContent = sampleText();
        $$('[data-size-preview]').forEach((el) => { el.textContent = sampleText(); });
      }
    }
  });

  // theme
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const icon = $('#icon-theme');
    icon.innerHTML = state.theme === 'dark'
      ? '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/>'
      : '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 12H1.8M22.2 12h-2.4M5.6 5.6 7.4 7.4M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>';
    store.set(LS.theme, state.theme);
  }
  $('#btn-theme').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  });

  // language
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $('#lang-label').textContent = state.lang === 'ar' ? 'EN' : 'ع';
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-attr]').forEach((el) => {
      for (const pair of el.dataset.i18nAttr.split(',')) {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr.trim(), t(key.trim()));
      }
    });
    store.set(LS.lang, state.lang);
    renderStats();
    renderResultsHead();
    renderGrid();
    if (!state.query && !state.filter) buildShowcase();
  }
  $('#btn-lang').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    if (!state.sample) $('#sample').value = '';
    applyLang();
  });

  // upload triggers
  ['#btn-upload', '#btn-upload-2'].forEach((sel) => $(sel).addEventListener('click', () => {
    resetUpload();
    openModal('#upload-modal');
  }));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-upload-trigger]')) { resetUpload(); openModal('#upload-modal'); }
  });

  const dropzone = $('#dropzone');
  dropzone.addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); dropzone.classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); dropzone.classList.remove('drag');
  }));
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });
  $('#btn-do-upload').addEventListener('click', doUpload);

  // grid interactions (event delegation)
  $('#grid').addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-act]');
    if (actionBtn) {
      const font = state.fonts.find((f) => f.id === actionBtn.dataset.id);
      if (!font) return;
      if (actionBtn.dataset.act === 'download') downloadFont(font);
      if (actionBtn.dataset.act === 'css') copyText(cssSnippet(font));
      if (actionBtn.dataset.act === 'delete') deleteFont(font);
      return;
    }
    const openTarget = e.target.closest('[data-open], .card');
    if (openTarget) {
      const id = openTarget.dataset.open || openTarget.dataset.id;
      const font = state.fonts.find((f) => f.id === id);
      if (font) openDetail(font);
    }
  });

  $('#grid').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.card');
    if (!card || e.target.closest('button')) return;
    e.preventDefault();
    const font = state.fonts.find((f) => f.id === card.dataset.id);
    if (font) openDetail(font);
  });

  $('#btn-more').addEventListener('click', async () => {
    state.limit += 36;
    await refresh();
    $('#grid').scrollIntoView({ block: 'nearest' });
  });

  $('#showcase-dots').addEventListener('click', (e) => {
    const dot = e.target.closest('i[data-i]');
    if (!dot) return;
    state.showcaseIndex = Number(dot.dataset.i);
    renderShowcase();
  });

  // shortcuts
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') ||
      document.activeElement?.isContentEditable;
    if (e.key === '/' && !typing) { e.preventDefault(); $('#search').focus(); }
    if (e.key.toLowerCase() === 'u' && !typing && !e.metaKey && !e.ctrlKey) {
      resetUpload(); openModal('#upload-modal');
    }
  });

  // deep links: /?font=<id>
  async function handleDeepLink() {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) { state.query = q; $('#search').value = q; await refresh(); }
    // روابط مباشرة لخط: /font/<id> أو /?font=<id>
    const pathMatch = /^\/font\/([A-Za-z0-9_\-]+)/.exec(location.pathname);
    const fontId = (pathMatch && pathMatch[1]) || params.get('font');
    if (fontId) {
      try {
        const res = await fetch(`/api/fonts/${encodeURIComponent(fontId)}`);
        if (res.ok) {
          const data = await res.json();
          openDetail(data.font);
        }
      } catch { /* ignore */ }
    }
  }

  /* ------------------------------- boot --------------------------------- */
  function boot() {
    applyTheme();
    document.documentElement.style.setProperty('--preview-size', `${state.previewSize}px`);
    $('#preview-size').value = String(state.previewSize);
    document.body.dataset.view = state.view;
    if (state.sample) $('#sample').value = state.sample;
    $('#year').textContent = new Date().getFullYear();

    applyLang();
    refresh().then(handleDeepLink);
    startShowcase();

    // live event stream for multi-user: refresh when window regains focus
    let lastFocus = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - lastFocus > 60000) refresh();
      lastFocus = Date.now();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.AFL = { refresh, openDetail, state, t };
})();
