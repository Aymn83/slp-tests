import type { Text } from "@/lib/text";

// ===== تعريف الاختبار =====
// كل اختبار ملف TypeScript واحد في هذا المجلد يُسجَّل في index.ts.

export type ScaleOption = {
  value: string; // يُحفظ في قاعدة البيانات
  label: Text;
  score: number;
  isError?: boolean; // يُدرج البند في قائمة «البنود التي ظهرت فيها صعوبة»
};

export type Band = {
  id: string;
  min: number; // النسبة المئوية الدنيا (شاملة)
  label: Text;
  color: string; // لون الشارة في الواجهة والتقرير
};

export type TestItem = {
  id: string;
  label: Text; // نص البند / السؤال
  stimulus?: Text; // المثير: كلمة، صورة، جملة…
  hint?: Text;
};

export type TestSection = {
  id: string;
  title: Text;
  instructions?: Text;
  scale: string; // مفتاح في responseScales
  items: TestItem[];
};

export type Recommendation = {
  // تُطبَّق إذا وقع «القسم» (أو المجموع عند غياب section) في أحد المستويات المذكورة
  section?: string;
  bands: string[];
  text: Text;
};

export type ExtraField = { id: string; label: Text; rows?: number };

export type TestDefinition = {
  id: string;
  version: string;
  demo?: boolean;
  name: Text;
  description: Text;
  ageRange?: Text;
  instructions?: Text;
  responseScales: Record<string, ScaleOption[]>;
  sections: TestSection[];
  bands: Band[];
  recommendations: Recommendation[];
  extraFields?: ExtraField[]; // ملاحظات نوعية خاصة بالاختبار
};

// ===== سجل الاختبارات =====
// «generic»: اختبار يُعرَّف بالبيانات فقط (TestDefinition) ويستخدم المحرك العام.
// «sham»: بطارية لها واجهة وتصحيح خاصان بها (src/tests/sham).
export type TestMeta = {
  id: string;
  version: string;
  demo?: boolean;
  name: Text;
  description: Text;
  ageRange?: Text;
  sectionsCount: number;
  itemsCount: number;
};

export type RegisteredTest = { meta: TestMeta } & ({ kind: "generic"; def: TestDefinition } | { kind: "sham" } | { kind: "matrix" });

// ===== نتائج التصحيح =====
export type SectionResult = {
  id: string;
  score: number;
  max: number; // أقصى درجة للبنود المُجابة
  answered: number;
  total: number;
  percent: number | null;
  band: Band | null;
  errors: { item: TestItem; option: ScaleOption }[];
};

export type TestResult = {
  sections: SectionResult[];
  score: number;
  max: number;
  answered: number;
  total: number;
  percent: number | null;
  band: Band | null;
};
