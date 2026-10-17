// عرض نتائج «مصفوفة التواصل» — بلا حالة، يُستخدم في المتصفح والخادم والتقرير.
import { CELLS, LEVELS, REASONS, STATUSES } from "./data";
import type { MatrixRecord, MatrixStats } from "./scoring";

const statusOf = (v: string | null | undefined) => STATUSES.find((s) => s.v === v);

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {STATUSES.map((s) => (
        <span key={s.v} className="badge" style={{ backgroundColor: s.color, color: s.ink }}>
          {s.short} = {s.l}
        </span>
      ))}
      <span className="badge border border-dashed border-line bg-white text-ink-soft">فارغ = لم يُقيَّم</span>
    </div>
  );
}

// الاستمارة الشخصية (Profile): صف لكل مستوى، وأعمدة الأسباب الأربعة
export function MatrixProfile({ r }: { r: MatrixRecord }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand-soft text-brand-dark">
            <th className="border border-line px-1.5 py-1 text-start">المستوى</th>
            {REASONS.map((x) => (
              <th key={x.id} className="border border-line px-1.5 py-1">
                {x.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((l) => (
            <tr key={l.n}>
              <td className="border border-line px-1.5 py-1 align-top">
                <b>{l.roman}</b> {l.name}
                <div className="text-ink-soft">{l.age}</div>
              </td>
              {REASONS.map((x) => (
                <td key={x.id} className="border border-line p-1 align-top">
                  <div className="flex flex-wrap gap-1">
                    {CELLS.filter((c) => c.level === l.n && c.reason === x.id).map((c) => {
                      const s = statusOf(r.cells[c.id]?.s);
                      return (
                        <span
                          key={c.id}
                          title={`${c.name} — ${s?.l ?? "لم يُقيَّم"}`}
                          className="rounded px-1 py-0.5 leading-tight"
                          style={s ? { backgroundColor: s.color, color: s.ink } : { border: "1px dashed #cbd5e1", color: "#64748b" }}
                        >
                          ({c.n}) {c.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ملخص المستويات + المجموع
export function MatrixSummary({ st }: { st: MatrixStats }) {
  const td = "border border-line px-2 py-1.5 text-center";
  return (
    <div className="space-y-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-brand-soft text-brand-dark">
            <th className="border border-line px-2 py-1.5 text-start">المستوى</th>
            <th className={td}>متقن</th>
            <th className={td}>ناشئ</th>
            <th className={td}>مُقيَّم</th>
            <th className={td}>النسبة</th>
          </tr>
        </thead>
        <tbody>
          {st.levels.map((l) => {
            const info = LEVELS[l.level - 1];
            return (
              <tr key={l.level} className={st.targetLevel === l.level ? "bg-amber-50" : ""}>
                <td className="border border-line px-2 py-1.5">
                  {info.roman}. {info.name}
                  {st.targetLevel === l.level && <span className="badge ms-2 bg-amber-100 text-amber-800">المستوى المستهدف</span>}
                </td>
                <td className={td}>{l.mastered}</td>
                <td className={td}>{l.emerging}</td>
                <td className={td} dir="ltr">
                  {l.done} / {l.total}
                </td>
                <td className={td} dir="ltr">
                  {l.percent}%
                </td>
              </tr>
            );
          })}
          <tr className="bg-page font-bold">
            <td className="border border-line px-2 py-1.5">الدرجة الكلية (متقن = 2، ناشئ = 1)</td>
            <td className={td} colSpan={4} dir="ltr">
              {st.points} / {st.maxPoints}
            </td>
          </tr>
        </tbody>
      </table>
      {st.done < st.total && (
        <p className="text-xs text-amber-700">
          قُيِّمت {st.done} خلية من {st.total}.
        </p>
      )}
    </div>
  );
}
