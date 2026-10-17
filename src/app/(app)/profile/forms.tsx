"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/lib/auth-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";
import { AccountFields } from "@/components/account-fields";

export function ProfileForm({ t, d }: { t: Dict; d: React.ComponentProps<typeof AccountFields>["d"] }) {
  const [state, action] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <AccountFields t={t} d={d} />
      <SubmitButton>{t.save}</SubmitButton>
    </form>
  );
}

export function PasswordForm({ t }: { t: Dict }) {
  const [state, action] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="space-y-4" key={state?.ok}>
      <FormMessage state={state} />
      <div>
        <label className="label">{t.currentPassword}</label>
        <input name="current" type="password" className="input" dir="ltr" required autoComplete="current-password" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.newPassword}</label>
          <input name="password" type="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">{t.confirmPassword}</label>
          <input name="confirm" type="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      <SubmitButton>{t.changePassword}</SubmitButton>
    </form>
  );
}
