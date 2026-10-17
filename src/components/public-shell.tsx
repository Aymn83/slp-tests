import { getDict } from "@/lib/i18n";
import { LangToggle } from "./lang-toggle";
import { Logo } from "./logo";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-md justify-end">
        <LangToggle lang={lang} t={t} />
      </div>
      <div className="mb-6 flex max-w-md flex-col items-center text-center">
        <Logo className="mb-3 h-14 w-14" />
        <h1 className="text-xl font-bold text-brand-dark sm:text-2xl">{t.siteTitle}</h1>
        <p className="muted mt-1">{t.siteSubtitle}</p>
      </div>
      <div className="card w-full max-w-md">{children}</div>
    </main>
  );
}
