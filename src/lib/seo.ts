// إعدادات تحسين الظهور في محركات البحث (SEO)
export const SITE_URL = (process.env.SITE_URL || "https://therapists-slp.com").replace(/\/$/, "");

export const SEO_KEYWORDS = [
  "اضطرابات اللغة والكلام",
  "اختبارات النطق",
  "أخصائي نطق",
  "أخصائي نطق ولغة",
  "علاج النطق",
  "تقييم اللغة عند الأطفال",
  "أبراكسيا الكلام",
  "مصفوفة التواصل",
  "تأخر الكلام",
  "speech language pathology",
  "speech therapist",
  "SLP assessment Arabic",
];

// لا تُفهرَس صفحات المنصة الداخلية (الحالات والتقارير بيانات خاصة)
export const NO_INDEX = { index: false, follow: false } as const;

export function jsonLd(data: object) {
  // يمنع إغلاق وسم <script> من داخل النص
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
