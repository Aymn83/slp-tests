// بنية «مصفوفة التواصل» (د. تشارتي رولاند، © 1990/1996/2004 — جامعة أوريغون للصحة والعلوم).
// يحتوي هذا الملف على البنية فقط (المستويات، الأسباب، أسماء الرسائل، الخلايا الثمانين).
// نصوص الأسئلة وقوائم السلوكيات التفصيلية محمية بحقوق النشر ويستخدمها الفاحص من نسخته من دليل الاختبار.

export const LEVELS = [
  { n: 1, roman: "I", name: "السلوك العفوي", age: "0–3 أشهر", summary: "سلوك انعكاسي غير مقصود يفسّره مقدم الرعاية على أنه حالة (جوع، ارتياح، ألم…)." },
  { n: 2, roman: "II", name: "السلوك المتعمد", age: "3–8 أشهر", summary: "سلوك مقصود لكنه ليس موجّهاً للتواصل؛ مقدم الرعاية يستنتج منه رغبة الطفل." },
  { n: 3, roman: "III", name: "التواصل غير الاعتيادي", age: "6–12 شهراً", summary: "تواصل مقصود بإيماءات وحركات وأصوات غير اعتيادية اجتماعياً." },
  { n: 4, roman: "IV", name: "التواصل الاعتيادي", age: "12–18 شهراً", summary: "تواصل مقصود بإيماءات وأصوات اعتيادية، مع توجّه مزدوج نحو الشخص والموضوع." },
  { n: 5, roman: "V", name: "الرموز الملموسة", age: "12–24 شهراً", summary: "استخدام رموز تشبه مرجعها (صور، مجسمات، إيماءات تمثيلية، أصوات مقلَّدة)." },
  { n: 6, roman: "VI", name: "الرموز التجريدية", age: "18–24 شهراً", summary: "استخدام رموز مفردة لا تشبه مرجعها (كلمات، إشارات يدوية، كلمات مكتوبة، بريل)." },
  { n: 7, roman: "VII", name: "اللغة", age: "24 شهراً فأكثر", summary: "تركيب رمزين أو ثلاثة وفق قواعد نحوية." },
] as const;

export type ReasonId = "refuse" | "obtain" | "social" | "info";

export const REASONS: { id: ReasonId; name: string; full: string }[] = [
  { id: "refuse", name: "رفض", full: "رفض الأشياء غير المرغوبة" },
  { id: "obtain", name: "حصول", full: "الحصول على الأشياء المرغوبة" },
  { id: "social", name: "اجتماعي", full: "المشاركة في التفاعل الاجتماعي" },
  { id: "info", name: "معلومات", full: "تقديم المعلومات أو البحث عنها" },
];

// الرسائل الأربع والعشرون والمستويات التي تُقيَّم فيها
export const MESSAGES: { reason: ReasonId; n: number; name: string; levels: number[] }[] = [
  { reason: "refuse", n: 1, name: "يعبّر عن عدم الارتياح", levels: [1] },
  { reason: "refuse", n: 2, name: "يحتج", levels: [2] },
  { reason: "refuse", n: 3, name: "يرفض / يمتنع", levels: [3, 4, 5, 6, 7] },

  { reason: "obtain", n: 1, name: "يعبّر عن الراحة", levels: [1] },
  { reason: "obtain", n: 2, name: "إكمال النشاط", levels: [2] },
  { reason: "obtain", n: 3, name: "الحصول على المزيد من شيء", levels: [2] },
  { reason: "obtain", n: 4, name: "يطلب المزيد من نشاط", levels: [3, 4, 5, 6, 7] },
  { reason: "obtain", n: 5, name: "يطلب نشاطاً جديداً", levels: [3, 4, 5, 6, 7] },
  { reason: "obtain", n: 6, name: "يطلب المزيد من الأغراض", levels: [3, 4, 5, 6, 7] },
  { reason: "obtain", n: 7, name: "يقوم بالاختيار", levels: [3, 4, 5, 6, 7] },
  { reason: "obtain", n: 8, name: "يطلب أغراضاً جديدة", levels: [3, 4, 5, 6, 7] },
  { reason: "obtain", n: 9, name: "يطلب أغراضاً غير موجودة", levels: [5, 6, 7] },

  { reason: "social", n: 1, name: "يعبّر عن اهتمامه بالآخرين", levels: [1] },
  { reason: "social", n: 2, name: "يجذب الانتباه", levels: [2] },
  { reason: "social", n: 3, name: "يطلب الاهتمام", levels: [3, 4, 5, 6, 7] },
  { reason: "social", n: 4, name: "يُظهر المودة", levels: [3, 4, 5, 6, 7] },
  { reason: "social", n: 5, name: "يحيّي الناس", levels: [4, 5, 6, 7] },
  { reason: "social", n: 6, name: "يعرض / يشارك", levels: [4, 5, 6, 7] },
  { reason: "social", n: 7, name: "يوجّه اهتمام الآخرين", levels: [4, 5, 6, 7] },
  { reason: "social", n: 8, name: "صيغ اللباقة الاجتماعية", levels: [4, 5, 6, 7] },

  { reason: "info", n: 1, name: "يجيب على أسئلة نعم/لا", levels: [4, 5, 6, 7] },
  { reason: "info", n: 2, name: "يطرح الأسئلة", levels: [4, 5, 6, 7] },
  { reason: "info", n: 3, name: "يسمّي الأشياء / الناس", levels: [5, 6, 7] },
  { reason: "info", n: 4, name: "يقدّم التعليقات", levels: [5, 6, 7] },
];

export const cellId = (reason: ReasonId, n: number, level: number) => `${reason}-${n}-L${level}`;

export const CELLS = MESSAGES.flatMap((m) => m.levels.map((level) => ({ id: cellId(m.reason, m.n, level), reason: m.reason, n: m.n, name: m.name, level })));

// فئات عامة لأشكال السلوك حسب المستوى (لتوثيق «كيف» يعبّر الطفل) — صياغة عامة وليست نص الدليل
export const BEHAVIORS: Record<"pre" | "concrete" | "abstract" | "language", string[]> = {
  pre: ["حركة الجسم", "حركة الأطراف", "حركة الرأس", "تعابير الوجه", "النظر", "إصدارات صوتية", "لمس / دفع / سحب", "إيماءات اعتيادية"],
  concrete: ["صورة / رسم", "رمز مجسّم", "إيماءة تمثيلية", "تقليد صوت"],
  abstract: ["كلمة منطوقة", "إشارة يدوية", "كلمة مكتوبة", "بريل", "رمز تجريدي ثلاثي الأبعاد", "رمز تجريدي ثنائي الأبعاد"],
  language: ["تركيب رمزين", "تركيب ثلاثة رموز فأكثر"],
};

export function behaviorsFor(level: number): string[] {
  if (level <= 4) return BEHAVIORS.pre;
  if (level === 5) return BEHAVIORS.concrete;
  if (level === 6) return BEHAVIORS.abstract;
  return BEHAVIORS.language;
}

// حالات الخلية
export const STATUSES = [
  { v: "none", l: "غير مستخدم", short: "—", color: "#e5e7eb", ink: "#374151", points: 0 },
  { v: "emerging", l: "ناشئ", short: "ن", color: "#fde68a", ink: "#78350f", points: 1 },
  { v: "mastered", l: "متقن", short: "م", color: "#0f766e", ink: "#ffffff", points: 2 },
  { v: "surpassed", l: "تم تجاوزه", short: "ت", color: "#134e4a", ink: "#ffffff", points: 2 },
] as const;

// أهداف علاجية عامة لكل مستوى (صياغة خاصة بالمنصة)
export const GOALS: Record<number, string> = {
  1: "بناء سلوك مقصود عبر بيئة شديدة الاستجابة تربط حالات الطفل بنتائج واضحة ومتوقعة.",
  2: "الاستجابة المتسقة للسلوكيات التي يمكن أن تكون تواصلية حتى يدرك الطفل أن سلوكه يؤثر في الآخرين.",
  3: "تحويل الإيماءات غير الاعتيادية تدريجياً إلى إيماءات اعتيادية و/أو رموز مستهدفة.",
  4: "تعليم المطابقة بين الرموز (الملموسة أو التجريدية) ومراجعها.",
  5: "الانتقال من الرموز الملموسة إلى الرموز التجريدية مع توسيع المفردات الوظيفية.",
  6: "تعليم الجمع بين رمزين أو ثلاثة رموز في عبارات قصيرة.",
  7: "توسيع القدرات الدلالية والنحوية وتنويع وظائف اللغة.",
};
