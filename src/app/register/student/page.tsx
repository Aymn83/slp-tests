import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { getDict } from "@/lib/i18n";
import { StudentRegisterForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.studentRegister, alternates: { canonical: "/register/student" } };
}

export default async function StudentRegisterPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <StudentRegisterForm t={t} />
    </PublicShell>
  );
}
