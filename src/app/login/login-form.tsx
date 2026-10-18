"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

type As = "specialist" | "student";

// الدخول واحد للجميع، والحساب نفسه يحدد الوجهة؛ اختيار «طالب» يغيّر رابط إنشاء الحساب فقط
export function LoginForm({ t, initialAs, resetDone }: { t: Dict; initialAs: As; resetDone?: boolean }) {
  const [state, action] = useActionState(loginAction, null);
  const [as, setAs] = useState<As>(initialAs);
  return (
    <form action={action} className="space-y-4">
      <h2 className="h2">{t.loginTitle}</h2>
      <div>
        <div className="label">{t.loginAs}</div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-page p-1" role="radiogroup" aria-label={t.loginAs}>
          {(["specialist", "student"] as const).map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={as === x}
              onClick={() => setAs(x)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${as === x ? "bg-white text-brand-dark shadow-sm" : "text-ink-soft hover:text-ink"}`}
            >
              {x === "specialist" ? t.iAmSpecialist : t.iAmStudent}
            </button>
          ))}
        </div>
      </div>
      <FormMessage state={state ?? (resetDone ? { ok: t.resetDone } : null)} />
      <div>
        <label className="label" htmlFor="username">{t.username}</label>
        <input id="username" name="username" className="input" dir="ltr" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" className="input" dir="ltr" autoComplete="current-password" required />
      </div>
      <div className="text-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-brand hover:underline">
          {t.forgotPassword}
        </Link>
      </div>
      <SubmitButton className="btn btn-primary w-full">{t.login}</SubmitButton>
      <p className="muted text-center">
        {t.noAccount}{" "}
        {as === "student" ? (
          <Link href="/register/student" className="font-semibold text-brand">
            {t.studentRegister}
          </Link>
        ) : (
          <Link href="/register" className="font-semibold text-brand">
            {t.register}
          </Link>
        )}
      </p>
    </form>
  );
}
