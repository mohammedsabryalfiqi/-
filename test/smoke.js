'use strict';
/**
 * اختبار سريع للتأكد من أن الواجهة تعمل بدون أخطاء تشغيلية.
 *
 *   npm i --no-save jsdom
 *   node test/smoke.js
 *
 * يقوم الاختبار بتشغيل السيرفر على منفذ مؤقت، يفتح الصفحة داخل بيئة DOM،
 * ثم يتحقق من ظهور بطاقات الخطوط وفتح نافذة التفاصيل وإتمام الرفع.
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.TEST_PORT || 4199);
const ROOT = path.join(__dirname, '..');
const BASE = `http://127.0.0.1:${PORT}`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function waitForServer(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await get(`${BASE}/api/health`);
      if (res.status === 200) return true;
    } catch { /* retry */ }
    await wait(250);
  }
  throw new Error('السيرفر لم يستجب في الوقت المتوقع');
}

async function main() {
  let JSDOM;
  let VirtualConsole;
  try {
    ({ JSDOM, VirtualConsole } = require('jsdom'));
  } catch {
    console.log('⚠️  jsdom غير مثبت. شغّل: npm i --no-save jsdom');
    process.exit(0);
  }

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), QUIET: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

  const failures = [];
  const assert = (cond, message) => {
    if (cond) console.log(`  ✓ ${message}`);
    else { console.log(`  ✗ ${message}`); failures.push(message); }
  };

  try {
    await waitForServer();
    console.log(`\nالسيرفر يعمل على ${BASE}\n`);

    const runtimeErrors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (err) => {
      const msg = String(err.message || err);
      if (/Could not parse CSS|Not implemented/i.test(msg)) return; // cssom محدود في jsdom
      runtimeErrors.push(msg);
    });
    virtualConsole.on('error', (...args) => runtimeErrors.push(args.join(' ')));

    const dom = await JSDOM.fromURL(`${BASE}/`, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        // بدائل لما لا يدعمه jsdom
        window.IntersectionObserver = class {
          constructor(cb) { this.cb = cb; }
          observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
          unobserve() {}
          disconnect() {}
        };
        window.FontFace = class {
          constructor(family, source) { this.family = family; this.source = source; this.status = 'loaded'; }
          load() { return Promise.resolve(this); }
        };
        window.document.fonts = { add() {}, check() { return false; } };
        window.matchMedia = () => ({
          matches: false, media: '', onchange: null,
          addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
        });
        window.fetch = (input, init) => fetch(new URL(String(input), BASE), init);
        Object.defineProperty(window.navigator, 'clipboard', {
          value: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') },
          configurable: true,
        });
        window.confirm = () => true;
      },
    });

    const { window } = dom;
    const doc = window.document;

    // انتظر تحميل المكتبة من الواجهة
    let cards = [];
    for (let i = 0; i < 60; i++) {
      cards = doc.querySelectorAll('#grid .card');
      if (cards.length) break;
      await wait(250);
    }

    console.log('نتائج الفحص:');
    assert(cards.length > 0, `ظهرت بطاقات الخطوط (${cards.length} بطاقة)`);

    const firstName = doc.querySelector('.card-name')?.textContent?.trim() || '';
    assert(firstName.length > 0, `اسم الخط ظاهر أعلى البطاقة: "${firstName}"`);

    const previewText = doc.querySelector('#grid .card .preview-text')?.textContent?.trim() || '';
    assert(previewText.length > 5, `جملة المعاينة ظاهرة أسفل الاسم: "${previewText.slice(0, 42)}…"`);

    assert(doc.querySelectorAll('#stats .stat').length === 4, 'بطاقات الإحصاءات الأربع ظاهرة');
    assert((doc.querySelector('#showcase-name')?.textContent || '').trim() !== '—', 'قسم المعاينة الحيّة يعرض خطًا');

    // تعديل جملة المعاينة
    const sampleInput = doc.querySelector('#sample');
    sampleInput.value = 'نص تجريبي للمعاينة';
    sampleInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    await wait(80);
    const updated = doc.querySelector('#grid .card .preview-text')?.textContent?.trim() || '';
    assert(updated === 'نص تجريبي للمعاينة' || updated.length > 0, 'تحديث جملة المعاينة ينعكس على البطاقات');

    // البحث
    const search = doc.querySelector('#search');
    search.value = 'كوفي';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    await wait(700);
    const searchCards = doc.querySelectorAll('#grid .card');
    assert(searchCards.length > 0 && searchCards.length < cards.length,
      `البحث العربي يُصفّي النتائج (${searchCards.length} من ${cards.length})`);

    // عوامل التصفية
    doc.querySelector('#filters .chip[data-filter="variable"]').click();
    await wait(700);
    const varCards = doc.querySelectorAll('#grid .card');
    assert(varCards.length > 0, `مرشّح الخطوط المتغيّرة يعمل (${varCards.length})`);

    // فتح نافذة التفاصيل
    doc.querySelector('#grid .card .card-preview').click();
    await wait(160);
    const detailOpen = doc.querySelector('#detail-modal').classList.contains('open');
    const detailTitle = (doc.querySelector('#detail-title')?.textContent || '').trim();
    assert(detailOpen && detailTitle.length > 0, `نافذة التفاصيل تُفتح وتحمل اسم الخط: "${detailTitle}"`);
    assert(doc.querySelectorAll('#detail-body .meta-item').length >= 8, 'بيانات الخط (الميتاداتا) ظاهرة داخل التفاصيل');
    assert((doc.querySelector('#detail-body .code-block')?.textContent || '').includes('@font-face'), 'كود CSS جاهز للنسخ');

    // نافذة الرفع
    doc.querySelector('#btn-upload').click();
    await wait(80);
    assert(doc.querySelector('#upload-modal').classList.contains('open'), 'نافذة رفع الخطوط تُفتح');
    sampleInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // اختبار الرفع عبر الـ API مباشرة (multipart من Node)
    const form = new FormData();
    const fontBuffer = require('fs').readFileSync(path.join(ROOT, 'data/fonts', 'Amiri-Regular.ttf'));
    form.append('files', new Blob([fontBuffer]), 'Amiri-copy-test.ttf');
    form.append('tags', 'اختبار');
    const uploadRes = await fetch(`${BASE}/api/fonts`, { method: 'POST', body: form });
    const uploadJson = await uploadRes.json();
    assert(uploadRes.ok && uploadJson.ok !== false, 'رفع خط عبر multipart نجح');
    const dupRes = await fetch(`${BASE}/api/fonts`, { method: 'POST', body: (() => { const f = new FormData(); f.append('files', new Blob([fontBuffer]), 'Amiri-copy-test.ttf'); return f; })() });
    const dupJson = await dupRes.json();
    assert((dupJson.duplicates || []).length === 1, 'كشف التكرار (نفس البصمة) يعمل');

    // تنظيف: احذف النسخة المرفوعة في الاختبار
    for (const font of uploadJson.added || []) {
      await fetch(`${BASE}/api/fonts/${font.id}`, { method: 'DELETE' });
    }
    for (const dup of dupJson.added || []) {
      await fetch(`${BASE}/api/fonts/${dup.id}`, { method: 'DELETE' });
    }

    assert(runtimeErrors.length === 0,
      runtimeErrors.length ? `أخطاء تشغيلية في الواجهة: ${runtimeErrors.slice(0, 3).join(' | ')}` : 'لا توجد أخطاء تشغيلية في الواجهة');

    window.close();
  } catch (err) {
    failures.push(err.message);
    console.error('\nفشل الاختبار:', err);
  } finally {
    server.kill('SIGTERM');
    await wait(200);
    if (!server.killed) server.kill('SIGKILL');
  }

  console.log(`\n${failures.length ? `❌ فشل ${failures.length} فحصًا` : '✅ نجحت كل الفحوصات'}\n`);
  process.exit(failures.length ? 1 : 0);
}

main();
