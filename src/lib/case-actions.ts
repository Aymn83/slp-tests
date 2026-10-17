"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { allowedTestIds, requireUser } from "./auth";
import { getDict } from "./i18n";
import { opt, str } from "./credentials";
import type { FormState } from "./form-state";
import { getTest } from "@/tests";
import { sanitizeSham } from "@/tests/sham/scoring";
import { sanitizeMatrix } from "@/tests/matrix/scoring";

function parseDay(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ===== الحالات: كل استعلام مقيَّد بـ ownerId للمستخدم الحالي =====

export async function saveCaseAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getDict();
  const fullName = str(fd, "fullName");
  if (!fullName) return { error: t.fillRequired };
  const gender = str(fd, "gender");
  const data = {
    fullName,
    birthDate: parseDay(str(fd, "birthDate")),
    gender: gender === "male" || gender === "female" ? gender : null,
    referralSource: opt(fd, "referralSource"),
    referralReason: opt(fd, "referralReason"),
    initialDiagnosis: opt(fd, "initialDiagnosis"),
    motherLanguage: opt(fd, "motherLanguage"),
    homeLanguages: opt(fd, "homeLanguages"),
    school: opt(fd, "school"),
    grade: opt(fd, "grade"),
    notes: opt(fd, "notes"),
  };
  const id = str(fd, "id");
  let caseId = id;
  if (id) {
    const { count } = await prisma.case.updateMany({ where: { id, ownerId: user.id }, data });
    if (count === 0) redirect("/cases");
  } else {
    caseId = (await prisma.case.create({ data: { ...data, ownerId: user.id } })).id;
  }
  revalidatePath("/cases");
  redirect(`/cases/${caseId}`);
}

export async function deleteCaseAction(fd: FormData) {
  const user = await requireUser();
  await prisma.case.deleteMany({ where: { id: str(fd, "id"), ownerId: user.id } });
  revalidatePath("/cases");
  redirect("/cases");
}

// ===== تطبيق الاختبارات =====

export async function startAssessmentAction(fd: FormData) {
  const user = await requireUser();
  const caseId = str(fd, "caseId");
  const testId = str(fd, "testId");
  const owned = await prisma.case.findFirst({ where: { id: caseId, ownerId: user.id }, select: { id: true } });
  const test = getTest(testId);
  if (!owned || !test || !allowedTestIds(user).includes(testId)) redirect(`/cases/${caseId}`);
  const a = await prisma.assessment.create({
    data: { caseId, examinerId: user.id, testId, testVersion: test.meta.version },
  });
  redirect(`/assessments/${a.id}`);
}

async function ownAssessment(userId: string, id: number) {
  if (!Number.isInteger(id)) return null;
  return prisma.assessment.findFirst({ where: { id, examinerId: userId } });
}

function cleanMap(json: string, allowed: Set<string>): Record<string, string> {
  try {
    const raw = JSON.parse(json || "{}") as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) if (allowed.has(k) && typeof v === "string") out[k] = v.slice(0, 5000);
    return out;
  } catch {
    return {};
  }
}

export async function saveAssessmentAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getDict();
  const a = await ownAssessment(user.id, Number(str(fd, "id")));
  if (!a) redirect("/cases");
  if (a.status === "final") return { error: t.finalLocked };
  const test = getTest(a.testId);
  if (!test) return { error: t.testNotAllowed };

  const rawResponses = String(fd.get("responses") ?? "");
  let responses: unknown;
  let extra: Record<string, string> = {};
  if (test.kind === "sham" || test.kind === "matrix") {
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(rawResponses || "{}");
    } catch {}
    responses = test.kind === "sham" ? sanitizeSham(parsed) : sanitizeMatrix(parsed);
  } else {
    const itemIds = new Set(test.def.sections.flatMap((s) => s.items.map((i) => i.id)));
    const extraIds = new Set((test.def.extraFields ?? []).map((f) => f.id));
    responses = cleanMap(rawResponses, itemIds);
    extra = cleanMap(String(fd.get("extra") ?? ""), extraIds);
  }
  const finalize = str(fd, "intent") === "final";

  await prisma.assessment.update({
    where: { id: a.id },
    data: {
      responses: JSON.stringify(responses),
      extra: JSON.stringify(extra),
      recommendations: String(fd.get("recommendations") ?? "").slice(0, 20000),
      notes: String(fd.get("notes") ?? "").slice(0, 20000),
      testDate: parseDay(str(fd, "testDate")) ?? a.testDate,
      status: finalize ? "final" : "draft",
    },
  });
  revalidatePath(`/cases/${a.caseId}`);
  if (finalize) redirect(`/assessments/${a.id}/report`);
  return { ok: t.saved };
}

export async function reopenAssessmentAction(fd: FormData) {
  const user = await requireUser();
  const a = await ownAssessment(user.id, Number(str(fd, "id")));
  if (!a) redirect("/cases");
  await prisma.assessment.update({ where: { id: a.id }, data: { status: "draft" } });
  redirect(`/assessments/${a.id}`);
}

export async function deleteAssessmentAction(fd: FormData) {
  const user = await requireUser();
  const a = await ownAssessment(user.id, Number(str(fd, "id")));
  if (!a) redirect("/cases");
  await prisma.assessment.delete({ where: { id: a.id } });
  revalidatePath(`/cases/${a.caseId}`);
  redirect(`/cases/${a.caseId}`);
}
