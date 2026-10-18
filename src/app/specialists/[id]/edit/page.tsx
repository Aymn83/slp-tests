import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { canUseSite, getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { NO_INDEX } from "@/lib/seo";
import { updateOwnSpecialistAction } from "@/lib/specialist-actions";
import { COUNTRY_SUGGESTIONS, SPECIALTY_SUGGESTIONS } from "@/lib/specialists";
import { SpecialistForm } from "@/components/specialist-form";

export const metadata: Metadata = { robots: NO_INDEX };

// صاحب الصفحة أو المدير يعدّل البيانات، وبعد «حفظ» يعود إلى الصفحة
export default async function EditOwnSpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !canUseSite(user)) redirect("/login");
  const s = await prisma.specialist.findUnique({ where: { id }, omit: { photo: true } });
  if (!s) notFound();
  const isAdmin = user.role === "admin";
  if (!isAdmin && s.userId !== user.id) notFound();
  const { t } = await getDict();

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="h2">
        {t.editMyData} — {s.fullName}
      </h2>
      <SpecialistForm
        t={t}
        id={s.id}
        action={updateOwnSpecialistAction}
        values={s}
        existingPhotoUrl={s.hasPhoto ? `/specialists/${s.id}/photo?v=${s.updatedAt.getTime()}` : null}
        specialties={SPECIALTY_SUGGESTIONS}
        countries={COUNTRY_SUGGESTIONS}
        submitLabel={t.save}
        licenseLocked={!isAdmin}
        cancelHref={`/specialists/${s.id}`}
      />
    </div>
  );
}
