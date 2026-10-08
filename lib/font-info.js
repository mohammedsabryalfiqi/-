'use strict';
/**
 * استخراج معلومات الخطوط من الملفات نفسها (بدون أي مكتبات خارجية)
 * يدعم: TTF / OTF / WOFF / WOFF2 / TTC
 *
 * Font metadata extraction: name table, cmap (Arabic coverage), fvar axes...
 */

const zlib = require('zlib');

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const SFNT_MAGIC = new Set([
  0x00010000, // TrueType
  0x4f54544f, // 'OTTO' CFF
  0x74727565, // 'true'
  0x74746366, // 'ttcf'
]);

const tag = (buf, off) => buf.toString('latin1', off, off + 4).trim();
const u8 = (buf, off) => buf.readUInt8(off);
const u16 = (buf, off) => buf.readUInt16BE(off);
const i16 = (buf, off) => buf.readInt16BE(off);
const u32 = (buf, off) => buf.readUInt32BE(off);
const fixed = (buf, off) => buf.readInt32BE(off) / 65536;

function readUIntBase128(buf, pos) {
  let result = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[pos++];
    if (i === 0 && byte === 0x80) return null; // leading zeros not allowed
    if (result & 0xfe000000) return null;
    result = (result << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value: result >>> 0, next: pos };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* sfnt table directory                                                */
/* ------------------------------------------------------------------ */

/** Returns a Map<tag, {offset, length}> over a raw (uncompressed) sfnt buffer */
function readSfntTables(buf, base = 0) {
  const tables = new Map();
  const numTables = u16(buf, base + 4);
  for (let i = 0; i < numTables; i++) {
    const p = base + 12 + i * 16;
    if (p + 16 > buf.length) break;
    tables.set(tag(buf, p), { offset: u32(buf, p + 8), length: u32(buf, p + 12) });
  }
  return tables;
}

/* ------------------------------------------------------------------ */
/* name table                                                          */
/* ------------------------------------------------------------------ */

const NAME_IDS = {
  0: 'copyright',
  1: 'family',
  2: 'subfamily',
  3: 'uniqueId',
  4: 'fullName',
  5: 'version',
  6: 'postScriptName',
  7: 'trademark',
  8: 'manufacturer',
  9: 'designer',
  11: 'vendorUrl',
  12: 'designerUrl',
  13: 'license',
  14: 'licenseUrl',
  16: 'typographicFamily',
  17: 'typographicSubfamily',
  18: 'compatibleFull',
  19: 'sampleText',
  20: 'postScriptCid',
};

function decodeNameString(buf, platformID, encodingID, bytes) {
  // platform 0 = Unicode, 3 = Windows (UTF-16BE), 1 = Mac (assume latin-1 / mac-roman subset)
  if (platformID === 0 || platformID === 3) return swapUtf16BE(bytes);
  return bytes.toString('latin1');
}

function swapUtf16BE(bytes) {
  // Buffer#toString('utf16le') expects little-endian: swap pairs first
  const copy = Buffer.from(bytes);
  if (copy.length % 2 !== 0) return copy.toString('utf8');
  for (let i = 0; i + 1 < copy.length; i += 2) {
    const t = copy[i];
    copy[i] = copy[i + 1];
    copy[i + 1] = t;
  }
  return copy.toString('utf16le');
}

/**
 * @returns {{values: Object<string,string>, byLang: Object<string,Object>}}
 */
function parseNameTable(buf, offset, length) {
  const end = offset + length;
  const out = { values: {}, byLang: { en: {}, ar: {} } };
  if (offset < 0 || length < 6 || end > buf.length) return out;

  const count = u16(buf, offset + 2);
  const stringOffset = u16(buf, offset + 4);
  const storage = offset + stringOffset;

  const candidates = {}; // nameID -> [{lang, priority, text}]

  for (let i = 0; i < count; i++) {
    const p = offset + 6 + i * 12;
    if (p + 12 > end) break;
    const platformID = u16(buf, p);
    const encodingID = u16(buf, p + 2);
    const languageID = u16(buf, p + 4);
    const nameID = u16(buf, p + 6);
    const strLen = u16(buf, p + 8);
    const strOff = u16(buf, p + 10);
    const key = NAME_IDS[nameID];
    if (!key || strLen === 0) continue;

    const start = storage + strOff;
    const stop = Math.min(start + strLen, end);
    if (start < 0 || start >= stop) continue;
    const raw = buf.subarray(start, stop);

    let text;
    try {
      text = decodeNameString(buf, platformID, encodingID, raw);
    } catch {
      continue;
    }
    text = (text || '').replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    // ignore obvious mojibake
    if (/\uFFFD{2,}/.test(text)) continue;

    // language detection: Windows LCIDs / Mac lang ids
    let lang = 'other';
    if (platformID === 3) {
      if (languageID === 0x409) lang = 'en';
      else if (languageID === 0x401 || languageID === 0x801 || languageID === 0xc01 || languageID === 0x1001) lang = 'ar';
      else lang = 'other';
    } else if (platformID === 0) {
      lang = 'en';
    } else if (platformID === 1) {
      lang = languageID === 0 ? 'en' : 'other';
    }

    const priority = platformID === 3 ? (lang === 'en' ? 0 : 1) : platformID === 0 ? 2 : 3;
    (candidates[nameID] = candidates[nameID] || []).push({ key, lang, priority, text, platformID });
  }

  for (const nameID of Object.keys(candidates)) {
    const list = candidates[nameID];
    list.sort((a, b) => a.priority - b.priority);
    const key = list[0].key;
    if (!out.values[key]) out.values[key] = list[0].text;
    // collect localized (arabic) and english variants
    for (const item of list) {
      if (item.lang === 'ar' && !out.byLang.ar[key]) out.byLang.ar[key] = item.text;
      if (item.lang === 'en' && !out.byLang.en[key]) out.byLang.en[key] = item.text;
    }
    // if the best candidate is arabic, remember it as localized too
    if (list[0].lang === 'ar' && !out.byLang.ar[key]) out.byLang.ar[key] = list[0].text;
  }

  // family fallbacks
  if (!out.values.family && out.values.typographicFamily) out.values.family = out.values.typographicFamily;
  if (!out.values.subfamily && out.values.typographicSubfamily) out.values.subfamily = out.values.typographicSubfamily;
  return out;
}

/* ------------------------------------------------------------------ */
/* cmap                                                                */
/* ------------------------------------------------------------------ */

function parseCmapSubtable(buf, offset, tableEnd) {
  const format = u16(buf, offset);
  const map = new Map();
  const lookup = (cp) => {
    switch (format) {
      case 0: {
        if (cp > 255) return 0;
        return u8(buf, offset + 6 + cp);
      }
      case 4: {
        if (cp > 0xffff) return 0;
        const segCountX2 = u16(buf, offset + 6);
        const segCount = segCountX2 / 2;
        const endBase = offset + 14;
        const startBase = endBase + segCountX2 + 2;
        const deltaBase = startBase + segCountX2;
        const rangeBase = deltaBase + segCountX2;
        for (let i = 0; i < segCount; i++) {
          const endCode = u16(buf, endBase + i * 2);
          if (cp > endCode) continue;
          const startCode = u16(buf, startBase + i * 2);
          if (cp < startCode) return 0;
          const delta = i16(buf, deltaBase + i * 2);
          const rangeOffset = u16(buf, rangeBase + i * 2);
          if (rangeOffset === 0) return (cp + delta) & 0xffff;
          const glyphIndexAddr = rangeBase + i * 2 + rangeOffset + (cp - startCode) * 2;
          if (glyphIndexAddr + 2 > tableEnd) return 0;
          const gid = u16(buf, glyphIndexAddr);
          if (gid === 0) return 0;
          return (gid + delta) & 0xffff;
        }
        return 0;
      }
      case 6: {
        const first = u16(buf, offset + 6);
        const count = u16(buf, offset + 8);
        if (cp < first || cp >= first + count) return 0;
        return u16(buf, offset + 10 + (cp - first) * 2);
      }
      case 12: {
        const nGroups = u32(buf, offset + 12);
        let lo = 0;
        let hi = nGroups - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const p = offset + 16 + mid * 12;
          const startChar = u32(buf, p);
          const endChar = u32(buf, p + 4);
          if (cp < startChar) hi = mid - 1;
          else if (cp > endChar) lo = mid + 1;
          else return u32(buf, p + 8) + (cp - startChar);
        }
        return 0;
      }
      case 13: {
        const nGroups = u32(buf, offset + 12);
        for (let i = 0; i < nGroups; i++) {
          const p = offset + 16 + i * 12;
          if (cp >= u32(buf, p) && cp <= u32(buf, p + 4)) return u32(buf, p + 8);
        }
        return 0;
      }
      default:
        return 0;
    }
  };

  if (format === 4 || format === 12 || format === 6 || format === 0 || format === 13) {
    for (const cp of ARABIC_PROBES) map.set(cp, lookup(cp));
    map.set(0x0041, lookup(0x0041)); // A
    map.set(0x0640, lookup(0x0640)); // ـ tatweel
    map.set(0x200c, lookup(0x200c)); // ZWNJ (used by arabic shaping)
    return { format, map };
  }
  return null;
}

const ARABIC_PROBES = [0x0627, 0x0628, 0x062c, 0x0645, 0x064a, 0x06f0 /* ۰ extended arabic digit */, 0xfee0];

function parseCmap(tables, buf) {
  const cmapTable = tables.get('cmap');
  if (!cmapTable) return null;
  const offset = cmapTable.offset;
  const numTables = u16(buf, offset + 2);
  const encodings = [];
  for (let i = 0; i < numTables; i++) {
    const p = offset + 4 + i * 8;
    encodings.push({ platformID: u16(buf, p), encodingID: u16(buf, p + 2), offset: u32(buf, p + 4) });
  }
  // prefer UCS-4 (3,10) then BMP (3,1), then unicode platform
  const score = (e) =>
    e.platformID === 3 && e.encodingID === 10 ? 0 :
    e.platformID === 0 && e.encodingID >= 4 ? 1 :
    e.platformID === 3 && e.encodingID === 1 ? 2 :
    e.platformID === 0 ? 3 : 4;
  encodings.sort((a, b) => score(a) - score(b));

  const tableEnd = offset + cmapTable.length;
  for (const enc of encodings) {
    const sub = parseCmapSubtable(buf, offset + enc.offset, tableEnd);
    if (sub) {
      const values = Object.fromEntries(sub.map);
      const arabicProbes = ARABIC_PROBES.slice(0, 6).map((cp) => sub.map.get(cp) || 0);
      const arabic = arabicProbes.filter((g) => g > 0).length >= 2;
      const latin = (sub.map.get(0x0041) || 0) > 0;
      return { format: sub.format, values, arabic, latin };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* fvar (variable fonts)                                               */
/* ------------------------------------------------------------------ */

function parseFvar(tables, buf) {
  const t = tables.get('fvar');
  if (!t) return null;
  const o = t.offset;
  try {
    const axesArrayOffset = u16(buf, o + 4);
    const axisCount = u16(buf, o + 8);
    const axisSize = u16(buf, o + 10);
    const axes = [];
    for (let i = 0; i < axisCount; i++) {
      const p = o + axesArrayOffset + i * axisSize;
      axes.push({
        tag: tag(buf, p),
        min: fixed(buf, p + 4),
        default: fixed(buf, p + 8),
        max: fixed(buf, p + 12),
      });
    }
    return axes.length ? axes : null;
  } catch {
    return null;
  }
}

function parseOs2(tables, buf) {
  const t = tables.get('OS/2');
  if (!t) return null;
  try {
    const o = t.offset;
    const weightClass = u16(buf, o + 4);
    const widthClass = u16(buf, o + 6);
    const fsSelection = u16(buf, o + 62);
    const italic = (fsSelection & 1) !== 0;
    const bold = (fsSelection & 32) !== 0 || weightClass >= 600;
    return { weightClass, widthClass, italic, bold };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* container formats                                                   */
/* ------------------------------------------------------------------ */

function detectFormat(buf, filename = '') {
  if (buf.length < 4) return 'bin';
  const sig = buf.toString('latin1', 0, 4);
  if (sig === 'wOFF') return 'woff';
  if (sig === 'wOF2') return 'woff2';
  if (sig === 'ttcf') return 'ttc';
  if (sig === 'OTTO') return 'otf';
  if (buf.readUInt32BE(0) === 0x00010000 || sig === 'true' || sig === 'ttcf') return 'ttf';
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return ['ttf', 'otf', 'woff', 'woff2'].includes(ext) ? ext : 'bin';
}

/** get an sfnt-like buffer: {buf, tablesBase} */
function toSfnt(buf, format) {
  if (format === 'ttf' || format === 'otf') {
    return { sfnt: buf, base: 0 };
  }

  if (format === 'woff') {
    const numTables = u16(buf, 12);
    let out = Buffer.alloc(12 + numTables * 16);
    out.writeUInt32BE(buf.readUInt32BE(4), 0); // sfnt version == woff 'flavor'
    out.writeUInt16BE(numTables, 4);
    let dataOffset = 12 + numTables * 16;
    for (let i = 0; i < numTables; i++) {
      const p = 44 + i * 20;
      const t = tag(buf, p);
      const off = u32(buf, p + 4);
      const compLength = u32(buf, p + 8);
      const origLength = u32(buf, p + 12);
      let data = buf.subarray(off, off + compLength);
      if (compLength < origLength) {
        try {
          data = zlib.inflateSync(data);
        } catch {
          try {
            data = zlib.inflateRawSync(data);
          } catch {
            continue;
          }
        }
      }
      // write sfnt entry
      out.write(t.padEnd(4, ' '), 12 + i * 16, 'latin1');
      out.writeUInt32BE(0, 12 + i * 16 + 4);
      out.writeUInt32BE(dataOffset, 12 + i * 16 + 8);
      out.writeUInt32BE(Math.min(origLength, data.length), 12 + i * 16 + 12);
      out = Buffer.concat([out, data]);
      dataOffset += data.length;
    }
    return { sfnt: out, base: 0 };
  }

  if (format === 'woff2') {
    const numTables = u16(buf, 12);
    const totalCompressedSize = u32(buf, 20);
    let pos = 48;
    const entries = [];
    for (let i = 0; i < numTables; i++) {
      const flags = u8(buf, pos++);
      let t;
      const flagTag = flags & 0x3f;
      if (flagTag === 0x3f) {
        t = tag(buf, pos);
        pos += 4;
      } else {
        t = KNOWN_TAGS[flagTag];
      }
      const origRes = readUIntBase128(buf, pos);
      if (!origRes) break;
      pos = origRes.next;
      const origLength = origRes.value;
      const transformVersion = (flags >> 6) & 0x03;
      const isGlyfLike = t === 'glyf' || t === 'loca';
      const transformed = isGlyfLike ? transformVersion === 0 : transformVersion !== 0;
      let length = origLength;
      if (transformed) {
        const tl = readUIntBase128(buf, pos);
        if (!tl) break;
        pos = tl.next;
        length = tl.value;
      }
      entries.push({ tag: t, length, origLength });
    }
    const compressed = buf.subarray(pos, pos + totalCompressedSize);
    let raw;
    try {
      raw = zlib.brotliDecompressSync(compressed);
    } catch {
      return null;
    }
    const out = Buffer.alloc(12 + entries.length * 16);
    out.writeUInt32BE(buf.readUInt32BE(4), 0); // sfnt version == woff2 'flavor'
    out.writeUInt16BE(entries.length, 4);
    const chunks = [out];
    let dataOffset = 12 + entries.length * 16;
    let cursor = 0;
    entries.forEach((e, i) => {
      const data = raw.subarray(cursor, cursor + e.length);
      cursor += e.length;
      out.write(e.tag.padEnd(4, ' '), 12 + i * 16, 'latin1');
      out.writeUInt32BE(0, 12 + i * 16 + 4);
      out.writeUInt32BE(dataOffset, 12 + i * 16 + 8);
      out.writeUInt32BE(Math.min(e.origLength, data.length), 12 + i * 16 + 12);
      chunks.push(Buffer.from(data));
      dataOffset += data.length;
    });
    return { sfnt: Buffer.concat(chunks), base: 0 };
  }

  return null;
}

const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern',
  'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty',
  'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

/**
 * @param {Buffer} buf font file contents
 * @param {string} filename
 */
function inspectFont(buf, filename = '') {
  const format = detectFormat(buf, filename);
  const result = {
    format,
    valid: false,
    family: null,
    subfamily: null,
    fullName: null,
    postScriptName: null,
    version: null,
    designer: null,
    license: null,
    licenseUrl: null,
    vendorUrl: null,
    copyright: null,
    localizedName: null,
    arabic: false,
    latin: false,
    cmapFormat: null,
    weightClass: null,
    italic: false,
    bold: false,
    variable: false,
    axes: null,
  };

  if (buf.length < 12) return result;

  let sfntBuf = buf;
  if (format === 'woff' || format === 'woff2') {
    let conv = null;
    try {
      conv = toSfnt(buf, format);
    } catch {
      return result; // ملف مضغوط تالف
    }
    if (!conv) return result;
    sfntBuf = conv.sfnt;
  } else if (format === 'ttc') {
    // first font in the collection
    try {
      const firstOffset = u32(buf, 12);
      const tables = readSfntTables(buf, firstOffset);
      sfntBuf = buf;
      return finish(result, sfntBuf, tables, offsetBaseOf(firstOffset), filename);
    } catch {
      return result;
    }
  } else if (format !== 'ttf' && format !== 'otf') {
    return result;
  }

  // تحقق من بصمة ملف الخط (sfnt) — ملف عشوائي بامتداد .ttf لا يُقبل
  try {
    if (!SFNT_MAGIC.has(sfntBuf.readUInt32BE(0))) return result;
  } catch {
    return result;
  }

  let tables;
  try {
    tables = readSfntTables(sfntBuf, 0);
  } catch {
    return result;
  }
  return finish(result, sfntBuf, tables, 0, filename);
}

function offsetBaseOf(base) {
  return base;
}

function finish(result, sfntBuf, tables, base, filename) {
  try {
    return finishInner(result, sfntBuf, tables, base, filename);
  } catch (err) {
    // ملف تالف/غير متوقع: نُعيد ما استطعنا قراءته بدل الانهيار
    return result;
  }
}

function finishInner(result, sfntBuf, tables, base, filename) {
  // العدد الطبيعي للجداول في خط حقيقي بين ٦ و ٤٠ تقريبًا، ولا بد من name أو cmap
  if (!tables || tables.size === 0 || tables.size > 64) return result;
  if (!tables.has('name') && !tables.has('cmap')) return result;

  const nameTable = tables.get('name');
  if (nameTable) {
    const names = parseNameTable(sfntBuf, nameTable.offset, nameTable.length) || { values: {}, byLang: { en: {}, ar: {} } };
    const v = names.values;
    result.family = v.family || v.typographicFamily || v.fullName || null;
    result.subfamily = v.subfamily || v.typographicSubfamily || null;
    result.fullName = v.fullName || null;
    result.postScriptName = v.postScriptName || null;
    result.version = v.version || null;
    result.designer = v.designer || null;
    result.license = v.license || null;
    result.licenseUrl = v.licenseUrl || null;
    result.vendorUrl = v.vendorUrl || null;
    result.copyright = v.copyright || null;
    result.localizedName = names.byLang.ar.family || names.byLang.ar.typographicFamily || names.byLang.ar.fullName || null;
    // style from subfamily
    if (!result.subfamily && result.fullName && result.family && result.fullName.startsWith(result.family)) {
      result.subfamily = result.fullName.slice(result.family.length).trim() || null;
    }
  }

  const head = tables.get('head');
  let unitsPerEm = 1000;
  if (head) {
    try {
      unitsPerEm = u16(sfntBuf, head.offset + 18) || 1000;
    } catch { /* ignore */ }
  }
  result.unitsPerEm = unitsPerEm;

  const maxp = tables.get('maxp');
  if (maxp) {
    try {
      result.numGlyphs = u16(sfntBuf, maxp.offset + 4);
    } catch { /* ignore */ }
  }

  try {
    const cmap = parseCmap(tables, sfntBuf);
    if (cmap) {
      result.cmapFormat = cmap.format;
      result.arabic = cmap.arabic;
      result.latin = cmap.latin;
    }
  } catch { /* ignore */ }

  try {
    const os2 = parseOs2(tables, sfntBuf);
    if (os2) {
      result.weightClass = os2.weightClass;
      result.italic = os2.italic;
      result.bold = os2.bold;
    }
  } catch { /* ignore */ }

  try {
    const axes = parseFvar(tables, sfntBuf);
    if (axes) {
      result.variable = true;
      result.axes = axes;
    }
  } catch { /* ignore */ }

  result.valid = true;
  return result;
}

/** Beautiful fallback name from a file name */
function nameFromFilename(filename) {
  let base = String(filename || '').replace(/\.[a-z0-9]+$/i, '');
  base = base.replace(/[_+]+/g, ' ').replace(/\s+/g, ' ').trim();
  base = base.replace(/[\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  const styleWords = ['regular', 'bold', 'italic', 'light', 'medium', 'black', 'thin', 'semibold', 'semi', 'extrabold', 'extralight', 'book', 'heavy', 'variable', 'vf', 'display'];
  const parts = base.split(' ').filter(Boolean);
  const kept = parts.filter((p) => !styleWords.includes(p.toLowerCase()));
  const style = parts.filter((p) => styleWords.includes(p.toLowerCase()));
  const family = (kept.length ? kept : parts).join(' ').trim() || base;
  return {
    family,
    style: style.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || null,
    pretty: base,
  };
}

module.exports = { inspectFont, nameFromFilename, detectFormat, KNOWN_TAGS };
