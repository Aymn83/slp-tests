"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { answerQuestionAction, finishAttemptAction, startAttemptAction } from "@/lib/activity-actions";
import { LETTERS, caseLabMeta, learningNote, questions, stages } from "./content";

type Checked = { selected: number; correct: boolean; answer: number; explanation: string };
type Summary = Extract<Awaited<ReturnType<typeof finishAttemptAction>>, { score: number }>;

const purple = "#4b168f";

export function CaseLab({ studentName }: { studentName: string }) {
  const [phase, setPhase] = useState<"welcome" | "quiz" | "results">("welcome");
  const [attemptId, setAttemptId] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const q = questions[current];
  const stage = stages[q.stage];

  useEffect(() => {
    if (phase === "quiz") titleRef.current?.focus({ preventScroll: true });
  }, [phase, current]);

  // اختيار الإجابة بأرقام لوحة المفاتيح 1–4
  useEffect(() => {
    if (phase !== "quiz" || checked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) setSelected(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, checked]);

  const start = () =>
    startTransition(async () => {
      setError("");
      const r = await startAttemptAction(caseLabMeta.id);
      if ("error" in r) return setError("تعذّر بدء النشاط، حاول مرة أخرى.");
      setAttemptId(r.attemptId);
      setCurrent(0);
      setSelected(null);
      setChecked(null);
      setSummary(null);
      setCopyStatus("");
      setPhase("quiz");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const check = () =>
    selected !== null &&
    startTransition(async () => {
      const r = await answerQuestionAction(attemptId, current, selected);
      if ("error" in r) return setError("تعذّر حفظ الإجابة، حاول مرة أخرى.");
      setError("");
      setSelected(r.selected);
      setChecked(r);
    });

  const next = () =>
    startTransition(async () => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
        setSelected(null);
        setChecked(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const r = await finishAttemptAction(attemptId);
      if ("error" in r) return setError("تعذّر حفظ النتيجة، حاول مرة أخرى.");
      setSummary(r);
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const copy = async () => {
    if (!summary) return;
    const text = `الطالب/ـة: ${studentName}\nنتيجة نشاط تحليل دراسة حالة اضطرابات أصوات الكلام: ${summary.score}/${summary.total}\nالقرار الأقرب للحالة: ${summary.debrief.diagnosis}.\nالحالة افتراضية لأغراض تعليمية.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("تم نسخ ملخص النتيجة.");
    } catch {
      setCopyStatus("تعذر النسخ التلقائي؛ يمكنك تحديد النص من نتيجة الصفحة.");
    }
  };

  const card = "rounded-3xl border border-[#e5ddec] bg-white p-5 shadow-[0_18px_55px_rgba(46,12,93,.08)] sm:p-7";
  const primary = "rounded-2xl bg-[#4b168f] px-6 py-3 font-bold text-white transition hover:bg-[#2e0c5d] disabled:opacity-50";

  return (
    <div className="space-y-6 text-[#241a32]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4b168f] text-xl font-bold text-white" aria-hidden="true">
          ص
        </span>
        <div>
          <p className="text-xs text-[#6e6678]">{caseLabMeta.course}</p>
          <h1 className="text-xl font-extrabold">{caseLabMeta.title}</h1>
        </div>
      </div>

      {error && <p className="rounded-xl bg-[#fff0f1] px-4 py-2 text-sm text-[#a33b48]">{error}</p>}

      {phase === "welcome" && (
        <section className={`${card} grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center`}>
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-[#f1e9fb] px-3 py-1 text-sm font-semibold text-[#4b168f]">{caseLabMeta.subtitle}</span>
            <h2 className="text-3xl font-extrabold leading-snug">
              هل المشكلة <span className="text-[#4b168f]">نطقية</span> أم <span className="text-[#9a7000]">فونولوجية</span>؟
            </h2>
            <p className="text-[#6e6678]">{caseLabMeta.intro}</p>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" className={primary} onClick={start} disabled={pending}>
                ابدأ تحليل الحالة
              </button>
              <span className="text-sm text-[#6e6678]">{caseLabMeta.duration}</span>
            </div>
          </div>
          <aside className="space-y-3 rounded-3xl bg-gradient-to-br from-[#4b168f] to-[#2e0c5d] p-6 text-white" aria-label="بطاقة الحالة">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl font-bold" aria-hidden="true">
                س
              </span>
              <div>
                <span className="text-xs opacity-80">الحالة الافتراضية</span>
                <h3 className="text-xl font-bold">سامر</h3>
                <p className="text-sm opacity-90">5 سنوات و3 أشهر</p>
              </div>
            </div>
            <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm">كل معلومة جديدة قد تغيّر فرضيتك.</p>
          </aside>
        </section>
      )}

      {phase === "quiz" && (
        <section className="space-y-5" aria-labelledby="lab-question">
          <div className={`${card} space-y-3 !py-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#4b168f]">{stage.label}</span>
              <strong>
                السؤال {current + 1} من {questions.length}
              </strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f1e9fb]" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={current + 1} aria-label="تقدم النشاط">
              <span className="block h-full rounded-full bg-[#4b168f] transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <ol className="flex flex-wrap gap-2 text-xs" aria-label="مراحل الحالة">
              {stages.map((s, i) => (
                <li
                  key={s.short}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
                    i === q.stage ? "bg-[#4b168f] text-white" : i < q.stage ? "bg-[#e9f7f2] text-[#15785d]" : "bg-[#f7f4fa] text-[#6e6678]"
                  }`}
                >
                  <span>{i < q.stage ? "✓" : i + 1}</span>
                  {s.short}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
            <aside className={`${card} space-y-4 lg:self-start`} aria-labelledby="lab-evidence">
              <div>
                <span className="text-xs font-semibold text-[#9a7000]">ملف الحالة</span>
                <h2 id="lab-evidence" className="text-xl font-bold">
                  {stage.title}
                </h2>
              </div>
              <div className="space-y-3 leading-loose">{stage.body}</div>
              <div className="rounded-2xl border-s-4 border-[#d9a30e] bg-[#fdf6e3] px-4 py-3 text-sm">
                <span className="font-bold text-[#9a7000]">تذكّر: </span>
                {stage.hint}
              </div>
            </aside>

            <article className={`${card} space-y-4`}>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-[#f1e9fb]" style={{ WebkitTextStroke: `1px ${purple}` }}>
                  {String(current + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-semibold text-[#9a7000]">{q.kicker}</p>
              </div>
              <h2 id="lab-question" ref={titleRef} tabIndex={-1} className="text-lg font-bold leading-relaxed outline-none">
                {q.text}
              </h2>
              <div className="space-y-2" role="radiogroup" aria-labelledby="lab-question">
                {q.options.map((opt, i) => {
                  const isSel = selected === i;
                  const isAnswer = checked && checked.answer === i;
                  const isWrong = checked && isSel && !checked.correct;
                  const tone = isAnswer
                    ? "border-[#15785d] bg-[#e9f7f2]"
                    : isWrong
                      ? "border-[#a33b48] bg-[#fff0f1]"
                      : isSel
                        ? "border-[#4b168f] bg-[#f1e9fb]"
                        : "border-[#e5ddec] bg-white hover:border-[#4b168f]";
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      disabled={!!checked || pending}
                      onClick={() => setSelected(i)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-start transition ${tone}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isAnswer ? "bg-[#15785d] text-white" : isWrong ? "bg-[#a33b48] text-white" : isSel ? "bg-[#4b168f] text-white" : "bg-[#f7f4fa] text-[#6e6678]"
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {checked && (
                <div
                  aria-live="polite"
                  className={`flex gap-3 rounded-2xl px-4 py-3 ${checked.correct ? "bg-[#e9f7f2] text-[#0f5a45]" : "bg-[#fff0f1] text-[#7d2833]"}`}
                >
                  <span className="text-xl font-bold" aria-hidden="true">
                    {checked.correct ? "✓" : "!"}
                  </span>
                  <div>
                    <strong>{checked.correct ? "تحليل صحيح" : `الأقرب هو: ${LETTERS[checked.answer]}`}</strong>
                    <p className="mt-1 text-sm leading-relaxed">{checked.explanation}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {checked ? (
                  <button type="button" className={primary} onClick={next} disabled={pending} autoFocus>
                    {current === questions.length - 1 ? "عرض النتيجة" : "السؤال التالي"}
                  </button>
                ) : (
                  <button type="button" className={primary} onClick={check} disabled={selected === null || pending}>
                    ثبّت الإجابة
                  </button>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {phase === "results" && summary && (
        <section className="space-y-5" aria-labelledby="lab-results">
          <div className={`${card} flex flex-wrap items-center gap-6`}>
            <div
              className="flex h-32 w-32 flex-col items-center justify-center rounded-full text-[#4b168f]"
              style={{ background: `conic-gradient(${purple} ${(summary.score / summary.total) * 360}deg, #f1e9fb 0)` }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-extrabold">{summary.score}</span>
                <small className="text-xs text-[#6e6678]">من {summary.total}</small>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-block rounded-full bg-[#e9f7f2] px-3 py-1 text-sm font-semibold text-[#15785d]">اكتمل تحليل الحالة</span>
              <h2 id="lab-results" className="text-2xl font-extrabold">
                نتيجتك التشخيصية
              </h2>
              <p className="text-[#6e6678]">{summary.message}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#4b168f] to-[#2e0c5d] p-6 text-white">
            <span className="text-sm opacity-80">القرار الأقرب وفق المعطيات</span>
            <strong className="mt-1 block text-xl">{summary.debrief.diagnosis}</strong>
            <p className="mt-2 text-sm opacity-90">{summary.debrief.rationale}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className={`${card} space-y-3`}>
              <h3 className="font-bold">خريطة الاستدلال</h3>
              <ul className="space-y-3">
                {summary.debrief.reasoning.map((r, i) => (
                  <li key={r.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1e9fb] text-sm font-bold text-[#4b168f]">{i + 1}</span>
                    <div>
                      <strong>{r.title}</strong>
                      <p className="text-sm text-[#6e6678]">{r.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
            <article className={`${card} space-y-4`}>
              <h3 className="font-bold">مراجعة أدائك</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-[#e9f7f2] p-3">
                  <strong className="block text-2xl text-[#15785d]">{summary.score}</strong>
                  <span className="text-sm">إجابات صحيحة</span>
                </div>
                <div className="rounded-2xl bg-[#fff0f1] p-3">
                  <strong className="block text-2xl text-[#a33b48]">{summary.total - summary.score}</strong>
                  <span className="text-sm">تحتاج مراجعة</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.review.map((ok, i) => (
                  <span
                    key={i}
                    title={`السؤال ${i + 1}: ${ok ? "صحيح" : "يحتاج مراجعة"}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${ok ? "bg-[#15785d] text-white" : "bg-[#a33b48] text-white"}`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={primary} onClick={copy}>
              نسخ ملخص النتيجة
            </button>
            <button type="button" className="rounded-2xl border-2 border-[#4b168f] px-6 py-3 font-bold text-[#4b168f] hover:bg-[#f1e9fb]" onClick={start} disabled={pending}>
              إعادة النشاط
            </button>
            <span className="text-sm text-[#6e6678]" aria-live="polite">
              {copyStatus}
            </span>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#e5ddec] bg-white/70 px-5 py-4 text-sm">
        <strong>تنبيه تعليمي</strong>
        <p className="mt-1 text-[#6e6678]">{learningNote}</p>
      </section>
      <p className="text-center text-xs text-[#6e6678]">
        نشاط تدريبي · الاضطرابات النطقية والفونولوجية ·{" "}
        <a href="https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/" target="_blank" rel="noreferrer" className="underline">
          مرجع إضافي: ASHA
        </a>
      </p>
    </div>
  );
}
