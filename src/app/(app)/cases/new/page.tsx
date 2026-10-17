import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { CaseForm } from "../case-form";

export default async function NewCasePage() {
  await requireUser();
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="h1">{t.newCase}</h1>
      <CaseForm t={t} />
    </div>
  );
}
