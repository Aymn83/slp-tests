// عرض نتائج «بطارية الشام» — مكوّنات بلا حالة تُستخدم في المتصفح والخادم والتقرير معاً.
import { SHAM } from "./data";
import {
  DIM_FORMULAS,
  DIM_NAMES,
  SEV_COLORS,
  SEV_LABELS,
  WEIGHTS,
  fmt1,
  gropClass,
  nwrEff,
  gropEff,
  type ShamRecord,
  type ShamStats,
} from "./scoring";

const th = "border border-line px-2 py-1.5 text-start font-semibold";
const td = "border border-line px-2 py-1.5";

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="badge text-white" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

export function SeverityPill({ st }: { st: ShamStats }) {
  return st.sev === null ? (
    <span className="badge bg-gray-100 text-gray-700">غير مكتمل</span>
  ) : (
    <Pill label={SEV_LABELS[st.sev]} color={SEV_COLORS[st.sev]} />
  );
}

// جدول الدرجات المعايَرة + المجموع + التصنيف + المؤشرات الداعمة
export function ShamScoreTable({ st, compact }: { st: ShamStats; compact?: boolean }) {
  const gc = gropClass(st.d5.gpct);
  return (
    <div className="space-y-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-brand-soft text-brand-dark">
            <th className={th}>البُعد التشخيصي</th>
            {!compact && <th className={th}>الحد الأقصى</th>}
            <th className={th}>الدرجة الخام</th>
            {!compact && <th className={th}>معادلة المعايرة</th>}
            <th className={th}>الموزونة</th>
          </tr>
        </thead>
        <tbody>
          {st.dims.map((d, i) => (
            <tr key={i}>
              <td className={td}>
                {i + 1}. {DIM_NAMES[i]}
                {d.done < d.total && (
                  <div className="text-xs text-amber-700">
                    {d.done} / {d.total} بنداً مسجّلاً
                  </div>
                )}
              </td>
              {!compact && <td className={`${td} text-center`}>{i === 1 ? "100%" : d.max}</td>}
              <td className={`${td} text-center`} dir="ltr">
                {i === 1 ? `${fmt1(d.raw)}% اتساق` : i === 4 ? `${d.raw} (${st.d5.nwr} + ${st.d5.gropInv})` : d.raw}
              </td>
              {!compact && <td className={td}>{DIM_FORMULAS[i]}</td>}
              <td className={`${td} text-center font-bold`} dir="ltr">
                {fmt1(st.w[i])} / {WEIGHTS[i]}
              </td>
            </tr>
          ))}
          <tr className="bg-page font-bold">
            <td className={td} colSpan={compact ? 2 : 4}>
              مجموع كفاءة النطق الحركي الإجمالية {!st.complete && <span className="font-normal text-amber-700">(جزئي: {st.doneDims}/5 أبعاد)</span>}
            </td>
            <td className={`${td} text-center text-base`} dir="ltr">
              {fmt1(st.tot)} / 100
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">مصنّف الشدة (اجتهادي):</span> <SeverityPill st={st} />
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-line p-2">
          <b dir="ltr">{st.d2.done ? `${fmt1(st.d2.index)}%` : "—"}</b> مؤشر عدم الاتساق (العتبة 40%)
        </div>
        <div className="rounded-lg border border-line p-2">
          <b dir="ltr">{fmt1(st.d5.gpct)}%</b> Groping: <Pill label={gc.label} color={gc.color} />
        </div>
        <div className="rounded-lg border border-line p-2">
          <b dir="ltr">{st.d5.avDone ? (st.d5.gap > 0 ? `+${st.d5.gap}` : st.d5.gap) : "—"}</b> الفجوة الآلي − الإرادي (لا تدخل المجموع)
        </div>
        <div className="rounded-lg border border-line p-2">
          <b>{st.d4.ne}</b> بنود NE في النبر والتنغيم
        </div>
      </div>
    </div>
  );
}

// التفسير الآلي المستمد من نصوص البطارية نفسها
export function shamInterpretation(st: ShamStats): string[] {
  const out: string[] = [];
  if (st.sev !== null) {
    const c = SHAM.sum.classes[st.sev];
    out.push(`التصنيف (${c[1]}، ${c[0]}): ${c[2]}`);
  }
  if (st.d2.done === 15) out.push(`عدم الاتساق الصوتي: ${(st.d2.index < 40 ? SHAM.d2.cut[0] : SHAM.d2.cut[1]).replace(/\s+/g, " ")}`);
  const gp = st.d5.gpct;
  const gText = SHAM.d5.gropClass[gp <= 15 ? 0 : gp <= 40 ? 1 : 2][1];
  out.push(`سلوك البحث الحركي (Groping ${fmt1(gp)}%): ${gText}`);
  if (st.d5.avDone) out.push(`التفارق الآلي/الإرادي: الآلي ${st.d5.avA}/9، الإرادي ${st.d5.avV}/9، الفجوة ${st.d5.gap > 0 ? "+" : ""}${st.d5.gap}.`);
  return out;
}

const EX_LABEL: Record<string, string> = { spont: "تلقائي", imit: "تقليد", guided: "موجَّه" };

// تفاصيل الأبعاد للتقرير المطبوع
export function ShamReportDetails({ r, st }: { r: ShamRecord; st: ShamStats }) {
  const lowD3 = SHAM.d3.rows.map((row, i) => ({ row, x: r.d3.rows[i] })).filter(({ x }) => x.score !== null && x.score < 5);
  const weakPros = [
    ...SHAM.d4.stress.map((row, i) => ({ kind: "نبر", text: `${row[1]} ${row[2]}`, x: r.d4.stress[i] })),
    ...SHAM.d4.inton.map((row, i) => ({ kind: "تنغيم", text: `${row[1]} (${row[2]})`, x: r.d4.into[i] })),
  ].filter(({ x }) => x.score !== null && x.score !== 2);
  const ne = nwrEff(r);
  const ge = r.d5.grop.map(gropEff);

  return (
    <div className="space-y-4 text-[12.5px]">
      <div className="avoid-break">
        <h3 className="mb-1 font-bold">البُعد 1 — الفحص التأسيسي</h3>
        <p>
          الشفاه {st.d1.lips}/18 · اللسان {st.d1.tongue}/18 · المجموع {st.d1.raw}/36
        </p>
        {[...SHAM.d1.lips.map((x, i) => ({ t: x[1], v: r.d1.lips[i] })), ...SHAM.d1.tongue.map((x, i) => ({ t: x[1], v: r.d1.tongue[i] }))].some(
          (x) => x.v !== null && x.v < 2,
        ) && (
          <p>
            <b>بنود دون الكفاءة التامة:</b>{" "}
            {[...SHAM.d1.lips.map((x, i) => ({ t: x[1], v: r.d1.lips[i] })), ...SHAM.d1.tongue.map((x, i) => ({ t: x[1], v: r.d1.tongue[i] }))]
              .filter((x) => x.v !== null && x.v < 2)
              .map((x) => `${x.t} (${x.v})`)
              .join("، ")}
          </p>
        )}
      </div>

      <div className="avoid-break">
        <h3 className="mb-1 font-bold">
          البُعد 2 — عدم الاتساق الصوتي: {st.d2.yes}/15 كلمة متباينة ({fmt1(st.d2.index)}%)
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-page">
              <th className={th}>#</th>
              <th className={th}>الكلمة</th>
              <th className={th}>محاولة 1</th>
              <th className={th}>محاولة 2</th>
              <th className={th}>محاولة 3</th>
              <th className={th}>تباين</th>
            </tr>
          </thead>
          <tbody>
            {SHAM.d2.words.map((w, i) => {
              const x = r.d2.rows[i];
              return (
                <tr key={i}>
                  <td className={td}>{i + 1}</td>
                  <td className={td}>{w.word}</td>
                  <td className={td} dir="ltr">{x.t1}</td>
                  <td className={td} dir="ltr">{x.t2}</td>
                  <td className={td} dir="ltr">{x.t3}</td>
                  <td className={`${td} text-center`}>{x.v === "y" ? "نعم" : x.v === "n" ? "لا" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="avoid-break">
        <h3 className="mb-1 font-bold">
          البُعد 3 — دقة الحركات الصائتة: {st.d3.raw}/140
        </h3>
        {lowD3.length === 0 ? (
          <p>لا توجد كلمات دون الدقة الكاملة.</p>
        ) : (
          <p>
            <b>كلمات دون الدقة الكاملة (5):</b>{" "}
            {lowD3.map(({ row, x }) => `${row[1]} ${row[2]} = ${x.score}${x.prod ? ` [${x.prod}]` : ""}`).join("، ")}
          </p>
        )}
      </div>

      <div className="avoid-break">
        <h3 className="mb-1 font-bold">
          البُعد 4 — DDK {st.d4.ddk}/10 · النبر {st.d4.stress}/36 · التنغيم {st.d4.into}/14
        </h3>
        <p>
          <b>DDK:</b> {SHAM.d4.ddk.map((row, i) => `${row[1]} = ${r.d4.ddk[i].score ?? "—"}`).join(" · ")}
        </p>
        {weakPros.length > 0 && (
          <p>
            <b>بنود نبر/تنغيم غير صحيحة أو غير قابلة للتقييم:</b>{" "}
            {weakPros.map(({ kind, text, x }) => `${kind}: ${text} = ${x.score}${x.ex ? ` (${EX_LABEL[x.ex] ?? x.ex})` : ""}`).join("، ")}
          </p>
        )}
      </div>

      <div className="avoid-break">
        <h3 className="mb-1 font-bold">
          البُعد 5 — كلمات مستحدثة {st.d5.nwr}/10 · Groping {st.d5.grop}/30
        </h3>
        <p>
          <b>الكلمات المستحدثة:</b>{" "}
          {SHAM.d5.nwr.map((row, i) => `${row[1]} = ${ne[i].stopped ? "0 (توقف)" : (ne[i].score ?? "—")}`).join(" · ")}
        </p>
        <p>
          <b>Groping:</b> {SHAM.d5.gropWords.map((w, i) => `${w} = ${ge[i].v ?? "—"}`).join(" · ")}
        </p>
        <p>
          <b>التفارق الآلي/الإرادي:</b>{" "}
          {r.d5.av.map((x, i) => `النشاط ${i + 1}: آلي ${x.a ?? "—"} / إرادي ${x.v ?? "—"}`).join(" · ")}
        </p>
      </div>
    </div>
  );
}
