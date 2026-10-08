import { useState } from "react";
import { X, Download, Copy, Trash2 } from "lucide-react";
import type { FontRecord } from "@/types";
import { familyFor, fontCssSnippet, formatBytes } from "@/lib/fontLoader";

interface Props {
  font: FontRecord | null;
  sample: string;
  onClose: () => void;
  onDownload: (f: FontRecord) => void;
  onCopyCss: (f: FontRecord) => void;
  onDelete: (f: FontRecord) => void;
}

const GLYPH_ROWS = [
  "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض",
  "ط ظ ع غ ف ق ك ل م ن هـ و ي ء ة",
  "٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ، ؛ ؟ !",
  "A B C D E F G a b c d e f g 0 1 2 3",
];

export default function FontDetailDialog({
  font,
  sample,
  onClose,
  onDownload,
  onCopyCss,
  onDelete,
}: Props) {
  const [weight, setWeight] = useState<number | null>(null);
  if (!font) return null;

  const family = familyFor(font);
  const wghtAxis = font.axes?.find((a) => a.tag === "wght");
  const currentWeight = weight ?? wghtAxis?.default ?? font.weightClass ?? 400;

  const meta: [string, string | null | undefined][] = [
    ["الملف", font.file],
    ["الصيغة", font.format.toUpperCase()],
    ["الحجم", formatBytes(font.size)],
    ["الإصدار", font.version],
    ["المصمم", font.designer],
    ["عدد المحارف", font.numGlyphs ? String(font.numGlyphs) : null],
    ["الوزن الافتراضي", font.weightClass ? String(font.weightClass) : null],
    [
      "تاريخ الإضافة",
      new Date(font.addedAt).toLocaleDateString("ar-EG", { dateStyle: "long" }),
    ],
    ["المصدر", font.source === "library" ? "المكتبة الأساسية" : "مرفوع من المتصفح"],
    ["ملاحظة", font.note],
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-2xl">{font.nameArabic || font.name}</h2>
            <p className="text-muted text-sm">
              {font.name}
              {font.style ? ` · ${font.style}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-border/50 shrink-0">
            <X size={18} />
          </button>
        </header>

        <div className="rounded-2xl bg-background/60 border border-border px-5 py-7">
          <p
            dir="auto"
            className="leading-relaxed break-words"
            style={{
              fontFamily: `"${family}", sans-serif`,
              fontSize: "34px",
              fontWeight: currentWeight,
            }}
          >
            {sample}
          </p>
        </div>

        {wghtAxis && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <label className="text-muted shrink-0">الوزن (خط متغيّر):</label>
            <input
              type="range"
              min={wghtAxis.min}
              max={wghtAxis.max}
              step={1}
              value={currentWeight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="w-10 text-center font-bold">{currentWeight}</span>
          </div>
        )}

        <h3 className="font-bold mt-6 mb-2">عيّنات الحروف</h3>
        <div className="rounded-2xl bg-background/60 border border-border px-5 py-4 space-y-2">
          {GLYPH_ROWS.map((row, i) => (
            <p
              key={i}
              dir="auto"
              className="text-xl leading-loose"
              style={{ fontFamily: `"${family}", sans-serif`, fontWeight: currentWeight }}
            >
              {row}
            </p>
          ))}
        </div>

        <h3 className="font-bold mt-6 mb-2">بيانات الخط</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {meta
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border/60 py-1.5">
                <dt className="text-muted shrink-0">{k}</dt>
                <dd className="font-semibold text-start truncate" title={v!}>
                  {v}
                </dd>
              </div>
            ))}
        </dl>

        {font.license && (
          <p className="text-muted text-xs mt-3 leading-relaxed">
            الرخصة: {font.license}
            {font.licenseUrl ? ` — ${font.licenseUrl}` : ""}
          </p>
        )}

        {font.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {font.tags.map((t) => (
              <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-bold mt-6 mb-2">تضمين في موقعك (CSS)</h3>
        <pre
          dir="ltr"
          className="rounded-xl bg-background border border-border p-4 text-xs overflow-x-auto text-start"
        >
          {fontCssSnippet(font)}
        </pre>

        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          {font.source === "uploaded" && (
            <button
              onClick={() => onDelete(font)}
              className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-500 text-sm font-semibold hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 size={15} /> حذف
            </button>
          )}
          <button
            onClick={() => onCopyCss(font)}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-border/40 flex items-center gap-2"
          >
            <Copy size={15} /> نسخ CSS
          </button>
          <button
            onClick={() => onDownload(font)}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 flex items-center gap-2"
          >
            <Download size={15} /> تنزيل الخط
          </button>
        </div>
      </div>
    </div>
  );
}
