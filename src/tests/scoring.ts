import type { Lang } from "@/lib/text";
import { tx } from "@/lib/text";
import type { Band, SectionResult, TestDefinition, TestResult } from "./types";

export function bandFor(test: TestDefinition, percent: number | null): Band | null {
  if (percent === null) return null;
  const sorted = [...test.bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => percent >= b.min) ?? sorted[sorted.length - 1] ?? null;
}

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : null);

// النسبة تُحسب على البنود المُجابة فقط، ويُعرض عدد البنود غير المُجابة بجانبها
export function scoreTest(test: TestDefinition, responses: Record<string, string>): TestResult {
  const sections: SectionResult[] = test.sections.map((s) => {
    const scale = test.responseScales[s.scale] ?? [];
    const top = Math.max(0, ...scale.map((o) => o.score));
    let score = 0;
    let answered = 0;
    const errors: SectionResult["errors"] = [];
    for (const item of s.items) {
      const option = scale.find((o) => o.value === responses[item.id]);
      if (!option) continue;
      answered++;
      score += option.score;
      if (option.isError) errors.push({ item, option });
    }
    const max = answered * top;
    const percent = pct(score, max);
    return { id: s.id, score, max, answered, total: s.items.length, percent, band: bandFor(test, percent), errors };
  });

  const score = sections.reduce((a, s) => a + s.score, 0);
  const max = sections.reduce((a, s) => a + s.max, 0);
  const percent = pct(score, max);
  return {
    sections,
    score,
    max,
    answered: sections.reduce((a, s) => a + s.answered, 0),
    total: sections.reduce((a, s) => a + s.total, 0),
    percent,
    band: bandFor(test, percent),
  };
}

export function buildRecommendations(test: TestDefinition, result: TestResult, lang: Lang): string {
  const lines: string[] = [];
  for (const r of test.recommendations) {
    const band = r.section ? result.sections.find((s) => s.id === r.section)?.band : result.band;
    if (band && r.bands.includes(band.id)) lines.push(`• ${tx(lang, r.text)}`);
  }
  return lines.join("\n");
}
