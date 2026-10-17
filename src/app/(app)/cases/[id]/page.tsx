import Link from "next/link";
import { notFound } from "next/navigation";
import { allowedTestIds, requireUser } from "@/lib/auth";
import { deleteCaseAction, startAssessmentAction } from "@/lib/case-actions";
import { formatAge, formatDate, getDict, tx } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getTest } from "@/tests";
import { ConfirmButton, SubmitButton } from "@/components/ui";
import { AssessmentStatusBadge } from "@/components/status-badge";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { lang, t } = await getDict();
  const c = await prisma.case.findFirst({
    where: { id, ownerId: user.id },
    include: { assessments: { orderBy: { testDate: "desc" } } },
  });
  if (!c) notFound();
  const allowed = allowedTestIds(user).map((x) => getTest(x)!.meta);

  const info: [string, string | null][] = [
    [t.birthDate, c.birthDate ? formatDate(lang, c.birthDate) : null],
    [t.age, formatAge(t, c.birthDate)],
    [t.gender, c.gender === "male" ? t.male : c.gender === "female" ? t.female : null],
    [t.referralSource, c.referralSource],
    [t.referralReason, c.referralReason],
    [t.initialDiagnosis, c.initialDiagnosis],
    [t.motherLanguage, c.motherLanguage],
    [t.homeLanguages, c.homeLanguages],
    [t.school, c.school],
    [t.grade, c.grade],
    [t.notes, c.notes],
  ];

  return (
    <div className="space-y-6">
      <Link href="/cases" className="muted hover:text-brand">
        ← {t.cases}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{c.fullName}</h1>
        <div className="flex gap-2">
          <Link href={`/cases/${c.id}/edit`} className="btn btn-sm">
            {t.edit}
          </Link>
          <form action={deleteCaseAction}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton message={t.deleteCaseConfirm}>{t.delete}</ConfirmButton>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card">
          <h2 className="h2 mb-3">{t.caseInfo}</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-ink-soft">{k}</dt>
                <dd className="whitespace-pre-line">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="h2 mb-3">{t.newAssessment}</h2>
            {allowed.length === 0 ? (
              <p className="muted">{t.noTestsAvailable}</p>
            ) : (
              <form action={startAssessmentAction} className="flex flex-wrap gap-3">
                <input type="hidden" name="caseId" value={c.id} />
                <select name="testId" className="input max-w-xs" aria-label={t.chooseTest}>
                  {allowed.map((x) => (
                    <option key={x.id} value={x.id}>
                      {tx(lang, x.name)}
                    </option>
                  ))}
                </select>
                <SubmitButton>{t.start}</SubmitButton>
              </form>
            )}
          </section>

          <section className="card">
            <h2 className="h2 mb-3">{t.assessments}</h2>
            {c.assessments.length === 0 ? (
              <p className="muted">{t.noAssessments}</p>
            ) : (
              <ul className="divide-y divide-line">
                {c.assessments.map((a) => {
                  const test = getTest(a.testId);
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{test ? tx(lang, test.meta.name) : a.testId}</div>
                        <div className="muted text-xs">{formatDate(lang, a.testDate)}</div>
                      </div>
                      <AssessmentStatusBadge status={a.status} t={t} />
                      <Link href={`/assessments/${a.id}`} className="btn btn-sm">
                        {a.status === "final" ? t.results : t.edit}
                      </Link>
                      <Link href={`/assessments/${a.id}/report`} className="btn btn-sm">
                        {t.report}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
