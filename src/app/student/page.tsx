import Link from "next/link";
import { requireStudentArea } from "@/lib/auth";
import { formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { activityList } from "@/activities";

export default async function StudentHome() {
  const user = await requireStudentArea();
  const { lang, t } = await getDict();
  const attempts = await prisma.activityAttempt.findMany({
    where: { userId: user.id, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { activityId: true, score: true, total: true, completedAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t.activities}</h1>
        <p className="muted mt-1">{t.activitiesIntro}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {activityList.map(({ meta }) => {
          const mine = attempts.filter((a) => a.activityId === meta.id);
          const best = mine.length ? Math.max(...mine.map((a) => a.score ?? 0)) : null;
          const last = mine[0];
          return (
            <section key={meta.id} className="card space-y-3">
              <p className="text-xs font-semibold text-[#9a7000]">{meta.course}</p>
              <h2 className="h2">{meta.title}</h2>
              <p className="text-sm text-ink-soft">
                {meta.headline} — {meta.subtitle}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge bg-page text-ink-soft">{meta.duration}</span>
                {last && (
                  <span className="badge bg-brand-soft text-brand-dark">
                    {t.lastScore}: {last.score}/{last.total} · {formatDate(lang, last.completedAt)}
                  </span>
                )}
                {best !== null && (
                  <span className="badge bg-emerald-100 text-emerald-800">
                    {t.bestScore}: {best}/{meta.total}
                  </span>
                )}
              </div>
              <Link href={`/student/activities/${meta.id}`} className="btn btn-primary">
                {mine.length ? t.retryActivity : t.startActivity}
              </Link>
            </section>
          );
        })}
      </div>
    </div>
  );
}
