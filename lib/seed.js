'use strict';
/**
 * استيراد الخطوط الموجودة يدويًا داخل مجلد data/fonts
 * (يُستخدم لبذور المكتبة ولمزامنة أي ملفات تُضاف للسيرفر مباشرة)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');
const { inspectFont, nameFromFilename } = require('./font-info');

/** أسماء عربية للخطوط مفتوحة المصدر التي تأتي مع المكتبة */
const ARABIC_NAMES = {
  'amiri': 'أميري',
  'aref ruqaa': 'عارف رقعة',
  'cairo': 'القاهرة',
  'tajawal': 'تجوال',
  'reem kufi': 'ريم كوفي',
  'el messiri': 'المسيري',
  'alkalami': 'القلمي',
  'lemonada': 'ليموندا',
  'ruwudu': 'روودو',
  'marhey': 'مرحى',
  'noto kufi arabic': 'نوتو كوفي',
  'lateef': 'لطيف',
  'rakkas': 'رقّاص',
  'ibm plex sans arabic': 'آي بي إم بلكس سانس',
  'almarai': 'المراعي',
  'changa': 'شنغا',
  'harmattan': 'هرمتان',
  'noto naskh arabic': 'نوتو نسخ',
  'beiruti': 'بيروتي',
  'kufam': 'كوفام',
  'qahiri': 'قاهري',
  'mada': 'مدى',
  'jomhuria': 'جمهورية',
  'scheherazade new': 'شهرزاد الجديد',
  'noto sans arabic': 'نوتو سانس عربي',
  'markazi text': 'مركزي',
  'vazirmatn': 'وزیرمتن',
  'rubik': 'روبيك',
};

function arabicDisplayName(family) {
  if (!family) return null;
  const key = family.toLowerCase().replace(/\s+/g, ' ').trim();
  if (ARABIC_NAMES[key]) return ARABIC_NAMES[key];
  const base = key.replace(/\s+(regular|bold|light|medium|black|thin|italic|semibold|extrabold|extralight|book|heavy)$/, '').trim();
  return ARABIC_NAMES[base] || null;
}

const SUPPORTED = new Set(['ttf', 'otf', 'woff', 'woff2', 'ttc']);

async function seed({ log = console.log } = {}) {
  store.ensureDirs();
  const dir = store.FONTS_DIR;
  let files = [];
  try {
    files = await fs.promises.readdir(dir);
  } catch {
    return { imported: 0, skipped: 0, invalid: 0 };
  }

  const imported = [];
  let skipped = 0;
  let invalid = 0;

  for (const file of files) {
    if (file.startsWith('.')) continue;
    const ext = (path.extname(file).slice(1) || '').toLowerCase();
    if (!SUPPORTED.has(ext)) continue;
    if (store.findByFile(file)) { skipped++; continue; }

    const full = path.join(dir, file);
    let stat;
    try {
      stat = await fs.promises.stat(full);
    } catch { continue; }
    if (!stat.isFile()) continue;

    let buf;
    try {
      buf = await fs.promises.readFile(full);
    } catch {
      invalid++;
      continue;
    }

    let info;
    try {
      info = inspectFont(buf, file);
    } catch (err) {
      console.error(`[seed] تعذر قراءة "${file}": ${err.message}`);
      invalid++;
      continue;
    }
    if (!info.valid) { invalid++; continue; }

    const fallback = nameFromFilename(file);
    const family = info.family || fallback.family;
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    const record = {
      id: store.newId(),
      file,
      name: family,
      nameArabic: info.localizedName || arabicDisplayName(family) || null,
      style: info.subfamily || fallback.style || null,
      fullName: info.fullName || null,
      postScriptName: info.postScriptName || null,
      version: info.version || null,
      designer: info.designer || null,
      license: info.license ? String(info.license).slice(0, 2000) : null,
      licenseUrl: info.licenseUrl || null,
      vendorUrl: info.vendorUrl || null,
      copyright: info.copyright ? String(info.copyright).slice(0, 2000) : null,
      format: info.format,
      size: stat.size,
      sha256,
      arabic: !!info.arabic,
      latin: !!info.latin,
      variable: !!info.variable,
      axes: info.axes || null,
      numGlyphs: info.numGlyphs || null,
      cmapFormat: info.cmapFormat || null,
      weightClass: info.weightClass || null,
      italic: !!info.italic,
      bold: !!info.bold,
      tags: [],
      note: 'خط مفتوح المصدر ضمن المكتبة الأساسية (رخصة Apache/OFL).',
      sample: null,
      source: 'library',
      uploadedBy: null,
      downloads: 0,
      addedAt: new Date(stat.mtimeMs || Date.now()).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.db.fonts.push(record);
    imported.push(record);
    log(`[seed] تم استيراد: ${family} (${file})`);
  }

  if (imported.length) await store.save();
  return { imported: imported.length, skipped, invalid, records: imported };
}

module.exports = { seed, arabicDisplayName };
