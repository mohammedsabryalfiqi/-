import { Download, Info, Copy, Trash2 } from "lucide-react";
import type { FontRecord } from "@/types";
import { familyFor, formatBytes } from "@/lib/fontLoader";

interface Props {
  font: FontRecord;
  sample: string;
  previewSize: number;
  loaded: boolean;
  onDetail: (f: FontRecord) => void;
  onDownload: (f: FontRecord) => void;
  onCopyCss: (f: FontRecord) => void;
  onDelete: (f: FontRecord) => void;
}

function Badge({ children, tone }: { children: string; tone: "green" | "amber" | "blue" | "gray" }) {
  const tones = {
    green: "bg-primary/10 text-primary",
    amber: "bg-accent/15 text-accent",
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    gray: "bg-muted/10 text-muted",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function FontCard({
  font,
  sample,
  previewSize,
  loaded,
  onDetail,
  onDownload,
  onCopyCss,
  onDelete,
}: Props) {
  const family = familyFor(font);

  return (
    <article className="card-surface p-5 flex flex-col gap-4 transition-transform hover:-translate-y-1 hover:shadow-lg">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-tight truncate" title={font.name}>
            {font.nameArabic || font.name}
          </h3>
          <p className="text-muted text-xs truncate">
            {font.name}
            {font.designer ? ` · ${font.designer}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          {font.arabic && <Badge tone="green">عربي</Badge>}
          {font.variable ? <Badge tone="amber">متغيّر</Badge> : <Badge tone="gray">ثابت</Badge>}
          {font.source === "uploaded" && <Badge tone="blue">مرفوع</Badge>}
        </div>
      </header>

      <button
        onClick={() => onDetail(font)}
        className="text-start rounded-xl bg-background/60 border border-border px-4 py-5 min-h-[7.5rem] flex items-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
        title="عرض التفاصيل"
      >
        {loaded ? (
          <p
            dir="auto"
            className="leading-relaxed break-words w-full"
            style={{ fontFamily: `"${family}", sans-serif`, fontSize: `${previewSize}px` }}
          >
            {sample}
          </p>
        ) : (
          <p className="text-muted text-sm animate-pulse">جارٍ تحميل الخط…</p>
        )}
      </button>

      <footer className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted text-xs">
          {font.format.toUpperCase()} · {formatBytes(font.size)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onDetail(font)}
            className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
            title="التفاصيل"
          >
            <Info size={17} />
          </button>
          <button
            onClick={() => onCopyCss(font)}
            className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
            title="نسخ CSS"
          >
            <Copy size={17} />
          </button>
          <button
            onClick={() => onDownload(font)}
            className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
            title="تنزيل"
          >
            <Download size={17} />
          </button>
          {font.source === "uploaded" && (
            <button
              onClick={() => onDelete(font)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
              title="حذف"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
