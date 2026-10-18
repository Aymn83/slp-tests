import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { activityList } from "@/activities";
import { LETTERS, questions } from "@/activities/case-lab/content";

function parseAnswers(json: string): Record<string, number> {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

// نتائج الطلاب + مفتاح التصحيح (وضع المحاضر) — للمدير فقط
export default async function StudentResultsPage() {
  await requireAdmin();
  const { lang, t } = await getDict();
  const attempts = await prisma.activityAttempt.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, username: true, organization: true, role: true } } },
  });
  const studentCount = await prisma.user.count({ where: { role: "student" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{t.studentResults}</h1>
          <p className="muted">
            {t.students}: {studentCount}
          </p>
        </div>
        <Link href="/student" className="btn btn-sm">
          {t.studentArea} ↗
        </Link>
      </div>

      {activityList.map(({ meta, key, discussion }) => {
        const list = attempts.filter((a) => a.activityId === meta.id);
        // نسبة الإجابة الصحيحة لكل سؤال بين المحاولات المكتملة — تكشف الأسئلة الأصعب
        const done = list.filter((a) => a.completedAt);
        const perQuestion = key.map((k, i) =>
          done.length ? Math.round((done.filter((a) => parseAnswers(a.answers)[i] === k.answer).length / done.length) * 100) : null,
        );
        return (
          <section key={meta.id} className="space-y-4">
            <h2 className="h2">{meta.title}</h2>

            <div className="card overflow-x-auto p-0">
              {list.length === 0 ? (
                <p className="muted p-5">{t.noAttempts}</p>
              ) : (
                <table className="table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>{t.fullName}</th>
                      <th>{t.university}</th>
                      <th>{t.score}</th>
                      <th>{t.completedOn}</th>
                      <th>إجابات الأسئلة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => {
                      const ans = parseAnswers(a.answers);
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="font-semibold">{a.user.fullName}</div>
                            <div className="muted text-xs" dir="ltr">
                              @{a.user.username}
                            </div>
                          </td>
                          <td>{a.user.organization ?? "—"}</td>
                          <td className="font-bold">{a.completedAt ? `${a.score}/${a.total}` : "—"}</td>
                          <td>{a.completedAt ? formatDate(lang, a.completedAt) : <span className="badge bg-gray-100 text-gray-600">{t.inProgress}</span>}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {key.map((k, i) => {
                                const v = ans[i];
                                const cls = v === undefined ? "bg-gray-100 text-gray-400" : v === k.answer ? "bg-emerald-600 text-white" : "bg-red-600 text-white";
                                return (
                                  <span key={i} title={`السؤال ${i + 1}: ${v === undefined ? "—" : LETTERS[v]}`} className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${cls}`}>
                                    {i + 1}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <details className="card">
              <summary className="h2 cursor-pointer">{t.answerKey}</summary>
              <ol className="mt-4 space-y-3">
                {key.map((k, i) => (
                  <li key={i} className="rounded-xl border border-line p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>
                        {i + 1}. {LETTERS[k.answer]} — {questions[i].options[k.answer]}
                      </strong>
                      {perQuestion[i] !== null && <span className="badge bg-page text-ink-soft">{perQuestion[i]}% أجابوا صحيحاً</span>}
                    </div>
                    <p className="muted mt-1">{questions[i].text}</p>
                    <p className="mt-1">🎯 {k.objective}</p>
                  </li>
                ))}
              </ol>
              <h3 className="mt-5 font-bold">أسئلة نقاش مقترحة</h3>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                {discussion.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>
          </section>
        );
      })}
    </div>
  );
}
