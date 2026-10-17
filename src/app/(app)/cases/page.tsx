import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatAge, formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const q = ((await searchParams).q ?? "").trim();
  const cases = await prisma.case.findMany({
    where: { ownerId: user.id, ...(q && { fullName: { contains: q, mode: "insensitive" } }) },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assessments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{t.myCases}</h1>
          <p className="muted">{t.privacyNote}</p>
        </div>
        <Link href="/cases/new" className="btn btn-primary">
          + {t.newCase}
        </Link>
      </div>

      <form className="max-w-sm">
        <input name="q" defaultValue={q} placeholder={t.searchCases} className="input" />
      </form>

      {cases.length === 0 ? (
        <p className="card muted">{t.noCases}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table min-w-[600px]">
            <thead>
              <tr>
                <th>{t.caseName}</th>
                <th>{t.age}</th>
                <th>{t.gender}</th>
                <th>{t.assessments}</th>
                <th>{t.initialDiagnosis}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-page">
                  <td className="font-semibold">
                    <Link href={`/cases/${c.id}`} className="hover:text-brand">
                      {c.fullName}
                    </Link>
                    <div className="muted text-xs">{formatDate(lang, c.updatedAt)}</div>
                  </td>
                  <td>{formatAge(t, c.birthDate)}</td>
                  <td>{c.gender === "male" ? t.male : c.gender === "female" ? t.female : "—"}</td>
                  <td>{c._count.assessments}</td>
                  <td>{c.initialDiagnosis ?? "—"}</td>
                  <td>
                    <Link href={`/cases/${c.id}`} className="btn btn-sm">
                      {t.open}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
