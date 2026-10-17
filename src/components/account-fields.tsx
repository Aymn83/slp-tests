import type { Dict } from "@/lib/i18n";

type Defaults = Partial<Record<"fullName" | "fullNameEn" | "organization" | "jobTitle" | "phone" | "email", string | null>>;

// حقول الحساب المشتركة: التسجيل الذاتي، إنشاء المدير للحساب، الملف الشخصي
export function AccountFields({ t, withCredentials, d = {} }: { t: Dict; withCredentials?: boolean; d?: Defaults }) {
  return (
    <>
      <div>
        <label className="label">{t.fullName} *</label>
        <input name="fullName" className="input" required defaultValue={d.fullName ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.fullNameEn}</label>
          <input name="fullNameEn" className="input" dir="ltr" defaultValue={d.fullNameEn ?? ""} />
        </div>
        <div>
          <label className="label">{t.jobTitle}</label>
          <input name="jobTitle" className="input" defaultValue={d.jobTitle ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">{t.organization}</label>
        <input name="organization" className="input" defaultValue={d.organization ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.phone}</label>
          <input name="phone" className="input" dir="ltr" defaultValue={d.phone ?? ""} />
        </div>
        <div>
          <label className="label">{t.email}</label>
          <input name="email" type="email" className="input" dir="ltr" defaultValue={d.email ?? ""} />
        </div>
      </div>
      {withCredentials && (
        <>
          <div>
            <label className="label">{t.username} *</label>
            <input name="username" className="input" dir="ltr" autoComplete="username" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t.password} *</label>
              <input name="password" type="password" className="input" dir="ltr" autoComplete="new-password" required minLength={8} />
            </div>
            <div>
              <label className="label">{t.confirmPassword} *</label>
              <input name="confirm" type="password" className="input" dir="ltr" autoComplete="new-password" required minLength={8} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
