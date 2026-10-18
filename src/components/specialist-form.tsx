"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { FormState } from "@/lib/form-state";
import { FormMessage, SubmitButton } from "./ui";

type Values = Partial<
  Record<"fullName" | "phone" | "email" | "specialty" | "licenseNumber" | "country" | "governorate" | "workplace" | "workPhone" | "skills", string | null>
>;

// تصغير الصورة في المتصفح إلى 480 بكسل كحد أقصى وتحويلها JPEG — يبقى الحجم صغيراً قبل الإرسال
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

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
}) {
  const [state, formAction] = useActionState(action, null);
  const [photo, setPhoto] = useState(""); // dataURL جديدة
  const [mode, setMode] = useState<"keep" | "remove" | "new">("keep");
  const [photoError, setPhotoError] = useState("");
  const preview = mode === "new" ? photo : mode === "keep" ? existingPhotoUrl : null;

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
      <input type="hidden" name="photo" value={mode === "new" ? photo : ""} />
      <input type="hidden" name="photoMode" value={mode} />
      {/* حقل فخ لبرامج الإزعاج — مخفي عن المستخدمين */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <p className="muted">{t.requiredMark}</p>
      <FormMessage state={state} />

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-24 w-24 rounded-full border border-line object-cover" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-page text-3xl text-ink-soft">👤</span>
          )}
          <div className="space-y-2">
            <label className="label" htmlFor="sp-photo">
              {t.photo} <span className="muted font-normal">({t.optional})</span>
            </label>
            <input
              id="sp-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                setPhotoError("");
                if (!f) return;
                if (f.size > 15 * 1024 * 1024) return setPhotoError(t.invalidPhoto);
                try {
                  setPhoto(await shrinkImage(f));
                  setMode("new");
                } catch {
                  setPhotoError(t.invalidPhoto);
                }
              }}
            />
            <p className="muted text-xs">{t.photoHint}</p>
            {photoError && <p className="text-sm text-red-700">{photoError}</p>}
            {preview && (
              <button type="button" className="btn btn-sm" onClick={() => setMode("remove")}>
                {t.removePhoto}
              </button>
            )}
          </div>
        </div>
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
          {field("licenseNumber", t.licenseNumber, true, { dir: "ltr" })}
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

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
