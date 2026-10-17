"use client";

import { useActionState } from "react";
import type { Package } from "@prisma/client";
import {
  createUserAction,
  resetPasswordAction,
  savePackageAction,
  updateUserAccessAction,
} from "@/lib/admin-actions";
import type { Dict, Lang } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";
import { AccountFields } from "@/components/account-fields";

type Pkg = Pick<Package, "id" | "name" | "nameEn">;
type TestOption = { id: string; name: string };

const dateValue = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const pkgName = (lang: Lang, p: Pkg) => (lang === "en" && p.nameEn ? p.nameEn : p.name);

export function PackageSelect({ t, lang, packages, value }: { t: Dict; lang: Lang; packages: Pkg[]; value?: string | null }) {
  return (
    <select name="packageId" className="input" defaultValue={value ?? ""}>
      <option value="">{t.noPackage}</option>
      {packages.map((p) => (
        <option key={p.id} value={p.id}>
          {pkgName(lang, p)}
        </option>
      ))}
    </select>
  );
}

export function CreateUserForm({ t, lang, packages }: { t: Dict; lang: Lang; packages: Pkg[] }) {
  const [state, action] = useActionState(createUserAction, null);
  return (
    <form action={action} className="space-y-4" key={state?.ok}>
      <p className="muted">{t.createUserNote}</p>
      <FormMessage state={state} />
      <AccountFields t={t} withCredentials />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.package}</label>
          <PackageSelect t={t} lang={lang} packages={packages} />
        </div>
        <div>
          <label className="label">
            {t.expiresAt} <span className="muted">({t.optional})</span>
          </label>
          <input type="date" name="expiresAt" className="input" />
        </div>
      </div>
      <SubmitButton>{t.createUser}</SubmitButton>
    </form>
  );
}

export function AccessForm({
  t,
  lang,
  packages,
  user,
  isSelf,
}: {
  t: Dict;
  lang: Lang;
  packages: Pkg[];
  user: { id: string; role: string; status: string; packageId: string | null; expiresAt: Date | null };
  isSelf: boolean;
}) {
  const [state, action] = useActionState(updateUserAccessAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={user.id} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.role}</label>
          <select name="role" className="input" defaultValue={user.role} disabled={isSelf}>
            <option value="examiner">{t.roleExaminer}</option>
            <option value="admin">{t.roleAdmin}</option>
          </select>
        </div>
        <div>
          <label className="label">{t.status}</label>
          <select name="status" className="input" defaultValue={user.status} disabled={isSelf}>
            <option value="pending">{t.statusPending}</option>
            <option value="active">{t.statusActive}</option>
            <option value="suspended">{t.statusSuspended}</option>
            <option value="rejected">{t.statusRejected}</option>
          </select>
        </div>
        <div>
          <label className="label">{t.package}</label>
          <PackageSelect t={t} lang={lang} packages={packages} value={user.packageId} />
        </div>
        <div>
          <label className="label">
            {t.expiresAt} <span className="muted">({t.optional})</span>
          </label>
          <input type="date" name="expiresAt" className="input" defaultValue={dateValue(user.expiresAt)} />
        </div>
      </div>
      <SubmitButton>{t.save}</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ t, userId }: { t: Dict; userId: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} className="space-y-3" key={state?.ok}>
      <input type="hidden" name="id" value={userId} />
      <FormMessage state={state} />
      <div>
        <label className="label">{t.newPassword}</label>
        <input name="password" type="text" className="input" dir="ltr" minLength={8} required autoComplete="off" />
      </div>
      <SubmitButton className="btn">{t.resetPassword}</SubmitButton>
    </form>
  );
}

export function PackageForm({
  t,
  tests,
  pkg,
}: {
  t: Dict;
  tests: TestOption[];
  pkg?: { id: string; name: string; nameEn: string | null; description: string | null; testIds: string[] };
}) {
  const [state, action] = useActionState(savePackageAction, null);
  return (
    <form action={action} className="space-y-4" key={pkg ? pkg.id : state?.ok}>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.packageName} *</label>
          <input name="name" className="input" required defaultValue={pkg?.name} />
        </div>
        <div>
          <label className="label">{t.packageNameEn}</label>
          <input name="nameEn" className="input" dir="ltr" defaultValue={pkg?.nameEn ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">{t.description}</label>
        <input name="description" className="input" defaultValue={pkg?.description ?? ""} />
      </div>
      <fieldset>
        <legend className="label">{t.packageTests}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {tests.map((x) => (
            <label key={x.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <input type="checkbox" name="testIds" value={x.id} defaultChecked={pkg?.testIds.includes(x.id)} />
              {x.name}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton>{pkg ? t.save : t.create}</SubmitButton>
    </form>
  );
}
