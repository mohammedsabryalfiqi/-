/*! أداة تضمين مكتبة الخطوط العربية — Arabic Font Library widget
 *  الاستخدام:
 *    <div data-arabic-fonts data-query="Amiri" data-limit="4"></div>
 *    <script src="https://your-host/embed.js" async></script>
 *
 *  الخصائص الاختيارية على العنصر:
 *    data-query   : كلمة البحث (اسم خط / وسم / مصمم) أو فارغة لكل المكتبة
 *    data-limit   : عدد الخطوط المعروضة (افتراضي 4)
 *    data-sample  : جملة المعاينة
 *    data-size    : حجم خط المعاينة بالبكسل (افتراضي 30)
 *    data-api     : عنوان السيرفر إن اختلف عن مكان التضمين
 *    data-theme   : light | dark | auto (افتراضي auto يتبع النظام)
 *    data-search  : "1" لإظهار مربّع بحث داخلي
 */
(() => {
  'use strict';

  const script = document.currentScript;
  const ORIGIN = (() => {
    try {
      return new URL(script.src, location.href).origin;
    } catch {
      return location.origin;
    }
  })();

  const DEFAULT_SAMPLE = 'الخطّ العربي فنٌّ وحضارة — أبجد هوّز حطّي كلمن سعفص';

  const CSS = `
.aflw{--aflw-accent:#b8862f;--aflw-bg:transparent;--aflw-border:rgba(120,110,90,.28);--aflw-text:inherit;--aflw-muted:#8b8b96;
  font-family:"Noto Kufi Arabic","Segoe UI",Tahoma,system-ui,sans-serif;color:var(--aflw-text);
  border:1px solid var(--aflw-border);border-radius:16px;overflow:hidden;background:var(--aflw-bg)}
.aflw[data-theme="dark"]{--aflw-bg:#0e0e14;--aflw-text:#f2f2f6;--aflw-border:rgba(255,255,255,.12);--aflw-accent:#e7b96a}
.aflw[data-theme="light"]{--aflw-bg:#fff;--aflw-text:#1a1a1e;--aflw-border:rgba(0,0,0,.12);--aflw-accent:#a9741f}
.aflw-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--aflw-border);
  font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--aflw-muted)}
.aflw-head b{color:var(--aflw-accent);font-weight:700;letter-spacing:0}
.aflw-search{margin-inline-start:auto;border:1px solid var(--aflw-border);background:transparent;color:inherit;
  border-radius:999px;padding:5px 12px;font-size:13px;min-width:140px}
.aflw-item{padding:16px;border-bottom:1px solid var(--aflw-border)}
.aflw-item:last-child{border-bottom:0}
.aflw-name{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;font-size:14px;font-weight:700;margin-bottom:8px}
.aflw-name em{font-style:normal;font-size:11px;font-weight:600;color:var(--aflw-muted);letter-spacing:.05em}
.aflw-preview{line-height:1.7;word-break:break-word;opacity:.3;transition:opacity .35s}
.aflw-preview.on{opacity:1}
.aflw-foot{margin-top:8px;font-size:11px;color:var(--aflw-muted);display:flex;gap:8px;flex-wrap:wrap}
.aflw-foot a{color:var(--aflw-accent);text-decoration:none}
.aflw-empty,.aflw-load{padding:18px 16px;font-size:13px;color:var(--aflw-muted)}
.aflw-error{color:#e06c6c}
`;

  let styleInjected = false;
  function injectStyle() {
    if (styleInjected || document.getElementById('aflw-style')) { styleInjected = true; return; }
    const style = document.createElement('style');
    style.id = 'aflw-style';
    style.textContent = CSS;
    document.head.appendChild(style);
    styleInjected = true;
  }

  function pickTheme(el) {
    const attr = (el.dataset.theme || 'auto').toLowerCase();
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  const loaded = new Set();
  function loadFont(id, url, el) {
    const family = 'AFLW_' + String(id).replace(/[^A-Za-z0-9_]/g, '');
    if (loaded.has(family) || !window.FontFace) {
      el.style.fontFamily = `"${family}", inherit`;
      el.classList.add('on');
      return;
    }
    try {
      const face = new FontFace(family, `url("${url}")`, { display: 'swap' });
      face.load().then((f) => {
        document.fonts.add(f);
        loaded.add(family);
        el.style.fontFamily = `"${family}", inherit`;
        el.classList.add('on');
      }).catch(() => el.classList.add('on'));
    } catch {
      el.classList.add('on');
    }
  }

  async function render(el) {
    const apiBase = (el.dataset.api || ORIGIN).replace(/\/$/, '');
    const limit = Number(el.dataset.limit || 4);
    const sample = el.dataset.sample || DEFAULT_SAMPLE;
    const size = Number(el.dataset.size || 30);
    const query = el.dataset.query || '';
    const theme = pickTheme(el);

    el.classList.add('aflw');
    el.dataset.theme = theme;
    el.innerHTML = `
      <div class="aflw-head">
        <b>مكتبة الخطوط العربية</b><span>Arabic Fonts</span>
        ${el.dataset.search === '1' ? '<input class="aflw-search" type="search" placeholder="ابحث عن خط…" aria-label="بحث">' : ''}
      </div>
      <div class="aflw-body"><div class="aflw-load">جارٍ التحميل…</div></div>`;

    const body = el.querySelector('.aflw-body');

    async function fetchFonts(q) {
      const params = new URLSearchParams({ limit: String(limit), sort: 'recent' });
      if (q) params.set('q', q);
      const res = await fetch(`${apiBase}/api/fonts?${params}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    async function paint(q) {
      body.innerHTML = '<div class="aflw-load">جارٍ التحميل…</div>';
      try {
        const data = await fetchFonts(q);
        const fonts = data.fonts || [];
        if (!fonts.length) {
          body.innerHTML = '<div class="aflw-empty">لا توجد خطوط مطابقة.</div>';
          return;
        }
        body.innerHTML = fonts.map((font) => `
          <div class="aflw-item">
            <div class="aflw-name">
              ${escapeHtml(font.name)}
              ${font.nameArabic ? `· ${escapeHtml(font.nameArabic)}` : ''}
              <em>${escapeHtml((font.format || '').toUpperCase())} · ${Math.round((font.size || 0) / 1024)}KB</em>
            </div>
            <div class="aflw-preview" dir="auto" data-id="${escapeHtml(font.id)}"
                 data-url="${escapeHtml(apiBase + font.url)}"
                 style="font-size:${size}px">${escapeHtml(font.sample || sample)}</div>
            <div class="aflw-foot">
              ${font.designer ? `<span>${escapeHtml(font.designer)}</span>` : ''}
              <a href="${escapeHtml(apiBase + '/?font=' + encodeURIComponent(font.id))}" target="_blank" rel="noopener">تنزيل / تفاصيل</a>
            </div>
          </div>`).join('');
        body.querySelectorAll('.aflw-preview').forEach((p) => loadFont(p.dataset.id, p.dataset.url, p));
      } catch (err) {
        body.innerHTML = `<div class="aflw-empty aflw-error">تعذر تحميل المكتبة: ${escapeHtml(err.message)}</div>`;
      }
    }

    const search = el.querySelector('.aflw-search');
    if (search) {
      let timer;
      search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => paint(search.value.trim()), 260);
      });
    }
    paint(query);
  }

  function init() {
    injectStyle();
    document.querySelectorAll('[data-arabic-fonts]').forEach((el) => {
      if (el.dataset.aflwReady === '1') return;
      el.dataset.aflwReady = '1';
      render(el);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.ArabicFontsWidget = { init, render };
})();
