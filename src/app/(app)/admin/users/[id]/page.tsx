import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { UserStatusBadge } from "@/components/status-badge";
import { AccessForm, ResetPasswordForm } from "../../forms";

export default async function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { lang, t } = await getDict();
  const [user, packages] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { _count: { select: { cases: true, assessments: true } } } }),
    prisma.package.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, nameEn: true } }),
  ]);
  if (!user) notFound();

  const info: [string, string | null][] = [
    [t.username, `@${user.username}`],
    [t.fullNameEn, user.fullNameEn],
    [t.jobTitle, user.jobTitle],
    [t.organization, user.organization],
    [t.phone, user.phone],
    [t.email, user.email],
    [t.requestedAt, formatDate(lang, user.createdAt)],
    [t.lastLogin, user.lastLoginAt ? formatDate(lang, user.lastLoginAt) : t.never],
    [t.casesCount, String(user._count.cases)],
    [t.myAssessments, String(user._count.assessments)],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="muted hover:text-brand">
        ← {t.users}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">{user.fullName}</h1>
        <UserStatusBadge user={user} t={t} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-ink-soft">{k}</dt>
                <dd>{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="space-y-6">
          <section className="card">
            <h2 className="h2 mb-3">{t.manageUser}</h2>
            <AccessForm t={t} lang={lang} packages={packages}
              user={{ id: user.id, role: user.role, status: user.status, packageId: user.packageId, expiresAt: user.expiresAt }}
              isSelf={user.id === admin.id} />
          </section>
          <section className="card">
            <h2 className="h2 mb-3">{t.resetPassword}</h2>
            <ResetPasswordForm t={t} userId={user.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
