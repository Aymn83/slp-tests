import { allowedTestIds, requireUser } from "@/lib/auth";
import { getDict, tx } from "@/lib/i18n";
import { getTest } from "@/tests";

export default async function TestsPage() {
  const user = await requireUser();
  const { lang, t } = await getDict();
  const tests = allowedTestIds(user).map((id) => getTest(id)!.meta);

  return (
    <div className="space-y-6">
      <h1 className="h1">{t.availableTests}</h1>
      {tests.length === 0 && <p className="card muted">{t.noTestsAvailable}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((x) => (
          <section key={x.id} className="card space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="h2">{tx(lang, x.name)}</h2>
              {x.demo && <span className="badge bg-purple-100 text-purple-800">{t.demoBadge}</span>}
            </div>
            <p className="text-sm text-ink-soft">{tx(lang, x.description)}</p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              {x.ageRange && (
                <span className="badge bg-brand-soft text-brand-dark">
                  {t.ageRange}: {tx(lang, x.ageRange)}
                </span>
              )}
              <span className="badge bg-page text-ink-soft">
                {x.sectionsCount} {t.sectionsCount}
              </span>
              <span className="badge bg-page text-ink-soft">
                {x.itemsCount} {t.items}
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
