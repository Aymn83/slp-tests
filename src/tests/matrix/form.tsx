"use client";

import { useActionState, useMemo, useState } from "react";
import { saveAssessmentAction } from "@/lib/case-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";
import { LEVELS, MESSAGES, REASONS, STATUSES, behaviorsFor, cellId, type ReasonId } from "./data";
import { matrixRecommendations, matrixStats, type CellStatus, type MatrixRecord } from "./scoring";
import { MatrixProfile, MatrixSummary, StatusLegend } from "./results";

type Props = {
  t: Dict;
  assessment: { id: number; testDate: string; record: MatrixRecord; recommendations: string; notes: string };
};

type Tab = ReasonId | "sum";

export function MatrixForm({ t, assessment }: Props) {
  const [state, action] = useActionState(saveAssessmentAction, null);
  const [r, setR] = useState(assessment.record);
  const [tab, setTab] = useState<Tab>("refuse");
  const [notes, setNotes] = useState(assessment.notes);
  const [testDate, setTestDate] = useState(assessment.testDate);
  // تبقى التوصيات متزامنة مع النتائج ما لم يعدّلها الفاحص بنفسه
  const [recsTouched, setRecsTouched] = useState(assessment.recommendations !== "");
  const [recs, setRecs] = useState(assessment.recommendations);

  const st = useMemo(() => matrixStats(r), [r]);
  const autoRecs = useMemo(() => matrixRecommendations(st), [st]);
  const shownRecs = recsTouched ? recs : autoRecs;

  const mut = (fn: (d: MatrixRecord) => void) =>
    setR((p) => {
      const n = structuredClone(p);
      fn(n);
      return n;
    });
  const setStatus = (id: string, s: CellStatus) =>
    mut((d) => {
      const c = d.cells[id];
      c.s = c.s === s ? null : s;
      if (c.s === null || c.s === "none") c.b = [];
    });
  const toggleBehavior = (id: string, b: string) =>
    mut((d) => {
      const c = d.cells[id];
      c.b = c.b.includes(b) ? c.b.filter((x) => x !== b) : [...c.b, b];
    });
  const surpassBelow = (reason: ReasonId, n: number, levels: number[]) =>
    mut((d) => {
      const top = Math.max(0, ...levels.filter((l) => {
        const s = d.cells[cellId(reason, n, l)].s;
        return s === "mastered" || s === "emerging";
      }));
      for (const l of levels) if (l < top && d.cells[cellId(reason, n, l)].s === null) d.cells[cellId(reason, n, l)].s = "surpassed";
    });

  const reasonDone = (id: ReasonId) => {
    const cells = MESSAGES.filter((m) => m.reason === id).flatMap((m) => m.levels.map((l) => r.cells[cellId(m.reason, m.n, l)].s));
    return `${cells.filter((s) => s !== null).length}/${cells.length}`;
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={assessment.id} />
      <input type="hidden" name="responses" value={JSON.stringify(r)} />
      <input type="hidden" name="extra" value="{}" />
      <input type="hidden" name="recommendations" value={shownRecs} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="testDate" value={testDate} />

      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-brand px-3 py-1 text-white">
            <span className="text-xs">الدرجة</span> <b className="text-lg" dir="ltr">{st.points}</b>
            <span className="text-xs"> / {st.maxPoints} · {st.done}/{st.total} خلية</span>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <FormMessage state={state} />
            <SubmitButton className="btn btn-sm" name="intent" value="draft">
              {t.saveDraft}
            </SubmitButton>
            <SubmitButton className="btn btn-primary btn-sm" name="intent" value="final">
              {t.finalize}
            </SubmitButton>
          </div>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto pb-1" aria-label="أقسام المصفوفة">
          {[...REASONS.map((x) => ({ id: x.id as Tab, l: x.full, c: reasonDone(x.id) })), { id: "sum" as Tab, l: "الاستمارة الشخصية والنتيجة", c: "" }].map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setTab(x.id);
                window.scrollTo({ top: 0 });
              }}
              aria-current={tab === x.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold ${
                tab === x.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:border-brand"
              }`}
            >
              {x.l}
              {x.c && <span className="badge bg-page text-ink-soft">{x.c}</span>}
            </button>
          ))}
        </nav>
      </div>

      {tab === "refuse" && (
        <section className="card space-y-3 text-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <label className="label">{t.testDate}</label>
              <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>
            <StatusLegend />
          </div>
          <ul className="list-disc space-y-1 ps-5 text-ink-soft">
            <li>اطرح أسئلة كل رسالة من دليل الاختبار، وابدأ بالرفض ثم الحصول ثم الاجتماعي ثم المعلومات.</li>
            <li>«متقن»: يستخدم الطفل السلوك باستقلالية وبشكل متسق في أغلب الفرص المناسبة. «ناشئ»: يظهر أحياناً أو بمساعدة.</li>
            <li>«تم تجاوزه»: مستوى أدنى لم يعد الطفل يستخدمه لأنه استبدله بمهارة أعلى.</li>
            <li>حدّد أشكال السلوك التي يستخدمها الطفل لكل خلية (اختياري) لتظهر في التقرير.</li>
          </ul>
        </section>
      )}

      {tab !== "sum" &&
        MESSAGES.filter((m) => m.reason === tab).map((m) => (
          <section key={`${m.reason}-${m.n}`} className="card">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">
                ({m.n}) {m.name}
              </h3>
              {m.levels.length > 1 && (
                <button type="button" className="btn btn-sm" onClick={() => surpassBelow(m.reason, m.n, m.levels)}>
                  المستويات الأدنى غير المقيّمة = «تم تجاوزه»
                </button>
              )}
            </div>
            <ul className="divide-y divide-line">
              {m.levels.map((level) => {
                const id = cellId(m.reason, m.n, level);
                const cell = r.cells[id];
                const info = LEVELS[level - 1];
                return (
                  <li key={id} className="py-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-40 flex-1">
                        <span className="font-semibold">
                          {info.roman}. {info.name}
                        </span>{" "}
                        <span className="muted text-xs">{info.age}</span>
                      </div>
                      <div className="flex flex-wrap gap-1" role="group" aria-label={`${m.name} — المستوى ${info.roman}`}>
                        {STATUSES.map((s) => {
                          const on = cell.s === s.v;
                          return (
                            <button
                              key={s.v}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setStatus(id, s.v)}
                              className="rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition"
                              style={on ? { backgroundColor: s.color, color: s.ink, borderColor: s.color } : { borderColor: "var(--color-line)", color: "var(--color-ink-soft)" }}
                            >
                              {s.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {(cell.s === "mastered" || cell.s === "emerging") && (
                      <div className="mt-2 flex flex-wrap gap-1.5 ps-1">
                        {behaviorsFor(level).map((b) => {
                          const on = cell.b.includes(b);
                          return (
                            <button
                              key={b}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleBehavior(id, b)}
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft"}`}
                            >
                              {on ? "✓ " : ""}
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {tab === "sum" && (
        <div className="space-y-4">
          <section className="card space-y-3">
            <h2 className="h2">الاستمارة الشخصية</h2>
            <StatusLegend />
            <MatrixProfile r={r} />
          </section>
          <section className="card space-y-3">
            <h2 className="h2">{t.results}</h2>
            <MatrixSummary st={st} />
          </section>
          <section className="card space-y-4">
            <div>
              <label className="label">نوع الرموز المستخدمة (للمستويات V–VII)</label>
              <input
                className="input"
                value={r.symbols}
                placeholder="مثال: صور رمزية، مجسمات، إشارات يدوية، كلمات منطوقة…"
                onChange={(e) => mut((d) => void (d.symbols = e.target.value))}
              />
            </div>
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
              <label className="label" htmlFor="notes">
                {t.examinerNotes}
              </label>
              <textarea id="notes" rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </section>
        </div>
      )}
    </form>
  );
}
