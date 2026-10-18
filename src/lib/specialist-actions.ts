"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getCurrentUser, requireAdmin, requireActive } from "./auth";
import { getDict } from "./i18n";
import { str } from "./credentials";
import type { FormState } from "./form-state";
import { parsePhoto, readPhotoUpdate, readSpecialistFields } from "./specialists";

function done() {
  revalidatePath("/specialists", "layout");
  revalidatePath("/admin/specialists", "layout");
}

// طلب انضمام عام — لا يحتاج تسجيل دخول، ويبقى «قيد المراجعة» حتى يوافق المدير
export async function joinSpecialistAction(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getDict();
  // حقل مخفي يملؤه برامج الإزعاج الآلية فقط
  if (str(fd, "website")) return { ok: t.joinDone };
  const r = readSpecialistFields(fd, t);
  if ("error" in r) return { error: r.error };
  const photo = parsePhoto(String(fd.get("photo") ?? ""));
  if (photo === "invalid") return { error: t.invalidPhoto };
  const exists = await prisma.specialist.findFirst({
    where: { licenseNumber: r.data.licenseNumber, status: { in: ["pending", "approved"] } },
    select: { id: true },
  });
  if (exists) return { error: t.licenseTaken };
  // من يقدّم الطلب وهو مسجّل الدخول تُربط الصفحة بحسابه (إن لم تكن له صفحة)
  const me = await getCurrentUser();
  const link = me && me.role !== "student" && me.specialists.length === 0 ? { userId: me.id } : {};
  await prisma.specialist.create({ data: { ...r.data, ...link, photo, hasPhoto: !!photo, status: "pending" } });
  done();
  return { ok: t.joinDone };
}

export async function updateSpecialistAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getDict();
  const id = str(fd, "id");
  const r = readSpecialistFields(fd, t);
  if ("error" in r) return { error: r.error };
  const photoData = readPhotoUpdate(fd);
  if (photoData === "invalid") return { error: t.invalidPhoto };
  await prisma.specialist.update({ where: { id }, data: { ...r.data, ...photoData } });
  done();
  return { ok: t.saved };
}

// صاحب الصفحة (أو المدير) يعدّل بياناته ثم يعود إلى صفحته. رقم الترخيص لا يغيّره إلا المدير
export async function updateOwnSpecialistAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireActive();
  const { t } = await getDict();
  const id = str(fd, "id");
  const s = await prisma.specialist.findUnique({ where: { id }, select: { userId: true, licenseNumber: true } });
  const isAdmin = user.role === "admin";
  if (!s || (!isAdmin && s.userId !== user.id)) return { error: t.notAllowed };
  const r = readSpecialistFields(fd, t);
  if ("error" in r) return { error: r.error };
  const photoData = readPhotoUpdate(fd);
  if (photoData === "invalid") return { error: t.invalidPhoto };
  const data = isAdmin ? r.data : { ...r.data, licenseNumber: s.licenseNumber };
  await prisma.specialist.update({ where: { id }, data: { ...data, ...photoData } });
  done();
  redirect(`/specialists/${id}`);
}

// ربط صفحة اختصاصي بحساب عضو (للمدير) — حساب واحد لكل صفحة وصفحة واحدة لكل حساب
export async function linkSpecialistAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getDict();
  const id = str(fd, "id");
  const userId = str(fd, "userId") || null;
  if (userId) {
    const other = await prisma.specialist.findFirst({ where: { userId, id: { not: id } }, select: { id: true } });
    if (other) return { error: t.accountAlreadyLinked };
  }
  await prisma.specialist.update({ where: { id }, data: { userId } });
  done();
  revalidatePath("/", "layout");
  return { ok: t.saved };
}

export async function setSpecialistStatusAction(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["pending", "approved", "rejected"].includes(status)) return;
  await prisma.specialist.update({
    where: { id: str(fd, "id") },
    data: { status, approvedAt: status === "approved" ? new Date() : null },
  });
  done();
}

export async function deleteSpecialistAction(fd: FormData) {
  await requireAdmin();
  await prisma.specialist.delete({ where: { id: str(fd, "id") } });
  done();
  redirect("/admin/specialists");
}
