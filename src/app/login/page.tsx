import { PublicShell } from "@/components/public-shell";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <LoginForm t={t} />
    </PublicShell>
  );
}
