import { prisma } from "./prisma";
import { canViewAll, type CurrentUser } from "./auth";
import { getTest } from "@/tests";
import { scoreTest } from "@/tests/scoring";
import { sanitizeSham, shamStats } from "@/tests/sham/scoring";
import { matrixStats, sanitizeMatrix } from "@/tests/matrix/scoring";

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

const asMap = (v: unknown): Record<string, string> => (v && typeof v === "object" ? (v as Record<string, string>) : {});

// يحمّل اختباراً مطبّقاً مع نتائجه: الفاحص يرى اختباراته فقط، والمدير يرى الكل (isOwner يحدد صلاحية التعديل)
export async function loadAssessment(user: CurrentUser, rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id)) return null;
  const a = await prisma.assessment.findFirst({
    where: canViewAll(user) ? { id } : { id, examinerId: user.id },
    include: { case: true, examiner: true },
  });
  if (!a) return null;
  const test = getTest(a.testId);
  if (!test) return null;
  const isOwner = a.examinerId === user.id;
  const responses = parseJson(a.responses);
  const extra = asMap(parseJson(a.extra));
  if (test.kind === "sham") {
    const record = sanitizeSham(responses);
    return { a, test, extra, isOwner, kind: "sham" as const, sham: { record, stats: shamStats(record) } };
  }
  if (test.kind === "matrix") {
    const record = sanitizeMatrix(responses);
    return { a, test, extra, isOwner, kind: "matrix" as const, matrix: { record, stats: matrixStats(record) } };
  }
  const map = asMap(responses);
  return { a, test, extra, isOwner, kind: "generic" as const, def: test.def, responses: map, result: scoreTest(test.def, map) };
}

export function reportNumber(a: { id: number; createdAt: Date }): string {
  return `SLP-${a.createdAt.getFullYear()}-${String(a.id).padStart(5, "0")}`;
}
