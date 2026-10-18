// اختبار إعدادات البريد: يرسل رسالة تجريبية ويطبع النتيجة أو سبب الفشل.
// الاستخدام (من مجلد المشروع على السيرفر):
//   node --env-file=.env deploy/test-mail.mjs you@example.com
import nodemailer from "nodemailer";

const to = process.argv[2];
if (!to) {
  console.log("الاستخدام: node --env-file=.env deploy/test-mail.mjs you@example.com");
  process.exit(1);
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
const missing = Object.entries({ SMTP_HOST, SMTP_USER, SMTP_PASS }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.log("ERROR: إعدادات ناقصة في .env:", missing.join(", "));
  process.exit(1);
}

const port = Number(SMTP_PORT || 465);
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 15000,
});

try {
  await transport.verify();
  console.log(`OK: تم الاتصال بخادم البريد ${SMTP_HOST}:${port} وتسجيل الدخول بنجاح`);
  const r = await transport.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: "اختبار البريد — myskills.lt",
    text: "رسالة تجريبية من الموقع. إذا وصلتك فإعدادات البريد صحيحة.",
  });
  console.log("SENT:", r.response);
} catch (e) {
  console.log("ERROR:", e.message);
  process.exit(1);
}
