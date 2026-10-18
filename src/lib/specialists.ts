import type { Dict } from "./i18n";
import { opt, str } from "./credentials";

export const MAX_PHOTO_BYTES = 400 * 1024;

// يقبل dataURL لصورة JPEG/PNG/WebP صغّرها المتصفح؛ ويتحقق من البصمة الفعلية للملف لا من النوع المعلن فقط
export function parsePhoto(dataUrl: string): Uint8Array<ArrayBuffer> | null | "invalid" {
  if (!dataUrl) return null;
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return "invalid";
  const buf = Buffer.from(m[2], "base64");
  if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) return "invalid";
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf.subarray(0, 4).toString("hex") === "89504e47";
  const webp = buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
  return jpeg || png || webp ? new Uint8Array(buf) : "invalid";
}

export function photoMime(buf: Uint8Array): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  return "image/webp";
}

const cut = (v: string | null, n = 200) => (v ? v.slice(0, n) : v);

// قراءة حقول النموذج والتحقق منها (مشتركة بين طلب الانضمام وتعديل المدير)
export function readSpecialistFields(fd: FormData, t: Dict) {
  const data = {
    fullName: cut(str(fd, "fullName"))!,
    specialty: cut(str(fd, "specialty"))!,
    licenseNumber: cut(str(fd, "licenseNumber"), 60)!,
    country: cut(str(fd, "country"), 80)!,
    phone: cut(opt(fd, "phone"), 40),
    email: cut(opt(fd, "email"), 120),
    governorate: cut(opt(fd, "governorate"), 80),
    workplace: cut(opt(fd, "workplace")),
    workPhone: cut(opt(fd, "workPhone"), 40),
    skills: cut(opt(fd, "skills"), 3000),
  };
  if (!data.fullName || !data.specialty || !data.licenseNumber || !data.country) return { error: t.fillRequired } as const;
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: t.invalidEmail } as const;
  return { data } as const;
}

export const SPECIALTY_SUGGESTIONS = [
  "اضطرابات النطق واللغة",
  "علاج النطق والبلع",
  "السمعيات وإعادة التأهيل السمعي",
  "التأتأة واضطرابات الطلاقة",
  "التواصل البديل والمعزّز (AAC)",
  "اضطراب طيف التوحد والتواصل",
  "التربية الخاصة",
];

export const COUNTRY_SUGGESTIONS = [
  "سوريا", "الأردن", "لبنان", "فلسطين", "العراق", "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عُمان",
  "اليمن", "مصر", "ليبيا", "تونس", "الجزائر", "المغرب", "السودان", "تركيا", "ألمانيا",
];
