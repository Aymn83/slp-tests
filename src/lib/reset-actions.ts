"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { hashPassword } from "./password";
import { getDict } from "./i18n";
import { str } from "./credentials";
import { SITE_URL } from "./seo";
import { resetEmail, sendMail } from "./mail";
import type { FormState } from "./form-state";
import { findValidResetToken, hashToken } from "./reset-tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000; // ساعة واحدة
const MAX_PER_HOUR = 3;

// طلب رابط إعادة التعيين. الرد واحد دائماً حتى لا يُكشف وجود الحساب من عدمه
export async function requestPasswordResetAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const id = str(fd, "identifier").toLowerCase();
  if (!id) return { error: t.fillRequired };
  const done = { ok: t.resetRequested };

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: id }, { email: { equals: id, mode: "insensitive" } }] },
    select: { id: true, fullName: true, email: true, status: true },
  });
  if (!user?.email || user.status === "rejected") return done;

  // حدّ للطلبات: لا أكثر من 3 روابط في الساعة لكل حساب
  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - TOKEN_TTL_MS) } },
  });
  if (recent >= MAX_PER_HOUR) return done;

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  const link = `${SITE_URL}/reset-password?token=${token}`;
  const mail = resetEmail(user.fullName, link, t.siteTitle);
  await sendMail(user.email, mail.subject, mail.text, mail.html);
  return done;
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const token = str(fd, "token");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: t.passwordTooShort };
  if (password !== String(fd.get("confirm") ?? "")) return { error: t.passwordsMismatch };
  const row = await findValidResetToken(token);
  if (!row) return { error: t.resetInvalid };

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // تُلغى أي روابط أخرى لم تُستخدم لنفس الحساب
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId, usedAt: null, id: { not: row.id } } }),
  ]);
  redirect("/login?reset=1");
}
