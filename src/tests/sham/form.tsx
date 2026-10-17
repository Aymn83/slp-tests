"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveAssessmentAction } from "@/lib/case-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";
import { SHAM, SHAM_CARDS } from "./data";
import {
  GROP_TYPES,
  fmt1,
  gropClass,
  gropEff,
  nwrEff,
  shamStats,
  type ShamRecord,
  type StressScore,
  type YN,
} from "./scoring";
import { ShamScoreTable, shamInterpretation } from "./results";

type Props = {
  t: Dict;
  assessment: { id: number; testDate: string; record: ShamRecord; recommendations: string; notes: string };
};

const TABS = [
  { id: "ov", n: "ب", l: "نظرة عامة" },
  { id: "d1", n: "1", l: "الفحص التأسيسي", dim: 0 },
  { id: "d2", n: "2", l: "عدم الاتساق", dim: 1 },
  { id: "d3", n: "3", l: "الحركات الصائتة", dim: 2 },
  { id: "d4", n: "4", l: "DDK والنبر والتنغيم", dim: 3 },
  { id: "d5", n: "5", l: "السمات الداعمة", dim: 4 },
  { id: "sum", n: "Σ", l: "النتيجة والتوصيات" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const EX = [
  ["spont", "تلقائي عفوي"],
  ["imit", "تقليد بعد نموذج"],
  ["guided", "استثارة موجَّهة"],
];
const TYPE_LABELS: Record<string, string> = { prolong: "إطالة الأصوات", partial: "تكرارات جزئية", silent: "وضعية فموية صامتة", other: "أخرى" };

// ===== عناصر صغيرة =====
type Opt<T> = { v: T; l: string; tone?: "yes" | "no" };
function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
  auto,
  disabled,
}: {
  value: T | null;
  options: Opt<T>[];
  onChange: (v: T | null) => void;
  label: string;
  auto?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value === o.v;
        const tone = on
          ? o.tone === "yes"
            ? "border-red-600 bg-red-600 text-white"
            : o.tone === "no"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : auto
                ? "border-brand bg-brand-soft text-brand-dark border-dashed"
                : "border-brand bg-brand text-white"
          : "border-line bg-white text-ink-soft hover:border-brand";
        return (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on && !auto ? null : o.v)}
            className={`min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-bold transition disabled:opacity-40 ${tone}`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

const S02: Opt<number>[] = [0, 1, 2].map((v) => ({ v, l: String(v) }));
const S03: Opt<number>[] = [0, 1, 2, 3].map((v) => ({ v, l: String(v) }));
const S15: Opt<number>[] = [1, 2, 3, 4, 5].map((v) => ({ v, l: String(v) }));
const S02NE: Opt<StressScore & (number | string)>[] = [...S02, { v: "NE", l: "NE" }];
const SYN: Opt<"y" | "n">[] = [
  { v: "n", l: "لا", tone: "no" },
  { v: "y", l: "نعم", tone: "yes" },
];

function Txt({ value, onChange, placeholder, ipa }: { value: string; onChange: (v: string) => void; placeholder: string; ipa?: boolean }) {
  return (
    <input
      className={`input py-1.5 ${ipa ? "font-mono" : ""}`}
      dir={ipa ? "ltr" : undefined}
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      spellCheck={!ipa}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Sel({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: string[][]; placeholder: string; disabled?: boolean }) {
  return (
    <select className="input py-1.5" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-label={placeholder}>
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function Row({ n, children, controls, fields, muted }: { n: string | number; children: React.ReactNode; controls: React.ReactNode; fields?: React.ReactNode; muted?: boolean }) {
  return (
    <li className={`py-3 ${muted ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-6 text-sm font-bold text-ink-soft">{n}</span>
        <div className="min-w-40 flex-1">{children}</div>
        <div className="flex flex-wrap items-center gap-2">{controls}</div>
      </div>
      {fields && <div className="mt-2 grid gap-2 ps-9 sm:grid-cols-3">{fields}</div>}
    </li>
  );
}

const Chip = ({ children, ltr }: { children: React.ReactNode; ltr?: boolean }) => (
  <span className="badge me-1 bg-page text-ink-soft" dir={ltr ? "ltr" : undefined}>
    {children}
  </span>
);
const Ul = ({ items }: { items: readonly string[] }) => (
  <ul className="list-disc space-y-1 ps-5 text-sm">
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);
const Key = ({ text }: { text: string }) => (
  <div className="rounded-lg border-s-4 border-brand bg-brand-soft px-3 py-2 text-sm">
    <b>مفتاح التسجيل:</b> {text}
  </div>
);
function How({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="rounded-xl border border-line bg-white p-3" open={open}>
      <summary className="cursor-pointer font-semibold text-brand-dark">{title}</summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}
function DimHead({ n, title, goal }: { n: number; title: string; goal: string }) {
  return (
    <section className="card flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{n}</span>
      <div>
        <h2 className="h2">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft">{goal}</p>
      </div>
    </section>
  );
}
function List({ title, sub, children, footer }: { title: string; sub?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        {sub && <span className="muted">{sub}</span>}
      </div>
      <ul className="divide-y divide-line">{children}</ul>
      {footer && <div className="mt-2 text-sm text-ink-soft">{footer}</div>}
    </section>
  );
}

function TimerBtn({ sec, onStart }: { sec: number | string; onStart: (sec: number) => void }) {
  return (
    <button type="button" className="btn btn-sm" onClick={() => onStart(Number(sec))}>
      ⏱ {sec} ث
    </button>
  );
}

// ===== المؤقت =====
function useTimer() {
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const ctx = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (end === null) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= end) {
        clearInterval(id);
        try {
          const a = ctx.current!;
          const o = a.createOscillator();
          const g = a.createGain();
          o.frequency.value = 880;
          g.gain.value = 0.15;
          o.connect(g);
          g.connect(a.destination);
          o.start();
          o.stop(a.currentTime + 0.35);
        } catch {}
        setTimeout(() => setEnd(null), 3000);
      }
    }, 200);
    return () => clearInterval(id);
  }, [end]);
  const start = (sec: number) => {
    try {
      ctx.current = ctx.current ?? new AudioContext();
      void ctx.current.resume();
    } catch {}
    setNow(Date.now());
    setEnd(Date.now() + sec * 1000);
  };
  const left = end === null ? null : Math.max(0, Math.ceil((end - now) / 1000));
  return { left, start, stop: () => setEnd(null) };
}

// ===== النموذج =====
export function ShamForm({ t, assessment }: Props) {
  const [state, action] = useActionState(saveAssessmentAction, null);
  const [r, setR] = useState(assessment.record);
  const [tab, setTab] = useState<TabId>("ov");
  const [recs, setRecs] = useState(assessment.recommendations);
  const [notes, setNotes] = useState(assessment.notes);
  const [testDate, setTestDate] = useState(assessment.testDate);
  const [card, setCard] = useState<number | null>(null);
  const timer = useTimer();
  const st = useMemo(() => shamStats(r), [r]);
  const mut = (fn: (d: ShamRecord) => void) =>
    setR((p) => {
      const n = structuredClone(p);
      fn(n);
      return n;
    });
  const go = (id: TabId) => {
    setTab(id);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (card === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCard(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card]);

  const tabIdx = TABS.findIndex((x) => x.id === tab);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={assessment.id} />
      <input type="hidden" name="responses" value={JSON.stringify(r)} />
      <input type="hidden" name="extra" value="{}" />
      <input type="hidden" name="recommendations" value={recs} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="testDate" value={testDate} />

      {/* الشريط الثابت: المجموع الحي + الأقسام + الحفظ */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-brand px-3 py-1 text-white">
            <span className="text-xs">الدرجة الكلية</span> <b className="text-lg" dir="ltr">{fmt1(st.tot)}</b>
            <span className="text-xs"> / 100 {!st.complete && `· ${st.doneDims}/5 أبعاد`}</span>
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
        <nav className="mt-2 flex gap-1 overflow-x-auto pb-1" aria-label="أقسام البطارية">
          {TABS.map((x) => {
            const d = "dim" in x ? st.dims[x.dim] : null;
            const done = d && d.done === d.total;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => go(x.id)}
                aria-current={tab === x.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold ${
                  tab === x.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:border-brand"
                }`}
              >
                <span className="text-xs">{x.n}</span>
                {x.l}
                {d && (
                  <span className={`badge ${done ? "bg-emerald-100 text-emerald-800" : "bg-page text-ink-soft"}`}>
                    {done ? "✓" : `${d.done}/${d.total}`}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === "ov" && (
        <div className="space-y-4">
          <section className="card space-y-3">
            <h2 className="h2">بطارية الشام التشخيصية</h2>
            <p className="muted">Al-Sham Diagnostic Assessment Battery for Childhood Apraxia of Speech</p>
            <p className="text-sm">{SHAM.intro[0]}</p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{SHAM.intro[1]}</p>
            <div className="max-w-48">
              <label className="label">{t.testDate}</label>
              <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>
          </section>
          <section className="card space-y-2">
            <h3 className="font-bold">أبعاد البطارية الخمسة (بترتيب التطبيق الموصى به)</h3>
            <ol className="list-decimal space-y-1 ps-5 text-sm">
              {SHAM.dimlist.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
            <p className="muted">{SHAM.order}</p>
          </section>
          <section className="card space-y-2">
            <h3 className="font-bold">الفئة العمرية والزمن المتوقع</h3>
            <p className="text-sm">{SHAM.age}</p>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {SHAM.time.map((x, i) => (
                  <tr key={i}>
                    <td className="border border-line px-2 py-1">{x[0]}</td>
                    <td className="border border-line px-2 py-1">{x[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <How title="حقيبة أدوات الفحص">
            <Ul items={SHAM.kit} />
          </How>
          <How title="تعليمات عامة تسري على جميع الأبعاد">
            <Ul items={SHAM.general} />
          </How>
        </div>
      )}

      {tab === "d1" && (
        <div className="space-y-4">
          <DimHead n={1} title="الفحص التأسيسي (الفحص الفموي لغير الكلام)" goal={SHAM.d1.goal} />
          <How title="تعليمات التطبيق" open>
            <Ul items={SHAM.d1.instr} />
          </How>
          <Key text={SHAM.d1.key} />
          {(["lips", "tongue"] as const).map((part) => (
            <List
              key={part}
              title={part === "lips" ? "أولاً: تقييم الشفاه" : "ثانياً: تقييم اللسان"}
              sub="الدرجة 0–2"
              footer={
                <>
                  المجموع الجزئي: <b>{part === "lips" ? st.d1.lips : st.d1.tongue}</b> / 18
                  {part === "tongue" && <p className="mt-1">{SHAM.d1.note}</p>}
                </>
              }
            >
              {SHAM.d1[part].map((row, i) => (
                <Row
                  key={i}
                  n={row[0]}
                  controls={
                    <>
                      {/10 ثوانٍ/.test(row[1]) && <TimerBtn sec={10} onStart={timer.start} />}
                      <Seg value={r.d1[part][i]} options={S02} label={`${row[1]}`} onChange={(v) => mut((d) => void (d.d1[part][i] = v))} />
                    </>
                  }
                >
                  <div className="font-semibold">{row[1]}</div>
                  <Chip>{row[2]}</Chip>
                </Row>
              ))}
            </List>
          ))}
        </div>
      )}

      {tab === "d2" && (
        <div className="space-y-4">
          <DimHead n={2} title="عدم الاتساق الصوتي (Inconsistency)" goal={SHAM.d2.goal} />
          <How title="تعليمات التطبيق" open>
            <Ul items={SHAM.d2.instr} />
          </How>
          <List
            title="ورقة التسجيل (15 كلمة) — اضغط الصورة لعرضها للطفل"
            sub={`كلمات متباينة: ${st.d2.yes} / 15 · المؤشر ${fmt1(st.d2.index)}%`}
          >
            {SHAM.d2.words.map((w, i) => (
              <Row
                key={i}
                n={i + 1}
                controls={
                  <>
                    <span className="muted">تباين؟</span>
                    <Seg<"y" | "n"> value={r.d2.rows[i].v} options={SYN} label={`تباين الكلمة ${i + 1}`} onChange={(v) => mut((d) => void (d.d2.rows[i].v = v as YN))} />
                  </>
                }
                fields={(["t1", "t2", "t3"] as const).map((k, j) => (
                  <Txt key={k} ipa value={r.d2.rows[i][k]} placeholder={`محاولة ${j + 1} (IPA)`} onChange={(v) => mut((d) => void (d.d2.rows[i][k] = v))} />
                ))}
              >
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setCard(i)} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white" aria-label={`عرض بطاقة ${w.word}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={SHAM_CARDS[i].src} alt="" className="h-full w-full object-contain" />
                  </button>
                  <div>
                    <div className="text-lg font-bold">{w.word}</div>
                    <Chip>المستوى {w.level}</Chip>
                  </div>
                </div>
              </Row>
            ))}
          </List>
          <section className="card space-y-2 text-sm">
            <h3 className="font-bold">احتساب المؤشر والتفسير</h3>
            <p>{SHAM.d2.formula}</p>
            {st.d2.done === 15 ? (
              <p className={`rounded-lg px-3 py-2 ${st.d2.index < 40 ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
                {st.d2.index < 40 ? SHAM.d2.cut[0] : SHAM.d2.cut[1]}
              </p>
            ) : (
              <p className="muted">يظهر التفسير بعد تحديد «نعم/لا» لكل الكلمات الخمس عشرة.</p>
            )}
            <p className="muted">{SHAM.d2.note}</p>
          </section>
        </div>
      )}

      {tab === "d3" && (
        <div className="space-y-4">
          <DimHead n={3} title="دقة الحركات الصائتة وتشويهها" goal={SHAM.d3.goal} />
          <How title="تعليمات التطبيق" open>
            <Ul items={SHAM.d3.instr} />
            <p className="muted">{SHAM.d3.rel}</p>
          </How>
          <How title="سلّم تقدير دقة الحركة (MACS، خماسي المستويات)" open>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {SHAM.d3.macs.map((x) => (
                  <tr key={x[0]}>
                    <td className="border border-line px-2 py-1 text-center font-bold">{x[0]}</td>
                    <td className="border border-line px-2 py-1 font-semibold">{x[1]}</td>
                    <td className="border border-line px-2 py-1">{x[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Ul items={SHAM.d3.subst} />
          </How>
          <How title="أزواج الكلمات (14 زوجاً) ووصف الصور المقترح">
            <p className="muted">{SHAM.d3.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <tbody>
                  {SHAM.d3.pairs.map((x) => (
                    <tr key={x[0]}>
                      <td className="border border-line px-2 py-1">{x[0]}</td>
                      <td className="border border-line px-2 py-1 font-bold">{x[1]}</td>
                      <td className="border border-line px-2 py-1" dir="ltr">{x[2]}</td>
                      <td className="border border-line px-2 py-1">{x[3]}</td>
                      <td className="border border-line px-2 py-1 font-bold">{x[4]}</td>
                      <td className="border border-line px-2 py-1" dir="ltr">{x[5]}</td>
                      <td className="border border-line px-2 py-1">{x[6]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </How>
          <List title="ورقة التسجيل (28 كلمة)" sub={`الدرجة 1–5 · المجموع ${st.d3.raw} / 140`}>
            {SHAM.d3.rows.map((row, i) => (
              <Row
                key={i}
                n={row[0]}
                controls={<Seg value={r.d3.rows[i].score} options={S15} label={`تقييم الكلمة ${row[0]}`} onChange={(v) => mut((d) => void (d.d3.rows[i].score = v))} />}
                fields={
                  <>
                    <Txt ipa value={r.d3.rows[i].prod} placeholder="الإنتاج المسجَّل" onChange={(v) => mut((d) => void (d.d3.rows[i].prod = v))} />
                    <Txt value={r.d3.rows[i].note} placeholder="تلقائي / مقلَّد / ملاحظات" onChange={(v) => mut((d) => void (d.d3.rows[i].note = v))} />
                  </>
                }
              >
                <span className="text-lg font-bold">{row[1]}</span> <Chip ltr>{row[2]}</Chip>
              </Row>
            ))}
          </List>
        </div>
      )}

      {tab === "d4" && (
        <div className="space-y-4">
          <DimHead n={4} title="الانتقالات الحركية (DDK) والنبر والتنغيم" goal={SHAM.d4.goal} />
          <How title="تعليمات DDK">
            <Ul items={SHAM.d4.ddkInstr} />
            <p className="muted">{SHAM.d4.ddkNote}</p>
          </How>
          <Key text={SHAM.d4.ddkKey} />
          <List title="أ) الانتقالات الحركية (DDK)" sub="الدرجة 0–2" footer={<>المجموع الجزئي: <b>{st.d4.ddk}</b> / 10</>}>
            {SHAM.d4.ddk.map((row, i) => (
              <Row
                key={i}
                n={row[0]}
                controls={
                  <>
                    <TimerBtn sec={(row[3].match(/\d+/) ?? ["5"])[0]} onStart={timer.start} />
                    <Seg value={r.d4.ddk[i].score} options={S02} label={`درجة بند DDK ${row[0]}`} onChange={(v) => mut((d) => void (d.d4.ddk[i].score = v))} />
                  </>
                }
                fields={
                  <>
                    <Txt value={r.d4.ddk[i].ok} placeholder="تكرارات صحيحة (اختياري)" onChange={(v) => mut((d) => void (d.d4.ddk[i].ok = v))} />
                    <Txt value={r.d4.ddk[i].bad} placeholder="تكرارات خاطئة (اختياري)" onChange={(v) => mut((d) => void (d.d4.ddk[i].bad = v))} />
                  </>
                }
              >
                <div className="font-bold">{row[1]}</div>
                <Chip>{row[2]}</Chip>
                <Chip>{row[3]}</Chip>
              </Row>
            ))}
          </List>
          <How title="تعليمات النبر والتنغيم (تسري على الجزأين ب وج)" open>
            <Ul items={SHAM.d4.instr} />
          </How>
          {(["stress", "into"] as const).map((part) => (
            <List
              key={part}
              title={part === "stress" ? "ب) النبر (18 بنداً)" : "ج) التنغيم (7 بنود)"}
              sub="الدرجة 0–2 أو NE"
              footer={
                <>
                  المجموع الجزئي: <b>{part === "stress" ? st.d4.stress : st.d4.into}</b> / {part === "stress" ? 36 : 14}
                  {part === "stress" && <> · بنود NE: <b>{st.d4.ne}</b></>}
                </>
              }
            >
              {part === "stress" ? (
                <li className="space-y-2 py-2">
                  <How title="قواعد اختيار بنود النبر">
                    <p className="text-sm">{SHAM.d4.stressRules[0]}</p>
                    <p className="muted">{SHAM.d4.stressRules[1]}</p>
                  </How>
                  <Key text={SHAM.d4.key} />
                </li>
              ) : (
                <li className="py-2 text-sm text-ink-soft">{SHAM.d4.intonIntro}</li>
              )}
              {(part === "stress" ? SHAM.d4.stress : SHAM.d4.inton).map((row, i) => (
                <Row
                  key={i}
                  n={row[0]}
                  controls={
                    <Seg
                      value={r.d4[part][i].score}
                      options={S02NE}
                      label={`تقييم ${part === "stress" ? "النبر" : "التنغيم"} ${row[0]}`}
                      onChange={(v) => mut((d) => void (d.d4[part][i].score = v as StressScore))}
                    />
                  }
                  fields={
                    <>
                      <Txt ipa={part === "stress"} value={r.d4[part][i].prod} placeholder={part === "stress" ? "الإنتاج المسجَّل" : "الإنتاج المسجَّل / ملاحظات"} onChange={(v) => mut((d) => void (d.d4[part][i].prod = v))} />
                      <Sel value={r.d4[part][i].ex} options={EX} placeholder="نوع الاستثارة" onChange={(v) => mut((d) => void (d.d4[part][i].ex = v))} />
                    </>
                  }
                >
                  <div className="font-bold">{row[1]}</div>
                  {part === "stress" ? (
                    <>
                      <Chip ltr>{row[2]}</Chip>
                      <Chip>{(row as readonly string[])[3]}</Chip>
                    </>
                  ) : (
                    <Chip>{row[2]}</Chip>
                  )}
                </Row>
              ))}
            </List>
          ))}
          <section className="card">
            <h3 className="mb-2 font-bold">ملاحظات لتفسير النبر والتنغيم</h3>
            <Ul items={SHAM.d4.notes} />
          </section>
        </div>
      )}

      {tab === "d5" && (
        <D5 r={r} mut={mut} st={st} />
      )}

      {tab === "sum" && (
        <div className="space-y-4">
          <section className="card space-y-3">
            <h2 className="h2">نموذج التسجيل الكلي</h2>
            <ShamScoreTable st={st} />
          </section>
          <section className="card space-y-2">
            <h3 className="font-bold">مصنّف الشدة الإكلينيكية (اجتهادي، غير معياري)</h3>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {SHAM.sum.classes.map((c, i) => (
                  <tr key={i} className={st.sev === i ? "bg-brand-soft font-semibold" : ""}>
                    <td className="border border-line px-2 py-1 whitespace-nowrap">{c[0]}</td>
                    <td className="border border-line px-2 py-1">{c[1]}</td>
                    <td className="border border-line px-2 py-1">{c[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{SHAM.sum.disclaimer}</p>
          </section>
          <section className="card space-y-2">
            <h3 className="font-bold">التفسير (يُولَّد تلقائياً ويظهر في التقرير)</h3>
            <Ul items={shamInterpretation(st)} />
          </section>
          <section className="card space-y-4">
            <div>
              <label className="label" htmlFor="recs">
                {t.recommendations}
              </label>
              <textarea id="recs" rows={6} className="input" value={recs} onChange={(e) => setRecs(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="notes">
                {t.examinerNotes}
              </label>
              <textarea id="notes" rows={4} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </section>
          <How title="الملحق ب: جدول مقارنة السمات السلوكية الخمس (ASHA)">
            <p className="muted">{SHAM.asha.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="bg-page">
                    <th className="border border-line px-2 py-1 text-start">السمة السلوكية</th>
                    <th className="border border-line px-2 py-1 text-start">الكلام الآلي/التلقائي</th>
                    <th className="border border-line px-2 py-1 text-start">التفسير الإكلينيكي في حالات CAS</th>
                  </tr>
                </thead>
                <tbody>
                  {SHAM.asha.rows.map((x, i) => (
                    <tr key={i}>
                      {x.map((c, j) => (
                        <td key={j} className="border border-line px-2 py-1">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">{SHAM.asha.note}</p>
          </How>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" className="btn btn-sm" disabled={tabIdx === 0} onClick={() => go(TABS[tabIdx - 1].id)}>
          → السابق
        </button>
        <button type="button" className="btn btn-sm" disabled={tabIdx === TABS.length - 1} onClick={() => go(TABS[tabIdx + 1].id)}>
          التالي ←
        </button>
      </div>

      {timer.left !== null && (
        <div role="timer" className={`fixed bottom-4 start-4 z-40 flex items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-lg ${timer.left === 0 ? "bg-red-600" : "bg-brand-dark"}`}>
          <b className="text-2xl" dir="ltr">{timer.left}</b>
          <span className="text-sm">{timer.left === 0 ? "انتهى الوقت" : "ثانية"}</span>
          <button type="button" className="rounded-lg bg-white/20 px-2 py-1 text-sm" onClick={timer.stop}>
            إيقاف
          </button>
        </div>
      )}

      {card !== null && (
        <div role="dialog" aria-modal="true" aria-label="عرض البطاقة للطفل" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={(e) => e.target === e.currentTarget && setCard(null)}>
          <div className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHAM_CARDS[card].src} alt={SHAM_CARDS[card].word} className="mx-auto aspect-square w-full max-w-sm object-contain" />
            <div className="text-xl font-bold">{SHAM_CARDS[card].word}</div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" className="btn" onClick={() => setCard((card + SHAM_CARDS.length - 1) % SHAM_CARDS.length)}>
                السابقة
              </button>
              <span>
                {card + 1} / {SHAM_CARDS.length}
              </span>
              <button type="button" className="btn" onClick={() => setCard((card + 1) % SHAM_CARDS.length)}>
                التالية
              </button>
            </div>
            <div className="flex justify-center gap-2">
              <TimerBtn sec={10} onStart={timer.start} />
              <button type="button" className="btn btn-primary" onClick={() => setCard(null)} autoFocus>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function D5({ r, mut, st }: { r: ShamRecord; mut: (fn: (d: ShamRecord) => void) => void; st: ReturnType<typeof shamStats> }) {
  const ne = nwrEff(r);
  const stopped = ne.some((x) => x.stopped);
  const gc = gropClass(st.d5.gpct);
  return (
    <div className="space-y-4">
      <DimHead n={5} title="السمات الداعمة (Supporting Features)" goal={SHAM.d5.goal} />

      <How title="تعليمات تكرار الكلمات المستحدثة" open>
        <Ul items={SHAM.d5.nwrInstr} />
      </How>
      <Key text={SHAM.d5.nwrKey} />
      {stopped && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <b>قاعدة التوقف:</b> سُجّل خطآن متتاليان، فتُحتسب الكلمات التالية بصفر ويُنهى الاختبار.
        </p>
      )}
      <List title="أ) تكرار الكلمات المستحدثة (الذاكرة الفونولوجية العاملة)" sub={`الدرجة 0/1 · المجموع ${st.d5.nwr} / 10`}>
        {SHAM.d5.nwr.map((row, i) => (
          <Row
            key={i}
            n={row[0]}
            muted={ne[i].stopped}
            controls={
              ne[i].stopped ? (
                <span className="badge bg-amber-100 text-amber-800">توقّف الاختبار = 0</span>
              ) : (
                <Seg value={r.d5.nwr[i].score} options={[0, 1].map((v) => ({ v, l: String(v) }))} label={`درجة الكلمة المستحدثة ${row[0]}`} onChange={(v) => mut((d) => void (d.d5.nwr[i].score = v))} />
              )
            }
            fields={!ne[i].stopped && <Txt ipa value={r.d5.nwr[i].resp} placeholder="استجابة الطفل" onChange={(v) => mut((d) => void (d.d5.nwr[i].resp = v))} />}
          >
            <span className="text-lg font-bold">{row[1]}</span> <Chip>{row[2]} مقطع</Chip>
            <Chip ltr>{row[3]}</Chip>
          </Row>
        ))}
      </List>

      <How title="ب) Groping — التعريف والتعليمات ومفتاح الدرجات">
        <p className="text-sm">{SHAM.d5.gropDef}</p>
        <Ul items={SHAM.d5.gropInstr} />
        <table className="w-full border-collapse text-sm">
          <tbody>
            {SHAM.d5.gropKey.map((x) => (
              <tr key={x[0]}>
                <td className="border border-line px-2 py-1 text-center font-bold">{x[0]}</td>
                <td className="border border-line px-2 py-1">{x[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">تُقترح الدرجة تلقائياً من عدد المحاولات والتوقيت (إطار منقّط)، ويمكنك اعتماد درجة أخرى بالضغط عليها.</p>
      </How>
      <List
        title="ب) سلوك بحث الكلمة (Groping)"
        sub="الدرجة 0–3 لكل كلمة"
        footer={
          <>
            المجموع: <b>{st.d5.grop}</b> / 30 ({fmt1(st.d5.gpct)}%) · التصنيف الوصفي:{" "}
            <span className="badge text-white" style={{ backgroundColor: gc.color }}>
              {gc.label}
            </span>
          </>
        }
      >
        {SHAM.d5.gropWords.map((w, i) => {
          const g = r.d5.grop[i];
          const ef = gropEff(g);
          const off = g.pres !== "y";
          return (
            <Row
              key={i}
              n={i + 1}
              controls={
                <>
                  <span className="muted">موجود؟</span>
                  <Seg<"y" | "n"> value={g.pres} options={SYN} label={`وجود Groping للكلمة ${i + 1}`} onChange={(v) => mut((d) => void (d.d5.grop[i].pres = v as YN))} />
                  <Seg
                    value={ef.v}
                    auto={ef.auto && g.pres === "y"}
                    options={S03}
                    label={`درجة Groping للكلمة ${i + 1}`}
                    onChange={(v) => mut((d) => void (d.d5.grop[i].score = g.score === v ? null : v))}
                  />
                </>
              }
              fields={
                <>
                  <Sel disabled={off} value={g.att} options={[["12", "1–2 محاولة"], ["3", "3 محاولات فأكثر"]]} placeholder="عدد المحاولات" onChange={(v) => mut((d) => void (d.d5.grop[i].att = v))} />
                  <Sel disabled={off} value={g.type} options={GROP_TYPES.map((k) => [k, TYPE_LABELS[k]])} placeholder="نوع السلوك" onChange={(v) => mut((d) => void (d.d5.grop[i].type = v))} />
                  <Sel disabled={off} value={g.time} options={[["before", "قبل الصوت"], ["during", "أثناء النطق"]]} placeholder="التوقيت" onChange={(v) => mut((d) => void (d.d5.grop[i].time = v))} />
                </>
              }
            >
              <span className="text-lg font-bold">{w}</span>
              {ef.auto && g.pres === "y" && <span className="badge ms-2 bg-brand-soft text-brand-dark">درجة مقترحة</span>}
            </Row>
          );
        })}
      </List>

      <List title="ج) التفارق الآلي مقابل الإرادي (وصفي — لا يدخل المجموع)" sub="الدرجة 0–3">
        <li className="space-y-2 py-2">
          <p className="text-sm text-ink-soft">{SHAM.d5.avIntro}</p>
          <Key text={SHAM.d5.avKey} />
        </li>
        {SHAM.d5.av.map((row, i) => (
          <li key={i} className="grid gap-3 py-3 sm:grid-cols-2">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 p-2">
              <span className="text-sm">
                <b>آلي {row[0]}:</b> {row[1]}
              </span>
              <Seg value={r.d5.av[i].a} options={S03} label={`درجة النشاط الآلي ${row[0]}`} onChange={(v) => mut((d) => void (d.d5.av[i].a = v))} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-2">
              <span className="text-sm">
                <b>إرادي {row[0]}:</b> {row[3]}
              </span>
              <Seg value={r.d5.av[i].v} options={S03} label={`درجة النشاط الإرادي ${row[0]}`} onChange={(v) => mut((d) => void (d.d5.av[i].v = v))} />
            </div>
          </li>
        ))}
        <li className="py-2 text-sm">
          الآلي <b>{st.d5.avA}</b>/9 · الإرادي <b>{st.d5.avV}</b>/9 · الفجوة (آلي − إرادي):{" "}
          <b dir="ltr">{st.d5.avDone ? (st.d5.gap > 0 ? `+${st.d5.gap}` : st.d5.gap) : "—"}</b>
          <p className="muted mt-1">{SHAM.d5.avNote}</p>
        </li>
      </List>
    </div>
  );
}
