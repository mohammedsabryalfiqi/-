#!/usr/bin/env node
/**
 * تنزيل خطوط عربية مفتوحة المصدر من مستودع google/fonts إلى مجلد data/fonts
 *
 *   node scripts/fetch-google-fonts.mjs                     # القائمة العربية الجاهزة
 *   node scripts/fetch-google-fonts.mjs cairo almarai zain  # خطوط محدّدة بالاسم
 *   node scripts/fetch-google-fonts.mjs --all cairo         # مع الأنماط المائلة كذلك
 *   node scripts/fetch-google-fonts.mjs --list my-fonts.txt # أسماء من ملف
 *   GITHUB_TOKEN=xxx node scripts/fetch-google-fonts.mjs    # لتفادي حدود GitHub API
 *
 * بعد التنزيل يعمل الاستيراد تلقائيًا (نفس ما يفعله السيرفر عند الإقلاع).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = path.join(ROOT, 'data', 'fonts');
const API = 'https://api.github.com/repos/google/fonts/contents/';
const RAW = 'https://raw.githubusercontent.com/google/fonts/main/';
const DIRS = ['ofl', 'apache', 'ufl'];

/** خطوط عربية متوفّرة في مستودع Google Fonts */
const ARABIC_SET = [
  'almarai', 'amiri', 'arefruqaa', 'beiruti', 'cairo', 'changa', 'elmessiri', 'gulzar',
  'harmattan', 'ibmplexsansarabic', 'jomhuria', 'kufam', 'lateef', 'lemonada', 'mada',
  'markazitext', 'marhey', 'mirza', 'notokufiarabic', 'notonaskharabic', 'notonastaliqurdu',
  'notosansarabic', 'qahiri', 'rakkas', 'readexpro', 'reemkufi', 'ruwudu', 'scheherazadenew',
  'tajawal', 'vibes', 'zain',
];

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));

let families = positional;
const listIdx = args.indexOf('--list');
if (listIdx !== -1 && args[listIdx + 1]) {
  const content = await fs.readFile(args[listIdx + 1], 'utf8');
  families = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}
if (flags.has('--list') && !families.length) families = ARABIC_SET;
if (!families.length) families = ARABIC_SET;

const headers = { 'User-Agent': 'arabic-font-library', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listDir(dir, family) {
  const res = await fetch(`${API}${dir}/${family}?ref=main`, { headers });
  if (res.status === 404) return null;
  if (res.status === 403) throw new Error('تجاوزت حدود GitHub API — أضف GITHUB_TOKEN لإكمال التنزيل');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'arabic-font-library' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await fs.mkdir(FONTS_DIR, { recursive: true });
  let saved = 0;
  let failed = 0;

  for (const family of families) {
    const slug = family.toLowerCase().trim();
    let entries = null;
    let sourceDir = null;
    for (const dir of DIRS) {
      try {
        entries = await listDir(dir, slug);
      } catch (err) {
        console.error(`! ${slug}: ${err.message}`);
        entries = null;
        break;
      }
      if (entries) { sourceDir = dir; break; }
    }
    if (!entries) {
      console.warn(`✗ لم يُوجد الخط: ${slug}`);
      failed++;
      continue;
    }

    const files = entries.filter((e) => e.type === 'file' && /\.(ttf|otf)$/i.test(e.name));
    const wanted = files.filter((e) => flags.has('--all') || !/italic/i.test(e.name));
    if (!wanted.length) {
      console.warn(`✗ لا ملفات مناسبة في: ${slug}`);
      failed++;
      continue;
    }

    for (const file of wanted) {
      const dest = path.join(FONTS_DIR, file.name.replace(/\s+/g, '-'));
      try {
        const exists = await fs.stat(dest).then(() => true).catch(() => false);
        if (exists) {
          console.log(`• موجود مسبقًا: ${file.name}`);
          continue;
        }
        const size = await download(`${RAW}${sourceDir}/${slug}/${encodeURIComponent(file.name)}`, dest);
        console.log(`✓ ${file.name} (${Math.round(size / 1024)} كيلوبايت)`);
        saved++;
      } catch (err) {
        console.error(`✗ ${file.name}: ${err.message}`);
        failed++;
      }
      await sleep(120);
    }
  }

  console.log(`\nتم تنزيل ${saved} ملفًا${failed ? ` — وفشل ${failed}` : ''}.`);

  if (saved) {
    const store = await import('../lib/store.js').catch(() => null);
    if (store) {
      const seedModule = await import('../lib/seed.js').catch(() => null);
      if (seedModule?.default?.seed) {
        await store.default.load();
        const result = await seedModule.default.seed({ log: console.log });
        console.log(`تم استيراد ${result.imported} خطًا إلى الفهرس.`);
      }
    }
    console.log('(إن لم يتم الاستيراد تلقائيًا: شغّل npm run seed)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
