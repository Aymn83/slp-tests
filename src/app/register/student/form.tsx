"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStudentAction } from "@/lib/auth-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

export function StudentRegisterForm({ t }: { t: Dict }) {
  const [state, action] = useActionState(registerStudentAction, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="h2">{t.studentRegister}</h2>
        <p className="muted mt-1">{t.studentRegisterNote}</p>
      </div>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="st-name">{t.fullName} *</label>
        <input id="st-name" name="fullName" className="input" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="st-org">
            {t.university} <span className="muted font-normal">({t.optional})</span>
          </label>
          <input id="st-org" name="organization" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="st-email">
            {t.email} <span className="muted font-normal">({t.optional})</span>
          </label>
          <input id="st-email" name="email" type="email" className="input" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="st-user">{t.username} *</label>
        <input id="st-user" name="username" className="input" dir="ltr" autoComplete="username" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="st-pass">{t.password} *</label>
          <input id="st-pass" name="password" type="password" className="input" dir="ltr" autoComplete="new-password" required minLength={8} />
        </div>
        <div>
          <label className="label" htmlFor="st-confirm">{t.confirmPassword} *</label>
          <input id="st-confirm" name="confirm" type="password" className="input" dir="ltr" autoComplete="new-password" required minLength={8} />
        </div>
      </div>
      <SubmitButton className="btn btn-primary w-full">{t.studentRegister}</SubmitButton>
      <p className="muted text-center">
        {t.haveAccount}{" "}
        <Link href="/login?as=student" className="font-semibold text-brand">
          {t.login}
        </Link>
      </p>
    </form>
  );
}
