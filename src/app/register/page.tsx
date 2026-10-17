import { PublicShell } from "@/components/public-shell";
import { getDict } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <RegisterForm t={t} />
    </PublicShell>
  );
}
