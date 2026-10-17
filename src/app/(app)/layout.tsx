import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { getDict } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { Logo } from "@/components/logo";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const pending = user.role === "admin" ? await prisma.user.count({ where: { status: "pending" } }) : 0;

  const nav = [
    { href: "/dashboard", label: t.dashboard },
    { href: "/cases", label: t.cases },
    { href: "/tests", label: t.tests },
    ...(user.role === "admin"
      ? [
          { href: "/admin/users", label: t.users, count: pending },
          { href: "/admin/packages", label: t.packages },
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
            <Link href="/profile" className="hidden text-sm font-semibold text-ink-soft hover:text-brand sm:inline">
              {user.fullName}
            </Link>
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
          <Link
            href="/profile"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-brand-soft sm:hidden"
          >
            {t.profile}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
