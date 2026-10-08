/**
 * تسجيل الخطوط في المتصفح عبر FontFace API
 * كل خط يحصل على اسم عائلة فريد: ff-<id>
 */
import type { FontRecord } from "@/types";

const loaded = new Set<string>();

export function familyFor(font: FontRecord): string {
  return `ff-${font.id}`;
}

export async function loadFontFace(
  font: FontRecord,
  blob?: Blob | null,
): Promise<boolean> {
  const family = familyFor(font);
  if (loaded.has(family)) return true;
  try {
    const source = blob
      ? await blob.arrayBuffer()
      : `url("${encodeURI(`/fonts/${font.file}`)}")`;
    const face = new FontFace(family, source as any, {
      display: "swap",
      ...(font.variable && font.axes?.some((a) => a.tag === "wght")
        ? {
            weight: `${font.axes.find((a) => a.tag === "wght")!.min} ${font.axes.find((a) => a.tag === "wght")!.max}`,
          }
        : {}),
    });
    await face.load();
    document.fonts.add(face);
    loaded.add(family);
    return true;
  } catch {
    return false;
  }
}

export function fontCssSnippet(font: FontRecord): string {
  const url =
    font.source === "library"
      ? `/fonts/${font.file}`
      : font.file; /* الخط المرفوع محفوظ محليًا في متصفحك */
  const fmt =
    font.format === "otf"
      ? "opentype"
      : font.format === "ttf"
        ? "truetype"
        : font.format;
  return [
    `@font-face {`,
    `  font-family: "${font.name}";`,
    `  src: url("${url}") format("${fmt}");`,
    font.variable && font.axes?.some((a) => a.tag === "wght")
      ? `  font-weight: ${font.axes.find((a) => a.tag === "wght")!.min} ${font.axes.find((a) => a.tag === "wght")!.max};`
      : `  font-weight: ${font.weightClass || 400};`,
    `  font-display: swap;`,
    `}`,
    ``,
    `.my-text { font-family: "${font.name}", sans-serif; }`,
  ].join("\n");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(2)} م.ب`;
}
