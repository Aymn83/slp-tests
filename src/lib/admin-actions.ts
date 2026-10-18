"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { hashPassword } from "./password";
import { requireAdmin } from "./auth";
import { getDict } from "./i18n";
import { opt, str, validateNewCredentials } from "./credentials";
import type { FormState } from "./form-state";
import { allTests } from "@/tests";

const STATUSES = ["pending", "active", "suspended", "rejected"];

function done() {
  revalidatePath("/", "layout"); // يشمل شارة عدد الطلبات في الترويسة
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// موافقة سريعة من قائمة الطلبات: تفعيل + باقة + تاريخ انتهاء
export async function approveUserAction(fd: FormData) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: str(fd, "id") },
    data: { status: "active", packageId: opt(fd, "packageId"), expiresAt: parseDate(str(fd, "expiresAt")) },
  });
  done();
}

export async function setUserStatusAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!STATUSES.includes(status) || id === admin.id) return;
  await prisma.user.update({ where: { id }, data: { status } });
  done();
}

export async function updateUserAccessAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const { t } = await getDict();
  const id = str(fd, "id");
  const roleIn = str(fd, "role");
  const role = roleIn === "admin" || roleIn === "student" ? roleIn : "examiner";
  const status = str(fd, "status");
  await prisma.user.update({
    where: { id },
    data: {
      packageId: opt(fd, "packageId"),
      expiresAt: parseDate(str(fd, "expiresAt")),
      // لا يستطيع المدير تخفيض دوره أو إيقاف نفسه
      ...(id !== admin.id && { role, ...(STATUSES.includes(status) && { status }) }),
    },
  });
  done();
  return { ok: t.saved };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getDict();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: t.passwordTooShort };
  await prisma.user.update({ where: { id: str(fd, "id") }, data: { passwordHash: await hashPassword(password) } });
  return { ok: t.saved };
}

export async function createUserAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
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
      status: "active",
      packageId: opt(fd, "packageId"),
      expiresAt: parseDate(str(fd, "expiresAt")),
    },
  });
  done();
  return { ok: `${t.saved}: ${v.username}` };
}

export async function savePackageAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getDict();
  const name = str(fd, "name");
  if (!name) return { error: t.fillRequired };
  const valid = new Set(allTests.map((x) => x.meta.id));
  const testIds = fd.getAll("testIds").map(String).filter((x) => valid.has(x));
  const data = { name, nameEn: opt(fd, "nameEn"), description: opt(fd, "description"), testIds: JSON.stringify(testIds) };
  const id = str(fd, "id");
  if (id) await prisma.package.update({ where: { id }, data });
  else await prisma.package.create({ data });
  done();
  return { ok: t.saved };
}

export async function deletePackageAction(fd: FormData) {
  await requireAdmin();
  await prisma.package.delete({ where: { id: str(fd, "id") } });
  done();
}
