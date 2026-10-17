import { setLangAction } from "@/lib/auth-actions";
import type { Dict, Lang } from "@/lib/i18n";

export function LangToggle({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <form action={setLangAction}>
      <input type="hidden" name="lang" value={lang === "ar" ? "en" : "ar"} />
      <button type="submit" className="btn btn-sm">
        {t.switchLang}
      </button>
    </form>
  );
}
