import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { joinSpecialistAction } from "@/lib/specialist-actions";
import { COUNTRY_SUGGESTIONS, SPECIALTY_SUGGESTIONS } from "@/lib/specialists";
import { SpecialistForm } from "@/components/specialist-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return {
    title: t.joinSpecialist,
    description: t.joinIntro,
    alternates: { canonical: "/specialists/join" },
    openGraph: { title: t.joinSpecialist, description: t.joinIntro, url: "/specialists/join" },
  };
}

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
