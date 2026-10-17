import Link from "next/link";
import { allowedTestIds, requireUser } from "@/lib/auth";
import { formatDate, getDict, tx } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getTest } from "@/tests";
import { AssessmentStatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const [cases, assessments, recent, pending] = await Promise.all([
    prisma.case.count({ where: { ownerId: user.id } }),
    prisma.assessment.count({ where: { examinerId: user.id } }),
    prisma.assessment.findMany({
      where: { examinerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { case: { select: { fullName: true } } },
    }),
    user.role === "admin" ? prisma.user.count({ where: { status: "pending" } }) : Promise.resolve(0),
  ]);
  const tests = allowedTestIds(user).length;

  const stats = [
    { label: t.myCases, value: cases, href: "/cases" },
    { label: t.myAssessments, value: assessments, href: "/cases" },
    { label: t.availableTests, value: tests, href: "/tests" },
    ...(user.role === "admin" ? [{ label: t.pendingUsers, value: pending, href: "/admin/users" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">
            {t.welcome}
            {lang === "en" ? ", " : "، "}
            {user.fullName}
          </h1>
          <p className="muted">{t.privacyNote}</p>
        </div>
        <Link href="/cases/new" className="btn btn-primary">
          + {t.newCase}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card transition hover:border-brand">
            <div className="text-3xl font-extrabold text-brand-dark">{s.value}</div>
            <div className="muted mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2 className="h2 mb-3">{t.recentAssessments}</h2>
        {recent.length === 0 ? (
          <p className="muted">{t.noCases}</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => {
              const test = getTest(a.testId);
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{a.case.fullName}</div>
                    <div className="muted text-xs">
                      {test ? tx(lang, test.meta.name) : a.testId} · {formatDate(lang, a.testDate)}
                    </div>
                  </div>
                  <AssessmentStatusBadge status={a.status} t={t} />
                  <Link href={`/assessments/${a.id}`} className="btn btn-sm">
                    {t.open}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
