import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { PasswordForm, ProfileForm } from "./forms";

export default async function ProfilePage() {
  const user = await requireUser();
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">{t.profile}</h1>
      <section className="card">
        <p className="muted mb-4">{t.profileHint}</p>
        <ProfileForm
          t={t}
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
      <section className="card">
        <h2 className="h2 mb-3">{t.changePassword}</h2>
        <PasswordForm t={t} />
      </section>
    </div>
  );
}
