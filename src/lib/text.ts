// أدوات نصية آمنة للاستخدام في الخادم والمتصفح معاً
export type Lang = "ar" | "en";

// نص ثنائي اللغة — الإنجليزية اختيارية وتُستخدم العربية عند غيابها
export type Text = { ar: string; en?: string };

export function tx(lang: Lang, text: Text | undefined): string {
  if (!text) return "";
  return lang === "en" && text.en ? text.en : text.ar;
}
