import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileType2 } from "lucide-react";
import type { FontRecord } from "@/types";
import { detectFormat, nameFromFilename, parseFont } from "@/lib/fontParser";
import { saveUploadedFont } from "@/lib/db";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: (fonts: { meta: FontRecord; blob: Blob }[]) => void;
}

const ACCEPT = ".ttf,.otf,.woff,.woff2";

export default function UploadDialog({ open, onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = useCallback((list: FileList | null) => {
    if (!list) return;
    const ok = Array.from(list).filter((f) =>
      /\.(ttf|otf|woff2?)$/i.test(f.name),
    );
    setFiles((prev) => [...prev, ...ok]);
  }, []);

  const doUpload = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const added: { meta: FontRecord; blob: Blob }[] = [];
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const info = parseFont(buffer, file.name);
        const meta: FontRecord = {
          id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          file: file.name,
          name: info.family || nameFromFilename(file.name),
          nameArabic: info.familyArabic,
          style: info.subfamily,
          version: info.version,
          designer: info.designer,
          license: info.license,
          licenseUrl: info.licenseUrl,
          format: detectFormat(file.name, bytes),
          size: file.size,
          arabic: info.arabic,
          latin: info.latin,
          variable: info.variable,
          axes: info.axes,
          numGlyphs: info.numGlyphs,
          weightClass: info.weightClass,
          tags: tags
            .split(/[,،]/)
            .map((t) => t.trim())
            .filter(Boolean),
          note: note.trim() || null,
          addedAt: new Date().toISOString(),
          source: "uploaded",
        };
        const blob = new Blob([buffer], { type: "font/" + meta.format });
        await saveUploadedFont(meta, blob);
        added.push({ meta, blob });
      } catch {
        /* تجاهل الملف الفاسد وتابع */
      }
    }
    setBusy(false);
    setFiles([]);
    setTags("");
    setNote("");
    onUploaded(added);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl">رفع خطوط إلى المكتبة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-border/50">
            <X size={18} />
          </button>
        </header>

        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files);
          }}
        >
          <UploadCloud className="mx-auto mb-3 text-primary" size={36} />
          <p className="font-semibold">اسحب ملفات الخطوط هنا أو اضغط للاختيار</p>
          <p className="text-muted text-sm mt-1">
            TTF · OTF · WOFF · WOFF2 — تُحفظ الخطوط في متصفحك (IndexedDB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              pick(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 text-sm bg-background/60 border border-border rounded-lg px-3 py-2"
              >
                <FileType2 size={15} className="text-primary shrink-0" />
                <span className="truncate flex-1">{f.name}</span>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-muted hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 space-y-3">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="وسوم (افصل بفاصلة)"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (المصدر، الرخصة…)"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-border/40"
          >
            إلغاء
          </button>
          <button
            onClick={doUpload}
            disabled={!files.length || busy}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90"
          >
            {busy
              ? "جارٍ الإضافة…"
              : files.length
                ? `إضافة ${files.length} ${files.length === 1 ? "خط" : "خطوط"}`
                : "ابدأ الرفع"}
          </button>
        </div>
      </div>
    </div>
  );
}
