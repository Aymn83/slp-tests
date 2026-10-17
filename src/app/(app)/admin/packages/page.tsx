import { parseIds, requireAdmin } from "@/lib/auth";
import { deletePackageAction } from "@/lib/admin-actions";
import { getDict, tx } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { allTests } from "@/tests";
import { ConfirmButton } from "@/components/ui";
import { PackageForm } from "../forms";

export default async function PackagesPage() {
  await requireAdmin();
  const { lang, t } = await getDict();
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });
  const tests = allTests.map((x) => ({ id: x.meta.id, name: tx(lang, x.meta.name) }));

  return (
    <div className="space-y-6">
      <h1 className="h1">{t.packages}</h1>

      {packages.length === 0 && <p className="muted">{t.noPackages}</p>}
      {packages.map((p) => (
        <section key={p.id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="h2">{(lang === "en" && p.nameEn) || p.name}</h2>
            <div className="flex items-center gap-3">
              <span className="muted">
                {t.members}: {p._count.users}
              </span>
              <form action={deletePackageAction}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={t.deletePackageConfirm}>{t.delete}</ConfirmButton>
              </form>
            </div>
          </div>
          <PackageForm t={t} tests={tests} pkg={{ ...p, testIds: parseIds(p.testIds) }} />
        </section>
      ))}

      <details className="card" open={packages.length === 0}>
        <summary className="h2 cursor-pointer">{t.newPackage}</summary>
        <div className="mt-4">
          <PackageForm t={t} tests={tests} />
        </div>
      </details>
    </div>
  );
}
