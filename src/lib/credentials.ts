import { prisma } from "./prisma";
import type { Dict } from "./i18n";

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const opt = (fd: FormData, k: string) => str(fd, k) || null;

// التحقق من اسم مستخدم جديد وكلمة مروره (للتسجيل الذاتي وإنشاء المدير للحسابات)
export async function validateNewCredentials(
  fd: FormData,
  t: Dict,
): Promise<{ error: string } | { username: string; password: string }> {
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return { error: t.usernameInvalid };
  if (password.length < 8) return { error: t.passwordTooShort };
  if (fd.has("confirm") && password !== String(fd.get("confirm"))) return { error: t.passwordsMismatch };
  if (await prisma.user.findUnique({ where: { username } })) return { error: t.usernameTaken };
  return { username, password };
}
