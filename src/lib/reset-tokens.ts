import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// يتحقق من رمز إعادة التعيين دون استهلاكه: موجود، لم يُستخدم، ولم تنتهِ صلاحيته
export async function findValidResetToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}
