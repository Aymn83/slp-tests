import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { setSpecialistStatusAction } from "@/lib/specialist-actions";
import { formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/ui";
import { SpecialistAvatar } from "@/components/specialist-avatar";

export default async function AdminSpecialistsPage() {
  await requireAdmin();
  const { lang, t } = await getDict();
  const all = await prisma.specialist.findMany({ omit: { photo: true }, orderBy: { createdAt: "desc" } });
  const groups = [
    { key: "pending", title: t.specialistRequests, items: all.filter((s) => s.status === "pending") },
    { key: "approved", title: t.approvedSpecialists, items: all.filter((s) => s.status === "approved") },
    { key: "rejected", title: t.rejectedSpecialists, items: all.filter((s) => s.status === "rejected") },
  ];

  const statusBtn = (id: string, status: string, label: string, cls = "btn btn-sm") => (
    <form action={setSpecialistStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls}>{label}</SubmitButton>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{t.specialists}</h1>
        <Link href="/specialists" className="btn btn-sm">
          {t.browseSpecialists} ↗
        </Link>
      </div>

      {groups.map((g) =>
        g.key === "rejected" && g.items.length === 0 ? null : (
          <section key={g.key} className="card space-y-3">
            <h2 className="h2">
              {g.title} <span className="badge bg-page text-ink-soft">{g.items.length}</span>
            </h2>
            {g.items.length === 0 && <p className="muted">{g.key === "pending" ? t.noPending : t.noSpecialists}</p>}
            <ul className="divide-y divide-line">
              {g.items.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <SpecialistAvatar id={s.id} name={s.fullName} hasPhoto={s.hasPhoto} version={s.updatedAt} className="h-12 w-12 text-lg" />
                  <div className="min-w-48 flex-1 text-sm">
                    <div className="font-bold">{s.fullName}</div>
                    <div className="text-ink-soft">
                      {s.specialty} · {t.licenseNumber}: <span dir="ltr">{s.licenseNumber}</span>
                    </div>
                    <div className="muted text-xs">
                      {[s.governorate, s.country].filter(Boolean).join("، ")} · {t.requestedAt}: {formatDate(lang, s.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.key !== "approved" && statusBtn(s.id, "approved", t.approve, "btn btn-primary btn-sm")}
                    {g.key === "pending" && statusBtn(s.id, "rejected", t.reject, "btn btn-danger btn-sm")}
                    {g.key === "approved" && statusBtn(s.id, "pending", t.hideFromDirectory)}
                    <Link href={`/admin/specialists/${s.id}`} className="btn btn-sm">
                      {t.edit}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
