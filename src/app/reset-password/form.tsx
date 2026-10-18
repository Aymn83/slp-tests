"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/reset-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ResetForm({ t, token }: { t: Dict; token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <h2 className="h2">{t.resetTitle}</h2>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="new-password">
          {t.newPassword}
        </label>
        <input id="new-password" name="password" type="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="confirm-password">
          {t.confirmPassword}
        </label>
        <input id="confirm-password" name="confirm" type="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
      </div>
      <SubmitButton className="btn btn-primary w-full">{t.saveNewPassword}</SubmitButton>
    </form>
  );
}
