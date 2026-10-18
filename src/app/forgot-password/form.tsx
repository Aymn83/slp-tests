"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/reset-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

export function ForgotForm({ t }: { t: Dict }) {
  const [state, action] = useActionState(requestPasswordResetAction, null);
  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="h2">{t.forgotTitle}</h2>
        <FormMessage state={state} />
        <Link href="/login" className="btn">
          {t.login}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="h2">{t.forgotTitle}</h2>
        <p className="muted mt-1">{t.forgotNote}</p>
      </div>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="identifier">
          {t.identifier}
        </label>
        <input id="identifier" name="identifier" className="input" dir="ltr" autoComplete="username" required />
      </div>
      <SubmitButton className="btn btn-primary w-full">{t.sendResetLink}</SubmitButton>
      <p className="muted text-center">
        <Link href="/login" className="font-semibold text-brand">
          ← {t.login}
        </Link>
      </p>
    </form>
  );
}
