import { getDict } from "@/lib/i18n";
import { joinSpecialistAction } from "@/lib/specialist-actions";
import { COUNTRY_SUGGESTIONS, SPECIALTY_SUGGESTIONS } from "@/lib/specialists";
import { SpecialistForm } from "@/components/specialist-form";

export default async function JoinSpecialistPage() {
  const { t } = await getDict();
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-ink-soft">{t.joinIntro}</p>
      <SpecialistForm
        t={t}
        action={joinSpecialistAction}
        specialties={SPECIALTY_SUGGESTIONS}
        countries={COUNTRY_SUGGESTIONS}
        submitLabel={t.joinSubmit}
        successView
      />
    </div>
  );
}
