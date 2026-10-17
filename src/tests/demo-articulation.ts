import type { TestDefinition } from "./types";

// اختبار تجريبي لعرض إمكانيات المنصة فقط — ليس أداة معيارية مقننة.

const sound = (id: string, letter: string, word: string, wordEn: string) => ({
  id,
  label: { ar: `صوت /${letter}/`, en: `Sound /${letter}/` },
  stimulus: { ar: word, en: wordEn },
});

export const demoArticulation: TestDefinition = {
  id: "demo-articulation",
  version: "0.1",
  demo: true,
  name: { ar: "مسح النطق التجريبي", en: "Demo Articulation Screening" },
  description: {
    ar: "مسح سريع لإنتاج الأصوات العربية في الكلمات، مقسّم حسب مخارج الأصوات. نموذج تجريبي لعرض طريقة عمل المنصة.",
    en: "A quick screening of Arabic sound production in words, grouped by place of articulation. A demo to show how the platform works.",
  },
  ageRange: { ar: "3 – 7 سنوات", en: "3 – 7 years" },
  instructions: {
    ar: "اعرض الصورة أو قل الكلمة واطلب من الطفل تسميتها أو تكرارها، ثم سجّل نوع الإنتاج للصوت المستهدف.",
    en: "Show the picture or say the word and ask the child to name or repeat it, then record how the target sound was produced.",
  },
  responseScales: {
    articulation: [
      { value: "correct", label: { ar: "صحيح", en: "Correct" }, score: 2 },
      { value: "distortion", label: { ar: "تحريف", en: "Distortion" }, score: 1, isError: true },
      { value: "substitution", label: { ar: "إبدال", en: "Substitution" }, score: 0, isError: true },
      { value: "omission", label: { ar: "حذف", en: "Omission" }, score: 0, isError: true },
    ],
  },
  sections: [
    {
      id: "labial",
      title: { ar: "الأصوات الشفوية", en: "Labial sounds" },
      scale: "articulation",
      items: [
        sound("b", "ب", "باب", "bab (door)"),
        sound("m", "م", "موز", "mooz (banana)"),
        sound("f", "ف", "فيل", "feel (elephant)"),
        sound("w", "و", "وردة", "warda (flower)"),
      ],
    },
    {
      id: "alveolar",
      title: { ar: "الأصوات الأسنانية واللثوية", en: "Dental and alveolar sounds" },
      scale: "articulation",
      items: [
        sound("t", "ت", "تفاحة", "tuffaha (apple)"),
        sound("d", "د", "دب", "dub (bear)"),
        sound("n", "ن", "نمر", "nimr (tiger)"),
        sound("l", "ل", "ليمون", "laymoon (lemon)"),
        sound("r", "ر", "رمان", "rumman (pomegranate)"),
        sound("s", "س", "سمكة", "samaka (fish)"),
        sound("z", "ز", "زرافة", "zarafa (giraffe)"),
        sound("sh", "ش", "شمس", "shams (sun)"),
      ],
    },
    {
      id: "velar",
      title: { ar: "الأصوات الطبقية والحلقية", en: "Velar and guttural sounds" },
      scale: "articulation",
      items: [
        sound("k", "ك", "كرة", "kura (ball)"),
        sound("q", "ق", "قطة", "qitta (cat)"),
        sound("kh", "خ", "خروف", "kharoof (sheep)"),
        sound("gh", "غ", "غزال", "ghazal (deer)"),
        sound("ain", "ع", "عصفور", "asfoor (bird)"),
        sound("h", "ح", "حصان", "hisan (horse)"),
      ],
    },
  ],
  bands: [
    { id: "typical", min: 90, label: { ar: "ضمن المدى الطبيعي", en: "Within typical range" }, color: "#15803d" },
    { id: "mild", min: 75, label: { ar: "صعوبة بسيطة", en: "Mild difficulty" }, color: "#ca8a04" },
    { id: "moderate", min: 50, label: { ar: "صعوبة متوسطة", en: "Moderate difficulty" }, color: "#ea580c" },
    { id: "severe", min: 0, label: { ar: "صعوبة شديدة", en: "Severe difficulty" }, color: "#b91c1c" },
  ],
  recommendations: [
    {
      bands: ["typical"],
      text: {
        ar: "الأداء النطقي ضمن المدى الطبيعي لهذا المسح، ولا حاجة لتدخل علاجي حالياً مع متابعة النمو اللغوي.",
        en: "Articulation is within the typical range for this screening; no therapy is needed now. Continue monitoring language development.",
      },
    },
    {
      bands: ["mild"],
      text: {
        ar: "يُنصح بإرشاد الأهل ببرنامج تدريب منزلي على الأصوات المتأثرة وإعادة التقييم بعد 3 أشهر.",
        en: "Give the parents a home practice programme for the affected sounds and re-assess in 3 months.",
      },
    },
    {
      bands: ["moderate", "severe"],
      text: {
        ar: "يُوصى بجلسات علاج نطق فردية بواقع جلستين أسبوعياً على الأقل، مع تقييم شامل للنطق والفونولوجيا.",
        en: "Individual articulation therapy at least twice a week is recommended, with a full articulation and phonology assessment.",
      },
    },
    {
      bands: ["severe"],
      text: {
        ar: "يُنصح بفحص السمع وفحص الآلية الفموية الحركية لاستبعاد أسباب عضوية.",
        en: "A hearing screening and an oral-motor examination are advised to rule out organic causes.",
      },
    },
    {
      section: "labial",
      bands: ["mild", "moderate", "severe"],
      text: { ar: "التركيز على الأصوات الشفوية في الخطة العلاجية.", en: "Target labial sounds in the therapy plan." },
    },
    {
      section: "alveolar",
      bands: ["mild", "moderate", "severe"],
      text: {
        ar: "التركيز على الأصوات الأسنانية واللثوية (خاصة ر، س، ش) في الخطة العلاجية.",
        en: "Target dental and alveolar sounds (especially r, s, sh) in the therapy plan.",
      },
    },
    {
      section: "velar",
      bands: ["mild", "moderate", "severe"],
      text: { ar: "التركيز على الأصوات الطبقية والحلقية في الخطة العلاجية.", en: "Target velar and guttural sounds in the therapy plan." },
    },
  ],
  extraFields: [
    { id: "intelligibility", label: { ar: "وضوح الكلام العام", en: "Overall intelligibility" }, rows: 2 },
    { id: "observations", label: { ar: "ملاحظات سلوكية أثناء الفحص", en: "Behavioural observations" }, rows: 3 },
  ],
};
