"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession, homeFor, requireUser } from "./auth";
import { LANG_COOKIE, getDict } from "./i18n";
import { opt, str, validateNewCredentials } from "./credentials";
import type { FormState } from "./form-state";

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: t.invalidCredentials };
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(homeFor(user));
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const fullName = str(fd, "fullName");
  if (!fullName) return { error: t.fillRequired };
  const v = await validateNewCredentials(fd, t);
  if ("error" in v) return v;
  await prisma.user.create({
    data: {
      username: v.username,
      passwordHash: await hashPassword(v.password),
      fullName,
      fullNameEn: opt(fd, "fullNameEn"),
      organization: opt(fd, "organization"),
      jobTitle: opt(fd, "jobTitle"),
      phone: opt(fd, "phone"),
      email: opt(fd, "email"),
      role: "examiner",
      status: "pending",
    },
  });
  return { ok: t.registerDone };
}

// حساب طالب: يُفعَّل مباشرة ويقتصر على الأنشطة التدريبية
export async function registerStudentAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  const fullName = str(fd, "fullName");
  if (!fullName) return { error: t.fillRequired };
  const v = await validateNewCredentials(fd, t);
  if ("error" in v) return v;
  const user = await prisma.user.create({
    data: {
      username: v.username,
      passwordHash: await hashPassword(v.password),
      fullName,
      organization: opt(fd, "organization"),
      email: opt(fd, "email"),
      role: "student",
      status: "active",
      lastLoginAt: new Date(),
    },
  });
  await createSession(user.id);
  redirect("/student");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function setLangAction(fd: FormData) {
  const lang = fd.get("lang") === "en" ? "en" : "ar";
  const store = await cookies();
  store.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getDict();
  const fullName = str(fd, "fullName");
  if (!fullName) return { error: t.fillRequired };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      fullNameEn: opt(fd, "fullNameEn"),
      organization: opt(fd, "organization"),
      jobTitle: opt(fd, "jobTitle"),
      phone: opt(fd, "phone"),
      email: opt(fd, "email"),
    },
  });
  revalidatePath("/", "layout");
  return { ok: t.saved };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getDict();
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return { error: t.wrongPassword };
  if (password.length < 8) return { error: t.passwordTooShort };
  if (password !== String(fd.get("confirm") ?? "")) return { error: t.passwordsMismatch };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  return { ok: t.saved };
}
