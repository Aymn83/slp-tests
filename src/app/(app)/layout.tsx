import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { getDict } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { Logo } from "@/components/logo";
import { UserCard } from "@/components/user-card";
import { prisma } from "@/lib/prisma";
import { NO_INDEX } from "@/lib/seo";
import type { Metadata } from "next";

// صفحات المنصة الداخلية خاصة — لا تظهر في محركات البحث
export const metadata: Metadata = { robots: NO_INDEX };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const [pending, pendingSpecialists] =
    user.role === "admin"
      ? await Promise.all([prisma.user.count({ where: { status: "pending" } }), prisma.specialist.count({ where: { status: "pending" } })])
      : [0, 0];

  const nav = [
    { href: "/dashboard", label: t.dashboard },
    { href: "/cases", label: t.cases },
    { href: "/tests", label: t.tests },
    { href: "/specialists", label: t.specialists },
    ...(user.role === "admin"
      ? [
          { href: "/admin/users", label: t.users, count: pending },
          { href: "/admin/packages", label: t.packages },
          { href: "/admin/specialists", label: t.specialistRequests, count: pendingSpecialists },
          { href: "/admin/students", label: t.studentResults },
        ]
      : []),
  ];

  return (
    <>
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <Logo />
            <span className="truncate font-bold text-brand-dark">{t.siteTitle}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LangToggle lang={lang} t={t} />
            <form action={logoutAction}>
              <button className="btn btn-sm">{t.logout}</button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-brand-soft hover:text-brand-dark"
            >
              {n.label}
              {"count" in n && n.count ? (
                <span className="badge bg-amber-100 text-amber-800">{n.count}</span>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[230px_1fr]">
        <aside className="no-print lg:sticky lg:top-4 lg:self-start">
          <UserCard user={user} t={t} profileHref="/profile" />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}
