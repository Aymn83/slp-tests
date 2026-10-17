"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Case } from "@prisma/client";
import { saveCaseAction } from "@/lib/case-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

type CaseData = Omit<Case, "ownerId" | "createdAt" | "updatedAt">;

export function CaseForm({ t, c }: { t: Dict; c?: CaseData }) {
  const [state, action] = useActionState(saveCaseAction, null);
  const field = (name: keyof CaseData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label">{label}</label>
      <input name={name} className="input" defaultValue={(c?.[name] as string | null) ?? ""} {...props} />
    </div>
  );
  return (
    <form action={action} className="space-y-6">
      {c && <input type="hidden" name="id" value={c.id} />}
      <FormMessage state={state} />

      <section className="card space-y-4">
        <h2 className="h2">{t.basicInfo}</h2>
        {field("fullName", `${t.caseName} *`, { required: true })}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.birthDate}</label>
            <input
              type="date"
              name="birthDate"
              className="input"
              defaultValue={c?.birthDate ? new Date(c.birthDate).toISOString().slice(0, 10) : ""}
            />
          </div>
          <div>
            <label className="label">{t.gender}</label>
            <select name="gender" className="input" defaultValue={c?.gender ?? ""}>
              <option value="">—</option>
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="h2">{t.referralInfo}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("referralSource", t.referralSource)}
          {field("initialDiagnosis", t.initialDiagnosis)}
        </div>
        <div>
          <label className="label">{t.referralReason}</label>
          <textarea name="referralReason" rows={2} className="input" defaultValue={c?.referralReason ?? ""} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="h2">{t.languageInfo}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("motherLanguage", t.motherLanguage)}
          {field("homeLanguages", t.homeLanguages)}
          {field("school", t.school)}
          {field("grade", t.grade)}
        </div>
        <div>
          <label className="label">{t.notes}</label>
          <textarea name="notes" rows={3} className="input" defaultValue={c?.notes ?? ""} />
        </div>
      </section>

      <div className="flex gap-3">
        <SubmitButton>{t.save}</SubmitButton>
        <Link href={c ? `/cases/${c.id}` : "/cases"} className="btn">
          {t.cancel}
        </Link>
      </div>
    </form>
  );
}
