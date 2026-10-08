import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Search, UploadCloud, LayoutGrid, Type } from "lucide-react";
import type { FilterKey, FontRecord, SortKey } from "@/types";
import bundledFontsJson from "@/data/fonts.json";
import FontCard from "@/components/FontCard";
import UploadDialog from "@/components/UploadDialog";
import FontDetailDialog from "@/components/FontDetailDialog";
import {
  deleteUploadedFont,
  getAllUploadedFonts,
  getUploadedFontBlob,
} from "@/lib/db";
import { fontCssSnippet, formatBytes, loadFontFace } from "@/lib/fontLoader";

const DEFAULT_SAMPLE = "ذُق طعم الخط العربي: جمالٌ يسبق المعنى، وحرفٌ يحكي حكاية.";

const BUNDLED: FontRecord[] = (bundledFontsJson as any[]).map((f) => ({
  ...f,
  source: "library" as const,
}));

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "arabic", label: "يدعم العربية" },
  { key: "variable", label: "خطوط متغيّرة" },
  { key: "static", label: "خطوط ثابتة" },
  { key: "latin", label: "يدعم اللاتينية" },
];

export default function App() {
  const [fonts, setFonts] = useState<FontRecord[]>(BUNDLED);
  const [loadedFamilies, setLoadedFamilies] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [sample, setSample] = useState(
    () => localStorage.getItem("afl.sample") || DEFAULT_SAMPLE,
  );
  const [previewSize, setPreviewSize] = useState(
    () => Number(localStorage.getItem("afl.size")) || 26,
  );
  const [dark, setDark] = useState(
    () =>
      localStorage.getItem("afl.theme") === "dark" ||
      (!localStorage.getItem("afl.theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detail, setDetail] = useState<FontRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* المظهر */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("afl.theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("afl.sample", sample);
  }, [sample]);
  useEffect(() => {
    localStorage.setItem("afl.size", String(previewSize));
  }, [previewSize]);

  /* تحميل الخطوط: المدمجة + المرفوعة من IndexedDB */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const uploaded = await getAllUploadedFonts();
      if (cancelled) return;
      const uploadedMeta = uploaded.map((u) => ({
        ...u.meta,
        source: "uploaded" as const,
      }));
      setFonts([...BUNDLED, ...uploadedMeta]);

      const markLoaded = (id: string) =>
        setLoadedFamilies((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });

      await Promise.all([
        ...BUNDLED.map(async (f) => {
          if (await loadFontFace(f)) markLoaded(f.id);
        }),
        ...uploaded.map(async (u) => {
          if (await loadFontFace(u.meta, u.blob)) markLoaded(u.meta.id);
        }),
      ]);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  /* البحث والتصفية والترتيب */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = fonts.filter((f) => {
      if (filter === "arabic" && !f.arabic) return false;
      if (filter === "latin" && !f.latin) return false;
      if (filter === "variable" && !f.variable) return false;
      if (filter === "static" && f.variable) return false;
      if (!q) return true;
      return [f.name, f.nameArabic, f.designer, ...(f.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ar");
      if (sort === "size") return b.size - a.size;
      return (b.addedAt || "").localeCompare(a.addedAt || "");
    });
    return list;
  }, [fonts, query, filter, sort]);

  const stats = useMemo(
    () => ({
      total: fonts.length,
      arabic: fonts.filter((f) => f.arabic).length,
      variable: fonts.filter((f) => f.variable).length,
      size: fonts.reduce((s, f) => s + (f.size || 0), 0),
    }),
    [fonts],
  );

  /* إجراءات البطاقة */
  const handleDownload = async (f: FontRecord) => {
    let url: string;
    let revoke = false;
    if (f.source === "library") {
      url = encodeURI(`/fonts/${f.file}`);
    } else {
      const blob = await getUploadedFontBlob(f.id);
      if (!blob) return showToast("تعذر العثور على ملف الخط");
      url = URL.createObjectURL(blob);
      revoke = true;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = f.file;
    a.click();
    if (revoke) window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleCopyCss = async (f: FontRecord) => {
    try {
      await navigator.clipboard.writeText(fontCssSnippet(f));
      showToast("تم نسخ كود CSS");
    } catch {
      showToast("تعذر النسخ — انسخ يدويًا من التفاصيل");
    }
  };

  const handleDelete = async (f: FontRecord) => {
    if (f.source !== "uploaded") return;
    if (!window.confirm(`هل تريد حذف "${f.nameArabic || f.name}" نهائيًا؟`)) return;
    await deleteUploadedFont(f.id);
    setFonts((prev) => prev.filter((x) => x.id !== f.id));
    setDetail((d) => (d?.id === f.id ? null : d));
    showToast("تم حذف الخط");
  };

  const handleUploaded = async (added: { meta: FontRecord; blob: Blob }[]) => {
    setUploadOpen(false);
    if (!added.length) return showToast("لم تُضف أي خطوط — تحقق من الملفات");
    setFonts((prev) => [...prev, ...added.map((a) => a.meta)]);
    for (const a of added) {
      if (await loadFontFace(a.meta, a.blob)) {
        setLoadedFamilies((prev) => {
          const next = new Set(prev);
          next.add(a.meta.id);
          return next;
        });
      }
    }
    showToast(`تمت إضافة ${added.length} ${added.length === 1 ? "خط" : "خطوط"} إلى المكتبة`);
  };

  return (
    <div className="min-h-screen">
      {/* ------------------------------ الترويسة ------------------------------ */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Type size={18} />
            </span>
            مكتبة الخطوط العربية
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2.5 rounded-xl border border-border hover:bg-border/40"
            title="تبديل المظهر"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 flex items-center gap-2"
          >
            <UploadCloud size={16} /> رفع خطوط
          </button>
        </div>
      </header>

      {/* ------------------------------ المقدمة ------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-8 text-center">
        <p className="text-primary font-bold text-sm mb-3">
          مكتبة خطوط مفتوحة · تعمل بالكامل في متصفحك
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl mx-auto">
          اكتشف الخط العربي المناسب في ثوانٍ
        </h1>
        <p className="text-muted max-w-2xl mx-auto mt-4 leading-relaxed">
          اكتب جملة المعاينة وستظهر تحت اسم كل خط بخطّه نفسه — لتتعرّف على الخط الذي
          تبحث عنه بلمحة واحدة. ويمكنك رفع خطوطك الخاصة وستُحفظ في متصفحك.
        </p>
      </section>

      {/* ------------------------------ أدوات التحكم ------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="card-surface p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث باسم الخط أو المصمم أو الوسم…"
                className="w-full rounded-xl border border-border bg-background ps-10 pe-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="recent">الأحدث إضافة</option>
              <option value="name">الاسم (أ - ي)</option>
              <option value="size">الحجم</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted hover:border-primary/60 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder="اكتب جملة المعاينة التي ستظهر أسفل اسم كل خط…"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2 text-sm text-muted shrink-0">
              <span>حجم المعاينة</span>
              <input
                type="range"
                min={16}
                max={56}
                value={previewSize}
                onChange={(e) => setPreviewSize(Number(e.target.value))}
                className="w-36 accent-primary"
              />
              <span className="w-8 font-bold text-foreground">{previewSize}</span>
            </div>
          </div>
        </div>

        {/* الإحصاءات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["إجمالي الخطوط", String(stats.total)],
            ["تدعم العربية", String(stats.arabic)],
            ["خطوط متغيّرة", String(stats.variable)],
            ["حجم المكتبة", formatBytes(stats.size)],
          ].map(([k, v]) => (
            <div key={k} className="card-surface px-4 py-3 text-center">
              <p className="font-extrabold text-xl">{v}</p>
              <p className="text-muted text-xs mt-0.5">{k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ المكتبة ------------------------------ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-5">
          <LayoutGrid size={18} className="text-primary" />
          <h2 className="font-bold text-xl">
            {query ? `نتائج البحث عن: ${query}` : "المكتبة"}
          </h2>
          <span className="text-muted text-sm">({visible.length} خطًا)</span>
        </div>

        {visible.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="font-bold text-lg">لا نتائج مطابقة</p>
            <p className="text-muted mt-1">جرّب كلمة أخرى أو أزل عوامل التصفية.</p>
            {(query || filter !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-border/40"
              >
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((f) => (
              <FontCard
                key={f.id}
                font={f}
                sample={sample || DEFAULT_SAMPLE}
                previewSize={previewSize}
                loaded={loadedFamilies.has(f.id)}
                onDetail={setDetail}
                onDownload={handleDownload}
                onCopyCss={handleCopyCss}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-muted text-sm">
        مكتبة الخطوط العربية — جميع الخطوط المعروضة مفتوحة المصدر (رخص OFL / Apache)،
        والخطوط المرفوعة تبقى ملك أصحابها وتُحفظ في متصفحك فقط.
      </footer>

      {/* ------------------------------ النوافذ ------------------------------ */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
      <FontDetailDialog
        font={detail}
        sample={sample || DEFAULT_SAMPLE}
        onClose={() => setDetail(null)}
        onDownload={handleDownload}
        onCopyCss={handleCopyCss}
        onDelete={handleDelete}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-foreground text-background px-5 py-3 rounded-xl text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
