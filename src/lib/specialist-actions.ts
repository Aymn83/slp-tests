"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";
import { getDict } from "./i18n";
import { str } from "./credentials";
import type { FormState } from "./form-state";
import { parsePhoto, readSpecialistFields } from "./specialists";

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
  await prisma.specialist.create({ data: { ...r.data, photo, hasPhoto: !!photo, status: "pending" } });
  done();
  return { ok: t.joinDone };
}

export async function updateSpecialistAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getDict();
  const id = str(fd, "id");
  const r = readSpecialistFields(fd, t);
  if ("error" in r) return { error: r.error };
  const photoMode = str(fd, "photoMode"); // keep | remove | new
  let photoData = {};
  if (photoMode === "remove") photoData = { photo: null, hasPhoto: false };
  if (photoMode === "new") {
    const photo = parsePhoto(String(fd.get("photo") ?? ""));
    if (photo === "invalid") return { error: t.invalidPhoto };
    photoData = photo ? { photo, hasPhoto: true } : {};
  }
  await prisma.specialist.update({ where: { id }, data: { ...r.data, ...photoData } });
  done();
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
