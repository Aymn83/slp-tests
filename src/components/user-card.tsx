import Link from "next/link";
import { linkedSpecialist, type CurrentUser } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

// صورة المستخدم: صورته الشخصية، وإلا صورة صفحته في الدليل، وإلا الحرف الأول من اسمه
export function userPhotoUrl(user: CurrentUser): string | null {
  if (user.hasPhoto) return `/me/photo?v=${user.updatedAt.getTime()}`;
  const sp = linkedSpecialist(user);
  if (sp?.hasPhoto) return `/specialists/${sp.id}/photo?v=${sp.updatedAt.getTime()}`;
  return null;
}

function jobLabel(user: CurrentUser, t: Dict): string {
  return user.jobTitle || linkedSpecialist(user)?.specialty || (user.role === "admin" ? t.roleAdmin : user.role === "student" ? t.roleStudent : t.roleExaminer);
}

// بطاقة المستخدم على يمين الصفحة (بداية السطر في العربية)
export function UserCard({ user, t, profileHref }: { user: CurrentUser; t: Dict; profileHref: string }) {
  const photo = userPhotoUrl(user);
  const sp = linkedSpecialist(user);
  return (
    <section className="card flex items-center gap-4 lg:flex-col lg:text-center">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={user.fullName} className="h-16 w-16 shrink-0 rounded-full border border-line object-cover lg:h-24 lg:w-24" />
      ) : (
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand-dark lg:h-24 lg:w-24 lg:text-4xl"
          aria-hidden="true"
        >
          {user.fullName.trim().charAt(0)}
        </span>
      )}
      <div className="min-w-0 space-y-1 lg:w-full">
        <div className="truncate font-bold text-ink">{user.fullName}</div>
        <div className="truncate text-sm text-brand-dark">{jobLabel(user, t)}</div>
        {user.organization && <div className="muted truncate text-xs">{user.organization}</div>}
        <div className="flex flex-wrap gap-2 pt-1 lg:flex-col">
          <Link href={profileHref} className="btn btn-sm">
            ✎ {t.editMyData}
          </Link>
          {sp && (
            <Link href={`/specialists/${sp.id}`} className="btn btn-sm">
              {t.myDirectoryPage}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
