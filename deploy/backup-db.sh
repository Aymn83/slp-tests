#!/usr/bin/env bash
# نسخة احتياطية مضغوطة لقاعدة بيانات موقع الاختبارات، مع الاحتفاظ بآخر 14 نسخة.
# يُشغَّل يومياً عبر cron (انظر DEPLOY.md) وقبل أي تغيير في مخطط القاعدة.
set -euo pipefail

APP_DIR="/var/www/slp-tests"
BACKUP_DIR="/root/backups/slp-tests"
KEEP=14

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# يقرأ DATABASE_URL من ملف .env الخاص بالموقع
DATABASE_URL=$(grep '^DATABASE_URL=' "$APP_DIR/.env" | sed -E 's/^DATABASE_URL="?([^"]*)"?$/\1/')
# pg_dump لا يقبل معامل ?schema= في الرابط
DB_URL="${DATABASE_URL%%\?*}"

FILE="$BACKUP_DIR/slp_tests_$(date +%Y-%m-%d_%H%M).sql.gz"
pg_dump --no-owner --no-privileges "$DB_URL" | gzip > "$FILE"
chmod 600 "$FILE"
echo "==> نسخة احتياطية: $FILE"

# حذف النسخ الأقدم مع إبقاء آخر $KEEP
ls -1t "$BACKUP_DIR"/slp_tests_*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm --
