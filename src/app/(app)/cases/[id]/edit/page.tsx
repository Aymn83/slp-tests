import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { CaseForm } from "../../case-form";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { t } = await getDict();
  const c = await prisma.case.findFirst({
    where: { id, ownerId: user.id },
    omit: { ownerId: true, createdAt: true, updatedAt: true },
  });
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="h1">{t.editCase}</h1>
      <CaseForm t={t} c={c} />
    </div>
  );
}
