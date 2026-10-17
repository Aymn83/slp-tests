"use client";

import { useActionState, useMemo, useState } from "react";
import { saveAssessmentAction } from "@/lib/case-actions";
import type { Dict } from "@/lib/i18n";
import { tx, type Lang } from "@/lib/text";
import { buildRecommendations, scoreTest } from "@/tests/scoring";
import type { TestDefinition } from "@/tests/types";
import { FormMessage, SubmitButton } from "@/components/ui";
import { ResultsTable } from "@/components/results-table";

type Props = {
  t: Dict;
  lang: Lang;
  test: TestDefinition;
  assessment: {
    id: number;
    testDate: string;
    responses: Record<string, string>;
    extra: Record<string, string>;
    recommendations: string;
    notes: string;
  };
};

export function AssessmentForm({ t, lang, test, assessment }: Props) {
  const [state, action] = useActionState(saveAssessmentAction, null);
  const [responses, setResponses] = useState(assessment.responses);
  const [extra, setExtra] = useState(assessment.extra);
  // ما دام الفاحص لم يكتب توصيات بنفسه، تبقى التوصيات متزامنة مع النتائج
  const [recsTouched, setRecsTouched] = useState(assessment.recommendations !== "");
  const [recs, setRecs] = useState(assessment.recommendations);

  const result = useMemo(() => scoreTest(test, responses), [test, responses]);
  const autoRecs = useMemo(() => buildRecommendations(test, result, lang), [test, result, lang]);
  const shownRecs = recsTouched ? recs : autoRecs;

  const setAnswer = (itemId: string, value: string) =>
    setResponses((r) => {
      const next = { ...r };
      if (next[itemId] === value) delete next[itemId];
      else next[itemId] = value;
      return next;
    });

  const fillSection = (sectionId: string) => {
    const s = test.sections.find((x) => x.id === sectionId)!;
    const best = [...test.responseScales[s.scale]].sort((a, b) => b.score - a.score)[0];
    setResponses((r) => {
      const next = { ...r };
      for (const i of s.items) if (!next[i.id]) next[i.id] = best.value;
      return next;
    });
  };

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="id" value={assessment.id} />
      <input type="hidden" name="responses" value={JSON.stringify(responses)} />
      <input type="hidden" name="extra" value={JSON.stringify(extra)} />
      <input type="hidden" name="recommendations" value={shownRecs} />

      <div className="min-w-0 space-y-6">
        <section className="card grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label className="label">{t.testDate}</label>
            <input type="date" name="testDate" className="input" defaultValue={assessment.testDate} />
          </div>
          {test.instructions && (
            <div>
              <div className="label">{t.instructions}</div>
              <p className="text-sm text-ink-soft">{tx(lang, test.instructions)}</p>
            </div>
          )}
        </section>

        {test.sections.map((s) => {
          const scale = test.responseScales[s.scale];
          return (
            <section key={s.id} className="card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="h2">{tx(lang, s.title)}</h2>
                <button type="button" className="btn btn-sm" onClick={() => fillSection(s.id)}>
                  ✓ {tx(lang, [...scale].sort((a, b) => b.score - a.score)[0].label)} …
                </button>
              </div>
              {s.instructions && <p className="muted mb-3">{tx(lang, s.instructions)}</p>}
              <ul className="divide-y divide-line">
                {s.items.map((item, idx) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="w-6 text-sm text-ink-soft">{idx + 1}</span>
                    <div className="min-w-32 flex-1">
                      <div className="font-semibold">{tx(lang, item.label)}</div>
                      {item.stimulus && <div className="text-sm text-ink-soft">{tx(lang, item.stimulus)}</div>}
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={tx(lang, item.label)}>
                      {scale.map((o) => {
                        const on = responses[item.id] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setAnswer(item.id, o.value)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                              on
                                ? o.isError
                                  ? "border-orange-500 bg-orange-500 text-white"
                                  : "border-brand bg-brand text-white"
                                : "border-line bg-white text-ink-soft hover:border-brand"
                            }`}
                          >
                            {tx(lang, o.label)}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {(test.extraFields ?? []).length > 0 && (
          <section className="card space-y-4">
            {test.extraFields!.map((f) => (
              <div key={f.id}>
                <label className="label">{tx(lang, f.label)}</label>
                <textarea
                  rows={f.rows ?? 3}
                  className="input"
                  value={extra[f.id] ?? ""}
                  onChange={(e) => setExtra((x) => ({ ...x, [f.id]: e.target.value }))}
                />
              </div>
            ))}
          </section>
        )}

        <section className="card space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="label" htmlFor="recs">
                {t.recommendations}
              </label>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setRecs(autoRecs);
                  setRecsTouched(false);
                }}
              >
                ↻ {t.regenerate}
              </button>
            </div>
            <p className="muted mb-2">{t.recommendationsHint}</p>
            <textarea
              id="recs"
              rows={6}
              className="input"
              value={shownRecs}
              onChange={(e) => {
                setRecs(e.target.value);
                setRecsTouched(true);
              }}
            />
          </div>
          <div>
            <label className="label">{t.examinerNotes}</label>
            <textarea name="notes" rows={3} className="input" defaultValue={assessment.notes} />
          </div>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="card space-y-3">
          <h2 className="h2">{t.liveResults}</h2>
          <ResultsTable test={test} result={result} lang={lang} t={t} />
          <p className="muted">
            {result.answered} {t.answeredOf} {result.total}
          </p>
        </section>
        <section className="card space-y-3">
          <FormMessage state={state} />
          <SubmitButton className="btn w-full" name="intent" value="draft">
            {t.saveDraft}
          </SubmitButton>
          <SubmitButton className="btn btn-primary w-full" name="intent" value="final">
            {t.finalize}
          </SubmitButton>
        </section>
      </aside>
    </form>
  );
}
