import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL, jsonLd } from "@/lib/seo";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { SpecialistAvatar } from "@/components/specialist-avatar";

const LIST_FIELDS = {
  id: true,
  fullName: true,
  specialty: true,
  country: true,
  governorate: true,
  workplace: true,
  hasPhoto: true,
  updatedAt: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return {
    title: t.specialists,
    description: t.specialistsSeo,
    alternates: { canonical: "/specialists" },
    openGraph: { title: t.specialists, description: t.specialistsSeo, url: "/specialists" },
  };
}

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<{ q?: string; country?: string }> }) {
  const { t } = await getDict();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const country = (sp.country ?? "").trim();
  const contains = { contains: q, mode: "insensitive" as const };

  const [list, countries] = await Promise.all([
    prisma.specialist.findMany({
      where: {
        status: "approved",
        ...(country && { country }),
        ...(q && { OR: [{ fullName: contains }, { specialty: contains }, { workplace: contains }, { governorate: contains }] }),
      },
      orderBy: { fullName: "asc" },
      select: LIST_FIELDS,
    }),
    prisma.specialist.findMany({ where: { status: "approved" }, distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
  ]);

  // بيانات منظَّمة: الموقع + قائمة الاختصاصيين المعتمدين
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: t.siteTitle, inLanguage: "ar" },
      {
        "@type": "ItemList",
        name: t.specialists,
        itemListElement: list.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/specialists/${s.id}`, name: s.fullName })),
      },
    ],
  };

  return (
    <div className="space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder={t.searchSpecialists} className="input max-w-sm" />
        {countries.length > 1 && (
          <select name="country" defaultValue={country} className="input max-w-xs" aria-label={t.country}>
            <option value="">{t.allCountries}</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country}
              </option>
            ))}
          </select>
        )}
        <button className="btn">{t.filter}</button>
      </form>

      {list.length === 0 ? (
        <p className="card muted">{t.noSpecialists}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <Link key={s.id} href={`/specialists/${s.id}`} className="card flex gap-4 transition hover:border-brand">
              <SpecialistAvatar id={s.id} name={s.fullName} hasPhoto={s.hasPhoto} version={s.updatedAt} />
              <div className="min-w-0 space-y-1">
                <div className="font-bold text-ink">{s.fullName}</div>
                <div className="text-sm text-brand-dark">{s.specialty}</div>
                <div className="muted text-xs">
                  {[s.governorate, s.country].filter(Boolean).join("، ")}
                  {s.workplace && ` · ${s.workplace}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
