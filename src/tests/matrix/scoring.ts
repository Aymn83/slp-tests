import { CELLS, GOALS, LEVELS, STATUSES, behaviorsFor } from "./data";

export type CellStatus = (typeof STATUSES)[number]["v"];
export type MatrixCell = { s: CellStatus | null; b: string[] };
export type MatrixRecord = { cells: Record<string, MatrixCell>; symbols: string };

export function blankMatrix(): MatrixRecord {
  return { cells: Object.fromEntries(CELLS.map((c) => [c.id, { s: null, b: [] }])), symbols: "" };
}

const STATUS_SET = new Set<string>(STATUSES.map((s) => s.v));

// تنقية ما يصل من المتصفح أو قاعدة البيانات
export function sanitizeMatrix(raw: unknown): MatrixRecord {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const cells = r.cells && typeof r.cells === "object" ? (r.cells as Record<string, unknown>) : {};
  const out = blankMatrix();
  for (const c of CELLS) {
    const x = cells[c.id] && typeof cells[c.id] === "object" ? (cells[c.id] as Record<string, unknown>) : {};
    const allowed = new Set(behaviorsFor(c.level));
    out.cells[c.id] = {
      s: typeof x.s === "string" && STATUS_SET.has(x.s) ? (x.s as CellStatus) : null,
      b: Array.isArray(x.b) ? x.b.filter((v): v is string => typeof v === "string" && allowed.has(v)) : [],
    };
  }
  out.symbols = typeof r.symbols === "string" ? r.symbols.slice(0, 1000) : "";
  return out;
}

const points = (s: CellStatus | null) => STATUSES.find((x) => x.v === s)?.points ?? 0;
const isMastered = (s: CellStatus | null) => s === "mastered" || s === "surpassed";

export type LevelStats = { level: number; total: number; done: number; mastered: number; emerging: number; points: number; percent: number };

export type MatrixStats = {
  levels: LevelStats[];
  done: number;
  total: number;
  points: number;
  maxPoints: number;
  highestMastered: number | null; // أعلى مستوى فيه خلية متقنة واحدة على الأقل
  emergingCells: { id: string; name: string; level: number }[];
  targetLevel: number | null; // المستوى المقترح للاستهداف العلاجي
};

export function matrixStats(r: MatrixRecord): MatrixStats {
  const levels: LevelStats[] = LEVELS.map(({ n }) => {
    const cells = CELLS.filter((c) => c.level === n);
    const st = cells.map((c) => r.cells[c.id]?.s ?? null);
    const pts = st.reduce((a, s) => a + points(s), 0);
    return {
      level: n,
      total: cells.length,
      done: st.filter((s) => s !== null).length,
      mastered: st.filter(isMastered).length,
      emerging: st.filter((s) => s === "emerging").length,
      points: pts,
      percent: Math.round((pts / (cells.length * 2)) * 100),
    };
  });
  const highest = [...levels].reverse().find((l) => l.mastered > 0)?.level ?? null;
  const emergingCells = CELLS.filter((c) => r.cells[c.id]?.s === "emerging").map((c) => ({ id: c.id, name: c.name, level: c.level }));
  // الهدف: أدنى مستوى فيه خلايا ناشئة؛ وإلا المستوى التالي لأعلى مستوى متقن
  const lowestEmerging = emergingCells.length ? Math.min(...emergingCells.map((c) => c.level)) : null;
  const done = levels.reduce((a, l) => a + l.done, 0);
  const targetLevel = done === 0 ? null : (lowestEmerging ?? Math.min(7, (highest ?? 0) + 1));
  return {
    levels,
    done,
    total: CELLS.length,
    points: levels.reduce((a, l) => a + l.points, 0),
    maxPoints: CELLS.length * 2,
    highestMastered: highest,
    emergingCells,
    targetLevel,
  };
}

// تفسير وتوصيات آلية قابلة للتعديل
export function matrixRecommendations(st: MatrixStats): string {
  if (st.done === 0) return "";
  const lines: string[] = [];
  const lvl = (n: number) => LEVELS[n - 1];
  if (st.highestMastered) {
    const l = lvl(st.highestMastered);
    lines.push(`• أعلى مستوى ظهرت فيه رسائل متقنة: المستوى ${l.roman} (${l.name}).`);
  } else {
    lines.push("• لم تظهر رسائل متقنة بعد؛ يُبدأ من المستوى الأول.");
  }
  if (st.emergingCells.length) {
    lines.push(`• تثبيت الرسائل الناشئة حتى تصبح مستقلة ومتسقة: ${st.emergingCells.map((c) => `${c.name} (${lvl(c.level).roman})`).join("، ")}.`);
  }
  if (st.targetLevel) {
    const t = lvl(st.targetLevel);
    lines.push(`• المستوى المقترح للاستهداف: ${t.roman} (${t.name}). الهدف العام: ${GOALS[st.targetLevel]}`);
  }
  lines.push("• يُراعى عند اختيار الأهداف أي قيود حسية أو حركية أو معرفية قد تمنع الطفل من استخدام أنواع معينة من الرموز.");
  return lines.join("\n");
}
