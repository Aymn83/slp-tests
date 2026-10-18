import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { NO_INDEX, SITE_URL, jsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { SpecialistAvatar } from "@/components/specialist-avatar";
import { ShareButton } from "@/components/share-button";

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

// نص المهارات: الأسطر التي تبدأ بـ - أو • تصبح قائمة نقطية، والباقي فقرات
function SkillsText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = BULLET.test(line);
    const clean = line.replace(BULLET, "");
    const last = blocks[blocks.length - 1];
    if (bullet && last?.list) last.lines.push(clean);
    else blocks.push({ list: bullet, lines: [clean] });
  }
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="list-disc space-y-1 ps-5 marker:text-brand">
            {b.lines.map((l, j) => (
              <li key={j}>{l}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines[0]}</p>
        ),
      )}
    </div>
  );
}

const BULLET = /^[-•*]\s*/;
const firstSkill = (skills: string | null) =>
  skills
    ?.split(/\r?\n/)
    .map((l) => l.replace(BULLET, "").trim())
    .find(Boolean) ?? null;

// يُستدعى مرة واحدة لكل طلب رغم استخدامه في البيانات الوصفية والصفحة
const loadSpecialist = cache((id: string) => prisma.specialist.findUnique({ where: { id }, omit: { photo: true } }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = await loadSpecialist(id);
  if (!s || s.status !== "approved") return { robots: NO_INDEX };
  const place = [s.governorate, s.country].filter(Boolean).join("، ");
  const title = `${s.fullName} — ${s.specialty}`;
  const description = [s.specialty, place, s.workplace, firstSkill(s.skills)].filter(Boolean).join(" · ").slice(0, 300);
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
  const canEdit = !!user && (isAdmin || s?.userId === user.id);
  // الملفات غير المعتمدة لا يراها إلا المدير وصاحبها
  if (!s || (s.status !== "approved" && !isAdmin && s.userId !== user?.id)) notFound();

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
    ...(s.skills && { description: s.skills.replace(/^[-•*]\s*/gm, "").replace(/\s*\n+\s*/g, " · ").slice(0, 500) }),
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
          {s.status === "pending" ? t.statusPending : t.statusRejected}
          {isAdmin && (
            <>
              {" — "}
              <Link href={`/admin/specialists/${s.id}`} className="font-semibold underline">
                {t.editSpecialist}
              </Link>
            </>
          )}
        </p>
      )}
      <section className="card flex flex-wrap items-center gap-5">
        <SpecialistAvatar id={s.id} name={s.fullName} hasPhoto={s.hasPhoto} version={s.updatedAt} className="h-28 w-28 text-4xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{s.fullName}</h2>
            {s.status === "approved" && (
              <ShareButton
                url={`${SITE_URL}/specialists/${s.id}`}
                title={`${s.fullName} — ${s.specialty}`}
                text={`${s.fullName} — ${s.specialty} | ${t.specialists}`}
                labels={{ share: t.share, copyLink: t.copyLink, linkCopied: t.linkCopied, shareVia: t.shareVia }}
              />
            )}
            {canEdit && (
              <Link href={`/specialists/${s.id}/edit`} className="btn btn-primary btn-sm">
                ✎ {t.editMyData}
              </Link>
            )}
          </div>
          <p className="text-brand-dark">{s.specialty}</p>
          {s.status === "approved" && <span className="badge bg-emerald-100 text-emerald-800">✓ {t.certifiedBadge}</span>}
        </div>
      </section>
      {s.skills && (
        <section className="card space-y-3">
          <h3 className="font-bold">{t.skills}</h3>
          <SkillsText text={s.skills} />
        </section>
      )}
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
