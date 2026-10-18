# نشر موقع الاختبارات على VPS — `myskills.lt`

تطبيق Next.js 16 + Prisma + PostgreSQL، يعمل على **نفس سيرفر براعم** (`187.124.13.157`) لكن **معزولاً تماماً**:

| | براعم | موقع الاختبارات |
|---|---|---|
| المجلد | `/var/www/baraem` | `/var/www/slp-tests` |
| المنفذ الداخلي | 3100 | **3200** |
| قاعدة البيانات | `baraem` | **`slp_tests`** (مستخدم `slp_user`) |
| عملية PM2 | `baraem` | **`slp-tests`** |
| كتلة Nginx | `baraem` | **`slp-tests`** |
| أمر التحديث | `/root/update-baraem.sh` | **`/root/update-slp.sh`** |

---

## 0) قبل البدء (مرة واحدة)

**أ) DNS** — من لوحة تحكم النطاق `myskills.lt` أضف سجلين:
- `A` ← `@` ← `187.124.13.157`
- `A` ← `www` ← `187.124.13.157`

انتظر حتى ينتشر (تحقق: `ping myskills.lt` يُظهر عنوان السيرفر).

**ب) مستودع GitHub** — المستودع `Aymn83/slp-tests` **خاص (Private)**.

## 1) الدخول وفحص المنفذ
```bash
ssh root@187.124.13.157
ss -ltnp | grep ':3200' || echo "المنفذ 3200 متاح"
```

## 2) مفتاح قراءة للمستودع الخاص (Deploy key)
```bash
ssh-keygen -t ed25519 -C "slp-tests-deploy" -f /root/.ssh/slp_tests_deploy -N ""
cat /root/.ssh/slp_tests_deploy.pub
```
انسخ الناتج إلى GitHub: المستودع ← **Settings ← Deploy keys ← Add deploy key** (اترك «Allow write access» غير مفعّل).

ثم:
```bash
cat >> /root/.ssh/config <<'EOF'
Host github-slp
  HostName github.com
  User git
  IdentityFile /root/.ssh/slp_tests_deploy
  IdentitiesOnly yes
EOF
ssh -T github-slp   # يجب أن تظهر رسالة نجاح من GitHub
```

## 3) قاعدة بيانات مستقلّة
ولّد كلمة مرور قوية واحفظها مؤقتاً (ستضعها في `.env`):
```bash
openssl rand -hex 24
```
```bash
sudo -u postgres psql -c "CREATE USER slp_user WITH PASSWORD 'ضع_كلمة_المرور_هنا';"
sudo -u postgres psql -c "CREATE DATABASE slp_tests OWNER slp_user;"
```

## 4) جلب الكود
```bash
mkdir -p /var/www && cd /var/www
git clone github-slp:Aymn83/slp-tests.git slp-tests
cd slp-tests
```

## 5) متغيّرات البيئة
```bash
cp .env.example .env
openssl rand -hex 32     # استخدمه قيمةً لـ AUTH_SECRET
nano .env
```
املأ: كلمة مرور القاعدة في `DATABASE_URL`، و`AUTH_SECRET`، و`ADMIN_PASSWORD` (كلمة مرور قوية لحساب المدير).
```bash
chmod 600 .env
```

## 6) التثبيت + القاعدة + المدير + البناء
```bash
npm ci
npx prisma generate
npx prisma db push
npm run db:seed          # ينشئ حساب المدير و«الباقة الأساسية»
npm run build
```

## 7) التشغيل عبر PM2
```bash
pm2 start deploy/ecosystem.config.js
pm2 save
curl -I http://127.0.0.1:3200/login   # يجب أن يرجع 200
```
(إذا كان `pm2 startup` قد نُفّذ سابقاً لبراعم فلا حاجة لإعادته.)

## 8) Nginx
```bash
cp deploy/nginx-myskills.lt.conf /etc/nginx/sites-available/slp-tests
ln -s /etc/nginx/sites-available/slp-tests /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 9) شهادة SSL (إلزامية — تسجيل الدخول لا يعمل بدون HTTPS)
```bash
certbot --nginx -d myskills.lt -d www.myskills.lt
```
افتح: **https://myskills.lt** وسجّل الدخول بحساب المدير، ثم **غيّر كلمة المرور فوراً** من «ملفي الشخصي».

## 10) أمر التحديث (مرة واحدة)
```bash
cat > /root/update-slp.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/slp-tests
PREV=$(git rev-parse HEAD)
git pull --ff-only origin main
exec bash deploy/update-slp.sh "$PREV"
EOF
chmod +x /root/update-slp.sh
```
بعد ذلك، كل تحديث = أمر واحد:
```bash
/root/update-slp.sh
```
يعيد تثبيت الاعتماديات أو تحديث القاعدة **فقط عند الحاجة**، ويأخذ نسخة احتياطية تلقائياً قبل أي تغيير في مخطط القاعدة.

## 11) النسخ الاحتياطي اليومي
```bash
chmod +x deploy/backup-db.sh
bash deploy/backup-db.sh        # تجربة أولى — تظهر النسخة في /root/backups/slp-tests
(crontab -l 2>/dev/null; echo "30 3 * * * bash /var/www/slp-tests/deploy/backup-db.sh >> /var/log/slp-backup.log 2>&1") | crontab -
```
يحتفظ بآخر 14 نسخة. **يُنصح بتنزيل نسخة أسبوعياً إلى جهازك** (بيانات حساسة لا يجب أن تكون نسختها الوحيدة على السيرفر):
```bash
scp root@187.124.13.157:/root/backups/slp-tests/<اسم_الملف>.sql.gz .
```

**الاستعادة من نسخة** (عند الحاجة فقط):
```bash
gunzip -c /root/backups/slp-tests/<اسم_الملف>.sql.gz | sudo -u postgres psql slp_tests
```

## 12) الجدار الناري
لا تفتح المنفذ 3200 ولا 5432 للخارج — يكفي `Nginx Full` (80/443) المفتوح أصلاً لبراعم.

## 13) البريد — رسائل «نسيت كلمة المرور»
أضف إلى نهاية `/var/www/slp-tests/.env` (ضع كلمة مرور صندوق البريد بنفسك):
```bash
nano /var/www/slp-tests/.env
```
```
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="noreply@therapists-slp.com"
SMTP_PASS="كلمة_مرور_صندوق_البريد"
MAIL_FROM="الاختبارات الخاصة باضطرابات اللغة والكلام <noreply@therapists-slp.com>"
```
ثم أعد تشغيل الموقع ليقرأ الإعدادات:
```bash
pm2 reload slp-tests --update-env
```
بدون هذه الإعدادات يعمل الموقع طبيعياً، لكن رسائل الاستعادة لا تُرسل (تُكتب في سجل `pm2 logs slp-tests` فقط).

## 14) النطاق الرئيسي الجديد: therapists-slp.com (و myskills.lt يحوّل إليه)

**أ) DNS** — من لوحة Hostinger للنطاق `therapists-slp.com`:
- عدّل سجل `A` للاسم `@` ليشير إلى `187.124.13.157` (بدل `2.57.91.91`).
- سجل `www`: إما `CNAME` ← `therapists-slp.com`، أو `A` ← `187.124.13.157`.

انتظر حتى ينتشر: `ping therapists-slp.com` يُظهر `187.124.13.157`.

**ب) جلب التحديث** (يجعل الروابط والخريطة تستخدم النطاق الجديد):
```bash
/root/update-slp.sh
```

**ج) تفعيل النطاق الجديد في Nginx + شهادة SSL:**
```bash
cp /var/www/slp-tests/deploy/nginx-therapists-slp.com.conf /etc/nginx/sites-available/therapists-slp
ln -s /etc/nginx/sites-available/therapists-slp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d therapists-slp.com -d www.therapists-slp.com
```
تأكد أن **https://therapists-slp.com** يفتح الموقع قبل المتابعة.

**د) تحويل myskills.lt إلى النطاق الجديد:**
```bash
ls /etc/letsencrypt/live/          # يجب أن يظهر مجلد باسم myskills.lt
cp /etc/nginx/sites-available/slp-tests /root/slp-tests.nginx.backup
cp /var/www/slp-tests/deploy/nginx-myskills.lt-redirect.conf /etc/nginx/sites-available/slp-tests
nginx -t && systemctl reload nginx
```
إذا فشل `nginx -t` أعد النسخة السابقة: `cp /root/slp-tests.nginx.backup /etc/nginx/sites-available/slp-tests && systemctl reload nginx`

**هـ) Google Search Console:** أضف `therapists-slp.com` كموقع جديد وأرسل `https://therapists-slp.com/sitemap.xml`، ثم من إعدادات `myskills.lt` استخدم أداة **Change of address** وانقلها إلى النطاق الجديد.
