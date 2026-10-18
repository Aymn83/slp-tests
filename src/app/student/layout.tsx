import Link from "next/link";
import type { Metadata } from "next";
import { requireStudentArea } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { getDict } from "@/lib/i18n";
import { NO_INDEX } from "@/lib/seo";
import { LangToggle } from "@/components/lang-toggle";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { robots: NO_INDEX };

// منطقة الطالب: الأنشطة التدريبية فقط
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudentArea();
  const { lang, t } = await getDict();
  return (
    <>
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/student" className="flex min-w-0 items-center gap-2">
            <Logo />
            <span className="truncate font-bold text-brand-dark">{t.siteTitle}</span>
          </Link>
          <span className="badge bg-amber-100 text-amber-800">{t.studentArea}</span>
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-ink-soft sm:inline">{user.fullName}</span>
            {user.role === "admin" && (
              <Link href="/admin/students" className="btn btn-sm">
                {t.studentResults}
              </Link>
            )}
            <LangToggle lang={lang} t={t} />
            <form action={logoutAction}>
              <button className="btn btn-sm">{t.logout}</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
