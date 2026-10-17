"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

export function LoginForm({ t }: { t: Dict }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <h2 className="h2">{t.loginTitle}</h2>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="username">{t.username}</label>
        <input id="username" name="username" className="input" dir="ltr" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" className="input" dir="ltr" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn btn-primary w-full">{t.login}</SubmitButton>
      <p className="muted text-center">
        {t.noAccount} <Link href="/register" className="font-semibold text-brand">{t.register}</Link>
      </p>
    </form>
  );
}
