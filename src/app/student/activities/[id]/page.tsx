import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireStudentArea } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { getActivity } from "@/activities";
import { CASE_LAB_ID, caseLabMeta } from "@/activities/case-lab/content";
import { CaseLab } from "@/activities/case-lab/lab";

export const metadata: Metadata = { title: caseLabMeta.title };

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStudentArea();
  const { id } = await params;
  const { t } = await getDict();
  if (!getActivity(id)) notFound();
  return (
    <div className="space-y-4">
      <Link href="/student" className="muted hover:text-brand">
        ← {t.activities}
      </Link>
      {id === CASE_LAB_ID && <CaseLab studentName={user.fullName} />}
    </div>
  );
}
