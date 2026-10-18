import Link from "next/link";
import { linkedSpecialist, type CurrentUser } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";
import { PasswordForm, ProfileForm } from "@/app/(app)/profile/forms";

// صفحة «تعديل البيانات» — مشتركة بين منطقة الأخصائيين ومنطقة الطلاب
export function ProfilePageBody({ user, t }: { user: CurrentUser; t: Dict }) {
  const sp = linkedSpecialist(user);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">{t.editMyData}</h1>
      <section className="card">
        <p className="muted mb-4">{t.profileHint}</p>
        <ProfileForm
          t={t}
          photoUrl={user.hasPhoto ? `/me/photo?v=${user.updatedAt.getTime()}` : null}
          d={{
            fullName: user.fullName,
            fullNameEn: user.fullNameEn,
            organization: user.organization,
            jobTitle: user.jobTitle,
            phone: user.phone,
            email: user.email,
          }}
        />
      </section>
      {sp && (
        <section className="card flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">{t.myDirectoryPage}</span>
          <div className="flex gap-2">
            <Link href={`/specialists/${sp.id}`} className="btn btn-sm">
              {t.viewProfile}
            </Link>
            <Link href={`/specialists/${sp.id}/edit`} className="btn btn-sm">
              ✎ {t.editMyData}
            </Link>
          </div>
        </section>
      )}
      <section className="card">
        <h2 className="h2 mb-3">{t.changePassword}</h2>
        <PasswordForm t={t} />
      </section>
    </div>
  );
}
