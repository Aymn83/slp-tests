"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireStudentArea } from "./auth";
import { getActivity } from "@/activities";

function parseAnswers(json: string): Record<string, number> {
  try {
    const v = JSON.parse(json || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

async function ownAttempt(attemptId: string) {
  const user = await requireStudentArea();
  const attempt = await prisma.activityAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  return attempt ? { user, attempt, activity: getActivity(attempt.activityId) } : null;
}

export async function startAttemptAction(activityId: string): Promise<{ attemptId: string } | { error: string }> {
  const user = await requireStudentArea();
  const activity = getActivity(activityId);
  if (!activity) return { error: "not found" };
  const a = await prisma.activityAttempt.create({ data: { userId: user.id, activityId, total: activity.key.length } });
  return { attemptId: a.id };
}

// يسجّل إجابة سؤال ويعيد التصحيح والشرح. أول إجابة لكل سؤال نهائية (لا يمكن تغييرها بعد معرفة الإجابة)
export async function answerQuestionAction(
  attemptId: string,
  question: number,
  selected: number,
): Promise<{ selected: number; correct: boolean; answer: number; explanation: string } | { error: string }> {
  const r = await ownAttempt(attemptId);
  if (!r?.activity) return { error: "not found" };
  if (r.attempt.completedAt) return { error: "completed" };
  const k = r.activity.key[question];
  if (!k || !Number.isInteger(selected) || selected < 0 || selected > 3) return { error: "invalid" };
  const answers = parseAnswers(r.attempt.answers);
  const final = typeof answers[question] === "number" ? answers[question] : selected;
  if (typeof answers[question] !== "number") {
    answers[question] = selected;
    await prisma.activityAttempt.update({ where: { id: attemptId }, data: { answers: JSON.stringify(answers) } });
  }
  return { selected: final, correct: final === k.answer, answer: k.answer, explanation: k.explanation };
}

export async function finishAttemptAction(attemptId: string) {
  const r = await ownAttempt(attemptId);
  if (!r?.activity) return { error: "not found" } as const;
  const answers = parseAnswers(r.attempt.answers);
  const review = r.activity.key.map((k, i) => answers[i] === k.answer);
  const score = review.filter(Boolean).length;
  if (!r.attempt.completedAt) {
    await prisma.activityAttempt.update({ where: { id: attemptId }, data: { score, completedAt: new Date() } });
    revalidatePath("/student");
    revalidatePath("/admin/students");
  }
  return {
    score,
    total: r.activity.key.length,
    review,
    message: r.activity.message(score, r.user.fullName),
    debrief: r.activity.debrief,
  } as const;
}
