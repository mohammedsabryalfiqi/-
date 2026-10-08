'use strict';
/**
 * مكتبة الخطوط العربية — سيرفر Node.js بدون أي تبعيات خارجية
 *
 * التشغيل:  node server.js        (المنت الافتراضي 4173)
 * متغيرات البيئة: PORT, HOST, FONTS_DATA_DIR, ADMIN_TOKEN
 */

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const store = require('./lib/store');
const { inspectFont, nameFromFilename } = require('./lib/font-info');
const { seed } = require('./lib/seed');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 64 * 1024 * 1024); // 64MB لكل خط
const MAX_TOTAL_SIZE = Number(process.env.MAX_TOTAL_SIZE || 512 * 1024 * 1024); // 512MB للطلب الواحد
const MAX_FILES_PER_REQUEST = Number(process.env.MAX_FILES_PER_REQUEST || 300);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ttc': 'font/collection',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
};

/* ------------------------------------------------------------------ */
/* utilities                                                           */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
};

const ok = (res, payload = {}) => json(res, 200, { ok: true, ...payload });
const fail = (res, status, message, extra = {}) => json(res, status, { ok: false, error: message, ...extra });

async function readJsonBody(req, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'حجم البيانات المرسلة كبير جدًا');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'JSON غير صالح');
  }
}

function safeJoin(baseDir, unsafePath) {
  const decoded = decodeURIComponent(unsafePath);
  if (decoded.includes('\u0000')) return null;
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (normalized.split(/[/\\]/).some((p) => p === '..')) return null;
  const full = path.join(baseDir, normalized);
  if (!full.startsWith(baseDir + path.sep) && full !== baseDir) return null;
  return full;
}

function publicFont(record) {
  const { sha256, ...rest } = record;
  return { ...rest, url: store.relativeUrl(record.file), sha256Short: (sha256 || '').slice(0, 12) };
}

/* ------------------------------------------------------------------ */
/* multipart/form-data parser (streaming, no dependencies)             */
/* ------------------------------------------------------------------ */

/**
 * يحلّل الطلب ويحفظ الملفات المرفوعة في مجلد مؤقت.
 * @returns {Promise<{fields: Object, files: Array}>}
 */
function readMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    if (!/^multipart\/form-data/i.test(contentType) || !match) {
      reject(new HttpError(415, 'يجب إرسال الخطوط بصيغة multipart/form-data'));
      return;
    }
    const boundary = (match[1] || match[2]).trim();
    if (!boundary || boundary.length > 200) {
      reject(new HttpError(400, 'boundary غير صالح'));
      return;
    }

    const firstDelimiter = Buffer.from('--' + boundary);
    const delimiter = Buffer.from('\r\n--' + boundary);
    const HEADER_END = Buffer.from('\r\n\r\n');

    const fields = {};
    const files = [];
    const finishStreams = [];
    let total = 0;
    let pending = Buffer.alloc(0);
    let state = 'start';
    let current = null;
    let paused = false;
    let settled = false;

    const cleanupTmp = async () => {
      for (const f of files) {
        if (f.tmpPath) await fsp.rm(f.tmpPath, { force: true }).catch(() => {});
      }
    };

    const die = (err) => {
      if (settled) return;
      settled = true;
      try { req.destroy(); } catch { /* ignore */ }
      if (current && current.stream) {
        try { current.stream.destroy(); } catch { /* ignore */ }
      } else if (current && current.tmpPath) {
        fsp.rm(current.tmpPath, { force: true }).catch(() => {});
      }
      cleanupTmp().finally(() => reject(err instanceof HttpError ? err : new HttpError(400, err.message || 'فشل رفع الملفات')));
    };

    const startPart = (rawHeaders) => {
      const lines = rawHeaders.split('\r\n');
      let name = '';
      let filename = null;
      let partType = '';
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();
        if (key === 'content-disposition') {
          const n = /name="([^"]*)"/i.exec(value);
          if (n) name = n[1];
          const f = /filename\*?=(?:UTF-8'')?"?([^"]*)"?/i.exec(value);
          if (f && f[1]) filename = decodeURIComponent(f[1]);
        } else if (key === 'content-type') {
          partType = value;
        }
      }
      if (!name && !filename) throw new HttpError(400, 'جزء غير معروف داخل الطلب');

      if (filename !== null) {
        if (files.length >= MAX_FILES_PER_REQUEST) {
          throw new HttpError(413, `لا يمكن رفع أكثر من ${MAX_FILES_PER_REQUEST} خطًا في الطلب الواحد`);
        }
        const cleanName = path.basename(String(filename).replace(/[\\/]+/g, '-')).replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'font';
        const tmpPath = path.join(store.TMP_DIR, `up_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`);
        const stream = fs.createWriteStream(tmpPath);
        stream.on('error', die);
        current = {
          kind: 'file',
          field: name || 'files',
          filename: cleanName,
          contentType: partType,
          tmpPath,
          stream,
          size: 0,
          hash: crypto.createHash('sha256'),
          streamError: null,
        };
        stream.on('error', (err) => { current && (current.streamError = err); });
        files.push(current);
      } else {
        current = { kind: 'field', field: name, chunks: [], size: 0 };
      }
    };

    const writePart = (chunk) => {
      if (!chunk || !chunk.length || !current) return;
      total += chunk.length;
      if (total > MAX_TOTAL_SIZE) throw new HttpError(413, 'إجمالي حجم الطلب أكبر من الحد المسموح');
      if (current.kind === 'file') {
        current.size += chunk.length;
        if (current.size > MAX_FILE_SIZE) {
          throw new HttpError(413, `حجم الملف "${current.filename}" أكبر من ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} ميجابايت`);
        }
        current.hash.update(chunk);
        const okToWrite = current.stream.write(chunk);
        if (!okToWrite && !paused) {
          paused = true;
          req.pause();
          current.stream.once('drain', () => {
            paused = false;
            try { req.resume(); } catch { /* ignore */ }
          });
        }
      } else {
        current.size += chunk.length;
        if (current.size > 1024 * 1024) throw new HttpError(413, 'قيمة الحقل كبيرة جدًا');
        current.chunks.push(chunk);
      }
    };

    const endPart = () => {
      if (!current) return;
      if (current.kind === 'file') {
        const part = current;
        part.stream.end();
        finishStreams.push(new Promise((res, rej) => {
          part.stream.on('finish', res);
          part.stream.on('error', rej);
        }));
      } else {
        const value = Buffer.concat(current.chunks).toString('utf8').trim();
        if (current.field) {
          if (fields[current.field] === undefined) fields[current.field] = value;
          else if (Array.isArray(fields[current.field])) fields[current.field].push(value);
          else fields[current.field] = [fields[current.field], value];
        }
      }
      current = null;
    };

    const pump = () => {
      for (;;) {
        if (state === 'done') return;
        switch (state) {
          case 'start': {
            const idx = pending.indexOf(firstDelimiter);
            if (idx === -1) {
              if (pending.length > 64 * 1024) throw new HttpError(400, 'طلب غير صالح');
              if (pending.length > firstDelimiter.length) {
                pending = pending.subarray(pending.length - firstDelimiter.length);
              }
              return;
            }
            pending = pending.subarray(idx + firstDelimiter.length);
            state = 'after-delimiter';
            break;
          }
          case 'after-delimiter': {
            if (pending.length < 2) return;
            if (pending[0] === 0x2d && pending[1] === 0x2d) { // "--" => نهاية
              pending = pending.subarray(2);
              state = 'done';
              return;
            }
            if (pending[0] === 0x0d && pending[1] === 0x0a) {
              pending = pending.subarray(2);
              state = 'headers';
              break;
            }
            throw new HttpError(400, 'صيغة الطلب غير صحيحة (multipart)');
          }
          case 'headers': {
            const idx = pending.indexOf(HEADER_END);
            if (idx === -1) {
              if (pending.length > 64 * 1024) throw new HttpError(400, 'ترويسات الجزء كبيرة جدًا');
              return;
            }
            const raw = pending.toString('utf8', 0, idx);
            pending = pending.subarray(idx + HEADER_END.length);
            startPart(raw);
            state = 'body';
            break;
          }
          case 'body': {
            const idx = pending.indexOf(delimiter);
            if (idx === -1) {
              const keep = Math.min(pending.length, delimiter.length - 1);
              if (pending.length - keep > 0) writePart(pending.subarray(0, pending.length - keep));
              pending = pending.subarray(pending.length - keep);
              return;
            }
            writePart(pending.subarray(0, idx));
            pending = pending.subarray(idx + delimiter.length);
            endPart();
            state = 'after-delimiter';
            break;
          }
          default:
            return;
        }
      }
    };

    req.on('data', (chunk) => {
      if (settled) return;
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      try {
        pump();
      } catch (err) {
        die(err);
      }
    });

    req.on('aborted', () => die(new HttpError(499, 'تم إلغاء الرفع')));
    req.on('error', (err) => die(err));

    req.on('end', async () => {
      if (settled) return;
      if (state !== 'done') {
        die(new HttpError(400, 'انتهى الطلب قبل اكتمال البيانات'));
        return;
      }
      try {
        await Promise.all(finishStreams);
        settled = true;
        const valid = files.filter((f) => f.size > 0);
        resolve({ fields, files: valid, allFiles: files });
      } catch (err) {
        die(err);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* API: list / search                                                  */
/* ------------------------------------------------------------------ */

function normalizeArabic(str) {
  return String(str || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matches(record, query) {
  const q = normalizeArabic(query);
  if (!q) return true;
  const haystack = normalizeArabic([
    record.name,
    record.nameArabic,
    record.style,
    record.fullName,
    record.postScriptName,
    (record.tags || []).join(' '),
    record.note,
    record.designer,
    record.sample,
    record.file,
    record.originalFileName,
  ].filter(Boolean).join(' '));
  return q.split(' ').every((token) => haystack.includes(token));
}

function handleList(req, res, url) {
  const p = url.searchParams;
  const query = (p.get('q') || '').trim();
  const filter = (p.get('filter') || '').trim();
  const sort = (p.get('sort') || 'recent').trim();
  const limit = Math.min(Math.max(Number(p.get('limit') || 0) || 0, 0), 1000);
  const offset = Math.max(Number(p.get('offset') || 0) || 0, 0);

  let items = store.list().slice();

  if (query) items = items.filter((f) => matches(f, query));
  if (filter === 'arabic') items = items.filter((f) => f.arabic);
  if (filter === 'variable') items = items.filter((f) => f.variable);
  if (filter === 'static') items = items.filter((f) => !f.variable);
  if (filter === 'latin') items = items.filter((f) => f.latin);

  const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ar');
  const sorters = {
    recent: (a, b) => String(b.addedAt).localeCompare(String(a.addedAt)),
    oldest: (a, b) => String(a.addedAt).localeCompare(String(b.addedAt)),
    name: byName,
    'name-desc': (a, b) => byName(b, a),
    size: (a, b) => (b.size || 0) - (a.size || 0),
    downloads: (a, b) => (b.downloads || 0) - (a.downloads || 0),
  };
  items.sort(sorters[sort] || sorters.recent);

  const counts = {
    total: store.list().length,
    arabic: store.list().filter((f) => f.arabic).length,
    variable: store.list().filter((f) => f.variable).length,
    latin: store.list().filter((f) => f.latin).length,
  };
  const totalBytes = store.list().reduce((sum, f) => sum + (f.size || 0), 0);

  const total = items.length;
  if (limit) items = items.slice(offset, offset + limit);
  else if (offset) items = items.slice(offset);

  return ok(res, {
    fonts: items.map(publicFont),
    total,
    counts: { ...counts, bytes: totalBytes },
    query: query || null,
    sort,
    filter: filter || null,
  });
}

/* ------------------------------------------------------------------ */
/* API: upload                                                         */
/* ------------------------------------------------------------------ */

async function handleUpload(req, res) {
  const { fields, files } = await readMultipart(req);
  const force = ['1', 'true', 'yes', 'on'].includes(String(fields.overwrite || fields.force || '').toLowerCase());
  const defaults = {
    name: typeof fields.name === 'string' ? fields.name.trim() : '',
    sample: typeof fields.sample === 'string' ? fields.sample.slice(0, 500) : '',
    note: typeof fields.note === 'string' ? fields.note.slice(0, 2000) : '',
    tags: typeof fields.tags === 'string'
      ? fields.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean).slice(0, 30)
      : [],
    uploadedBy: typeof fields.uploadedBy === 'string' ? fields.uploadedBy.slice(0, 120) : null,
  };

  if (!files.length) throw new HttpError(400, 'لم يتم إرسال أي ملف خط');

  const added = [];
  const errors = [];
  const duplicates = [];

  for (const file of files) {
    try {
      const buf = await fsp.readFile(file.tmpPath);
      if (!buf.length) throw new HttpError(400, 'الملف فارغ');

      const info = inspectFont(buf, file.filename);
      const fallback = nameFromFilename(file.filename);
      if (!info.valid) {
        throw new HttpError(415, `"${file.filename}" ليس ملف خط صالحًا (يُدعم TTF و OTF و WOFF و WOFF2)`);
      }
      if (info.format === 'bin') {
        throw new HttpError(415, `صيغة الملف "${file.filename}" غير مدعومة`);
      }

      const sha256 = file.hash.digest('hex');
      const duplicate = store.findByHash(sha256);
      if (duplicate && !force) {
        duplicates.push({ file: file.filename, id: duplicate.id, name: duplicate.name });
        await fsp.rm(file.tmpPath, { force: true });
        continue;
      }

      const family = (defaults.name || info.family || fallback.family || 'خط بدون اسم').trim();
      const storedName = store.safeFileName(file.filename);
      const destPath = path.join(store.FONTS_DIR, storedName);
      await fsp.rename(file.tmpPath, destPath);

      const record = {
        id: store.newId(),
        file: storedName,
        originalFileName: file.filename,
        name: family,
        nameArabic: info.localizedName || null,
        style: info.subfamily || fallback.style || null,
        fullName: info.fullName || fallback.pretty || null,
        postScriptName: info.postScriptName || null,
        version: info.version || null,
        designer: info.designer || null,
        license: info.license ? String(info.license).slice(0, 2000) : null,
        licenseUrl: info.licenseUrl || null,
        vendorUrl: info.vendorUrl || null,
        copyright: info.copyright ? String(info.copyright).slice(0, 2000) : null,
        format: info.format,
        size: buf.length,
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
        tags: defaults.tags.slice(),
        note: defaults.note,
        sample: defaults.sample || null,
        source: 'upload',
        uploadedBy: defaults.uploadedBy,
        downloads: 0,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await store.add(record);
      added.push(publicFont(record));
    } catch (err) {
      await fsp.rm(file.tmpPath, { force: true }).catch(() => {});
      errors.push({ file: file.filename, message: err.message || 'خطأ غير معروف' });
    }
  }

  if (!added.length && errors.length) {
    return json(res, 400, { ok: false, error: errors[0].message, errors, duplicates });
  }
  return ok(res, { added, errors, duplicates, count: added.length });
}

/* ------------------------------------------------------------------ */
/* API: update / delete / export                                       */
/* ------------------------------------------------------------------ */

async function handlePatch(req, res, id) {
  const record = store.get(id);
  if (!record) return fail(res, 404, 'الخط غير موجود');
  const body = await readJsonBody(req);
  const patch = {};
  if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 200) || record.name;
  if (typeof body.nameArabic === 'string') patch.nameArabic = body.nameArabic.trim().slice(0, 200) || null;
  if (typeof body.sample === 'string') {
    const val = body.sample.trim().slice(0, 500);
    patch.sample = val || null;
  }
  if (typeof body.note === 'string') patch.note = body.note.slice(0, 2000);
  if (typeof body.designer === 'string') patch.designer = body.designer.slice(0, 200);
  if (Array.isArray(body.tags)) patch.tags = body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 30);
  if (typeof body.arabic === 'boolean') patch.arabic = body.arabic;
  if (typeof body.hidden === 'boolean') patch.hidden = body.hidden;

  const updated = await store.update(id, patch);
  return ok(res, { font: publicFont(updated) });
}

async function handleDelete(res, id) {
  const record = store.get(id);
  if (!record) return fail(res, 404, 'الخط غير موجود');
  await store.remove(id);
  await fsp.rm(path.join(store.FONTS_DIR, record.file), { force: true }).catch(() => {});
  return ok(res, { deleted: id, name: record.name });
}

/* ------------------------------------------------------------------ */
/* static files                                                        */
/* ------------------------------------------------------------------ */

function serveFontFile(req, res, fileName, { download = false } = {}) {
  const safe = path.basename(fileName);
  const full = path.join(store.FONTS_DIR, safe);
  if (!full.startsWith(store.FONTS_DIR)) return fail(res, 403, 'ممنوع');
  return serveFile(req, res, full, { download });
}

function serveFile(req, res, fullPath, { download = false, cache = 'public' } = {}) {
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return fail(res, 404, 'الملف غير موجود');
  }
  if (!stat.isFile()) return fail(res, 404, 'الملف غير موجود');

  const ext = path.extname(fullPath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs).toString(36)}"`;

  const headers = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cache === 'no-cache' ? 'no-cache' : 'public, max-age=604800, immutable',
    ETag: etag,
    'Last-Modified': new Date(stat.mtimeMs).toUTCString(),
  };
  if (download) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(path.basename(fullPath))}"; filename*=UTF-8''${encodeURIComponent(path.basename(fullPath))}`;
  }

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  const range = req.headers.range;
  if (range && /^bytes=/.test(range)) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    let start = startStr ? Number(startStr) : 0;
    let end = endStr ? Number(endStr) : stat.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    end = Math.min(end, stat.size - 1);
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    headers['Content-Length'] = String(end - start + 1);
    res.writeHead(206, headers);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(fullPath, { start, end }).pipe(res);
  }

  headers['Content-Length'] = String(stat.size);
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  return fs.createReadStream(fullPath).pipe(res);
}

/* ------------------------------------------------------------------ */
/* router                                                              */
/* ------------------------------------------------------------------ */

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS بسيط (مفيد عند استخدام المكتبة من موقع آخر)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/api/health') {
    return ok(res, { status: 'up', fonts: store.list().length, uptime: process.uptime() });
  }

  if (pathname.startsWith('/api/')) {
    const needsAdmin = pathname.startsWith('/api/admin');
    if (needsAdmin && ADMIN_TOKEN && req.headers['x-admin-token'] !== ADMIN_TOKEN) {
      return fail(res, 401, 'غير مصرح');
    }

    if (pathname === '/api/fonts' && (req.method === 'GET' || req.method === 'HEAD')) {
      return handleList(req, res, url);
    }
    if (pathname === '/api/fonts' && req.method === 'POST') {
      return handleUpload(req, res);
    }
    if (pathname === '/api/export' && req.method === 'GET') {
      return ok(res, { exportedAt: new Date().toISOString(), fonts: store.list().map(publicFont) });
    }

    const idMatch = /^\/api\/fonts\/([A-Za-z0-9_\-]+)$/.exec(pathname);
    if (idMatch) {
      const id = idMatch[1];
      const record = store.get(id);
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (!record) return fail(res, 404, 'الخط غير موجود');
        return ok(res, { font: publicFont(record) });
      }
      if (req.method === 'PATCH') return handlePatch(req, res, id);
      if (req.method === 'DELETE') return handleDelete(res, id);
    }

    const downloadTrack = /^\/api\/fonts\/([A-Za-z0-9_\-]+)\/download$/.exec(pathname);
    if (downloadTrack && (req.method === 'GET' || req.method === 'HEAD')) {
      const record = store.get(downloadTrack[1]);
      if (!record) return fail(res, 404, 'الخط غير موجود');
      record.downloads = (record.downloads || 0) + 1;
      store.save();
      return serveFontFile(req, res, record.file, { download: true });
    }

    return fail(res, 404, 'مسار غير معروف');
  }

  // ملفات الخطوط
  if (pathname.startsWith('/files/')) {
    return serveFontFile(req, res, decodeURIComponent(pathname.slice('/files/'.length)), {
      download: url.searchParams.get('download') === '1',
    });
  }
  if (pathname.startsWith('/download/')) {
    const record = store.findByFile(path.basename(decodeURIComponent(pathname.slice('/download/'.length))));
    if (record) {
      record.downloads = (record.downloads || 0) + 1;
      store.save();
    }
    return serveFontFile(req, res, decodeURIComponent(pathname.slice('/download/'.length)), { download: true });
  }

  // صفحة العارض لأي اسم خط: /font/اسم-الخط
  if (pathname.startsWith('/font/')) {
    return serveFile(req, res, path.join(PUBLIC_DIR, 'index.html'), { cache: 'no-cache' });
  }

  if (pathname === '/' || pathname === '/index.html') {
    return serveFile(req, res, path.join(PUBLIC_DIR, 'index.html'), { cache: 'no-cache' });
  }
  if (pathname === '/embed.js') {
    return serveFile(req, res, path.join(PUBLIC_DIR, 'embed.js'), { cache: 'no-cache' });
  }

  const filePath = safeJoin(PUBLIC_DIR, pathname);
  if (filePath) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) return serveFile(req, res, filePath);
      if (stat.isDirectory()) {
        const idx = path.join(filePath, 'index.html');
        if (fs.existsSync(idx)) return serveFile(req, res, idx, { cache: 'no-cache' });
      }
    } catch { /* fallthrough */ }
  }

  return serveFile(req, res, path.join(PUBLIC_DIR, 'index.html'), { cache: 'no-cache' });
}

/* ------------------------------------------------------------------ */
/* bootstrap                                                           */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const started = Date.now();
  res.on('finish', () => {
    if (process.env.QUIET === '1') return;
    const ms = Date.now() - started;
    console.log(`${req.method} ${req.url} → ${res.statusCode} (${ms}ms)`);
  });
  route(req, res).catch((err) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error('[error]', err);
    if (res.headersSent) return res.end();
    fail(res, status, err.message || 'خطأ داخلي في السيرفر');
  });
});

server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

async function main() {
  await store.load();
  try {
    const result = await seed({ log: (...args) => console.log(...args) });
    if (result.imported) console.log(`[seed] تم استيراد ${result.imported} خطًا من مجلد data/fonts`);
  } catch (err) {
    console.error('[seed] تعذر الاستيراد:', err.message);
  }
  server.listen(PORT, HOST, () => {
    console.log(`\n  مكتبة الخطوط العربية تعمل الآن`);
    console.log(`  محليًا:    http://localhost:${PORT}`);
    console.log(`  الخطوط:     ${store.list().length} خطًا في المكتبة`);
    console.log(`  مجلد البيانات: ${store.DATA_DIR}\n`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { server, main, route };
