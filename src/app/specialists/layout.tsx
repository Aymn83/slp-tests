import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { Logo } from "@/components/logo";
import { SpecialistsTabs } from "./tabs";

// دليل الاختصاصيين: صفحات عامة لا تحتاج تسجيل دخول
export default async function SpecialistsLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  const user = await getCurrentUser();
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/specialists" className="flex min-w-0 items-center gap-2">
            <Logo />
            <span className="truncate font-bold text-brand-dark">{t.siteTitle}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LangToggle lang={lang} t={t} />
            <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary btn-sm">
              {user ? t.myDashboard : t.login}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <div>
          <h1 className="h1">{t.specialists}</h1>
          <p className="muted mt-1">{t.specialistsIntro}</p>
        </div>
        <SpecialistsTabs browse={t.browseSpecialists} join={t.joinSpecialist} />
        {children}
      </main>
    </>
  );
}
