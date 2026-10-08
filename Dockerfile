# ---------- بناء صورة خفيفة لتشغيل مكتبة الخطوط ----------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4173 \
    HOST=0.0.0.0 \
    FONTS_DATA_DIR=/app/data

# لا توجد تبعيات خارجية — نحتاج فقط ملفات المشروع
COPY package.json ./
COPY server.js ./
COPY lib ./lib
COPY public ./public
COPY data/fonts ./data/fonts

# مجلد البيانات الدائم (اربطه بوحدة تخزين عند التشغيل)
RUN mkdir -p /app/data/fonts /app/data/tmp /app/data/backups
VOLUME ["/app/data"]

EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=4s --start-period=8s \
  CMD wget -qO- http://127.0.0.1:4173/api/health || exit 1

CMD ["node", "server.js"]
