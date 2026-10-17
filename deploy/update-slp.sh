#!/usr/bin/env bash
# خطوات التحديث بعد سحب الكود — يستدعيها /root/update-slp.sh (انظر DEPLOY.md):
#   bash deploy/update-slp.sh <commit السابق قبل السحب>
# بدون معامل تُنفَّذ كل الخطوات.
set -euo pipefail

APP_DIR="/var/www/slp-tests"
cd "$APP_DIR"
PREV="${1:-}"

changed() { [ -z "$PREV" ] || ! git diff --quiet "$PREV" HEAD -- "$@"; }

if changed package-lock.json || [ ! -d node_modules ]; then
  echo "==> تغيّرت الاعتماديات: npm ci"
  npm ci
fi

echo "==> توليد Prisma Client"
npx prisma generate

if changed prisma/schema.prisma; then
  echo "==> تغيّر مخطط قاعدة البيانات: نسخة احتياطية ثم prisma db push"
  bash deploy/backup-db.sh
  npx prisma db push
fi

echo "==> بناء الإنتاج"
npm run build

echo "==> إعادة تشغيل التطبيق"
pm2 reload deploy/ecosystem.config.js --update-env || pm2 start deploy/ecosystem.config.js
pm2 save

echo "==> تم التحديث بنجاح ✅"
