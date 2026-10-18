"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { FormState } from "@/lib/form-state";
import { FormMessage, SubmitButton } from "./ui";
import { PhotoPicker } from "./photo-picker";

type Values = Partial<
  Record<"fullName" | "phone" | "email" | "specialty" | "licenseNumber" | "country" | "governorate" | "workplace" | "workPhone" | "skills", string | null>
>;

export function SpecialistForm({
  t,
  action,
  values = {},
  id,
  existingPhotoUrl,
  specialties,
  countries,
  submitLabel,
  successView,
  licenseLocked,
  cancelHref,
}: {
  t: Dict;
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  values?: Values;
  id?: string;
  existingPhotoUrl?: string | null;
  specialties: string[];
  countries: string[];
  submitLabel: string;
  successView?: boolean; // نموذج الانضمام: يستبدل النموذج برسالة نجاح
  licenseLocked?: boolean; // صاحب الصفحة لا يعدّل رقم الترخيص
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  if (successView && state?.ok) {
    return (
      <div className="card space-y-4 text-center">
        <FormMessage state={state} />
        <Link href="/specialists" className="btn">
          {t.backToList}
        </Link>
      </div>
    );
  }

  const field = (name: keyof Values, label: string, required?: boolean, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`sp-${name}`}>
        {label} {required ? "*" : <span className="muted font-normal">({t.optional})</span>}
      </label>
      <input id={`sp-${name}`} name={name} className="input" required={required} defaultValue={values[name] ?? ""} {...extra} />
    </div>
  );

  return (
    <form action={formAction} className="space-y-5">
      {id && <input type="hidden" name="id" value={id} />}
      {/* حقل فخ لبرامج الإزعاج — مخفي عن المستخدمين */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <p className="muted">{t.requiredMark}</p>
      <FormMessage state={state} />

      <section className="card space-y-4">
        <PhotoPicker t={t} existingUrl={existingPhotoUrl} inputId="sp-photo" />
        {field("fullName", t.fullName, true)}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sp-specialty">
              {t.specialty} *
            </label>
            <input id="sp-specialty" name="specialty" list="sp-specialties" className="input" required defaultValue={values.specialty ?? ""} />
            <datalist id="sp-specialties">
              {specialties.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>
          <div>
            {field("licenseNumber", t.licenseNumber, true, { dir: "ltr", readOnly: licenseLocked, className: licenseLocked ? "input bg-page" : "input" })}
            {licenseLocked && <p className="muted mt-1 text-xs">{t.licenseLocked}</p>}
          </div>
        </div>
      </section>

      <section className="card space-y-2">
        <label className="label" htmlFor="sp-skills">
          {t.skills} <span className="muted font-normal">({t.optional})</span>
        </label>
        <p className="muted text-xs">{t.skillsHint}</p>
        <textarea
          id="sp-skills"
          name="skills"
          rows={7}
          maxLength={3000}
          className="input leading-relaxed"
          placeholder={t.skillsPlaceholder}
          defaultValue={values.skills ?? ""}
        />
      </section>

      <section className="card space-y-4">
        <h3 className="font-bold">{t.workInfo}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sp-country">
              {t.country} *
            </label>
            <input id="sp-country" name="country" list="sp-countries" className="input" required defaultValue={values.country ?? ""} />
            <datalist id="sp-countries">
              {countries.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>
          {field("governorate", t.governorate)}
          {field("workplace", t.workplace)}
          {field("workPhone", t.workPhone, false, { dir: "ltr", type: "tel" })}
        </div>
      </section>

      <section className="card space-y-4">
        <h3 className="font-bold">{t.contactInfo}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("phone", t.phone, false, { dir: "ltr", type: "tel" })}
          {field("email", t.email, false, { dir: "ltr", type: "email" })}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        {cancelHref && (
          <Link href={cancelHref} className="btn">
            {t.cancel}
          </Link>
        )}
      </div>
    </form>
  );
}
