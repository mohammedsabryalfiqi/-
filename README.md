# مكتبة الخطوط العربية · Arabic Font Library

موقع كامل (سيرفر + واجهة) لبناء **مكتبة خطوط عربية خاصة بك**: ترفع الخطوط، فيحفظها السيرفر
لديك بشكل دائم، وتُعرض في معرض أنيق يظهر **اسم الخط وأسفله جملة المعاينة** مكتوبة بالخط نفسه —
لتتعرّف على الخط الذي تبحث عنه بلمحة واحدة.

> A self-hosted Arabic font library: upload font files, they are stored on your own server,
> and every font is listed with its **name followed by a live preview sentence rendered in that font**.
> Built with zero runtime dependencies (Node.js standard library only).

---

## المحتويات

- [المزايا](#المزايا)
- [التشغيل السريع](#التشغيل-السريع)
- [كيف يعمل التخزين](#كيف-يعمل-التخزين)
- [النشر على الإنترنت](#النشر-على-الإنترنت)
- [متغيّرات البيئة](#متغيّرات-البيئة)
- [واجهة برمجة التطبيقات (API)](#واجهة-برمجة-التطبيقات-api)
- [تضمين المكتبة في موقع آخر](#تضمين-المكتبة-في-موقع-آخر)
- [بنية المشروع](#بنية-المشروع)
- [English summary](#english-summary)

---

## المزايا

| | |
|---|---|
| 📤 **رفع متعدّد** | اسحب وأفلت عشرات ملفات الخطوط معًا (TTF · OTF · WOFF · WOFF2 · TTC) حتى ٦٤ ميجابايت للملف |
| 🔎 **قراءة بيانات الخط تلقائيًا** | يُستخرج اسم العائلة والنمط والمصمم والرخصة وعدد المحارف ومحاور التغيّر من ملف الخط نفسه (جدول `name` و `cmap` و `fvar`) — بدون أي مكتبة خارجية |
| ✍️ **جملة معاينة قابلة للتحكم** | اكتب جملة واحدة فتظهر أسفل كل خط بخطّه هو، ويمكن تخصيص جملة خاصة لكل خط على حدة |
| 🈯 **العربية واللاتينية** | فحص تلقائي لتغطية المحارف العربية واللاتينية لكل خط مع شارات توضيحية |
| 🔍 **بحث عربي ذكي** | يتجاهل التشكيل والهمزات (أ/إ/آ = ا) والتاء المربوطة، ويبحث في الاسم والاسم العربي والمصمم والوسوم واسم الملف |
| ⚡ **تحميل ذكي للخطوط** | كل خط يُحمَّل فقط عند ظهور بطاقته على الشاشة (IntersectionObserver + FontFace) — يظل المعرض سريعًا مع مئات الخطوط |
| 🌗 **عربي/إنجليزي + فاتح/غامق** | واجهة ثنائية اللغة RTL/LTR مع وضعين للألوان |
| 💾 **حفظ دائم على السيرفر** | الملفات في `data/fonts` والفهرس في `data/files.json` بكتابة ذرّية (atomic) ونسخ احتياطي |
| 🧩 **أداة تضمين** | سطر واحد لتضمين المكتبة أو خط معيّن في أي موقع |
| 🛡️ **بلا تبعيات** | لا `npm install` مطلوب للتشغيل — Node.js فقط |
| 🐳 **جاهز للنشر** | Dockerfile + إعدادات Railway / Render / systemd + Nginx |

---

## التشغيل السريع

```bash
# المتطلّب الوحيد: Node.js 18 أو أحدث
node server.js
# أو
npm start
# وضع التطوير (إعادة تشغيل تلقائية)
npm run dev
```

ثم افتح: <http://localhost:4173>

- المكتبة تأتي مزوّدة بـ **٢٠ خطًا عربيًا مفتوح المصدر** (Amiri، Cairo، Tajawal، Reem Kufi،
  Noto Naskh/Kufi، IBM Plex Sans Arabic، Almarai، Changa، Kufam، Rakkas، Aref Ruqaa…)
  كلها برخص OFL/Apache تسمح بإعادة التوزيع.
- أي ملف خط تنسخه يدويًا إلى مجلد `data/fonts` سيُستورد تلقائيًا عند تشغيل السيرفر
  (`npm run seed` للاستيراد بدون تشغيل السيرفر).

**الرفع:** اضغط زر «رفع خطوط» (أو اختصر بـ `u`) ← اسحب ملفات الخطوط ← اكتب جملة المعاينة
← «ابدأ الرفع». سيُخزّن كل خط في `data/fonts` مع بياناته في الفهرس.

---

## كيف يعمل التخزين

```
data/
├── fonts/            ← ملفات الخطوط نفسها (المصدر الدائم) — خذ نسخة احتياطية من هنا
├── files.json        ← فهرس الميتاداتا: الاسم، النمط، الوسوم، جملة المعاينة… إلخ
├── backups/          ← نسخ من الفهرس التالف إن حدث خطأ
└── tmp/              ← ملفات الرفع المؤقتة (تُنقل ثم تُحذف)
```

- كل كتابة على `files.json` تتم على ملف مؤقت ثم تُستبدل ذرّيًا (لا فهرس نصف مكتمل أبدًا).
- لكل خط بصمة `SHA-256`: عند رفع خط موجود مسبقًا يُنبّهك بدلًا من تكراره (يمكن تجاهل التنبيه بخيار «أضف حتى لو كان موجودًا»).
- **النسخ الاحتياطي:** انسخ مجلد `data/` كاملًا، أو نزّل الفهرس من `/api/export`.
- حذف خط من الواجهة يحذف سجلّه **وملفه** من السيرفر.

---

## النشر على الإنترنت

### 1) Docker (الأسهل)

```bash
docker build -t arabic-fonts .
docker run -d --name fonts -p 4173:4173 -v fonts-data:/app/data arabic-fonts
```

مهم: اربط وحدة تخزين (volume) على `/app/data` حتى لا تُفقد الخطوط عند تحديث الحاوية.

### 2) Railway / Render

- **Railway:** أنشئ مشروعًا من المستودع، ثم أضف Volume على المسار `/app/data`
  (ملف `railway.json` جاهز في المشروع يحدّد أمر التشغيل وفحص الصحة).
- **Render:** ملف `render.yaml` جاهز، وهو ينشئ قرصًا بسعة ٥ جيجابايت على `/var/data`
  ويضبط `FONTS_DATA_DIR=/var/data` تلقائيًا.

في كلتا الحالتين: لا تحتاج أي متغيّرات إضافية، والسيرفر يقرأ `PORT` و `HOST` من البيئة.

### 3) سيرفر خاص (VPS) مع Nginx

```bash
git clone <repo> /var/www/arabic-fonts && cd /var/www/arabic-fonts
PORT=4173 HOST=127.0.0.1 FONTS_DATA_DIR=/var/lib/arabic-fonts node server.js
```

- خدمة systemd جاهزة: `deploy/fonts-library.service` (تُنسخ إلى `/etc/systemd/system/`).
- إعداد Nginx جاهز (مع رفع الحد الأقصى لحجم الطلب وضغط الملفات):
  `deploy/nginx.conf.example`.

> **تلميح:** استخدم `FONTS_DATA_DIR=/var/lib/arabic-fonts` لفصل البيانات عن الكود،
> فيبقى تحديث الموقع آمنًا.

---

## متغيّرات البيئة

| المتغيّر | الافتراضي | الوصف |
|---|---|---|
| `PORT` | `4173` | منفذ التشغيل |
| `HOST` | `0.0.0.0` | العنوان المستمع (استخدم `127.0.0.1` خلف Nginx) |
| `FONTS_DATA_DIR` | `./data` | مكان تخزين الخطوط والفهرس |
| `MAX_FILE_SIZE` | `67108864` (64MB) | أقصى حجم لملف الخط الواحد |
| `MAX_TOTAL_SIZE` | `536870912` (512MB) | أقصى حجم لطلب الرفع الواحد |
| `MAX_FILES_PER_REQUEST` | `300` | أقصى عدد ملفات في الطلب الواحد |
| `ADMIN_TOKEN` | فارغ | إن حُدِّد، تُشترط قيمة `X-Admin-Token` على مسارات `/api/admin*` |
| `QUIET` | — | `1` لإيقاف سجل الطلبات |

---

## واجهة برمجة التطبيقات (API)

| الطريقة | المسار | الوصف |
|---|---|---|
| `GET` | `/api/health` | حالة السيرفر وعدد الخطوط |
| `GET` | `/api/fonts?q=&filter=&sort=&limit=&offset=` | قائمة الخطوط مع البحث والترتيب. `filter`: `arabic` \| `variable` \| `static` \| `latin`. `sort`: `recent` \| `name` \| `size` \| `downloads` |
| `GET` | `/api/fonts/:id` | بيانات خط واحد |
| `POST` | `/api/fonts` | رفع خطوط (`multipart/form-data`؛ الحقول: `files[]`, `name`, `sample`, `tags`, `note`, `overwrite`) |
| `PATCH` | `/api/fonts/:id` | تعديل الاسم/الاسم العربي/جملة المعاينة/الوسوم/الملاحظة |
| `DELETE` | `/api/fonts/:id` | حذف الخط وملفه من السيرفر |
| `GET` | `/api/fonts/:id/download` | تنزيل الخط (مع عدّاد التنزيلات) |
| `GET` | `/api/export` | نسخة JSON كاملة من الفهرس |
| `GET` | `/files/:name` | ملف الخط مباشرة (يصلح كـ `@font-face` / CDN) |
| `GET` | `/download/:name` | تنزيل الملف بإجبار المتصفح على الحفظ |

مثال رفع من سطر الأوامر:

```bash
curl -X POST http://localhost:4173/api/fonts \
  -F "files=@/path/MyFont-Bold.ttf" \
  -F "files=@/path/MyFont-Regular.ttf" \
  -F "tags=عناوين، رسمي" \
  -F "sample=الخطُّ الجميلُ يشرحُ العينَ ويُرضي الذوقَ" \
  -F "note=رخصة OFL"
```

مثال استخدام الخط في CSS:

```css
@font-face {
  font-family: "Amiri";
  src: url("https://your-domain.com/files/Amiri-Regular.ttf") format("truetype");
  font-display: swap;
}
```

---

## تضمين المكتبة في موقع آخر

```html
<!-- معرض كل المكتبة -->
<div data-arabic-fonts data-limit="6" data-sample="جملة المعاينة هنا"></div>
<script src="https://your-domain.com/embed.js" async></script>

<!-- خط واحد بالبحث -->
<div data-arabic-fonts data-query="Amiri" data-limit="1" data-size="38"></div>
<script src="https://your-domain.com/embed.js" async></script>
```

خصائص العنصر: `data-query` (بحث) · `data-limit` (العدد) · `data-sample` (جملة المعاينة) ·
`data-size` (حجم المعاينة) · `data-theme` (`light`/`dark`/`auto`) · `data-search="1"` (مربّع بحث
داخلي) · `data-api` (لو كان السيرفر على نطاق آخر).

---

## استيراد خطوط إضافية بالجملة

- **من جهازك:** انسخ الملفات إلى `data/fonts` ثم `npm run seed`.
- **من مستودع Google Fonts:** `npm run fetch-fonts -- cairo almarai ruwudu` (يقرأ المجلد من
  `google/fonts` وينزّل ملفات TTF/OTF، ومعه قائمة عربية جاهزة بالافتراضي).
  > يحتاج هذا السكربت اتصالًا بالإنترنت إلى `api.github.com` / `raw.githubusercontent.com`.

---

## بنية المشروع

```
.
├── server.js                     ← سيرفر HTTP + الموجّه + واجهة API (بدون تبعيات)
├── lib/
│   ├── font-info.js              ← قارئ ملفات الخطوط: name/cmap/fvar + فكّ WOFF2 (Brotli)
│   ├── store.js                  ← التخزين الذرّي على القرص (fonts/ + files.json)
│   └── seed.js                   ← استيراد الخطوط الموجودة في المجلد + أسماء عربية
├── public/
│   ├── index.html · styles.css   ← الواجهة (RTL أولًا، تصميم فاتح/غامق)
│   ├── app.js                    ← المعرض، البحث، الرفع، التفاصيل، الترجمة
│   └── embed.js                  ← أداة التضمين لأي موقع
├── data/fonts/                   ← الخطوط (ومعها ٢٠ خطًا مفتوح المصدر كبداية)
├── scripts/fetch-google-fonts.mjs
├── deploy/                       ← nginx.conf.example + fonts-library.service
├── test/smoke.js                 ← اختبار شامل للواجهة (jsdom) — npm test
└── Dockerfile · railway.json · render.yaml · Procfile
```

---

## English summary

A complete, dependency-free Arabic font library you can host anywhere Node.js runs.

- **Upload** TTF/OTF/WOFF/WOFF2/TTC fonts (drag & drop, many at once).
- Font **metadata is parsed from the file itself** — family, style, designer, license,
  glyph count, variable axes, plus automatic Arabic/Latin coverage detection.
- The gallery shows **the font name with a live preview sentence below it, rendered in that font**,
  so you instantly recognise the typeface you are looking for. Each font can also keep its own
  custom sample sentence.
- **Smart Arabic search** (ignores diacritics and hamza variants), filters, sorting,
  light/dark themes, Arabic/English UI, lazy font loading, and an embeddable widget.
- Files are stored on your server (`data/fonts` + `data/files.json`) with atomic writes and
  SHA-256 duplicate detection. REST API for automation, JSON export for backups.

```bash
node server.js          # → http://localhost:4173
npm test                # optional jsdom UI smoke test (needs: npm i --no-save jsdom)
```

Deploy with Docker/Railway/Render (configs included) or behind Nginx on a VPS —
just make sure the data directory is on a persistent volume.

**Licenses:** the bundled starter fonts (Amiri, Cairo, Tajawal, Noto, IBM Plex Sans Arabic,
Kufam, Rakkas…) are open-source under OFL/Apache licenses and remain the property of their authors.
The application code is provided as-is for you to use and modify.
