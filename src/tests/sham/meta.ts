import type { TestMeta } from "../types";

export const SHAM_ID = "sham-cas-battery";

export const shamMeta: TestMeta = {
  id: SHAM_ID,
  version: "1.0",
  name: { ar: "بطارية الشام التشخيصية", en: "Al-Sham Diagnostic Battery" },
  description: {
    ar: "أداة فحص وتشخيص تفريقي أولية لأبراكسيا الكلام النمائية (CAS) لدى الأطفال الناطقين بالعربية (اللهجة الشامية)، تدمج خمسة أبعاد: الفحص التأسيسي، عدم الاتساق الصوتي، دقة الحركات الصائتة، DDK والنبر والتنغيم، والسمات الداعمة.",
    en: "A preliminary screening and differential-diagnosis battery for Childhood Apraxia of Speech (CAS) in Levantine-Arabic-speaking children, combining five dimensions: oral-motor exam, inconsistency, vowel accuracy, DDK and prosody, and supporting features.",
  },
  ageRange: { ar: "3 – 10 سنوات تقريباً", en: "about 3 – 10 years" },
  sectionsCount: 5,
  itemsCount: 18 + 15 + 28 + 30 + 20 + 3,
};
