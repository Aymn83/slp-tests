import type { Dict } from "@/lib/i18n";
import { tx, type Lang } from "@/lib/text";
import type { Band, TestDefinition, TestResult } from "@/tests/types";

export function BandBadge({ band, lang }: { band: Band | null; lang: Lang }) {
  if (!band) return <span className="text-ink-soft">—</span>;
  return (
    <span className="badge text-white" style={{ backgroundColor: band.color }}>
      {tx(lang, band.label)}
    </span>
  );
}

const fmt = (p: number | null) => (p === null ? "—" : `${p}%`);

// جدول النتائج المشترك بين صفحة التطبيق والتقرير
export function ResultsTable({ test, result, lang, t }: { test: TestDefinition; result: TestResult; lang: Lang; t: Dict }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-brand-soft text-brand-dark">
          <th className="border border-line px-2 py-1.5 text-start">{t.section}</th>
          <th className="border border-line px-2 py-1.5">{t.score}</th>
          <th className="border border-line px-2 py-1.5">{t.percent}</th>
          <th className="border border-line px-2 py-1.5">{t.level}</th>
        </tr>
      </thead>
      <tbody>
        {test.sections.map((s, i) => {
          const r = result.sections[i];
          return (
            <tr key={s.id}>
              <td className="border border-line px-2 py-1.5">
                {tx(lang, s.title)}
                {r.answered < r.total && (
                  <div className="text-xs text-amber-700">
                    {r.answered} {t.answeredOf} {r.total}
                  </div>
                )}
              </td>
              <td className="border border-line px-2 py-1.5 text-center" dir="ltr">
                {r.score} / {r.max}
              </td>
              <td className="border border-line px-2 py-1.5 text-center" dir="ltr">
                {fmt(r.percent)}
              </td>
              <td className="border border-line px-2 py-1.5 text-center">
                <BandBadge band={r.band} lang={lang} />
              </td>
            </tr>
          );
        })}
        <tr className="font-bold">
          <td className="border border-line px-2 py-1.5">{t.total}</td>
          <td className="border border-line px-2 py-1.5 text-center" dir="ltr">
            {result.score} / {result.max}
          </td>
          <td className="border border-line px-2 py-1.5 text-center" dir="ltr">
            {fmt(result.percent)}
          </td>
          <td className="border border-line px-2 py-1.5 text-center">
            <BandBadge band={result.band} lang={lang} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
