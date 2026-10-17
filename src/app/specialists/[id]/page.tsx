import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { NO_INDEX, SITE_URL, jsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { SpecialistAvatar } from "@/components/specialist-avatar";

type Row = { label: string; value: string | null; href?: string; ltr?: boolean };

// قائمة «الحقل: القيمة» تُخفي الحقول الفارغة
function List({ items }: { items: Row[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {items
        .filter((r) => r.value)
        .map((r) => (
          <div key={r.label} className="contents">
            <dt className="font-semibold text-ink-soft">{r.label}</dt>
            <dd dir={r.ltr ? "ltr" : undefined} className={r.ltr ? "text-end" : undefined}>
              {r.href ? (
                <a href={r.href} className="text-brand hover:underline">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
    </dl>
  );
}

// يُستدعى مرة واحدة لكل طلب رغم استخدامه في البيانات الوصفية والصفحة
const loadSpecialist = cache((id: string) => prisma.specialist.findUnique({ where: { id }, omit: { photo: true } }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = await loadSpecialist(id);
  if (!s || s.status !== "approved") return { robots: NO_INDEX };
  const place = [s.governorate, s.country].filter(Boolean).join("، ");
  const title = `${s.fullName} — ${s.specialty}`;
  const description = [s.specialty, place, s.workplace].filter(Boolean).join(" · ");
  const url = `/specialists/${s.id}`;
  const images = s.hasPhoto ? [{ url: `${url}/photo?v=${s.updatedAt.getTime()}`, alt: s.fullName }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title, description, url, images },
    twitter: { card: s.hasPhoto ? "summary" : "summary_large_image", title, description },
  };
}

export default async function SpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getDict();
  const s = await loadSpecialist(id);
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  // الملفات غير المعتمدة لا يراها إلا المدير
  if (!s || (s.status !== "approved" && !isAdmin)) notFound();

  const rows: Row[] = [
    { label: t.specialty, value: s.specialty },
    { label: t.licenseNumber, value: s.licenseNumber, ltr: true },
    { label: t.country, value: s.country },
    { label: t.governorate, value: s.governorate },
  ];
  const work = [
    { label: t.workplace, value: s.workplace },
    { label: t.workPhone, value: s.workPhone, href: s.workPhone ? `tel:${s.workPhone.replace(/[^\d+]/g, "")}` : undefined, ltr: true },
  ];
  const contact = [
    { label: t.phone, value: s.phone, href: s.phone ? `tel:${s.phone.replace(/[^\d+]/g, "")}` : undefined, ltr: true },
    { label: t.email, value: s.email, href: s.email ? `mailto:${s.email}` : undefined, ltr: true },
  ];

  // بيانات منظَّمة (Person) تساعد محركات البحث على فهم الملف
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/specialists/${s.id}`,
    name: s.fullName,
    jobTitle: s.specialty,
    url: `${SITE_URL}/specialists/${s.id}`,
    ...(s.hasPhoto && { image: `${SITE_URL}/specialists/${s.id}/photo` }),
    ...(s.email && { email: s.email }),
    ...(s.phone && { telephone: s.phone }),
    address: { "@type": "PostalAddress", addressCountry: s.country, ...(s.governorate && { addressRegion: s.governorate }) },
    ...(s.workplace && {
      worksFor: { "@type": "Organization", name: s.workplace, ...(s.workPhone && { telephone: s.workPhone }) },
    }),
  };

  return (
    <div className="space-y-5">
      {s.status === "approved" && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(person)} />}
      <Link href="/specialists" className="muted hover:text-brand">
        ← {t.backToList}
      </Link>
      {s.status !== "approved" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {s.status === "pending" ? t.statusPending : t.statusRejected} —{" "}
          <Link href={`/admin/specialists/${s.id}`} className="font-semibold underline">
            {t.editSpecialist}
          </Link>
        </p>
      )}
      <section className="card flex flex-wrap items-center gap-5">
        <SpecialistAvatar id={s.id} name={s.fullName} hasPhoto={s.hasPhoto} version={s.updatedAt} className="h-28 w-28 text-4xl" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{s.fullName}</h2>
          <p className="text-brand-dark">{s.specialty}</p>
          {s.status === "approved" && <span className="badge bg-emerald-100 text-emerald-800">✓ {t.certifiedBadge}</span>}
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card space-y-3">
          <List items={rows} />
        </section>
        <div className="space-y-5">
          {work.some((r) => r.value) && (
            <section className="card space-y-3">
              <h3 className="font-bold">{t.workInfo}</h3>
              <List items={work} />
            </section>
          )}
          {contact.some((r) => r.value) && (
            <section className="card space-y-3">
              <h3 className="font-bold">{t.contactInfo}</h3>
              <List items={contact} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
