import Link from "next/link";
import { canViewAll, requireUser } from "@/lib/auth";
import { formatAge, formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type Search = { q?: string; scope?: string; examiner?: string };

export default async function CasesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const admin = canViewAll(user);
  // المدير يرى كل الحالات افتراضياً، ويمكنه حصرها بحالاته أو بفاحص معيّن
  const scope = admin && sp.scope !== "mine" ? "all" : "mine";
  const examiner = scope === "all" ? (sp.examiner ?? "") : "";
  const ownerFilter = scope === "mine" ? { ownerId: user.id } : examiner ? { ownerId: examiner } : {};

  const [cases, examiners] = await Promise.all([
    prisma.case.findMany({
      where: { ...ownerFilter, ...(q && { fullName: { contains: q, mode: "insensitive" } }) },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { assessments: true } }, owner: { select: { fullName: true } } },
    }),
    admin
      ? prisma.user.findMany({ where: { cases: { some: {} } }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } })
      : Promise.resolve([]),
  ]);
  const showOwner = scope === "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{scope === "all" ? t.allCases : t.myCases}</h1>
          <p className="muted">{t.privacyNote}</p>
        </div>
        <Link href="/cases/new" className="btn btn-primary">
          + {t.newCase}
        </Link>
      </div>

      {admin && (
        <div className="flex gap-1">
          {(["all", "mine"] as const).map((s) => (
            <Link
              key={s}
              href={s === "mine" ? "/cases?scope=mine" : "/cases"}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                scope === s ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:border-brand"
              }`}
            >
              {s === "all" ? t.allCases : t.myCases}
            </Link>
          ))}
        </div>
      )}

      <form className="flex flex-wrap gap-3">
        {scope === "mine" && admin && <input type="hidden" name="scope" value="mine" />}
        <input name="q" defaultValue={q} placeholder={t.searchCases} className="input max-w-sm" />
        {showOwner && (
          <select name="examiner" defaultValue={examiner} className="input max-w-xs" aria-label={t.examiner}>
            <option value="">{t.allExaminers}</option>
            {examiners.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        )}
        <button className="btn">{t.filter}</button>
      </form>

      {cases.length === 0 ? (
        <p className="card muted">{t.noCases}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>{t.caseName}</th>
                {showOwner && <th>{t.examiner}</th>}
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
                  {showOwner && (
                    <td>
                      {c.owner.fullName}
                      {c.ownerId === user.id && <span className="badge ms-1 bg-brand-soft text-brand-dark">{t.myCases}</span>}
                    </td>
                  )}
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
