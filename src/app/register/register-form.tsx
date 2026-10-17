"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";
import { AccountFields } from "@/components/account-fields";

export function RegisterForm({ t }: { t: Dict }) {
  const [state, action] = useActionState(registerAction, null);
  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <FormMessage state={state} />
        <Link href="/login" className="btn btn-primary">{t.login}</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="h2">{t.registerTitle}</h2>
        <p className="muted mt-1">{t.registerNote}</p>
      </div>
      <FormMessage state={state} />
      <AccountFields t={t} withCredentials />
      <SubmitButton className="btn btn-primary w-full">{t.register}</SubmitButton>
      <p className="muted text-center">
        {t.haveAccount} <Link href="/login" className="font-semibold text-brand">{t.login}</Link>
      </p>
    </form>
  );
}
