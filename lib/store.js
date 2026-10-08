'use strict';
/**
 * تخزين بيانات المكتبة على السيرفر (ملفات JSON + ملفات الخطوط على القرص)
 * التخزين آمن ضد التلف: كل كتابة تتم على ملف مؤقت ثم تُستبدل ذريًا.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.FONTS_DATA_DIR ? path.resolve(process.env.FONTS_DATA_DIR) : path.join(ROOT, 'data');
const FONTS_DIR = path.join(DATA_DIR, 'fonts');
const TMP_DIR = path.join(DATA_DIR, 'tmp');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'files.json');

const EMPTY_DB = { version: 1, updatedAt: new Date().toISOString(), fonts: [] };

let db = { ...EMPTY_DB, fonts: [] };
let saveQueue = Promise.resolve();

function ensureDirs() {
  for (const dir of [DATA_DIR, FONTS_DIR, TMP_DIR, BACKUP_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function load() {
  ensureDirs();
  try {
    const raw = await fsp.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.fonts)) {
      db = { version: 1, updatedAt: parsed.updatedAt || new Date().toISOString(), fonts: parsed.fonts };
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[store] تعذر قراءة files.json، سيتم إنشاء فهرس جديد:', err.message);
      try {
        const backup = path.join(BACKUP_DIR, `files.corrupt.${Date.now()}.json`);
        await fsp.copyFile(DB_FILE, backup);
        console.error('[store] تم الاحتفاظ بنسخة من الملف التالف في', backup);
      } catch { /* ignore */ }
    }
    await save();
  }
  return db;
}

function save() {
  saveQueue = saveQueue.then(async () => {
    ensureDirs();
    db.updatedAt = new Date().toISOString();
    const tmp = path.join(TMP_DIR, `files.${process.pid}.${Date.now()}.json`);
    await fsp.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
    await fsp.rename(tmp, DB_FILE);
  }).catch((err) => {
    console.error('[store] فشل حفظ الفهرس:', err.message);
  });
  return saveQueue;
}

/* ------------------------------- queries ------------------------------- */

function list() {
  return db.fonts;
}

function get(id) {
  return db.fonts.find((f) => f.id === id) || null;
}

function findByHash(sha256) {
  return db.fonts.find((f) => f.sha256 === sha256) || null;
}

function findByFile(file) {
  return db.fonts.find((f) => f.file === file) || null;
}

function add(record) {
  db.fonts.push(record);
  return save().then(() => record);
}

function update(id, patch) {
  const font = get(id);
  if (!font) return Promise.resolve(null);
  Object.assign(font, patch, { updatedAt: new Date().toISOString() });
  return save().then(() => font);
}

function remove(id) {
  const idx = db.fonts.findIndex((f) => f.id === id);
  if (idx === -1) return Promise.resolve(null);
  const [font] = db.fonts.splice(idx, 1);
  return save().then(() => font);
}

/* ------------------------------- helpers ------------------------------- */

function newId() {
  return 'f_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

/** اسم ملف آمن وفريد داخل مجلد الخطوط */
function safeFileName(originalName, existing = new Set(db.fonts.map((f) => f.file))) {
  const base = String(originalName || 'font')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '-')
    .replace(/^\.+/, '')
    .replace(/\s+/g, ' ')
    .trim() || 'font';

  const m = /^(.*?)(\.[A-Za-z0-9]{1,6})?$/.exec(base.length > 120 ? base.slice(0, 120) : base);
  let stem = (m[1] || 'font').trim() || 'font';
  const ext = (m[2] || '').toLowerCase();

  let candidate = stem + ext;
  let i = 1;
  const taken = (name) => existing.has(name) || fs.existsSync(path.join(FONTS_DIR, name));
  while (taken(candidate)) {
    candidate = `${stem} (${++i})${ext}`;
  }
  return candidate;
}

function relativeUrl(file) {
  return '/files/' + encodeURIComponent(file);
}

module.exports = {
  ROOT,
  DATA_DIR,
  FONTS_DIR,
  TMP_DIR,
  BACKUP_DIR,
  DB_FILE,
  ensureDirs,
  load,
  save,
  list,
  get,
  findByHash,
  findByFile,
  add,
  update,
  remove,
  newId,
  safeFileName,
  relativeUrl,
  get db() { return db; },
};
