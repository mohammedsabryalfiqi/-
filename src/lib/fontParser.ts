/**
 * قراءة بيانات الخط مباشرةً من الملف داخل المتصفح (TTF / OTF).
 * نسخة متصفح مبسّطة من محلّل جداول sfnt: name / cmap / fvar / OS2 / maxp.
 */
import type { FontAxis } from "@/types";

export interface ParsedFontInfo {
  family: string | null;
  familyArabic: string | null;
  subfamily: string | null;
  version: string | null;
  designer: string | null;
  license: string | null;
  licenseUrl: string | null;
  arabic: boolean;
  latin: boolean;
  variable: boolean;
  axes: FontAxis[] | null;
  numGlyphs: number | null;
  weightClass: number | null;
}

const NAME_IDS: Record<number, string> = {
  1: "family",
  2: "subfamily",
  5: "version",
  9: "designer",
  13: "license",
  14: "licenseUrl",
  16: "typographicFamily",
  17: "typographicSubfamily",
};

function readTag(view: DataView, off: number): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += String.fromCharCode(view.getUint8(off + i));
  return s.trim();
}

function readSfntTables(view: DataView, base = 0) {
  const tables = new Map<string, { offset: number; length: number }>();
  const numTables = view.getUint16(base + 4);
  for (let i = 0; i < numTables; i++) {
    const p = base + 12 + i * 16;
    if (p + 16 > view.byteLength) break;
    tables.set(readTag(view, p), {
      offset: view.getUint32(p + 8),
      length: view.getUint32(p + 12),
    });
  }
  return tables;
}

function decodeUtf16BE(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  }
  return s;
}

function decodeLatin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function parseNameTable(view: DataView, offset: number, length: number) {
  const values: Record<string, string> = {};
  const arabicValues: Record<string, string> = {};
  const end = offset + length;
  if (length < 6 || end > view.byteLength) return { values, arabicValues };

  const count = view.getUint16(offset + 2);
  const storage = offset + view.getUint16(offset + 4);
  const candidates: Record<
    number,
    { priority: number; text: string; lang: string }[]
  > = {};

  for (let i = 0; i < count; i++) {
    const p = offset + 6 + i * 12;
    if (p + 12 > end) break;
    const platformID = view.getUint16(p);
    const languageID = view.getUint16(p + 4);
    const nameID = view.getUint16(p + 6);
    const strLen = view.getUint16(p + 8);
    const strOff = view.getUint16(p + 10);
    if (!NAME_IDS[nameID] || strLen === 0) continue;

    const start = storage + strOff;
    const stop = Math.min(start + strLen, end);
    if (start < 0 || start >= stop) continue;
    const raw = new Uint8Array(view.buffer, view.byteOffset + start, stop - start);

    let text =
      platformID === 0 || platformID === 3
        ? decodeUtf16BE(raw)
        : decodeLatin1(raw);
    text = text.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
    if (!text) continue;

    let lang = "other";
    if (platformID === 3) {
      if (languageID === 0x409) lang = "en";
      else if ([0x401, 0x801, 0xc01, 0x1001].includes(languageID)) lang = "ar";
    } else if (platformID === 0) lang = "en";
    else if (platformID === 1 && languageID === 0) lang = "en";

    const priority =
      platformID === 3 ? (lang === "en" ? 0 : 1) : platformID === 0 ? 2 : 3;
    (candidates[nameID] = candidates[nameID] || []).push({
      priority,
      text,
      lang,
    });
  }

  for (const idStr of Object.keys(candidates)) {
    const nameID = Number(idStr);
    const list = candidates[nameID].sort((a, b) => a.priority - b.priority);
    const key = NAME_IDS[nameID];
    values[key] = list[0].text;
    const ar = list.find((c) => c.lang === "ar");
    if (ar) arabicValues[key] = ar.text;
  }

  if (!values.family && values.typographicFamily)
    values.family = values.typographicFamily;
  if (!values.subfamily && values.typographicSubfamily)
    values.subfamily = values.typographicSubfamily;

  return { values, arabicValues };
}

/** يفحص تغطية نقاط يونيكود معيّنة عبر جدول cmap (الصيغتان 4 و 12) */
function checkCmapCoverage(
  view: DataView,
  offset: number,
  codepoints: number[],
): number {
  const numTables = view.getUint16(offset + 2);
  let best = -1;
  for (let i = 0; i < numTables; i++) {
    const p = offset + 4 + i * 8;
    const platformID = view.getUint16(p);
    const subOff = offset + view.getUint32(p + 4);
    if (subOff + 4 > view.byteLength) continue;
    const format = view.getUint16(subOff);
    if (
      (format === 4 || format === 12) &&
      (platformID === 3 || platformID === 0)
    ) {
      if (best === -1 || format === 12) best = subOff;
      if (format === 12) break;
    }
  }
  if (best === -1) return 0;

  const format = view.getUint16(best);
  let covered = 0;
  for (const cp of codepoints) {
    if (format === 4) {
      if (cp > 0xffff) continue;
      const segCountX2 = view.getUint16(best + 6);
      const endBase = best + 14;
      const startBase = endBase + segCountX2 + 2;
      for (let s = 0; s < segCountX2 / 2; s++) {
        const endCode = view.getUint16(endBase + s * 2);
        if (cp <= endCode) {
          const startCode = view.getUint16(startBase + s * 2);
          if (cp >= startCode) covered++;
          break;
        }
      }
    } else if (format === 12) {
      const nGroups = view.getUint32(best + 12);
      let lo = 0;
      let hi = nGroups - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const g = best + 16 + mid * 12;
        const startChar = view.getUint32(g);
        const endChar = view.getUint32(g + 4);
        if (cp < startChar) hi = mid - 1;
        else if (cp > endChar) lo = mid + 1;
        else {
          covered++;
          break;
        }
      }
    }
  }
  return covered;
}

const ARABIC_PROBE = [0x0627, 0x0628, 0x062c, 0x0633, 0x0645, 0x0647, 0x064a];
const LATIN_PROBE = [0x41, 0x61, 0x7a, 0x30];

export function detectFormat(fileName: string, bytes: Uint8Array): string {
  const magic =
    (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  if (magic === 0x774f4632) return "woff2";
  if (magic === 0x774f4646) return "woff";
  if (magic === 0x4f54544f) return "otf";
  if (magic === 0x00010000 || magic === 0x74727565) return "ttf";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["ttf", "otf", "woff", "woff2"].includes(ext) ? ext : "ttf";
}

export function nameFromFilename(fileName: string): string {
  return fileName
    .replace(/\.(ttf|otf|woff2?|ttc)$/i, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** يحلّل ملف خط TTF/OTF — يعيد بيانات افتراضية لصيَغ WOFF/WOFF2 المضغوطة */
export function parseFont(buffer: ArrayBuffer, fileName: string): ParsedFontInfo {
  const fallback: ParsedFontInfo = {
    family: nameFromFilename(fileName) || null,
    familyArabic: null,
    subfamily: null,
    version: null,
    designer: null,
    license: null,
    licenseUrl: null,
    arabic: true, // لا يمكن فحص cmap في الملفات المضغوطة — نفترض دعم العربية
    latin: true,
    variable: /\[.*wght.*\]|variable/i.test(fileName),
    axes: null,
    numGlyphs: null,
    weightClass: null,
  };

  try {
    const view = new DataView(buffer);
    const magic = view.getUint32(0);
    const isSfnt =
      magic === 0x00010000 || magic === 0x4f54544f || magic === 0x74727565;
    if (!isSfnt) return fallback; // WOFF/WOFF2 مضغوطان

    const tables = readSfntTables(view);

    const info: ParsedFontInfo = { ...fallback, arabic: false, latin: false };

    const name = tables.get("name");
    if (name) {
      const { values, arabicValues } = parseNameTable(
        view,
        name.offset,
        name.length,
      );
      info.family = values.family || info.family;
      info.familyArabic = arabicValues.family || null;
      info.subfamily = values.subfamily || null;
      info.version = values.version || null;
      info.designer = values.designer || null;
      info.license = values.license ? values.license.slice(0, 220) : null;
      info.licenseUrl = values.licenseUrl || null;
    }

    const cmap = tables.get("cmap");
    if (cmap) {
      info.arabic =
        checkCmapCoverage(view, cmap.offset, ARABIC_PROBE) >=
        Math.ceil(ARABIC_PROBE.length * 0.7);
      info.latin = checkCmapCoverage(view, cmap.offset, LATIN_PROBE) >= 3;
    }

    const fvar = tables.get("fvar");
    if (fvar && fvar.length >= 16) {
      const axisCount = view.getUint16(fvar.offset + 8);
      const axisSize = view.getUint16(fvar.offset + 10) || 20;
      const axesOffset = fvar.offset + view.getUint16(fvar.offset + 4);
      const axes: FontAxis[] = [];
      for (let i = 0; i < axisCount; i++) {
        const p = axesOffset + i * axisSize;
        if (p + 20 > view.byteLength) break;
        axes.push({
          tag: readTag(view, p),
          min: view.getInt32(p + 4) / 65536,
          default: view.getInt32(p + 8) / 65536,
          max: view.getInt32(p + 12) / 65536,
        });
      }
      if (axes.length) {
        info.variable = true;
        info.axes = axes;
      } else {
        info.variable = false;
      }
    } else {
      info.variable = false;
    }

    const maxp = tables.get("maxp");
    if (maxp) info.numGlyphs = view.getUint16(maxp.offset + 4);

    const os2 = tables.get("OS/2");
    if (os2) info.weightClass = view.getUint16(os2.offset + 4);

    return info;
  } catch {
    return fallback;
  }
}
