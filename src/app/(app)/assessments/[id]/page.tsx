import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadAssessment } from "@/lib/assessments";
import { deleteAssessmentAction, reopenAssessmentAction } from "@/lib/case-actions";
import { formatAge, formatDate, getDict, tx } from "@/lib/i18n";
import { ConfirmButton, SubmitButton } from "@/components/ui";
import { AssessmentStatusBadge } from "@/components/status-badge";
import { ResultsTable } from "@/components/results-table";
import { ShamForm } from "@/tests/sham/form";
import { ShamScoreTable } from "@/tests/sham/results";
import { MatrixForm } from "@/tests/matrix/form";
import { MatrixProfile, MatrixSummary } from "@/tests/matrix/results";
import { AssessmentForm } from "./assessment-form";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const data = await loadAssessment(user, (await params).id);
  if (!data) notFound();
  const { a, test, isOwner } = data;
  const testDate = a.testDate.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Link href={`/cases/${a.caseId}`} className="muted hover:text-brand">
        ← {a.case.fullName}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h1">{tx(lang, test.meta.name)}</h1>
            {test.meta.demo && <span className="badge bg-purple-100 text-purple-800">{t.demoBadge}</span>}
            <AssessmentStatusBadge status={a.status} t={t} />
          </div>
          <p className="muted">
            {a.case.fullName} · {t.ageAtTest}: {formatAge(t, a.case.birthDate, a.testDate)}
            {!isOwner && ` · ${t.examiner}: ${a.examiner.fullName}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/assessments/${a.id}/report`} className="btn btn-sm">
            {t.report}
          </Link>
          {isOwner && (
            <form action={deleteAssessmentAction}>
              <input type="hidden" name="id" value={a.id} />
              <ConfirmButton message={t.deleteAssessmentConfirm}>{t.delete}</ConfirmButton>
            </form>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t.viewOnly}
          {a.status !== "final" && ` ${t.draftByOther}`}
        </p>
      )}

      {a.status === "final" || !isOwner ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="card space-y-4">
            <h2 className="h2">{t.results}</h2>
            <p className="muted">
              {t.testDate}: {formatDate(lang, a.testDate)}
            </p>
            {data.kind === "sham" ? (
              <ShamScoreTable st={data.sham.stats} />
            ) : data.kind === "matrix" ? (
              <>
                <MatrixProfile r={data.matrix.record} />
                <MatrixSummary st={data.matrix.stats} />
              </>
            ) : (
              <ResultsTable test={data.def} result={data.result} lang={lang} t={t} />
            )}
            <div>
              <h3 className="label">{t.recommendations}</h3>
              <p className="whitespace-pre-line text-sm">{a.recommendations || "—"}</p>
            </div>
          </section>
          <section className="card space-y-3 self-start">
            {isOwner && <p className="muted">{t.finalLocked}</p>}
            <Link href={`/assessments/${a.id}/report`} className="btn btn-primary w-full">
              {t.report}
            </Link>
            {isOwner && (
              <form action={reopenAssessmentAction}>
                <input type="hidden" name="id" value={a.id} />
                <SubmitButton className="btn w-full">{t.reopen}</SubmitButton>
              </form>
            )}
          </section>
        </div>
      ) : data.kind === "sham" ? (
        <ShamForm
          t={t}
          assessment={{ id: a.id, testDate, record: data.sham.record, recommendations: a.recommendations, notes: a.notes }}
        />
      ) : data.kind === "matrix" ? (
        <MatrixForm
          t={t}
          assessment={{ id: a.id, testDate, record: data.matrix.record, recommendations: a.recommendations, notes: a.notes }}
        />
      ) : (
        <AssessmentForm
          t={t}
          lang={lang}
          test={data.def}
          assessment={{
            id: a.id,
            testDate,
            responses: data.responses,
            extra: data.extra,
            recommendations: a.recommendations,
            notes: a.notes,
          }}
        />
      )}
    </div>
  );
}
