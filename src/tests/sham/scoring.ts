// تصحيح «بطارية الشام التشخيصية» — منقول من منطق ملف البطارية الأصلي، مع عكس درجتي عدم الاتساق والـGroping بطلب صاحب الموقع.

type V = number | null;
export type YN = "y" | "n" | null;
export type StressScore = number | "NE" | null;

export type ShamRecord = {
  d1: { lips: V[]; tongue: V[] };
  d2: { rows: { t1: string; t2: string; t3: string; v: YN }[] };
  d3: { rows: { prod: string; score: V; note: string }[] };
  d4: {
    ddk: { score: V; ok: string; bad: string }[];
    stress: { prod: string; score: StressScore; ex: string }[];
    into: { prod: string; score: StressScore; ex: string }[];
  };
  d5: {
    nwr: { resp: string; score: V }[];
    grop: { pres: YN; att: string; type: string; time: string; score: V }[];
    av: { a: V; v: V }[];
  };
};

const rep = <T,>(n: number, f: () => T): T[] => Array.from({ length: n }, f);

export function blankSham(): ShamRecord {
  return {
    d1: { lips: rep(9, () => null), tongue: rep(9, () => null) },
    d2: { rows: rep(15, () => ({ t1: "", t2: "", t3: "", v: null })) },
    d3: { rows: rep(28, () => ({ prod: "", score: null, note: "" })) },
    d4: {
      ddk: rep(5, () => ({ score: null, ok: "", bad: "" })),
      stress: rep(18, () => ({ prod: "", score: null, ex: "" })),
      into: rep(7, () => ({ prod: "", score: null, ex: "" })),
    },
    d5: {
      nwr: rep(10, () => ({ resp: "", score: null })),
      grop: rep(10, () => ({ pres: null, att: "", type: "", time: "", score: null })),
      av: rep(3, () => ({ a: null, v: null })),
    },
  };
}

// ===== تنقية المدخلات المحفوظة (تُستخدم في الخادم قبل الحفظ وعند القراءة) =====
const num = (v: unknown, min: number, max: number): V =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
const s = (v: unknown, allowed?: string[]): string => {
  const x = typeof v === "string" ? v.slice(0, 300) : "";
  return allowed && !allowed.includes(x) ? "" : x;
};
const yn = (v: unknown): YN => (v === "y" || v === "n" ? v : null);
const stressScore = (v: unknown): StressScore => (v === "NE" ? "NE" : num(v, 0, 2));
const arr = (v: unknown, i: number): Record<string, unknown> => {
  const a = Array.isArray(v) ? v[i] : undefined;
  return a && typeof a === "object" ? (a as Record<string, unknown>) : {};
};
const at = (v: unknown, i: number): unknown => (Array.isArray(v) ? v[i] : undefined);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export const EX_OPTIONS = ["spont", "imit", "guided"];
export const GROP_ATT = ["12", "3"];
export const GROP_TYPES = ["prolong", "partial", "silent", "other"];
export const GROP_TIME = ["before", "during"];

export function sanitizeSham(raw: unknown): ShamRecord {
  const r = obj(raw);
  const d1 = obj(r.d1), d2 = obj(r.d2), d3 = obj(r.d3), d4 = obj(r.d4), d5 = obj(r.d5);
  const b = blankSham();
  b.d1.lips = b.d1.lips.map((_, i) => num(at(d1.lips, i), 0, 2));
  b.d1.tongue = b.d1.tongue.map((_, i) => num(at(d1.tongue, i), 0, 2));
  b.d2.rows = b.d2.rows.map((_, i) => {
    const x = arr(d2.rows, i);
    return { t1: s(x.t1), t2: s(x.t2), t3: s(x.t3), v: yn(x.v) };
  });
  b.d3.rows = b.d3.rows.map((_, i) => {
    const x = arr(d3.rows, i);
    return { prod: s(x.prod), score: num(x.score, 1, 5), note: s(x.note) };
  });
  b.d4.ddk = b.d4.ddk.map((_, i) => {
    const x = arr(d4.ddk, i);
    return { score: num(x.score, 0, 2), ok: s(x.ok), bad: s(x.bad) };
  });
  const pros = (list: unknown) => (_: unknown, i: number) => {
    const x = arr(list, i);
    return { prod: s(x.prod), score: stressScore(x.score), ex: s(x.ex, ["", ...EX_OPTIONS]) };
  };
  b.d4.stress = b.d4.stress.map(pros(d4.stress));
  b.d4.into = b.d4.into.map(pros(d4.into));
  b.d5.nwr = b.d5.nwr.map((_, i) => {
    const x = arr(d5.nwr, i);
    return { resp: s(x.resp), score: num(x.score, 0, 1) };
  });
  b.d5.grop = b.d5.grop.map((_, i) => {
    const x = arr(d5.grop, i);
    return {
      pres: yn(x.pres),
      att: s(x.att, ["", ...GROP_ATT]),
      type: s(x.type, ["", ...GROP_TYPES]),
      time: s(x.time, ["", ...GROP_TIME]),
      score: num(x.score, 0, 3),
    };
  });
  b.d5.av = b.d5.av.map((_, i) => {
    const x = arr(d5.av, i);
    return { a: num(x.a, 0, 3), v: num(x.v, 0, 3) };
  });
  return b;
}

// ===== الحساب =====
const sum = (a: unknown[]) => a.reduce<number>((t, x) => t + (typeof x === "number" ? x : 0), 0);
const cnt = (a: unknown[]) => a.filter((x) => x !== null && x !== undefined).length;

// قاعدة التوقف: بعد خطأين متتاليين تُحتسب الكلمات التالية صفراً
export function nwrEff(r: ShamRecord): { score: V; stopped: boolean }[] {
  const out: { score: V; stopped: boolean }[] = [];
  let cons = 0;
  let stop = false;
  for (const it of r.d5.nwr) {
    if (stop) {
      out.push({ score: 0, stopped: true });
      continue;
    }
    out.push({ score: it.score, stopped: false });
    if (it.score === 0) {
      cons++;
      if (cons >= 2) stop = true;
    } else cons = 0;
  }
  return out;
}

export function suggestGrop(att: string, time: string): number {
  const many = att === "3";
  const before = time === "before";
  if (many && before) return 3;
  if (many || before) return 2;
  return 1;
}

export function gropEff(g: ShamRecord["d5"]["grop"][number]): { v: V; auto: boolean } {
  if (g.pres === "n") return { v: 0, auto: true };
  if (g.pres !== "y") return { v: null, auto: false };
  if (typeof g.score === "number") return { v: g.score, auto: false };
  if (g.att && g.time) return { v: suggestGrop(g.att, g.time), auto: true };
  return { v: null, auto: false };
}

export const WEIGHTS = [15, 30, 20, 20, 15];
export const DIM_NAMES = ["الفحص التأسيسي", "عدم الاتساق الصوتي", "دقة الحركات الصائتة", "DDK والنبر والتنغيم", "السمات الداعمة"];
export const DIM_FORMULAS = ["(الخام ÷ 36) × 15", "(نسبة الاتساق ÷ 100) × 30", "(الخام ÷ 140) × 20", "(الخام ÷ 60) × 20", "(كلمات مستحدثة + (30 − Groping)) ÷ 40 × 15"];

type Dim = { raw: number; done: number; total: number; max: number };

export type ShamStats = {
  d1: Dim & { lips: number; tongue: number };
  d2: Dim & { yes: number; index: number }; // index = مؤشر عدم الاتساق، raw = نسبة الاتساق
  d3: Dim;
  d4: Dim & { ddk: number; stress: number; into: number; ne: number };
  d5: Dim & { nwr: number; grop: number; gropInv: number; gpct: number; avA: number; avV: number; gap: number; avDone: number };
  dims: Dim[];
  w: number[];
  tot: number;
  complete: boolean;
  doneDims: number;
  sev: number | null; // 0 خفيف، 1 متوسط، 2 شديد — فقط عند اكتمال الأبعاد
};

export function shamStats(r: ShamRecord): ShamStats {
  const lips = sum(r.d1.lips);
  const tongue = sum(r.d1.tongue);
  const d1 = { lips, tongue, raw: lips + tongue, done: cnt(r.d1.lips) + cnt(r.d1.tongue), total: 18, max: 36 };

  const yes = r.d2.rows.filter((x) => x.v === "y").length;
  // معكوس عن الملف الأصلي: الكلمات المتسقة (لا) هي التي ترفع الدرجة، فيقلّ المجموع كلما زاد عدم الاتساق
  const consistent = r.d2.rows.filter((x) => x.v === "n").length;
  const d2 = { yes, index: (yes / 15) * 100, done: r.d2.rows.filter((x) => x.v === "y" || x.v === "n").length, total: 15, max: 100, raw: (consistent / 15) * 100 };

  const d3scores = r.d3.rows.map((x) => x.score);
  const d3 = { raw: sum(d3scores), done: cnt(d3scores), total: 28, max: 140 };

  const ddkS = r.d4.ddk.map((x) => x.score), stS = r.d4.stress.map((x) => x.score), inS = r.d4.into.map((x) => x.score);
  const ddk = sum(ddkS), stress = sum(stS), into = sum(inS);
  const ne = [...stS, ...inS].filter((x) => x === "NE").length;
  const d4 = { ddk, stress, into, ne, raw: ddk + stress + into, done: cnt(ddkS) + cnt(stS) + cnt(inS), total: 30, max: 60 };

  const ne5 = nwrEff(r);
  const nwr = sum(ne5.map((x) => x.score));
  const ge = r.d5.grop.map(gropEff);
  const grop = sum(ge.map((x) => x.v));
  // معكوس عن الملف الأصلي: كل كلمة مُقيَّمة تمنح (3 − درجة Groping)، فيقلّ المجموع كلما زاد البحث الحركي
  const gropInv = sum(ge.map((x) => (x.v === null ? null : 3 - x.v)));
  const avA = sum(r.d5.av.map((x) => x.a));
  const avV = sum(r.d5.av.map((x) => x.v));
  const d5 = {
    nwr,
    grop,
    gropInv,
    gpct: (grop / 30) * 100,
    raw: nwr + gropInv,
    done: ne5.filter((x) => x.stopped || x.score !== null).length + ge.filter((x) => x.v !== null).length,
    total: 20,
    max: 40,
    avA,
    avV,
    gap: avA - avV,
    avDone: cnt(r.d5.av.map((x) => x.a)) + cnt(r.d5.av.map((x) => x.v)),
  };

  const dims = [d1, d2, d3, d4, d5];
  const w = dims.map((d, i) => (d.raw / d.max) * WEIGHTS[i]);
  const tot = w.reduce((a, b) => a + b, 0);
  const complete = dims.every((d) => d.done === d.total);
  return {
    d1,
    d2,
    d3,
    d4,
    d5,
    dims,
    w,
    tot,
    complete,
    doneDims: dims.filter((d) => d.done === d.total).length,
    sev: !complete ? null : tot >= 85 ? 0 : tot >= 60 ? 1 : 2,
  };
}

export const SEV_LABELS = ["خفيف", "متوسط", "شديد"];
export const SEV_COLORS = ["#ca8a04", "#ea580c", "#b91c1c"];

export function gropClass(p: number): { label: string; color: string } {
  return p <= 15
    ? { label: "منخفض", color: "#15803d" }
    : p <= 40
      ? { label: "متوسط", color: "#ca8a04" }
      : { label: "بارز", color: "#b91c1c" };
}

export const fmt1 = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(1);
