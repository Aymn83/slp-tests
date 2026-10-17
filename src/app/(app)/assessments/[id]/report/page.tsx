import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadOwnAssessment, reportNumber } from "@/lib/assessments";
import { formatAge, formatDate, getDict, tx, type Dict, type Lang } from "@/lib/i18n";
import { ResultsTable } from "@/components/results-table";
import type { TestDefinition, TestResult } from "@/tests/types";
import { ShamReportDetails, ShamScoreTable, shamInterpretation } from "@/tests/sham/results";
import { MatrixProfile, MatrixSummary, StatusLegend } from "@/tests/matrix/results";
import { CELLS, LEVELS, REASONS, STATUSES } from "@/tests/matrix/data";
import type { MatrixRecord } from "@/tests/matrix/scoring";
import { ReportToolbar } from "./report-toolbar";

// أشكال التواصل المستخدمة في الخلايا المتقنة والناشئة
function MatrixBehaviors({ r }: { r: MatrixRecord }) {
  const used = CELLS.filter((c) => {
    const s = r.cells[c.id]?.s;
    return s === "mastered" || s === "emerging";
  });
  return (
    <section className="avoid-break mt-5">
      <h2 className="mb-1 text-base font-bold text-brand-dark">الرسائل المستخدمة وأشكال التواصل</h2>
      {used.length === 0 ? (
        <p>—</p>
      ) : (
        <ul className="space-y-0.5">
          {REASONS.map((x) => {
            const list = used.filter((c) => c.reason === x.id);
            if (list.length === 0) return null;
            return (
              <li key={x.id}>
                <b>{x.full}:</b>{" "}
                {list
                  .map((c) => {
                    const cell = r.cells[c.id];
                    const st = STATUSES.find((s) => s.v === cell.s)!.l;
                    return `${c.name} (${LEVELS[c.level - 1].roman}، ${st}${cell.b.length ? `: ${cell.b.join("، ")}` : ""})`;
                  })
                  .join(" · ")}
              </li>
            );
          })}
        </ul>
      )}
      {r.symbols.trim() && (
        <p className="mt-1">
          <b>نوع الرموز المستخدمة:</b> {r.symbols}
        </p>
      )}
    </section>
  );
}

// نتائج الاختبارات العامة: جدول الأقسام + البنود الصعبة + الحقول الإضافية
function GenericResults({
  def,
  result,
  extra,
  lang,
  t,
}: {
  def: TestDefinition;
  result: TestResult;
  extra: Record<string, string>;
  lang: Lang;
  t: Dict;
}) {
  const errorSections = def.sections
    .map((s, i) => ({ s, errors: result.sections[i].errors }))
    .filter((x) => x.errors.length > 0);
  const extras = (def.extraFields ?? []).filter((f) => extra[f.id]?.trim());
  return (
    <>
      <section className="avoid-break mt-5">
        <h2 className="mb-2 text-base font-bold text-brand-dark">{t.testResults}</h2>
        <ResultsTable test={def} result={result} lang={lang} t={t} />
      </section>

      <section className="avoid-break mt-5">
        <h2 className="mb-2 text-base font-bold text-brand-dark">{t.errorsList}</h2>
        {errorSections.length === 0 ? (
          <p>{t.noErrors}</p>
        ) : (
          <ul className="space-y-1">
            {errorSections.map(({ s, errors }) => (
              <li key={s.id}>
                <b>{tx(lang, s.title)}:</b>{" "}
                {errors
                  .map((e) => `${tx(lang, e.item.label)}${e.item.stimulus ? ` (${tx(lang, e.item.stimulus)})` : ""} — ${tx(lang, e.option.label)}`)
                  .join(lang === "en" ? "; " : "، ")}
              </li>
            ))}
          </ul>
        )}
      </section>

      {extras.map((f) => (
        <section key={f.id} className="avoid-break mt-5">
          <h2 className="mb-1 text-base font-bold text-brand-dark">{tx(lang, f.label)}</h2>
          <p className="whitespace-pre-line">{extra[f.id]}</p>
        </section>
      ))}
    </>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const data = await loadOwnAssessment(user.id, (await params).id);
  if (!data) notFound();
  const { a, test } = data;
  const c = a.case;
  const ex = a.examiner;
  const examinerName = (lang === "en" && ex.fullNameEn) || ex.fullName;
  const no = reportNumber(a);
  const testName = tx(lang, test.meta.name);

  const caseRows: [string, string | null][] = [
    [t.caseName, c.fullName],
    [t.birthDate, c.birthDate ? formatDate(lang, c.birthDate) : null],
    [t.ageAtTest, formatAge(t, c.birthDate, a.testDate)],
    [t.gender, c.gender === "male" ? t.male : c.gender === "female" ? t.female : null],
    [t.referralSource, c.referralSource],
    [t.initialDiagnosis, c.initialDiagnosis],
    [t.motherLanguage, c.motherLanguage],
    [t.homeLanguages, c.homeLanguages],
    [t.school, c.school],
    [t.grade, c.grade],
  ];

  return (
    <>
      <ReportToolbar t={t} backHref={`/assessments/${a.id}`} fileName={`${testName} - ${c.fullName} - ${no}`} />

      <article className="report relative mx-auto max-w-[210mm] bg-white p-8 text-[13px] leading-relaxed shadow-sm ring-1 ring-line">
        {a.status !== "final" && (
          <div className="mb-4 rounded border border-dashed border-amber-500 py-1 text-center text-sm font-bold text-amber-700">
            {t.draftWatermark}
          </div>
        )}

        {/* الترويسة: اسم الاختبار ثم اسم الفاحص */}
        <header className="border-b-4 border-brand pb-4 text-center">
          <h1 className="text-2xl font-extrabold text-brand-dark">{testName}</h1>
          <p className="mt-2 text-base font-bold">
            {t.examinerName}: {examinerName}
            {ex.jobTitle && <span className="font-normal text-ink-soft"> — {ex.jobTitle}</span>}
          </p>
          {ex.organization && <p className="text-ink-soft">{ex.organization}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-ink-soft">
            <span>
              {t.reportNo}: <b dir="ltr">{no}</b>
            </span>
            <span>
              {t.testDate}: <b>{formatDate(lang, a.testDate)}</b>
            </span>
            <span>
              {t.printDate}: <b>{formatDate(lang, new Date())}</b>
            </span>
          </div>
        </header>

        <section className="avoid-break mt-5">
          <h2 className="mb-2 text-base font-bold text-brand-dark">{t.caseData}</h2>
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: Math.ceil(caseRows.length / 2) }, (_, r) => (
                <tr key={r}>
                  {caseRows.slice(r * 2, r * 2 + 2).map(([k, v]) => (
                    <FragmentCells key={k} k={k} v={v} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {c.referralReason && (
            <p className="mt-2">
              <b>{t.referralReason}:</b> {c.referralReason}
            </p>
          )}
        </section>

        {data.kind === "sham" ? (
          <>
            <section className="avoid-break mt-5">
              <h2 className="mb-2 text-base font-bold text-brand-dark">{t.testResults}</h2>
              <ShamScoreTable st={data.sham.stats} />
            </section>
            <section className="avoid-break mt-5">
              <h2 className="mb-1 text-base font-bold text-brand-dark">التفسير</h2>
              <ul className="list-disc space-y-1 ps-5">
                {shamInterpretation(data.sham.stats).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </section>
            <section className="mt-5">
              <h2 className="mb-2 text-base font-bold text-brand-dark">تفاصيل الأبعاد</h2>
              <ShamReportDetails r={data.sham.record} st={data.sham.stats} />
            </section>
          </>
        ) : data.kind === "matrix" ? (
          <>
            <section className="avoid-break mt-5">
              <h2 className="mb-2 text-base font-bold text-brand-dark">الاستمارة الشخصية</h2>
              <div className="mb-2">
                <StatusLegend />
              </div>
              <MatrixProfile r={data.matrix.record} />
            </section>
            <section className="avoid-break mt-5">
              <h2 className="mb-2 text-base font-bold text-brand-dark">{t.testResults}</h2>
              <MatrixSummary st={data.matrix.stats} />
            </section>
            <MatrixBehaviors r={data.matrix.record} />
          </>
        ) : (
          <GenericResults def={data.def} result={data.result} extra={data.extra} lang={lang} t={t} />
        )}

        <section className="avoid-break mt-5">
          <h2 className="mb-1 text-base font-bold text-brand-dark">{t.recommendations}</h2>
          <p className="whitespace-pre-line">{a.recommendations || "—"}</p>
        </section>

        {a.notes.trim() && (
          <section className="avoid-break mt-5">
            <h2 className="mb-1 text-base font-bold text-brand-dark">{t.examinerNotes}</h2>
            <p className="whitespace-pre-line">{a.notes}</p>
          </section>
        )}

        <footer className="avoid-break mt-10 grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold">
              {t.examinerName}: {examinerName}
            </p>
            <p className="mt-8 border-t border-ink pt-1 text-center text-xs">{t.signature}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-20 w-32 rounded-lg border border-dashed border-ink-soft" />
            <p className="mt-1 text-xs">{t.stamp}</p>
          </div>
        </footer>

        <p className="mt-8 border-t border-line pt-2 text-center text-[10px] text-ink-soft">{t.siteTitle}</p>
      </article>
    </>
  );
}

function FragmentCells({ k, v }: { k: string; v: string | null }) {
  return (
    <>
      <th className="w-[18%] border border-line bg-page px-2 py-1 text-start font-semibold">{k}</th>
      <td className="w-[32%] border border-line px-2 py-1">{v || "—"}</td>
    </>
  );
}
