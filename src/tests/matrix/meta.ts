import type { TestMeta } from "../types";

export const MATRIX_ID = "communication-matrix";

export const matrixMeta: TestMeta = {
  id: MATRIX_ID,
  version: "1.0",
  name: { ar: "مصفوفة التواصل", en: "Communication Matrix" },
  description: {
    ar: "أداة لتقييم المراحل الأولى من التطور التواصلي عبر سبعة مستويات وأربعة أسباب للتواصل (رفض، حصول، اجتماعي، معلومات)، وتناسب من يستخدمون طرق تواصل ما قبل الرمزية أو البديلة والمعزّزة. د. تشارتي رولاند. يحتاج الفاحص إلى نسخته من دليل الاختبار لطرح الأسئلة.",
    en: "Assesses early communication across seven levels and four reasons to communicate (refuse, obtain, social, information); suitable for pre-symbolic and AAC users. By Dr. Charity Rowland. The examiner needs their own copy of the manual for the questions.",
  },
  ageRange: { ar: "المراحل التواصلية المبكرة (0–24 شهراً نمائياً) وأي عمر", en: "early communication stages (0–24 months developmentally), any age" },
  sectionsCount: 4,
  itemsCount: 80,
};
