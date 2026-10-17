import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteSpecialistAction, setSpecialistStatusAction, updateSpecialistAction } from "@/lib/specialist-actions";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { COUNTRY_SUGGESTIONS, SPECIALTY_SUGGESTIONS } from "@/lib/specialists";
import { ConfirmButton, SubmitButton } from "@/components/ui";
import { SpecialistForm } from "@/components/specialist-form";

export default async function EditSpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { t } = await getDict();
  const s = await prisma.specialist.findUnique({ where: { id }, omit: { photo: true } });
  if (!s) notFound();
  const statusLabel = s.status === "approved" ? t.certifiedBadge : s.status === "pending" ? t.statusPending : t.statusRejected;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/specialists" className="muted hover:text-brand">
        ← {t.specialists}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">{t.editSpecialist}</h1>
        <span className="badge bg-page text-ink-soft">{statusLabel}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {s.status !== "approved" && (
          <form action={setSpecialistStatusAction}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="status" value="approved" />
            <SubmitButton className="btn btn-primary btn-sm">{t.approve}</SubmitButton>
          </form>
        )}
        {s.status === "approved" && (
          <form action={setSpecialistStatusAction}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="status" value="pending" />
            <SubmitButton className="btn btn-sm">{t.hideFromDirectory}</SubmitButton>
          </form>
        )}
        <Link href={`/specialists/${s.id}`} className="btn btn-sm">
          {t.viewProfile}
        </Link>
        <form action={deleteSpecialistAction}>
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message={t.deleteSpecialistConfirm}>{t.delete}</ConfirmButton>
        </form>
      </div>

      <SpecialistForm
        t={t}
        id={s.id}
        action={updateSpecialistAction}
        values={s}
        existingPhotoUrl={s.hasPhoto ? `/specialists/${s.id}/photo?v=${s.updatedAt.getTime()}` : null}
        specialties={SPECIALTY_SUGGESTIONS}
        countries={COUNTRY_SUGGESTIONS}
        submitLabel={t.save}
      />
    </div>
  );
}
