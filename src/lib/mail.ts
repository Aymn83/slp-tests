import nodemailer from "nodemailer";

// إرسال البريد عبر SMTP (بريد Hostinger). الإعدادات في .env:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
export function mailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL مباشر، 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (!mailConfigured()) {
    // بدون إعدادات البريد (مثلاً على جهاز التطوير) يُطبع المحتوى في السجل بدل الإرسال
    console.warn(`[mail] SMTP غير مضبوط — لم يُرسل البريد إلى ${to}:\n${text}`);
    return false;
  }
  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
    await getTransporter().sendMail({ from, to, subject, text, html });
    return true;
  } catch (e) {
    console.error("[mail] فشل الإرسال:", (e as Error).message);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// قالب رسالة عربية بسيطة باتجاه من اليمين لليسار
export function resetEmail(name: string, link: string, siteTitle: string) {
  const subject = "إعادة تعيين كلمة المرور";
  const text = [
    `مرحباً ${name}،`,
    "",
    "وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. لاختيار كلمة مرور جديدة افتح الرابط التالي (صالح لمدة ساعة واحدة):",
    link,
    "",
    "إذا لم تطلب ذلك فتجاهل هذه الرسالة، ولن يتغير شيء في حسابك.",
    "",
    siteTitle,
  ].join("\n");
  const html = `<!doctype html><html lang="ar" dir="rtl"><body style="margin:0;background:#f5f7f8;font-family:Tahoma,Arial,sans-serif;color:#1f2933">
<div style="max-width:520px;margin:24px auto;background:#fff;border:1px solid #e3e8ec;border-radius:16px;padding:28px;direction:rtl;text-align:right">
<h2 style="margin:0 0 12px;color:#134e4a">${esc(subject)}</h2>
<p>مرحباً ${esc(name)}،</p>
<p>وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. اضغط الزر لاختيار كلمة مرور جديدة:</p>
<p style="text-align:center;margin:24px 0"><a href="${esc(link)}" style="background:#0f766e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;display:inline-block">اختيار كلمة مرور جديدة</a></p>
<p style="font-size:13px;color:#5f6b76">الرابط صالح لمدة ساعة واحدة ويُستخدم مرة واحدة فقط. إذا لم تطلب ذلك فتجاهل هذه الرسالة، ولن يتغير شيء في حسابك.</p>
<hr style="border:none;border-top:1px solid #e3e8ec;margin:20px 0">
<p style="font-size:12px;color:#5f6b76;margin:0">${esc(siteTitle)}</p>
</div></body></html>`;
  return { subject, text, html };
}
